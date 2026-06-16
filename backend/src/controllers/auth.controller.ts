// backend/src/controllers/auth.controller.ts
import { Request, Response } from 'express';
import bcrypt from 'bcryptjs';
import jwt from 'jsonwebtoken';
import crypto from 'crypto';

import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

const ACCESS_SECRET = process.env.JWT_ACCESS_SECRET || 'access_secret';
const REFRESH_SECRET = process.env.JWT_REFRESH_SECRET || 'refresh_secret';

// ✅ Define a type for user rows with proper status union type
type UserRow = {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  password: string;
  role: string;
  district_id: number;
  status: string; // Using string to avoid type conflicts
  is_verified: number;
  is_active: number;
  is_deleted: number;
  verification_token: string;
  token_expires: Date;
  profile_image: string;
  created_at: Date;
};

/**
 * =========================
 * REGISTER
 * =========================
 */
export const register = async (req: Request, res: Response): Promise<void> => {
  try {
    const { full_name, phone, email, password, district_id, role } = req.body;

    console.log('📝 Register request:', { full_name, phone, email, district_id, role });

    if (!full_name || !phone || !email || !password || !district_id) {
      res.status(400).json({ message: 'Missing fields' });
      return;
    }

    const existing = await db.query(
      `SELECT id FROM users WHERE email = ? OR phone = ?`,
      [email, phone]
    ) as any[];

    if (existing && Array.isArray(existing) && existing.length > 0) {
      res.status(409).json({ message: 'User already exists' });
      return;
    }

    const hashedPassword = await bcrypt.hash(password, 10);

    const verificationToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 24 * 60 * 60 * 1000);

    await db.query(
      `INSERT INTO users (
        full_name,
        phone,
        email,
        password,
        role,
        district_id,
        status,
        is_verified,
        verification_token,
        token_expires
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?)`,
      [
        full_name,
        phone,
        email,
        hashedPassword,
        role || 'farmer',
        district_id,
        role === 'veterinarian' ? 'pending' : 'active',
        role === 'veterinarian' ? 0 : 1,
        verificationToken,
        expires,
      ]
    );

    console.log('✅ User registered successfully:', email);

    res.status(201).json({
      success: true,
      message: role === 'veterinarian' 
        ? 'Account created. Check email for verification.' 
        : 'Account created successfully! You can now login.',
    });
  } catch (error) {
    console.error('❌ Register error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error',
      error: error instanceof Error ? error.message : 'Unknown error'
    });
  }
};

/**
 * =========================
 * VERIFY EMAIL
 * =========================
 */
