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
  is_read: number;
  created_at: Date;
  status: 'sent' | 'delivered' | 'read';
  seen_at: Date | null;
}

// Get messages for a conversation
export const getMessages = async (req: Request, res: Response) => {
  try {
    const { conversationId } = req.params;
    const userId = (req as any).user?.id;
    
    console.log(`📥 Getting messages for conversation: ${conversationId}`);
    
    // Get all messages for this conversation
    const [messages] = await pool.execute<Message[]>(
      `SELECT m.*, 
              u.name as sender_name,
              m.status
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.conversation_id = ?
       ORDER BY m.created_at ASC`,
      [conversationId]
    );
    
    // Mark unread messages as read (where current user is not the sender)
    await pool.execute(
      `UPDATE messages 
       SET status = 'read', is_read = 1, seen_at = NOW()
       WHERE conversation_id = ? AND sender_id != ? AND is_read = 0`,
      [conversationId, userId]
    );
    
    res.json(messages);
  } catch (error) {
    console.error('Get messages error:', error);
    res.status(500).json({ error: 'Failed to get messages' });
  }
};

// Send a new message
export const sendMessage = async (req: Request, res: Response) => {
  try {
    const { conversation_id, message, receiver_id } = req.body;
    const sender_id = (req as any).user?.id;
    
    console.log('📤 Sending message:', { conversation_id, sender_id, receiver_id, message });
    
    // Insert message into database
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO messages (conversation_id, sender_id, message, status, created_at)
       VALUES (?, ?, ?, 'sent', NOW())`,
      [conversation_id, sender_id, message]
    );
    
    // Get the inserted message with full details
    const [newMessage] = await pool.execute<Message[]>(
      `SELECT m.*, u.name as sender_name
       FROM messages m
       LEFT JOIN users u ON m.sender_id = u.id
       WHERE m.id = ?`,
      [result.insertId]
    );
    
    res.status(201).json(newMessage[0]);
  } catch (error) {
    console.error('Send message error:', error);
    res.status(500).json({ error: 'Failed to send message' });
  }
};

// Get all conversations for a user
export const getConversations = async (req: Request, res: Response) => {
  try {
    const userId = (req as any).user?.id;
    
    console.log(`📋 Getting conversations for user: ${userId}`);
    
    const [conversations] = await pool.execute(
      `SELECT DISTINCT 
          c.*,
          CASE 
            WHEN c.farmer_id = ? THEN c.veterinarian_id
            ELSE c.farmer_id
          END as other_user_id,
          (SELECT u.name FROM users u WHERE u.id = 
            CASE 
              WHEN c.farmer_id = ? THEN c.veterinarian_id
              ELSE c.farmer_id
            END
          ) as other_user_name,
          (SELECT u.role FROM users u WHERE u.id = 
            CASE 
              WHEN c.farmer_id = ? THEN c.veterinarian_id
              ELSE c.farmer_id
            END
          ) as other_user_role,
          (SELECT message FROM messages 
           WHERE conversation_id = c.id 
           ORDER BY created_at DESC LIMIT 1) as last_message,
          (SELECT created_at FROM messages 
           WHERE conversation_id = c.id 
           ORDER BY created_at DESC LIMIT 1) as last_message_time,
          (SELECT COUNT(*) FROM messages 
           WHERE conversation_id = c.id AND sender_id != ? AND is_read = 0) as unread_count
       FROM conversations c
       INNER JOIN participants p ON c.id = p.conversation_id
       WHERE p.user_id = ?
       ORDER BY last_message_time DESC`,
      [userId, userId, userId, userId, userId]
    );
    
    res.json(conversations);
  } catch (error) {
    console.error('Get conversations error:', error);
    res.status(500).json({ error: 'Failed to get conversations' });
  }
};

// Create a new conversation
export const createConversation = async (req: Request, res: Response) => {
  try {
    const { farmerId, veterinarianId } = req.body;
    const userId = (req as any).user?.id;
    
    console.log(`🆕 Creating conversation between farmer ${farmerId} and vet ${veterinarianId}`);
    
    // Check if conversation already exists
    const [existing] = await pool.execute(
      `SELECT c.id 
       FROM conversations c
       INNER JOIN participants p1 ON c.id = p1.conversation_id AND p1.user_id = ?
       INNER JOIN participants p2 ON c.id = p2.conversation_id AND p2.user_id = ?`,
      [farmerId, veterinarianId]
    );
    
    if ((existing as any[]).length > 0) {
      console.log('Conversation already exists:', (existing as any[])[0].id);
      return res.json({ conversation_id: (existing as any[])[0].id });
    }
    
    // Create new conversation
    const [result] = await pool.execute<ResultSetHeader>(
      `INSERT INTO conversations (farmer_id, veterinarian_id, created_at)
       VALUES (?, ?, NOW())`,
      [farmerId, veterinarianId]
    );
    
    const conversationId = result.insertId;
    
    // Add participants
    await pool.execute(
      `INSERT INTO participants (conversation_id, user_id) VALUES (?, ?), (?, ?)`,
      [conversationId, farmerId, conversationId, veterinarianId]
    );
    
    console.log('New conversation created:', conversationId);
    res.status(201).json({ conversation_id: conversationId });
  } catch (error) {
    console.error('Create conversation error:', error);
    res.status(500).json({ error: 'Failed to create conversation' });
  }
};

// Mark message as read
export const markAsRead = async (req: Request, res: Response) => {
  try {
    const { messageId } = req.params;
    const userId = (req as any).user?.id;
    
    await pool.execute(
      `UPDATE messages 
       SET status = 'read', is_read = 1, seen_at = NOW()
       WHERE id = ? AND sender_id != ?`,
      [messageId, userId]
    );
    
    res.json({ success: true });
  } catch (error) {
    console.error('Mark as read error:', error);
    res.status(500).json({ error: 'Failed to mark as read' });
  }
};