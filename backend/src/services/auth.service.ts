// backend/src/services/auth.service.ts
import { db } from '../config/db';

// ✅ Define User type
type User = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  password: string;
  role: string;
  district_id: number;
  status: string;
  is_verified: number;
  is_active: number;
  is_deleted: number;
  verification_token: string;
  token_expires: Date;
  profile_image: string;
  created_at: Date;
  updated_at: Date;
};

// ✅ Define QueryResult type for insert operations
type QueryResult = {
  insertId: number;
  affectedRows: number;
};

/**
 * Find user by phone number
 */
export async function findUserByPhone(phone: string): Promise<User | null> {
  try {
    // ✅ db.query returns rows directly (not an array with [rows])
    const rows = await db.query(
      `
      SELECT *
      FROM users
      WHERE phone = ?
      LIMIT 1
    `,
      [phone]
    ) as User[];

    return rows && rows.length > 0 ? rows[0] : null;
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
    const rows = await db.query(
      `
      SELECT *
      FROM users
      WHERE email = ?
      LIMIT 1
    `,
      [email]
    ) as User[];

    return rows && rows.length > 0 ? rows[0] : null;
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
    const rows = await db.query(
      `
      SELECT *
      FROM users
      WHERE id = ?
      LIMIT 1
    `,
      [id]
    ) as User[];

    return rows && rows.length > 0 ? rows[0] : null;
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
    const rows = await db.query(
      `
      SELECT *
      FROM users
      WHERE email = ? OR phone = ?
      LIMIT 1
    `,
      [login, login]
    ) as User[];

    return rows && rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('❌ findUserByLogin error:', error);
    throw error;
  }
}

/**
 * Create a new user
 */
export async function createUser(
  fullName: string,
  phone: string,
  email: string,
  password: string,
  role: string,
  district_id: number
): Promise<number> {
  try {
    // ✅ db.query returns rows directly
    const result = await db.query(
      `
      INSERT INTO users (
        full_name,
        phone,
        email,
        password,
        role,
        district_id,
        status,
        is_verified,
        is_active,
        is_deleted
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)
    `,
      [
        fullName,
        phone,
        email,
        password,
        role || 'farmer',
        district_id || 1,
        role === 'veterinarian' ? 'pending' : 'active',
        role === 'veterinarian' ? 0 : 1,
        1,
        0,
      ]
    ) as any;

    return result.insertId;
  } catch (error) {
    console.error('❌ createUser error:', error);
    throw error;
  }
}

/**
 * Update user password
 */
export async function updateUserPassword(userId: number, hashedPassword: string): Promise<boolean> {
  try {
    const result = await db.query(
      `
      UPDATE users
      SET password = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [hashedPassword, userId]
    ) as any;

    return result.affectedRows > 0;
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
      `
      UPDATE users
      SET status = ?, updated_at = NOW()
      WHERE id = ?
    `,
      [status, userId]
    ) as any;

    return result.affectedRows > 0;
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
      `
      UPDATE users
      SET is_verified = 1, verification_token = NULL, token_expires = NULL
      WHERE id = ?
    `,
      [userId]
    ) as any;

    return result.affectedRows > 0;
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
      `
      UPDATE users
      SET verification_token = ?, token_expires = ?
      WHERE email = ?
    `,
      [token, expires, email]
    ) as any;

    return result.affectedRows > 0;
  } catch (error) {
    console.error('❌ storeVerificationToken error:', error);
    throw error;
  }
}

/**
 * Find user by verification token
 */
export async function findUserByVerificationToken(token: string): Promise<User | null> {
  try {
    const rows = await db.query(
      `
      SELECT *
      FROM users
      WHERE verification_token = ?
      LIMIT 1
    `,
      [token]
    ) as User[];

    return rows && rows.length > 0 ? rows[0] : null;
  } catch (error) {
    console.error('❌ findUserByVerificationToken error:', error);
    throw error;
  }
}

/**
 * Check if user exists by email or phone
 */
export async function userExists(email: string, phone: string): Promise<boolean> {
  try {
    const rows = await db.query(
      `
      SELECT id FROM users
      WHERE email = ? OR phone = ?
      LIMIT 1
    `,
      [email, phone]
    ) as any[];

    return rows && rows.length > 0;
  } catch (error) {
    console.error('❌ userExists error:', error);
    throw error;
  }
}

// Export all functions as a service
export default {
  findUserByPhone,
  findUserByEmail,
  findUserById,
  findUserByLogin,
  createUser,
  updateUserPassword,
  updateUserStatus,
  verifyUserEmail,
  storeVerificationToken,
  findUserByVerificationToken,
  userExists,
};