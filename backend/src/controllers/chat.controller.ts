// ============================================================
// FILE: backend/src/controllers/chat.controller.ts
// DESCRIPTION: Chat controller for messaging between users
// ============================================================

import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

// Database connection pool
const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'vetconnect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

interface Message extends RowDataPacket {
  id: number;
  conversation_id: number;
  sender_id: number;
  message: string;
  image_url: string | null;
  is_read: number;
  read_at: Date | null;
  created_at: Date;
}

interface Conversation extends RowDataPacket {
  id: number;
  farmer_id: number;
  veterinarian_id: number;
  last_message: string | null;
  last_message_at: Date | null;
  created_at: Date;
  updated_at: Date;
}

/**
 * =========================
 * GET MESSAGES FOR A CONVERSATION
 * =========================
 * GET /api/chat/conversations/:conversationId/messages
 */
export const getMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const user = (req as any).user;
    const userId = user?.id;
    
    console.log(`📥 Getting messages for conversation: ${conversationId}`);
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    // Check if user has access to this conversation
    const [convCheck] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM conversations 
       WHERE id = ? AND (farmer_id = ? OR veterinarian_id = ?)`,
      [conversationId, userId, userId]
    );
    
    if (convCheck.length === 0) {
      res.status(403).json({ error: 'You do not have access to this conversation' });
      return;
    }
    
    // Get all messages for this conversation
    const [messages] = await pool.query<Message[]>(
      `SELECT 
        m.*,
        u.full_name as sender_name,
        u.role as sender_role
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    
    // Mark unread messages as read (where current user is not the sender)
    await pool.query(
      `UPDATE messages 
       SET is_read = 1, read_at = NOW()
       WHERE conversation_id = ? AND sender_id != ? AND is_read = 0`,
      [conversationId, userId]
    );
    
    res.json({
      success: true,
      data: messages
    });
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

/**
 * =========================
 * SEND A NEW MESSAGE
 * =========================
 * POST /api/chat/messages
 */
export const sendMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversation_id, message, image_url } = req.body;
    const user = (req as any).user;
    const sender_id = user?.id;
    
    console.log('📤 Sending message:', { conversation_id, sender_id, message, image_url });
    
    if (!message && !image_url) {
      res.status(400).json({ error: 'Message or image is required' });
      return;
    }
    
    if (!sender_id) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    // Check if user has access to this conversation
    const [convCheck] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM conversations 
       WHERE id = ? AND (farmer_id = ? OR veterinarian_id = ?)`,
      [conversation_id, sender_id, sender_id]
    );
    
    if (convCheck.length === 0) {
      res.status(403).json({ error: 'You do not have access to this conversation' });
      return;
    }
    
    // Insert message into database
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO messages (conversation_id, sender_id, message, image_url, is_read, created_at)
       VALUES (?, ?, ?, ?, 0, NOW())`,
      [conversation_id, sender_id, message || null, image_url || null]
    );
    
    // Update conversation's last message
    await pool.query(
      `UPDATE conversations 
       SET last_message = ?, last_message_at = NOW(), updated_at = NOW() 
       WHERE id = ?`,
      [message || '📷 Image', conversation_id]
    );
    
    // Get the inserted message with full details
    const [newMessage] = await pool.query<Message[]>(
      `SELECT 
        m.*,
        u.full_name as sender_name,
        u.role as sender_role
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage[0]
    });
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

/**
 * =========================
 * GET ALL CONVERSATIONS FOR A USER
 * =========================
 * GET /api/chat/conversations
 */
export const getConversations = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    
    console.log(`📋 Getting conversations for user: ${userId}`);
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const [conversations] = await pool.query<Conversation[]>(
      `SELECT 
        c.*,
        CASE 
          WHEN c.farmer_id = ? THEN c.veterinarian_id
          ELSE c.farmer_id
        END as other_user_id,
        CASE 
          WHEN c.farmer_id = ? THEN 
            (SELECT full_name FROM users WHERE id = c.veterinarian_id)
          ELSE 
            (SELECT full_name FROM users WHERE id = c.farmer_id)
        END as other_user_name,
        CASE 
          WHEN c.farmer_id = ? THEN 
            (SELECT role FROM users WHERE id = c.veterinarian_id)
          ELSE 
            (SELECT role FROM users WHERE id = c.farmer_id)
        END as other_user_role,
        (SELECT COUNT(*) FROM messages 
         WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
       FROM conversations c
       WHERE c.farmer_id = ? OR c.veterinarian_id = ?
       ORDER BY c.last_message_at DESC`,
      [userId, userId, userId, userId, userId, userId]
    );
    
    res.json({
      success: true,
      data: conversations
    });
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

/**
 * =========================
 * CREATE A NEW CONVERSATION
 * =========================
 * POST /api/chat/conversations
 */
export const createConversation = async (req: Request, res: Response): Promise<void> => {
  try {
    const { farmerId, veterinarianId } = req.body;
    const user = (req as any).user;
    
    console.log(`🆕 Creating conversation between farmer ${farmerId} and vet ${veterinarianId}`);
    
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    if (!farmerId || !veterinarianId) {
      res.status(400).json({ error: 'Farmer ID and Veterinarian ID are required' });
      return;
    }
    
    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM conversations 
       WHERE (farmer_id = ? AND veterinarian_id = ?) 
       OR (farmer_id = ? AND veterinarian_id = ?)`,
      [farmerId, veterinarianId, veterinarianId, farmerId]
    );
    
    if (existing.length > 0) {
      console.log('Conversation already exists:', existing[0].id);
      res.json({ 
        success: true,
        conversation_id: existing[0].id,
        message: 'Conversation already exists'
      });
      return;
    }
    
    // Create new conversation
    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO conversations (farmer_id, veterinarian_id, created_at, updated_at)
       VALUES (?, ?, NOW(), NOW())`,
      [farmerId, veterinarianId]
    );
    
    const conversationId = result.insertId;
    
    console.log('New conversation created:', conversationId);
    res.status(201).json({ 
      success: true,
      conversation_id: conversationId,
      message: 'Conversation created successfully'
    });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

/**
 * =========================
 * MARK ALL MESSAGES AS READ
 * =========================
 * PATCH /api/chat/conversations/:conversationId/read-all
 */
export const markAllAsRead = async (req: Request, res: Response): Promise<void> => {
  try {
    const { conversationId } = req.params;
    const user = (req as any).user;
    const userId = user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    // Check if user has access to this conversation
    const [convCheck] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM conversations 
       WHERE id = ? AND (farmer_id = ? OR veterinarian_id = ?)`,
      [conversationId, userId, userId]
    );
    
    if (convCheck.length === 0) {
      res.status(403).json({ error: 'You do not have access to this conversation' });
      return;
    }
    
    await pool.query(
      `UPDATE messages 
       SET is_read = 1, read_at = NOW()
       WHERE conversation_id = ? AND sender_id != ? AND is_read = 0`,
      [conversationId, userId]
    );
    
    res.json({ 
      success: true, 
      message: 'All messages marked as read' 
    });
  } catch (error) {
    console.error('Mark all as read error:', error);
    res.status(500).json({ error: 'Failed to mark messages as read' });
  }
};

