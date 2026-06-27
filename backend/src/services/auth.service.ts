// ============================================================
// FILE: backend/src/services/auth.service.ts
// DESCRIPTION: Authentication service for user management
// ============================================================

import { db } from '../config/db';
import bcrypt from 'bcryptjs';
import { 
  extractRows, 
  extractSingleRow, 
  extractInsertId, 
  getAffectedRows 
} from './db-helpers';

/**
 * =========================
 * TYPES
 * =========================
 */

export type User = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  password: string;
  role: string;
  district_id: number | null;
  province: string | null;
  address: string | null;
  profile_image: string | null;
  status: string;
  is_verified: number;
  is_active: number;
  is_deleted: number;
  verification_token: string | null;
  token_expires: Date | null;
  approved_by: number | null;
  approved_at: Date | null;
  last_login: Date | null;
  created_at: Date;
  updated_at: Date;
};

export type CreateUserData = {
  full_name: string;
  phone: string;
  email: string;
  password: string;
  role?: string;
  district_id?: number | null;
  province?: string | null;
  address?: string | null;
};

export type UpdateUserData = {
  full_name?: string;
  phone?: string;
  email?: string;
  role?: string;
  district_id?: number | null;
  province?: string | null;
  address?: string | null;
  profile_image?: string | null;
  status?: string;
};

/**
 * =========================
 * USER CRUD OPERATIONS
 * =========================
 */

/**
 * Find user by phone number
 */
export async function findUserByPhone(phone: string): Promise<User | null> {
  try {
    const result = await db.query(
      `SELECT * FROM users WHERE phone = ? LIMIT 1`,
      [phone]
    );
    return extractSingleRow(result);
  } catch (error) {
    console.error('❌ findUserByPhone error:', error);
    throw error;
  }
}

/**
 * Find user by email
 */
export async function findUserByEmail(email: string): Promise<User | null> {
  try {
    const result = await db.query(
      `SELECT * FROM users WHERE email = ? LIMIT 1`,
      [email]
    );
    return extractSingleRow(result);
  } catch (error) {
    console.error('❌ findUserByEmail error:', error);
    throw error;
  }
}

/**
 * Find user by ID
 */
export async function findUserById(id: number): Promise<User | null> {
  try {
    const result = await db.query(
      `SELECT * FROM users WHERE id = ? LIMIT 1`,
      [id]
    );
    return extractSingleRow(result);
  } catch (error) {
    console.error('❌ findUserById error:', error);
    throw error;
  }
}

/**
 * Find user by email or phone (for login)
 */
export async function findUserByLogin(login: string): Promise<User | null> {
  try {
    const result = await db.query(
      `SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1`,
      [login, login]
    );
    return extractSingleRow(result);
  } catch (error) {
    console.error('❌ findUserByLogin error:', error);
    throw error;
  }
}

/**
 * Find user by verification token
 */
