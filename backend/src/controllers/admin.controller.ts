// ============================================================
// FILE: backend/src/controllers/admin.controller.ts
// DESCRIPTION: Admin controller for user management operations
// ============================================================

import bcrypt from 'bcryptjs';
import { Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * =========================
 * HELPER FUNCTIONS
 * =========================
 */

// Extract rows from different database result formats
const extractRows = (result: any): any[] => {
  if (!result) return [];
  if (Array.isArray(result)) {
    // Check if it's [rows, fields] format from mysql2
    if (result.length > 0 && Array.isArray(result[0])) {
      return result[0];
    }
    return result;
  }
  if (result.rows) return result.rows;
  if (result[0]) return result[0];
  return result;
};

// Extract single row from different database result formats
const extractSingleRow = (result: any): any => {
  const rows = extractRows(result);
  return rows.length > 0 ? rows[0] : null;
};

// Get insert ID from different database result formats
const extractInsertId = (result: any): number => {
  if (!result) return 0;
  if (result.insertId) return result.insertId;
  if (result[0] && result[0].insertId) return result[0].insertId;
  if (result.rows && result.rows.insertId) return result.rows.insertId;
  return 0;
};

// Check if result has data
const hasData = (result: any): boolean => {
  const rows = extractRows(result);
  return rows.length > 0;
};

// Helper to safely parse ID from params
const parseId = (id: string | string[]): number => {
  if (Array.isArray(id)) {
    return parseInt(id[0]);
  }
  return parseInt(id);
};

/**
 * =========================
 * ROLE CHECKS
 * =========================
 */
const isSuperAdmin = (user: any) => user?.role === 'super_admin';
const isDistrictAdmin = (user: any) => user?.role === 'district_admin';

/**
 * =========================
 * CAN MANAGE USER HELPER
 * =========================
 * Checks if the current user can manage the target user
 */
const canManageUser = (currentUser: any, targetUser: any): boolean => {
  // Super admin can manage everyone
  if (isSuperAdmin(currentUser)) return true;
  
  // District admin can only manage users in their district
  if (isDistrictAdmin(currentUser)) {
    // District admin must have a district assigned
    if (!currentUser.district_id) return false;
    // Target user must be in the same district
    return targetUser.district_id === currentUser.district_id;
  }
  
  // Other roles cannot manage users
  return false;
};

/**
 * =========================
 * GET USERS (SCOPED)
 * =========================
 * GET /api/admin/users
 */
export const getUsers = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    console.log('👤 Admin user:', { 
      id: user.id, 
      role: user.role, 
      district_id: user.district_id 
    });

    let query = `
      SELECT 
        u.id, 
        u.full_name, 
        u.phone, 
        u.email, 
        u.role, 
        u.status, 
        u.is_verified, 
        u.district_id, 
        u.created_at,
        u.approved_by,
        u.approved_at,
        u.last_login,
        d.name as district_name,
        d.province as province
      FROM users u
      LEFT JOIN districts d ON u.district_id = d.id
      WHERE u.is_deleted = 0
    `;

    const params: any[] = [];

    if (isDistrictAdmin(user)) {
      query += ' AND u.district_id = ?';
      params.push(user.district_id);
      console.log('🔍 District admin filtering by district:', user.district_id);
    } else {
      console.log('🔍 Super admin - showing all users');
    }

    query += ' ORDER BY u.created_at DESC';

    console.log('📝 SQL Query:', query);
    console.log('📝 Params:', params);

    const result = await db.query(query, params);
    const rows = extractRows(result);
    
    console.log('📊 Total users found:', rows.length);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.log('❌ Get users error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to fetch users' 
    });
  }
};

/**
 * =========================
 * GET USER BY ID
 * =========================
 * GET /api/admin/users/:id
 */
