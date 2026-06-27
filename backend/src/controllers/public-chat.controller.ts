// ============================================================
// FILE: backend/src/controllers/public-chat.controller.ts
// DESCRIPTION: Public chat controller for all users
// ============================================================

import { Request, Response } from 'express';
import mysql from 'mysql2/promise';
import { RowDataPacket, ResultSetHeader } from 'mysql2';

const pool = mysql.createPool({
  host: 'localhost',
  user: 'root',
  password: '',
  database: 'vetconnect',
  waitForConnections: true,
  connectionLimit: 10,
  queueLimit: 0
});

interface PublicMessage extends RowDataPacket {
  id: number;
  user_id: number;
  message: string;
  image_url: string | null;
  is_deleted: number;
  created_at: Date;
  user_name?: string;
  user_role?: string;
}

/**
 * =========================
 * GET PUBLIC CHAT MESSAGES
 * =========================
 * GET /api/public-chat/messages
 */
export const getPublicMessages = async (req: Request, res: Response): Promise<void> => {
  try {
    const { limit = 50, offset = 0 } = req.query;

    const [messages] = await pool.query<PublicMessage[]>(
      `SELECT 
        pm.*,
        u.full_name as user_name,
        u.role as user_role
       FROM public_chat_messages pm
       LEFT JOIN users u ON pm.user_id = u.id
       WHERE pm.is_deleted = 0
       ORDER BY pm.created_at DESC
       LIMIT ? OFFSET ?`,
      [Number(limit), Number(offset)]
    );

    res.json({
      success: true,
      data: messages,
      pagination: {
        limit: Number(limit),
        offset: Number(offset),
      }
    });
  } catch (error) {
    console.error('Get public messages error:', error);
    res.status(500).json({ error: 'Failed to get public messages' });
  }
};

/**
 * =========================
 * SEND PUBLIC MESSAGE
 * =========================
 * POST /api/public-chat/messages
 */
export const sendPublicMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { message, image_url } = req.body;
    const user = (req as any).user;
    const userId = user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!message && !image_url) {
      res.status(400).json({ error: 'Message or image is required' });
      return;
    }

    const [result] = await pool.query<ResultSetHeader>(
      `INSERT INTO public_chat_messages (user_id, message, image_url, created_at)
       VALUES (?, ?, ?, NOW())`,
      [userId, message || null, image_url || null]
    );

    const [newMessage] = await pool.query<PublicMessage[]>(
      `SELECT 
        pm.*,
        u.full_name as user_name,
        u.role as user_role
       FROM public_chat_messages pm
       LEFT JOIN users u ON pm.user_id = u.id
       WHERE pm.id = ?`,
      [result.insertId]
    );

    res.status(201).json({
      success: true,
      message: 'Message sent successfully',
      data: newMessage[0]
    });
  } catch (error) {
    console.error('Send public message error:', error);
    res.status(500).json({ error: 'Failed to send public message' });
  }
};

/**
 * =========================
 * DELETE PUBLIC MESSAGE
 * =========================
 * DELETE /api/public-chat/messages/:id
 */
export const deletePublicMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const user = (req as any).user;
    const userId = user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    const [message] = await pool.query<RowDataPacket[]>(
      `SELECT user_id FROM public_chat_messages WHERE id = ? AND is_deleted = 0`,
      [id]
    );

    if (message.length === 0) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    if (message[0].user_id !== userId && user.role !== 'super_admin' && user.role !== 'district_admin') {
      res.status(403).json({ error: 'You do not have permission to delete this message' });
      return;
    }

    await pool.query(
      `UPDATE public_chat_messages SET is_deleted = 1 WHERE id = ?`,
      [id]
    );

    res.json({ success: true, message: 'Message deleted successfully' });
  } catch (error) {
    console.error('Delete public message error:', error);
    res.status(500).json({ error: 'Failed to delete public message' });
  }
};

/**
 * =========================
 * REPORT PUBLIC MESSAGE
 * =========================
 * POST /api/public-chat/messages/:id/report
 */
export const reportPublicMessage = async (req: Request, res: Response): Promise<void> => {
  try {
    const { id } = req.params;
    const { reason } = req.body;
    const user = (req as any).user;
    const userId = user?.id;

    if (!userId) {
      res.status(401).json({ error: 'User not authenticated' });
      return;
    }

    if (!reason) {
      res.status(400).json({ error: 'Reason is required' });
      return;
    }

    const [message] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM public_chat_messages WHERE id = ? AND is_deleted = 0`,
      [id]
    );

    if (message.length === 0) {
      res.status(404).json({ error: 'Message not found' });
      return;
    }

    const [existing] = await pool.query<RowDataPacket[]>(
      `SELECT id FROM message_reports WHERE reporter_id = ? AND message_id = ?`,
      [userId, id]
    );

    if (existing.length > 0) {
      res.status(400).json({ error: 'You have already reported this message' });
      return;
    }

    await pool.query(
      `INSERT INTO message_reports (reporter_id, message_id, reason, status, created_at)
       VALUES (?, ?, ?, 'pending', NOW())`,
      [userId, id, reason]
    );

    res.status(201).json({ success: true, message: 'Report submitted successfully' });
  } catch (error) {
    console.error('Report public message error:', error);
    res.status(500).json({ error: 'Failed to report public message' });
  }
};

export default {
  getPublicMessages,
  sendPublicMessage,
  deletePublicMessage,
  reportPublicMessage,
};