/**
 * =========================
 * GET UNREAD COUNT
 * =========================
 * GET /api/chat/unread-count
 */
export const getUnreadCount = async (req: Request, res: Response): Promise<void> => {
  try {
    const user = (req as any).user;
    const userId = user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    const [result] = await pool.query<RowDataPacket[]>(
      `SELECT COUNT(*) as unread_count
       FROM messages m
       JOIN conversations c ON m.conversation_id = c.id
       WHERE (c.farmer_id = ? OR c.veterinarian_id = ?) 
       AND m.sender_id != ? 
       AND m.is_read = 0`,
      [userId, userId, userId]
    );
    
    res.json({ 
      success: true,
      unread_count: result[0]?.unread_count || 0 
    });
  } catch (error) {
    console.error('Get unread count error:', error);
    res.status(500).json({ error: 'Failed to get unread count' });
  }
};

/**
 * =========================
 * DELETE MESSAGE
 * =========================
 * DELETE /api/chat/messages/:messageId
 */
export const deleteMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { messageId } = req.params;
    const user = (req as any).user;
    const userId = user?.id;
    
    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    // Check if user is the sender
    const [message] = await pool.query<RowDataPacket[]>(
      `SELECT sender_id FROM messages WHERE id = ?`,
      [messageId]
    );
    
    if (message.length === 0) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }
    
    if (message[0].sender_id !== userId) {
      res.status(403).json({ error: 'You can only delete your own messages' });
      return;
    }
    
    await pool.query(
      `DELETE FROM messages WHERE id = ? AND sender_id = ?`,
      [messageId, userId]
    );
    
    res.json({ 
      success: true, 
      message: 'Message deleted successfully' 
    });
  } catch (error) {
    console.error('Delete message error:', error);
    res.status(500).json({ error: 'Failed to delete message' });
  }
};

/**
 * =========================
 * GET CONVERSATION BY USERS
 * =========================
 * GET /api/chat/conversations/by-users
 */
export const getConversationByUsers = async (req: Request, res: Response): Promise<void> => {
  try {
    const { farmerId, veterinarianId } = req.query;
    const user = (req as any).user;
    
    if (!user) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }
    
    if (!farmerId || !veterinarianId) {
      res.status(400).json({ error: 'Farmer ID and Veterinarian ID are required' });
      return;
    }
    
    // ✅ FIX: Use pool.query instead of pool.execute
    const [rows] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM conversations 
       WHERE (farmer_id = ? AND veterinarian_id = ?) 
       OR (farmer_id = ? AND veterinarian_id = ?)`,
      [farmerId, veterinarianId, veterinarianId, farmerId]
    );
    
    res.json({ 
      success: true,
      conversation_id: rows[0]?.id || null 
    });
  } catch (error) {
    console.error('Get conversation by users error:', error);
    res.status(500).json({ error: 'Failed to get conversation' });
  }
};

// Export all functions
export default {
  getMessages,
  sendMessage,
  getConversations,
  createConversation,
  markAllAsRead,
  getUnreadCount,
  deleteMessage,
  getConversationByUsers
};