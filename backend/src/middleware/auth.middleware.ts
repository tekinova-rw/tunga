// ============================================================
// FILE: backend/src/middleware/auth.middleware.ts
// DESCRIPTION: Authentication middleware for JWT validation
// ============================================================

import { Request, Response, NextFunction } from 'express';
import jwt, { JwtPayload } from 'jsonwebtoken';

/**
 * =========================
 * USER TYPE
 * =========================
 */
export interface AuthUser {
  id: number;
  role: string;
  district_id?: number | null;
  full_name?: string;
  email?: string;
  phone?: string;
  status?: string;
  is_verified?: boolean;
  is_active?: boolean;
}

/**
 * =========================
 * REQUEST EXTENSION
 * =========================
 */
export interface AuthRequest extends Request {
  user?: AuthUser;
}

/**
 * =========================
 * AUTH MIDDLEWARE (ACCESS TOKEN ONLY)
 * =========================
 * Verifies JWT access token and attaches user to request
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    console.log('🔐 Auth middleware started');

    const authHeader = req.headers.authorization;
    console.log('📋 Auth header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader) {
      console.log('❌ No authorization header found');
      return res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('❌ Invalid authorization format');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid authorization format. Expected: Bearer <token>' 
      });
    }

    const token = parts[1];
    console.log('🔐 Token received:', token.substring(0, 20) + '...');

    // Check if JWT_ACCESS_SECRET is configured
    if (!process.env.JWT_ACCESS_SECRET) {
      console.error('❌ JWT_ACCESS_SECRET not configured in environment');
      return res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      });
    }

    // 🔐 VERIFY ACCESS TOKEN ONLY
    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET) as JwtPayload;
      console.log('✅ Token verified successfully');
    } catch (jwtError: any) {
      console.error('❌ JWT verification failed:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        return res.status(401).json({ 
          success: false,
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED'
        });
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        return res.status(401).json({ 
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
      }
      
      return res.status(401).json({ 
        success: false,
        message: 'Token validation failed',
        code: 'TOKEN_VALIDATION_FAILED'
      });
    }

    // Validate decoded token has required fields
    if (!decoded || typeof decoded === 'string') {
      console.log('❌ Invalid token payload');
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token payload' 
      });
    }

    // Check required fields
    if (!decoded.id || !decoded.role) {
      console.log('❌ Token missing required fields:', { 
        hasId: !!decoded.id, 
        hasRole: !!decoded.role 
      });
      return res.status(401).json({ 
        success: false,
        message: 'Invalid token - missing user data' 
      });
    }

    // Attach user to request
    req.user = {
      id: decoded.id,
      role: decoded.role,
      district_id: decoded.district_id || null,
      full_name: decoded.full_name,
      email: decoded.email,
      phone: decoded.phone,
      status: decoded.status,
      is_verified: decoded.is_verified,
      is_active: decoded.is_active,
    };

    console.log('✅ User attached to request:', { 
      id: req.user.id, 
      role: req.user.role,
      district_id: req.user.district_id
    });

    next();
  } catch (err: any) {
    console.error('❌ Auth middleware error:', err.message);
    return res.status(401).json({ 
      success: false,
      message: 'Authentication failed',
      error: process.env.NODE_ENV === 'development' ? err.message : undefined
    });
  }
};

/**
 * =========================
 * OPTIONAL AUTH MIDDLEWARE
 * =========================
 * Same as authenticate but doesn't throw error if no token
 * Useful for routes that can work with or without authentication
 */
export const optionalAuthenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('ℹ️ Optional auth: No token provided, continuing as guest');
      return next();
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('ℹ️ Optional auth: Invalid format, continuing as guest');
      return next();
    }

    const token = parts[1];

    if (!process.env.JWT_ACCESS_SECRET) {
      console.error('❌ JWT_ACCESS_SECRET not configured');
      return next();
    }

    try {
      const decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET) as JwtPayload;
      
      if (decoded && decoded.id && decoded.role) {
        req.user = {
          id: decoded.id,
          role: decoded.role,
          district_id: decoded.district_id || null,
        };
        console.log('✅ Optional auth: User attached:', { id: req.user.id, role: req.user.role });
      }
    } catch (err) {
      // Token invalid but we continue as guest
      console.log('ℹ️ Optional auth: Token invalid, continuing as guest');
    }

    next();
  } catch (err) {
    console.log('ℹ️ Optional auth: Error, continuing as guest');
    next();
  }
};

/**
 * =========================
 * ROLE CHECK MIDDLEWARES
 * =========================
 */

// Check if user is super admin
export const isSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    console.log('❌ isSuperAdmin: No user found in request');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No user authenticated',
    });
  }

  if (req.user.role !== 'super_admin') {
    console.log(`❌ isSuperAdmin: User ${req.user.id} is not super_admin (role: ${req.user.role})`);
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Super admin access required',
    });
  }

  console.log(`✅ Super admin access granted for user: ${req.user.id}`);
  next();
};

// Check if user is admin (super or district)
export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    console.log('❌ isAdmin: No user found in request');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No user authenticated',
    });
  }

  if (req.user.role !== 'super_admin' && req.user.role !== 'district_admin') {
    console.log(`❌ isAdmin: User ${req.user.id} is not admin (role: ${req.user.role})`);
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Admin access required',
    });
  }

  console.log(`✅ Admin access granted for user: ${req.user.id} (role: ${req.user.role})`);
  next();
};

// Check if user is veterinarian
export const isVeterinarian = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    console.log('❌ isVeterinarian: No user found in request');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No user authenticated',
    });
  }

  if (req.user.role !== 'veterinarian') {
    console.log(`❌ isVeterinarian: User ${req.user.id} is not a veterinarian (role: ${req.user.role})`);
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Veterinarian access required',
    });
  }

  console.log(`✅ Veterinarian access granted for user: ${req.user.id}`);
  next();
};

// Check if user is farmer
export const isFarmer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  if (!req.user) {
    console.log('❌ isFarmer: No user found in request');
    return res.status(401).json({
      success: false,
      message: 'Unauthorized - No user authenticated',
    });
  }

  if (req.user.role !== 'farmer') {
    console.log(`❌ isFarmer: User ${req.user.id} is not a farmer (role: ${req.user.role})`);
    return res.status(403).json({
      success: false,
      message: 'Forbidden - Farmer access required',
    });
  }

  console.log(`✅ Farmer access granted for user: ${req.user.id}`);
  next();
};

// Check if user has one of the allowed roles
export const hasRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    if (!req.user) {
      console.log('❌ hasRole: No user found in request');
      return res.status(401).json({
        success: false,
        message: 'Unauthorized - No user authenticated',
      });
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ hasRole: User ${req.user.id} has role ${req.user.role}, allowed: ${allowedRoles.join(', ')}`);
      return res.status(403).json({
        success: false,
        message: `Forbidden - Required roles: ${allowedRoles.join(', ')}`,
      });
    }

    console.log(`✅ Role access granted for user: ${req.user.id} (role: ${req.user.role})`);
    next();
  };
};

// Export authenticate as authMiddleware for backward compatibility
export const authMiddleware = authenticate;

// Default export
export default {
  authenticate,
  optionalAuthenticate,
  isSuperAdmin,
  isAdmin,
  isVeterinarian,
  isFarmer,
  hasRole,
  authMiddleware,
};