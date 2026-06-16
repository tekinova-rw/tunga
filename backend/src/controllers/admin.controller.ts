// backend/src/controllers/admin.controller.ts
import { Request, Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * =========================
 * ROLE CHECKS
 * =========================
 */
const isSuperAdmin = (user: any) => user?.role === 'super_admin';
const isDistrictAdmin = (user: any) => user?.role === 'district_admin';

/**
 * =========================
 * GET USERS (SCOPED)
 * =========================
 */
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let query = `
      SELECT id, full_name, phone, role, status, district_id, created_at
      FROM users
    `;

    const params: any[] = [];
    let whereAdded = false;

    /**
     * SUPER ADMIN → sees all
     */
    if (isSuperAdmin(user)) {
      // no filter
    }

    /**
     * DISTRICT ADMIN → only own district
     */
    else if (isDistrictAdmin(user)) {
      query += ' WHERE district_id = ?';
      params.push(user.district_id);
      whereAdded = true;
    }

    /**
     * ANY OTHER ROLE → forbidden
     */
    else {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    const [rows]: any = await db.query(query, params);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Failed to fetch users' });
  }
};

/**
 * =========================
 * APPROVE USER
 * =========================
 */
export const approveUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!id) {
      return res.status(400).json({ message: 'User ID required' });
    }

    /**
     * DISTRICT ADMIN can only approve within district
     */
    const [target]: any = await db.query(
      'SELECT district_id FROM users WHERE id = ?',
      [id]
    );

    if (target.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isDistrictAdmin(user) && target[0].district_id !== user.district_id) {
      return res.status(403).json({
        message: 'Not allowed outside your district',
      });
    }

    await db.query(
      `UPDATE users 
       SET status = 'active', is_verified = 1 
       WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'User approved successfully',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Failed to approve user' });
  }
};

/**
 * =========================
 * REJECT USER
 * =========================
 */
export const rejectUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [target]: any = await db.query(
      'SELECT district_id FROM users WHERE id = ?',
      [id]
    );

    if (target.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (isDistrictAdmin(user) && target[0].district_id !== user.district_id) {
      return res.status(403).json({
        message: 'Not allowed outside your district',
      });
    }

    await db.query(
      `UPDATE users 
       SET status = 'rejected', is_verified = 0 
       WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'User rejected successfully',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({ message: 'Failed to reject user' });
  }
};

/**
 * =========================
 * DELETE USER (SUPER ADMIN ONLY)
 * =========================
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || !isSuperAdmin(user)) {
      return res.status(403).json({
        message: 'Only super admin can delete users',
      });
    }

    const [rows]: any = await db.query(
      'SELECT id FROM users WHERE id = ?',
      [id]
    );

    if (rows.length === 0) {
      return res.status(404).json({ message: 'User not found' });
    }

    await db.query('DELETE FROM users WHERE id = ?', [id]);

    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      success: false,
      message: 'Failed to delete user',
    });
  }
};

/**
 * =========================
 * DASHBOARD STATS
 * =========================
 */
export const dashboardStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let query = `
      SELECT 
        COUNT(*) as totalUsers,
        SUM(role = 'farmer') as totalFarmers,
        SUM(role = 'veterinarian') as totalVets,
        SUM(status = 'pending') as pendingUsers
      FROM users
    `;

    const params: any[] = [];

    if (isDistrictAdmin(user)) {
      query += ' WHERE district_id = ?';
      params.push(user.district_id);
    }

    const [stats]: any = await db.query(query, params);

    return res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.log(error);
    return res.status(500).json({
      message: 'Failed to load dashboard stats',
    });
  }
};