export const getUserById = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'User ID required'
      });
    }

    const result = await db.query(
      `SELECT 
        u.id, 
        u.full_name, 
        u.phone, 
        u.email, 
        u.role, 
        u.status, 
        u.is_verified, 
        u.is_active,
        u.district_id, 
        u.province,
        u.address,
        u.profile_image,
        u.created_at,
        u.updated_at,
        u.approved_by,
        u.approved_at,
        u.last_login,
        d.name as district_name,
        d.province as province_name
      FROM users u
      LEFT JOIN districts d ON u.district_id = d.id
      WHERE u.id = ? AND u.is_deleted = 0`,
      [id]
    );

    const targetUser = extractSingleRow(result);

    if (!targetUser) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    // Check if user has access to this user
    if (!canManageUser(user, targetUser)) {
      return res.status(403).json({
        success: false,
        message: 'Not allowed to view users outside your district'
      });
    }

    // Get veterinarian profile if user is a veterinarian
    let vetProfile = null;
    if (targetUser.role === 'veterinarian') {
      const profileResult = await db.query(
        'SELECT * FROM veterinarian_profiles WHERE user_id = ?',
        [id]
      );
      vetProfile = extractSingleRow(profileResult);
    }

    // Get farmer profile if user is a farmer
    let farmerProfile = null;
    if (targetUser.role === 'farmer') {
      const profileResult = await db.query(
        'SELECT * FROM farmer_profiles WHERE user_id = ?',
        [id]
      );
      farmerProfile = extractSingleRow(profileResult);
    }

    return res.json({
      success: true,
      data: {
        ...targetUser,
        veterinarian_profile: vetProfile,
        farmer_profile: farmerProfile
      }
    });
  } catch (error) {
    console.log('❌ Get user error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch user'
    });
  }
};

/**
 * =========================
 * APPROVE USER
 * =========================
 * PATCH /api/admin/users/:id/approve
 */