export async function findUserByVerificationToken(token: string): Promise<User | null> {
  try {
    const result = await db.query(
      `SELECT * FROM users WHERE verification_token = ? LIMIT 1`,
      [token]
    );
    return extractSingleRow(result);
  } catch (error) {
    console.error('❌ findUserByVerificationToken error:', error);
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(data: CreateUserData): Promise<number> {
  try {
    const {
      full_name,
      phone,
      email,
      password,
      role = 'farmer',
      district_id = null,
      province = null,
      address = null,
    } = data;

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 10);

    // Determine status based on role
    const status = role === 'veterinarian' ? 'pending' : 'active';
    const isVerified = role === 'veterinarian' ? 0 : 1;

    const result = await db.query(
      `INSERT INTO users (
        full_name,
        phone,
        email,
        password,
        role,
        district_id,
        province,
        address,
        status,
        is_verified,
        is_active,
        is_deleted,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        full_name,
        phone,
        email,
        hashedPassword,
        role,
        district_id,
        province,
        address,
        status,
        isVerified,
        1,
        0,
      ]
    );

    return extractInsertId(result);
  } catch (error) {
    console.error('❌ createUser error:', error);
    throw error;
  }
}

/**
 * Update user
 */
export async function updateUser(id: number, data: UpdateUserData): Promise<boolean> {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.full_name !== undefined) {
      updates.push('full_name = ?');
      values.push(data.full_name);
    }
    if (data.phone !== undefined) {
      updates.push('phone = ?');
      values.push(data.phone);
    }
    if (data.email !== undefined) {
      updates.push('email = ?');
      values.push(data.email);
    }
    if (data.role !== undefined) {
      updates.push('role = ?');
      values.push(data.role);
    }
    if (data.district_id !== undefined) {
      updates.push('district_id = ?');
      values.push(data.district_id);
    }
    if (data.province !== undefined) {
      updates.push('province = ?');
      values.push(data.province);
    }
    if (data.address !== undefined) {
      updates.push('address = ?');
      values.push(data.address);
    }
    if (data.profile_image !== undefined) {
      updates.push('profile_image = ?');
      values.push(data.profile_image);
    }
    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await db.query(
      `UPDATE users SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ updateUser error:', error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: number, newPassword: string): Promise<boolean> {
  try {
    const hashedPassword = await bcrypt.hash(newPassword, 10);
    const result = await db.query(
      `UPDATE users SET password = ?, updated_at = NOW() WHERE id = ?`,
      [hashedPassword, userId]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ updateUserPassword error:', error);
    throw error;
  }
}

/**
 * Update user status
 */
export async function updateUserStatus(userId: number, status: string): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE users SET status = ?, updated_at = NOW() WHERE id = ?`,
      [status, userId]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ updateUserStatus error:', error);
    throw error;
  }
}

/**
 * Verify user email
 */
export async function verifyUserEmail(userId: number): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE users SET is_verified = 1, verification_token = NULL, token_expires = NULL WHERE id = ?`,
      [userId]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ verifyUserEmail error:', error);
    throw error;
  }
}

/**
 * Store verification token
 */
export async function storeVerificationToken(email: string, token: string, expires: Date): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE users SET verification_token = ?, token_expires = ? WHERE email = ?`,
      [token, expires, email]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ storeVerificationToken error:', error);
    throw error;
  }
}

/**
 * Check if user exists by email or phone
 */
export async function userExists(email: string, phone: string): Promise<boolean> {
  try {
    const result = await db.query(
      `SELECT id FROM users WHERE email = ? OR phone = ? LIMIT 1`,
      [email, phone]
    );
    const user = extractSingleRow(result);
    return !!user;
  } catch (error) {
    console.error('❌ userExists error:', error);
    throw error;
  }
}

/**
 * Update last login timestamp
 */
export async function updateLastLogin(userId: number): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE users SET last_login = NOW() WHERE id = ?`,
      [userId]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ updateLastLogin error:', error);
    throw error;
  }
}

/**
 * Soft delete user
 */
export async function softDeleteUser(userId: number): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE users SET is_deleted = 1, deleted_at = NOW() WHERE id = ?`,
      [userId]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ softDeleteUser error:', error);
    throw error;
  }
}

/**
 * Get users by role
 */
export async function getUsersByRole(role: string): Promise<User[]> {
  try {
    const result = await db.query(
      `SELECT * FROM users WHERE role = ? AND is_deleted = 0 ORDER BY created_at DESC`,
      [role]
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getUsersByRole error:', error);
    throw error;
  }
}

/**
 * Get users by district
 */
export async function getUsersByDistrict(districtId: number): Promise<User[]> {
  try {
    const result = await db.query(
      `SELECT * FROM users WHERE district_id = ? AND is_deleted = 0 ORDER BY created_at DESC`,
      [districtId]
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getUsersByDistrict error:', error);
    throw error;
  }
}

/**
 * Get pending users
 */
export async function getPendingUsers(): Promise<User[]> {
  try {
    const result = await db.query(
      `SELECT * FROM users WHERE status = 'pending' AND is_deleted = 0 ORDER BY created_at DESC`
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getPendingUsers error:', error);
    throw error;
  }
}

/**
 * Get user count by role
 */
export async function getUserCountByRole(role: string): Promise<number> {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM users WHERE role = ? AND is_deleted = 0`,
      [role]
    );
    const row = extractSingleRow(result);
    return row?.count || 0;
  } catch (error) {
    console.error('❌ getUserCountByRole error:', error);
    throw error;
  }
}

/**
 * Get user count by status
 */
export async function getUserCountByStatus(status: string): Promise<number> {
  try {
    const result = await db.query(
      `SELECT COUNT(*) as count FROM users WHERE status = ? AND is_deleted = 0`,
      [status]
    );
    const row = extractSingleRow(result);
    return row?.count || 0;
  } catch (error) {
    console.error('❌ getUserCountByStatus error:', error);
    throw error;
  }
}

/**
 * Validate user password
 */
export async function validateUserPassword(user: User, password: string): Promise<boolean> {
  try {
    return await bcrypt.compare(password, user.password);
  } catch (error) {
    console.error('❌ validateUserPassword error:', error);
    throw error;
  }
}

// Export all functions as a service object
const authService = {
  findUserByPhone,
  findUserByEmail,
  findUserById,
  findUserByLogin,
  findUserByVerificationToken,
  createUser,
  updateUser,
  updateUserPassword,
  updateUserStatus,
  verifyUserEmail,
  storeVerificationToken,
  userExists,
  updateLastLogin,
  softDeleteUser,
  getUsersByRole,
  getUsersByDistrict,
  getPendingUsers,
  getUserCountByRole,
  getUserCountByStatus,
  validateUserPassword,
};

export default authService;