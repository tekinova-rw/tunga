// ============================================================
// FILE: backend/src/middleware/auth.ts
// DESCRIPTION: Authentication middleware for JWT validation
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt from 'jsonwebtoken';
import { db } from '../config/db';

// JWT Secret
const JWT_SECRET = process.env.JWT_ACCESS_SECRET || 'vetconnect_secret_key';

/**
 * =========================
 * TYPES
 * =========================
 */
export interface AuthUser {
  id: number;
  full_name: string;
  phone: string;
  email: string;
  role: string;
  district_id: number | null;
  status: string;
  is_verified: number;
  iat?: number;
  exp?: number;
}

export interface AuthRequest extends Request {
  user?: AuthUser;
  districtScope?: number;
}

/**
 * =========================
 * AUTHENTICATE TOKEN
 * =========================
 * Middleware to verify JWT token and attach user to request
 */
export const authenticateToken = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1]; // Bearer TOKEN

    if (!token) {
      res.status(401).json({
        success: false,
        message: 'Access token required. Please login.',
      });
      return;
    }

    // Verify token
    const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;

    // Get fresh user data from database
    const [users]: any = await db.query(
      `SELECT 
        id, 
        full_name, 
        phone, 
        email, 
        role, 
        district_id, 
        status, 
        is_verified,
        is_active,
        is_deleted
       FROM users 
       WHERE id = ? AND is_deleted = 0`,
      [decoded.id]
    );

    if (users.length === 0) {
      res.status(401).json({
        success: false,
        message: 'User not found or has been deleted.',
      });
      return;
    }

    const user = users[0];

    // Check if account is active
    if (!user.is_active) {
      res.status(401).json({
        success: false,
        message: 'Account is deactivated. Please contact support.',
      });
      return;
    }

    // Check if account is suspended
    if (user.status === 'suspended') {
      res.status(401).json({
        success: false,
        message: 'Account has been suspended. Please contact support.',
      });
      return;
    }

    // Check if account is rejected
    if (user.status === 'rejected') {
      res.status(401).json({
        success: false,
        message: 'Account application was rejected.',
      });
      return;
    }

    // Attach user to request
    req.user = {
      id: user.id,
      full_name: user.full_name,
      phone: user.phone,
      email: user.email,
      role: user.role,
      district_id: user.district_id,
      status: user.status,
      is_verified: user.is_verified,
    };

    // Set district scope for district admins
    if (user.role === 'district_admin' && user.district_id) {
      req.districtScope = user.district_id;
    }

    console.log(`✅ Authenticated: ${user.full_name} (${user.role})`);
    next();
  } catch (error: any) {
    console.error('❌ Authentication error:', error.message);

    if (error.name === 'JsonWebTokenError') {
      res.status(403).json({
        success: false,
        message: 'Invalid token. Please login again.',
      });
      return;
    }

    if (error.name === 'TokenExpiredError') {
      res.status(403).json({
        success: false,
        message: 'Token expired. Please login again.',
      });
      return;
    }

    res.status(500).json({
      success: false,
      message: 'Internal server error during authentication.',
    });
  }
};

/**
 * =========================
 * OPTIONAL AUTH
 * =========================
 * Middleware that tries to authenticate but doesn't require it
 */
export const optionalAuth = async (
  req: AuthRequest,
  _res: Response,  // ✅ Added underscore to indicate unused
  next: NextFunction
): Promise<void> => {
  try {
    const authHeader = req.headers['authorization'];
    const token = authHeader && authHeader.split(' ')[1];

    if (token) {
      try {
        const decoded = jwt.verify(token, JWT_SECRET) as AuthUser;
        req.user = decoded;
        console.log(`✅ Optional auth: ${decoded.full_name} (${decoded.role})`);
      } catch (error) {
        // Token invalid, but we don't block the request
        console.log('⚠️ Optional auth: Invalid token, continuing as guest');
      }
    }

    next();
  } catch (error) {
    console.error('❌ Optional auth error:', error);
    next();
  }
};

/**
 * =========================
 * GET AUTH USER
 * =========================
 * Helper to get authenticated user from request
 */
export const getAuthUser = (req: AuthRequest): AuthUser | null => {
  return req.user || null;
};

/**
 * =========================
 * IS AUTHENTICATED
 * =========================
 * Helper to check if request is authenticated
 */
export const isAuthenticated = (req: AuthRequest): boolean => {
  return !!req.user;
};

/**
 * =========================
 * HAS ROLE
 * =========================
 * Helper to check if user has a specific role
 */
export const hasRole = (req: AuthRequest, role: string | string[]): boolean => {
  const user = req.user;
  if (!user) return false;
  
  const roles = Array.isArray(role) ? role : [role];
  return roles.includes(user.role);
};

/**
 * =========================
 * IS ADMIN
 * =========================
 * Helper to check if user is an admin (super_admin or district_admin)
 */
export const isAdmin = (req: AuthRequest): boolean => {
  const user = req.user;
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'district_admin';
};

/**
 * =========================
 * IS SUPER ADMIN
 * =========================
 */
export const isSuperAdmin = (req: AuthRequest): boolean => {
  const user = req.user;
  if (!user) return false;
  return user.role === 'super_admin';
};

/**
 * =========================
 * IS DISTRICT ADMIN
 * =========================
 */
export const isDistrictAdmin = (req: AuthRequest): boolean => {
  const user = req.user;
  if (!user) return false;
  return user.role === 'district_admin';
};

/**
 * =========================
 * CAN ACCESS DISTRICT
 * =========================
 * Check if user can access a specific district
 */
export const canAccessDistrict = (
  req: AuthRequest,
  districtId: number
): boolean => {
  const user = req.user;
  if (!user) return false;
  
  // Super admin can access all districts
  if (user.role === 'super_admin') return true;
  
  // District admin can only access their own district
  if (user.role === 'district_admin') {
    return user.district_id === districtId;
  }
  
  return false;
};

// Export all functions as default
export default {
  authenticateToken,
  optionalAuth,
  getAuthUser,
  isAuthenticated,
  hasRole,
  isAdmin,
  isSuperAdmin,
  isDistrictAdmin,
  canAccessDistrict,
};