export const approveUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    console.log('📥 Approve user request:', { 
      adminId: user?.id, 
      adminRole: user?.role, 
      adminDistrict: user?.district_id,
      targetUserId: id 
    });

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    if (!id) {
      return res.status(400).json({ 
        success: false,
        message: 'User ID required' 
      });
    }

    // Get target user with proper result handling
    let targetResult;
    try {
      targetResult = await db.query(
        'SELECT id, district_id, role, status FROM users WHERE id = ? AND is_deleted = 0',
        [id]
      );
    } catch (queryError) {
      const errorMessage = queryError instanceof Error ? queryError.message : 'Unknown error';
      console.error('❌ Query error:', queryError);
      return res.status(500).json({
        success: false,
        message: 'Database query failed',
        error: errorMessage
      });
    }

    const targetUser = extractSingleRow(targetResult);

    if (!targetUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if user has permission to approve
    if (!canManageUser(user, targetUser)) {
      return res.status(403).json({
        success: false,
        message: 'Not allowed to approve users outside your district'
      });
    }

    // Check if already approved
    if (targetUser.status === 'active') {
      return res.status(400).json({
        success: false,
        message: 'User is already approved',
      });
    }

    // Check if user is pending
    if (targetUser.status !== 'pending') {
      return res.status(400).json({
        success: false,
        message: `User status is '${targetUser.status}', only 'pending' users can be approved`,
      });
    }

    // Update user status
    try {
      await db.query(
        `UPDATE users 
         SET status = 'active', is_verified = 1, 
             approved_by = ?, approved_at = NOW() 
         WHERE id = ?`,
        [user.id, id]
      );
      console.log('✅ User approved successfully:', id);
    } catch (updateError) {
      const errorMessage = updateError instanceof Error ? updateError.message : 'Unknown error';
      console.error('❌ Update error:', updateError);
      return res.status(500).json({
        success: false,
        message: 'Failed to update user status',
        error: errorMessage
      });
    }

    // Handle veterinarian profile
    if (targetUser.role === 'veterinarian') {
      try {
        console.log('🔄 Handling veterinarian profile for user:', id);
        
        const profileResult = await db.query(
          'SELECT id FROM veterinarian_profiles WHERE user_id = ?',
          [id]
        );
        
        const profileExists = hasData(profileResult);

        if (profileExists) {
          await db.query(
            `UPDATE veterinarian_profiles 
             SET verification_status = 'approved', 
                 updated_at = NOW() 
             WHERE user_id = ?`,
            [id]
          );
          console.log('✅ Veterinarian profile updated');
        } else {
          await db.query(
            `INSERT INTO veterinarian_profiles (
              user_id, 
              verification_status,
              is_available,
              created_at,
              updated_at
            ) VALUES (?, 'approved', 1, NOW(), NOW())`,
            [id]
          );
          console.log('✅ Veterinarian profile created');
        }
      } catch (profileError) {
        console.error('⚠️ Could not update veterinarian profile:', profileError);
      }
    }

    return res.json({
      success: true,
      message: 'User approved successfully',
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Approve error:', error);
    return res.status(500).json({ 
      success: false,
      message: 'Failed to approve user',
      error: errorMessage,
    });
  }
};

/**
 * =========================
 * REJECT USER
 * =========================
 * PATCH /api/admin/users/:id/reject
 */
export const rejectUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const targetResult = await db.query(
      'SELECT id, district_id, role, status FROM users WHERE id = ? AND is_deleted = 0',
      [id]
    );

    const targetUser = extractSingleRow(targetResult);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!canManageUser(user, targetUser)) {
      return res.status(403).json({
        message: 'Not allowed to reject users outside your district'
      });
    }

    // Can only reject pending users
    if (targetUser.status !== 'pending') {
      return res.status(400).json({
        message: `User status is '${targetUser.status}', only 'pending' users can be rejected`
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
    console.log('❌ Reject error:', error);
    return res.status(500).json({ message: 'Failed to reject user' });
  }
};

/**
 * =========================
 * SUSPEND USER
 * =========================
 * PATCH /api/admin/users/:id/suspend
 */
export const suspendUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userId = parseId(id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (user.id === userId) {
      return res.status(400).json({ 
        message: 'Cannot suspend your own account' 
      });
    }

    const targetResult = await db.query(
      'SELECT id, district_id, role, status FROM users WHERE id = ? AND is_deleted = 0',
      [id]
    );

    const targetUser = extractSingleRow(targetResult);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!canManageUser(user, targetUser)) {
      return res.status(403).json({
        message: 'Not allowed to suspend users outside your district'
      });
    }

    // Cannot suspend super admin
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({
        message: 'Cannot suspend a Super Admin'
      });
    }

    // Cannot suspend district admin unless you're super admin
    if (targetUser.role === 'district_admin' && !isSuperAdmin(user)) {
      return res.status(403).json({
        message: 'Only Super Admin can suspend a District Admin'
      });
    }

    await db.query(
      `UPDATE users 
       SET status = 'suspended', is_active = 0 
       WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'User suspended successfully',
    });
  } catch (error) {
    console.log('❌ Suspend error:', error);
    return res.status(500).json({ message: 'Failed to suspend user' });
  }
};

/**
 * =========================
 * ACTIVATE USER
 * =========================
 * PATCH /api/admin/users/:id/activate
 */
export const activateUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const targetResult = await db.query(
      'SELECT id, district_id, role, status FROM users WHERE id = ? AND is_deleted = 0',
      [id]
    );

    const targetUser = extractSingleRow(targetResult);

    if (!targetUser) {
      return res.status(404).json({ message: 'User not found' });
    }

    if (!canManageUser(user, targetUser)) {
      return res.status(403).json({
        message: 'Not allowed to activate users outside your district'
      });
    }

    // Cannot activate super admin unless you're super admin
    if (targetUser.role === 'super_admin' && !isSuperAdmin(user)) {
      return res.status(403).json({
        message: 'Only Super Admin can activate a Super Admin'
      });
    }

    await db.query(
      `UPDATE users 
       SET status = 'active', is_active = 1 
       WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'User activated successfully',
    });
  } catch (error) {
    console.log('❌ Activate error:', error);
    return res.status(500).json({ message: 'Failed to activate user' });
  }
};

/**
 * =========================
 * UPDATE USER ROLE
 * =========================
 * PATCH /api/admin/users/:id/role
 */
