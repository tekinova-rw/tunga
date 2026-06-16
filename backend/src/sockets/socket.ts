// src/sockets/socket.ts
import { Server } from 'socket.io';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

let io: Server;

const onlineUsers = new Map<number, string>(); // userId -> socketId

export const initSocket = (server: any) => {
  io = new Server(server, {
    cors: {
      origin: '*',
    },
  });

  /**
   * 🔐 AUTHENTICATED CONNECTION
   */
  io.use((socket, next) => {
    try {
      const token = socket.handshake.auth?.token;

      if (!token) {
        return next(new Error('No token provided'));
      }

      const decoded = jwt.verify(token, process.env.JWT_SECRET!) as any;

      socket.data.user = decoded;
      next();
    } catch (err) {
      next(new Error('Invalid token'));
    }
  });

  io.on('connection', (socket) => {
    const user = socket.data.user;

    console.log('User connected:', user.id);

    // 🟢 TRACK ONLINE USERS
    onlineUsers.set(user.id, socket.id);

    /**
     * 📥 JOIN CHAT ROOM
     */
    socket.on('join_room', (conversationId: number) => {
      socket.join(`room_${conversationId}`);
    });

    /**
     * 💬 SEND MESSAGE (WITH DATABASE SAVE)
     */
    socket.on('send_message', async (data) => {
      try {
        const { conversationId, message } = data;

        // 💾 SAVE MESSAGE TO DATABASE
        await db.query(
          `INSERT INTO messages (conversation_id, sender_id, message)
           VALUES (?, ?, ?)`,
          [conversationId, user.id, message]
        );

        // 📡 BROADCAST MESSAGE
        io.to(`room_${conversationId}`).emit('receive_message', {
          conversationId,
          message,
          senderId: user.id,
          created_at: new Date(),
        });
      } catch (err) {
        console.log('Socket message error:', err);
      }
    });

    /**
     * 🔴 DISCONNECT
     */
    socket.on('disconnect', () => {
      console.log('User disconnected:', user.id);

      onlineUsers.delete(user.id);
    });
  });

  return io;
};