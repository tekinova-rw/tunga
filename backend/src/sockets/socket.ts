// ============================================================
// FILE: backend/src/sockets/socket.ts
// DESCRIPTION: Socket.IO server for real-time chat
// ============================================================

import { Server, Socket } from 'socket.io';
import { Server as HttpServer } from 'http';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

// Types
interface DecodedToken {
  id: number;
  role: string;
  full_name?: string;
  district_id?: number | null;
}

interface ClientSocket extends Socket {
  data: {
    user: DecodedToken;
  };
}

// Helper to extract rows from different database result formats
const extractRows = (result: any): any[] => {
  if (!result) return [];
  if (Array.isArray(result)) {
    if (result.length > 0 && Array.isArray(result[0])) {
      return result[0];
    }
    return result;
  }
  if (result.rows) return result.rows;
  if (result[0]) return result[0];
  return result;
};

const extractSingleRow = (result: any): any => {
  const rows = extractRows(result);
  return rows.length > 0 ? rows[0] : null;
};

const extractInsertId = (result: any): number => {
  if (!result) return 0;
  if (result.insertId) return result.insertId;
  if (result[0] && result[0].insertId) return result[0].insertId;
  if (result.rows && result.rows.insertId) return result.rows.insertId;
  return 0;
};

let io: Server;
const onlineUsers = new Map<number, string>(); // userId -> socketId

/**
 * =========================
 * INITIALIZE SOCKET.IO
 * =========================
 */