export const updateUserRole = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { role } = req.body;

    if (!user) {
      return res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
    }

    if (!role) {
      return res.status(400).json({ 
        success: false,
        message: 'Role is required' 
      });
    }

    const validRoles = ['farmer', 'veterinarian', 'district_admin', 'super_admin'];
    if (!validRoles.includes(role)) {
      return res.status(400).json({ 
        success: false,
        message: 'Invalid role. Valid roles: ' + validRoles.join(', ')
      });
    }

    // Get target user
    const targetResult = await db.query(
      'SELECT id, district_id, role, status FROM users WHERE id = ? AND is_deleted = 0',
      [id]
    );

    const targetUser = extractSingleRow(targetResult);

    if (!targetUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Check if user has access to this user
    if (!canManageUser(user, targetUser)) {
      return res.status(403).json({
        success: false,
        message: 'Not allowed to update users outside your district'
      });
    }

    // ============================================
    // ROLE ESCALATION PREVENTION
    // ============================================
    
    // 1. Only Super Admin can assign admin roles
    if (role === 'district_admin' || role === 'super_admin') {
      if (!isSuperAdmin(user)) {
        return res.status(403).json({
          success: false,
          message: `Forbidden - Only Super Admin can assign '${role}' role.`,
        });
      }
    }

    // 2. District Admin can ONLY assign farmer or veterinarian
    if (isDistrictAdmin(user)) {
      if (role !== 'farmer' && role !== 'veterinarian') {
        return res.status(403).json({
          success: false,
          message: `Forbidden - District Admin can only assign 'farmer' or 'veterinarian' roles.`,
          allowedRoles: ['farmer', 'veterinarian'],
        });
      }
    }

    // 3. Cannot assign role to yourself
    const targetUserId = parseId(id);
    if (user.id === targetUserId) {
      return res.status(400).json({
        success: false,
        message: 'Cannot change your own role',
      });
    }

    // 4. Cannot change Super Admin's role (even for Super Admin)
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot change Super Admin role',
      });
    }

    // 5. District Admin cannot change another District Admin's role
    if (targetUser.role === 'district_admin' && !isSuperAdmin(user)) {
      return res.status(403).json({
        success: false,
        message: 'Only Super Admin can change District Admin roles',
      });
    }

    // Update user role
    await db.query(
      'UPDATE users SET role = ? WHERE id = ? AND is_deleted = 0',
      [role, id]
    );

    console.log(`✅ User ${id} role updated from ${targetUser.role} to ${role} by ${user.id}`);

    // Get updated user data
    const updatedResult = await db.query(
      'SELECT id, full_name, email, phone, role, district_id, status FROM users WHERE id = ?',
      [id]
    );
    const updatedUser = extractSingleRow(updatedResult);

    return res.json({
      success: true,
      message: `User role updated successfully from '${targetUser.role}' to '${role}'`,
      data: updatedUser,
    });
  } catch (error) {
    console.log('❌ Update role error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to update user role',
    });
  }
};

/**
 * =========================
 * DELETE USER (SUPER ADMIN ONLY)
 * =========================
 * DELETE /api/admin/users/:id
 */