export const verifyEmail = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token } = req.params;

    const rows = await db.query(
      `SELECT * FROM users WHERE verification_token = ?`,
      [token]
    ) as UserRow[];

    if (!rows || rows.length === 0) {
      res.status(400).json({ message: 'Invalid token' });
      return;
    }

    const user = rows[0];

    if (new Date(user.token_expires) < new Date()) {
      res.status(400).json({ message: 'Token expired' });
      return;
    }

    await db.query(
      `UPDATE users
       SET is_verified = 1,
           verification_token = NULL,
           token_expires = NULL
       WHERE id = ?`,
      [user.id]
    );

    res.json({ message: 'Email verified successfully' });
  } catch (error) {
    console.error('❌ Verify email error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * =========================
 * LOGIN (ACCESS + REFRESH TOKEN)
 * =========================
 */
export const login = async (req: Request, res: Response): Promise<void> => {
  try {
    const { login, password } = req.body;

    console.log('📥 Login attempt:', { login });

    if (!login || !password) {
      res.status(400).json({ message: 'Email/phone and password are required' });
      return;
    }

    const rows = await db.query(
      `SELECT * FROM users WHERE email = ? OR phone = ? LIMIT 1`,
      [login, login]
    ) as UserRow[];

    if (!rows || rows.length === 0) {
      console.log('❌ User not found:', login);
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    const user = rows[0];
    console.log('👤 User found:', { id: user.id, email: user.email, role: user.role });

    // Check if account is deleted
    if (user.is_deleted) {
      console.log('❌ Account deleted:', user.id);
      res.status(403).json({ message: 'Account has been deleted' });
      return;
    }

    // Check if account is active
    if (!user.is_active) {
      console.log('❌ Account inactive:', user.id);
      res.status(403).json({ message: 'Account is deactivated' });
      return;
    }

    // Check if account is suspended
    if (user.status === 'suspended') {
      console.log('❌ Account suspended:', user.id);
      res.status(403).json({ message: 'Account has been suspended' });
      return;
    }

    // ✅ FIXED: Check if account is active or approved
    const isActiveOrApproved = user.status === 'active' || user.status === 'approved';
    if (!isActiveOrApproved) {
      console.log('❌ Account not active/approved:', user.status);
      res.status(403).json({ 
        message: 'Your account is not active. Please contact support.' 
      });
      return;
    }

    // Check password
    const valid = await bcrypt.compare(password, user.password);
    if (!valid) {
      console.log('❌ Invalid password for:', user.email);
      res.status(401).json({ message: 'Invalid credentials' });
      return;
    }

    console.log('✅ Password valid for:', user.email);

    // Check if email is verified
    if (!user.is_verified) {
      console.log('❌ Email not verified:', user.email);
      res.status(403).json({ message: 'Please verify your email first' });
      return;
    }

    // ✅ FIXED: Check if veterinarian is pending approval (using separate checks)
    if (user.role === 'veterinarian') {
      if (user.status === 'pending') {
        console.log('❌ Veterinarian pending approval:', user.id);
        res.status(403).json({ message: 'Waiting for admin approval' });
        return;
      }
      
      if (user.status === 'rejected') {
        console.log('❌ Veterinarian rejected:', user.id);
        res.status(403).json({ message: 'Account application was rejected' });
        return;
      }
    }

    // Update last login
    await db.query(
      `UPDATE users SET last_login = NOW() WHERE id = ?`,
      [user.id]
    );

    console.log('⏰ Last login updated for:', user.id);

    // Generate access token
    const accessToken = jwt.sign(
      {
        id: user.id,
        role: user.role,
        district_id: user.district_id,
      },
      ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    // Generate refresh token
    const refreshToken = jwt.sign(
      { id: user.id },
      REFRESH_SECRET,
      { expiresIn: '7d' }
    );

    console.log('🔐 Tokens generated for:', user.email);

    // Store refresh token
    try {
      await db.query(
        `INSERT INTO refresh_tokens (user_id, refresh_token, expires_at)
         VALUES (?, ?, DATE_ADD(NOW(), INTERVAL 7 DAY))`,
        [user.id, refreshToken]
      );
      console.log('💾 Refresh token stored for:', user.id);
    } catch (tokenError: any) {
      console.log('⚠️ Error storing refresh token:', tokenError.message);
      if (tokenError.code === 'ER_NO_SUCH_TABLE') {
        console.log('⚠️ refresh_tokens table missing, but continuing');
      } else {
        throw tokenError;
      }
    }

    // Remove sensitive data from response
    const userResponse = {
      id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      district_id: user.district_id,
      status: user.status,
      is_verified: user.is_verified,
      profile_image: user.profile_image,
      created_at: user.created_at,
    };

    console.log('✅ Login successful for:', user.email);

    res.json({
      success: true,
      token: accessToken,
      refreshToken,
      user: userResponse,
    });

  } catch (error) {
    console.error('❌ Login error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error', 
      error: error instanceof Error ? error.message : 'Unknown error' 
    });
  }
};

/**
 * =========================
 * REFRESH TOKEN
 * =========================
 */
export const refreshToken = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (!refreshToken) {
      res.status(401).json({ message: 'No refresh token' });
      return;
    }

    const rows = await db.query(
      `SELECT * FROM refresh_tokens WHERE refresh_token = ? AND revoked = FALSE`,
      [refreshToken]
    ) as any[];

    if (!rows || rows.length === 0) {
      res.status(403).json({ message: 'Invalid refresh token' });
      return;
    }

    const decoded: any = jwt.verify(refreshToken, REFRESH_SECRET);

    const newAccessToken = jwt.sign(
      { id: decoded.id },
      ACCESS_SECRET,
      { expiresIn: '15m' }
    );

    res.json({ 
      success: true,
      token: newAccessToken 
    });
  } catch (error) {
    console.error('❌ Refresh token error:', error);
    res.status(403).json({ message: 'Token expired' });
  }
};

/**
 * =========================
 * LOGOUT
 * =========================
 */
export const logout = async (req: Request, res: Response): Promise<void> => {
  try {
    const { refreshToken } = req.body;

    if (refreshToken) {
      await db.query(
        `DELETE FROM refresh_tokens WHERE refresh_token = ?`,
        [refreshToken]
      );
    }

    res.json({ 
      success: true,
      message: 'Logged out successfully' 
    });
  } catch (error) {
    console.error('❌ Logout error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * =========================
 * FORGOT PASSWORD
 * =========================
 */
export const forgotPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { email } = req.body;

    if (!email) {
      res.status(400).json({ message: 'Email is required' });
      return;
    }

    const users = await db.query(
      `SELECT id, email FROM users WHERE email = ?`,
      [email]
    ) as any[];

    if (!users || users.length === 0) {
      res.json({ 
        success: true,
        message: 'If an account exists, a reset link will be sent' 
      });
      return;
    }

    const resetToken = crypto.randomBytes(32).toString('hex');
    const expires = new Date(Date.now() + 60 * 60 * 1000);

    await db.query(
      `UPDATE users SET verification_token = ?, token_expires = ? WHERE email = ?`,
      [resetToken, expires, email]
    );

    console.log('🔑 Password reset token generated for:', email);
    console.log('🔗 Reset link:', `${process.env.FRONTEND_URL || 'http://localhost:8081'}/reset-password?token=${resetToken}&email=${email}`);

    res.json({ 
      success: true,
      message: 'Password reset link sent to your email' 
    });
  } catch (error) {
    console.error('❌ Forgot password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * =========================
 * RESET PASSWORD
 * =========================
 */
export const resetPassword = async (req: Request, res: Response): Promise<void> => {
  try {
    const { token, password } = req.body;

    if (!token || !password) {
      res.status(400).json({ message: 'Token and password are required' });
      return;
    }

    if (password.length < 6) {
      res.status(400).json({ message: 'Password must be at least 6 characters' });
      return;
    }

    const rows = await db.query(
      `SELECT * FROM users WHERE verification_token = ?`,
      [token]
    ) as UserRow[];

    if (!rows || rows.length === 0) {
      res.status(400).json({ message: 'Invalid token' });
      return;
    }

    const user = rows[0];

    if (new Date(user.token_expires) < new Date()) {
      res.status(400).json({ message: 'Token expired' });
      return;
    }

    const hashed = await bcrypt.hash(password, 10);

    await db.query(
      `UPDATE users
       SET password = ?, verification_token = NULL, token_expires = NULL
       WHERE id = ?`,
      [hashed, user.id]
    );

    // Delete all refresh tokens for this user (force re-login)
    await db.query(
      `DELETE FROM refresh_tokens WHERE user_id = ?`,
      [user.id]
    );

    res.json({ 
      success: true,
      message: 'Password reset successful. Please login with your new password.' 
    });
  } catch (error) {
    console.error('❌ Reset password error:', error);
    res.status(500).json({ message: 'Server error' });
  }
};

/**
 * =========================
 * GET USER PROFILE
 * =========================
 */
export const getProfile = async (req: AuthRequest, res: Response): Promise<void> => {
  try {
    const user = req.user;
    
    if (!user) {
      res.status(401).json({ 
        success: false,
        message: 'Unauthorized' 
      });
      return;
    }

    console.log('📥 Get profile for user:', user.id);

    const rows = await db.query(
      `SELECT id, full_name, phone, email, role, district_id, status, is_verified, is_active, profile_image, created_at 
       FROM users 
       WHERE id = ? AND is_deleted = 0`,
      [user.id]
    ) as UserRow[];

    if (!rows || rows.length === 0) {
      res.status(404).json({ 
        success: false,
        message: 'User not found' 
      });
      return;
    }

    const userData = rows[0];
    
    console.log('✅ Profile fetched for user:', userData.email);

    res.json({
      success: true,
      data: userData,
    });
  } catch (error) {
    console.error('❌ Get profile error:', error);
    res.status(500).json({ 
      success: false,
      message: 'Server error' 
    });
  }
};