export const initSocket = (server: HttpServer) => {
  io = new Server(server, {
    cors: {
      origin: '*',
      methods: ['GET', 'POST'],
      credentials: true,
    },
    path: '/socket.io',
  });

  /**
   * 🔐 AUTHENTICATION MIDDLEWARE
   */
  io.use((socket: ClientSocket, next) => {
    try {
      const token = socket.handshake.auth?.token;
      
      console.log('🔐 Socket auth attempt:', token ? 'Token provided' : 'No token');

      if (!token) {
        console.log('❌ No token provided');
        return next(new Error('No token provided'));
      }

      const secret = process.env.JWT_ACCESS_SECRET || process.env.JWT_SECRET;
      
      if (!secret) {
        console.log('❌ JWT secret not configured');
        return next(new Error('JWT secret not configured'));
      }

      const decoded = jwt.verify(token, secret) as DecodedToken;
      
      if (!decoded.id || !decoded.role) {
        console.log('❌ Invalid token payload');
        return next(new Error('Invalid token payload'));
      }

      socket.data.user = decoded;
      console.log('✅ Socket authenticated for user:', decoded.id);
      next();
    } catch (err: any) {
      console.log('❌ Socket authentication error:', err.message);
      next(new Error('Invalid token'));
    }
  });

  /**
   * 📡 CONNECTION HANDLER
   */
  io.on('connection', (socket: ClientSocket) => {
    const user = socket.data.user;
    
    console.log(`🟢 User connected: ${user.id} (${user.full_name || 'Unknown'})`);
    console.log(`📊 Online users: ${onlineUsers.size + 1}`);

    // 🟢 TRACK ONLINE USERS
    onlineUsers.set(user.id, socket.id);

    /**
     * 📥 JOIN CHAT ROOM
     */
    socket.on('join_room', (conversationId: number) => {
      console.log(`📥 User ${user.id} joined room: room_${conversationId}`);
      socket.join(`room_${conversationId}`);
      
      // Notify other users in the room
      socket.to(`room_${conversationId}`).emit('user_joined', {
        userId: user.id,
        userName: user.full_name,
      });
    });

    /**
     * 📤 LEAVE CHAT ROOM
     */
    socket.on('leave_room', (conversationId: number) => {
      console.log(`📤 User ${user.id} left room: room_${conversationId}`);
      socket.leave(`room_${conversationId}`);
      
      // Notify other users in the room
      socket.to(`room_${conversationId}`).emit('user_left', {
        userId: user.id,
        userName: user.full_name,
      });
    });

    /**
     * 💬 SEND MESSAGE (WITH DATABASE SAVE)
     */
    socket.on('send_message', async (data: {
      conversationId: number;
      message: string;
      image_url?: string;
    }) => {
      try {
        const { conversationId, message, image_url } = data;
        
        console.log(`💬 User ${user.id} sending message to conversation ${conversationId}`);

        if (!message && !image_url) {
          console.log('❌ No message content');
          socket.emit('error', { message: 'Message or image is required' });
          return;
        }

        // 💾 SAVE MESSAGE TO DATABASE
        const result = await db.query(
          `INSERT INTO messages (conversation_id, sender_id, message, image_url, is_read, created_at)
           VALUES (?, ?, ?, ?, 0, NOW())`,
          [conversationId, user.id, message || null, image_url || null]
        );

        const newId = extractInsertId(result);

        // Get the inserted message with sender details
        const newMessageResult = await db.query(
          `SELECT 
            m.*,
            u.full_name as sender_name,
            u.role as sender_role
           FROM messages m
           LEFT JOIN users u ON m.sender_id = u.id
           WHERE m.id = ?`,
          [newId]
        );

        const newMessage = extractSingleRow(newMessageResult);

        // Update conversation's last message
        await db.query(
          `UPDATE conversations 
           SET last_message = ?, last_message_at = NOW(), updated_at = NOW() 
           WHERE id = ?`,
          [message || '📷 Image', conversationId]
        );

        // 📡 BROADCAST MESSAGE TO ALL USERS IN THE ROOM
        const messageData = {
          id: newId,
          conversationId,
          message: message || null,
          image_url: image_url || null,
          sender_id: user.id,
          sender_name: user.full_name || 'Unknown',
          sender_role: user.role,
          created_at: newMessage?.created_at || new Date().toISOString(),
          is_read: 0,
        };

        io.to(`room_${conversationId}`).emit('receive_message', messageData);

        console.log(`✅ Message sent to room: room_${conversationId}`);
      } catch (err) {
        console.log('❌ Socket message error:', err);
        socket.emit('error', { message: 'Failed to send message' });
      }
    });

    /**
     * ✏️ MARK MESSAGE AS READ
     */
    socket.on('mark_read', async (data: {
      conversationId: number;
      messageIds: number[];
    }) => {
      try {
        const { conversationId, messageIds } = data;
        
        if (!messageIds || messageIds.length === 0) return;

        await db.query(
          `UPDATE messages 
           SET is_read = 1, read_at = NOW() 
           WHERE id IN (?) AND conversation_id = ? AND sender_id != ?`,
          [messageIds, conversationId, user.id]
        );

        // Notify other users that messages were read
        socket.to(`room_${conversationId}`).emit('messages_read', {
          messageIds,
          userId: user.id,
        });
      } catch (err) {
        console.log('❌ Mark read error:', err);
      }
    });

    /**
     * ✏️ MARK ALL MESSAGES AS READ IN CONVERSATION
     */
    socket.on('mark_all_read', async (data: {
      conversationId: number;
    }) => {
      try {
        const { conversationId } = data;

        await db.query(
          `UPDATE messages 
           SET is_read = 1, read_at = NOW() 
           WHERE conversation_id = ? AND sender_id != ? AND is_read = 0`,
          [conversationId, user.id]
        );

        // Notify other users that all messages were read
        socket.to(`room_${conversationId}`).emit('all_messages_read', {
          conversationId,
          userId: user.id,
        });
      } catch (err) {
        console.log('❌ Mark all read error:', err);
      }
    });

    /**
     * 🖊️ TYPING INDICATOR
     */
    socket.on('typing', (data: {
      conversationId: number;
      isTyping: boolean;
    }) => {
      const { conversationId, isTyping } = data;
      
      socket.to(`room_${conversationId}`).emit('user_typing', {
        userId: user.id,
        userName: user.full_name,
        isTyping,
      });
    });

    /**
     * 👤 GET ONLINE USERS
     */
    socket.on('get_online_users', () => {
      const userIds = Array.from(onlineUsers.keys());
      socket.emit('online_users', userIds);
    });

    /**
     * 🔴 DISCONNECT
     */
    socket.on('disconnect', () => {
      console.log(`🔴 User disconnected: ${user.id} (${user.full_name || 'Unknown'})`);
      console.log(`📊 Online users remaining: ${onlineUsers.size - 1}`);

      onlineUsers.delete(user.id);

      // Notify others that user went offline
      socket.broadcast.emit('user_offline', {
        userId: user.id,
      });
    });
  });

  return io;
};

/**
 * =========================
 * HELPER FUNCTIONS
 * =========================
 */

/**
 * Get IO instance
 */
export const getIO = () => {
  if (!io) {
    throw new Error('Socket.io not initialized');
  }
  return io;
};

/**
 * Check if user is online
 */
export const isUserOnline = (userId: number): boolean => {
  return onlineUsers.has(userId);
};

/**
 * Get user's socket ID
 */
export const getUserSocketId = (userId: number): string | undefined => {
  return onlineUsers.get(userId);
};

/**
 * Send notification to a specific user
 */
export const sendToUser = (userId: number, event: string, data: any) => {
  const socketId = onlineUsers.get(userId);
  if (socketId) {
    io.to(socketId).emit(event, data);
    return true;
  }
  return false;
};

/**
 * Send notification to multiple users
 */
export const sendToUsers = (userIds: number[], event: string, data: any) => {
  const sent = [];
  for (const userId of userIds) {
    const socketId = onlineUsers.get(userId);
    if (socketId) {
      io.to(socketId).emit(event, data);
      sent.push(userId);
    }
  }
  return sent;
};

/**
 * Broadcast to all connected users
 */
export const broadcastToAll = (event: string, data: any) => {
  io.emit(event, data);
};

export default {
  initSocket,
  getIO,
  isUserOnline,
  getUserSocketId,
  sendToUser,
  sendToUsers,
  broadcastToAll,
};