export const deleteUser = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user || !isSuperAdmin(user)) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can delete users',
      });
    }

    const userId = parseId(id);
    if (isNaN(userId)) {
      return res.status(400).json({ message: 'Invalid user ID' });
    }

    if (user.id === userId) {
      return res.status(400).json({ 
        success: false,
        message: 'Cannot delete your own account' 
      });
    }

    const targetResult = await db.query(
      'SELECT id, role FROM users WHERE id = ? AND is_deleted = 0',
      [id]
    );

    const targetUser = extractSingleRow(targetResult);

    if (!targetUser) {
      return res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
    }

    // Cannot delete super admin
    if (targetUser.role === 'super_admin') {
      return res.status(403).json({
        success: false,
        message: 'Cannot delete a Super Admin'
      });
    }

    await db.query(
      'UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE id = ?',
      [id]
    );

    return res.json({
      success: true,
      message: 'User deleted successfully',
    });
  } catch (error) {
    console.log('❌ Delete error:', error);
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
 * GET /api/admin/stats
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
        SUM(role = 'district_admin') as totalAdmins,
        SUM(role = 'super_admin') as totalSuperAdmins,
        SUM(status = 'pending') as pendingUsers,
        SUM(status = 'active') as activeUsers,
        SUM(status = 'suspended') as suspendedUsers,
        SUM(status = 'rejected') as rejectedUsers
      FROM users
      WHERE is_deleted = 0
    `;

    const params: any[] = [];

    if (isDistrictAdmin(user)) {
      query += ' AND district_id = ?';
      params.push(user.district_id);
    }

    const statsResult = await db.query(query, params);
    const stats = extractSingleRow(statsResult);

    return res.json({
      success: true,
      data: stats || {
        totalUsers: 0,
        totalFarmers: 0,
        totalVets: 0,
        totalAdmins: 0,
        totalSuperAdmins: 0,
        pendingUsers: 0,
        activeUsers: 0,
        suspendedUsers: 0,
        rejectedUsers: 0,
      },
    });
  } catch (error) {
    console.log('❌ Stats error:', error);
    return res.status(500).json({
      message: 'Failed to load dashboard stats',
    });
  }
};

/**
 * =========================
 * CREATE ADMIN (SUPER ADMIN ONLY)
 * =========================
 * POST /api/admin/users
 */
export const createAdmin = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user || !isSuperAdmin(user)) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can create admins',
      });
    }

    const { full_name, phone, email, password, role, district_id } = req.body;

    // Validate input
    if (!full_name || !phone || !email || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required: full_name, phone, email, password',
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters',
      });
    }

    // Check if user already exists
    const existingResult = await db.query(
      'SELECT id FROM users WHERE email = ? OR phone = ?',
      [email, phone]
    );

    const existingUser = extractSingleRow(existingResult);

    if (existingUser) {
      return res.status(409).json({
        success: false,
        message: 'User already exists with this email or phone',
      });
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Create admin
    const insertResult = await db.query(
      `INSERT INTO users (
        full_name, phone, email, password, role, district_id, 
        status, is_verified, is_active, is_deleted, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, 'active', 1, 1, 0, NOW(), NOW())`,
      [full_name, phone, email, hashedPassword, role || 'district_admin', district_id || null]
    );

    const newId = extractInsertId(insertResult);

    return res.status(201).json({
      success: true,
      message: 'Admin created successfully',
      data: {
        id: newId,
        full_name,
        phone,
        email,
        role: role || 'district_admin',
      },
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Create admin error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to create admin',
      error: errorMessage,
    });
  }
};

/**
 * =========================
 * DEBUG ENDPOINT (Optional)
 * =========================
 * GET /api/admin/test-db
 */
export const testDbConnection = async (_req: AuthRequest, res: Response) => {
  try {
    console.log('🔍 Testing database connection...');
    
    // Test 1: Simple query
    const test1 = await db.query('SELECT 1 as test');
    console.log('✅ Test 1 result:', test1);
    
    // Test 2: Check users table
    const test2 = await db.query('SELECT id, full_name, role, status FROM users LIMIT 5');
    console.log('✅ Test 2 result:', test2);
    
    // Test 3: Check specific user (ID 10)
    const test3 = await db.query('SELECT id, full_name, role, status FROM users WHERE id = 10');
    console.log('✅ Test 3 result:', test3);
    
    return res.json({
      success: true,
      message: 'Database connection test successful',
      data: {
        test1: extractRows(test1),
        test2: extractRows(test2),
        test3: extractRows(test3)
      }
    });
  } catch (error) {
    const errorMessage = error instanceof Error ? error.message : 'Unknown error';
    console.error('❌ Test error:', error);
    return res.status(500).json({
      success: false,
      message: 'Database test failed',
      error: errorMessage
    });
  }
};

/**
 * =========================
 * GET DISTRICT STATS
 * =========================
 * GET /api/admin/districts/stats
 * Super admin only - Get stats for all districts
 */
export const getDistrictStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user || !isSuperAdmin(user)) {
      return res.status(403).json({
        success: false,
        message: 'Only super admin can view district stats',
      });
    }

    const query = `
      SELECT 
        d.id,
        d.name,
        d.province,
        COUNT(DISTINCT u.id) as total_users,
        SUM(CASE WHEN u.role = 'farmer' THEN 1 ELSE 0 END) as total_farmers,
        SUM(CASE WHEN u.role = 'veterinarian' THEN 1 ELSE 0 END) as total_vets,
        SUM(CASE WHEN u.role = 'district_admin' THEN 1 ELSE 0 END) as total_admins,
        SUM(CASE WHEN u.status = 'pending' THEN 1 ELSE 0 END) as pending_users,
        SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) as active_users
      FROM districts d
      LEFT JOIN users u ON u.district_id = d.id AND u.is_deleted = 0
      GROUP BY d.id, d.name, d.province
      ORDER BY d.name
    `;

    const result = await db.query(query);
    const rows = extractRows(result);

    return res.json({
      success: true,
      data: rows,
    });
  } catch (error) {
    console.log('❌ District stats error:', error);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch district stats',
    });
  }
};