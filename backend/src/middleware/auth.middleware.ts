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
): void => {
  try {
    console.log('🔐 Auth middleware started');

    const authHeader = req.headers.authorization;
    console.log('📋 Auth header:', authHeader ? 'Present' : 'Missing');

    if (!authHeader) {
      console.log('❌ No authorization header found');
      res.status(401).json({ 
        success: false,
        message: 'No token provided' 
      });
      return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('❌ Invalid authorization format');
      res.status(401).json({ 
        success: false,
        message: 'Invalid authorization format. Expected: Bearer <token>' 
      });
      return;
    }

    const token = parts[1];
    console.log('🔐 Token received:', token.substring(0, 20) + '...');

    if (!process.env.JWT_ACCESS_SECRET) {
      console.error('❌ JWT_ACCESS_SECRET not configured in environment');
      res.status(500).json({ 
        success: false,
        message: 'Server configuration error' 
      });
      return;
    }

    let decoded: JwtPayload;
    try {
      decoded = jwt.verify(token, process.env.JWT_ACCESS_SECRET) as JwtPayload;
      console.log('✅ Token verified successfully');
    } catch (jwtError: any) {
      console.error('❌ JWT verification failed:', jwtError.message);
      
      if (jwtError.name === 'TokenExpiredError') {
        res.status(401).json({ 
          success: false,
          message: 'Access token expired',
          code: 'TOKEN_EXPIRED'
        });
        return;
      }
      
      if (jwtError.name === 'JsonWebTokenError') {
        res.status(401).json({ 
          success: false,
          message: 'Invalid token',
          code: 'INVALID_TOKEN'
        });
        return;
      }
      
      res.status(401).json({ 
        success: false,
        message: 'Token validation failed',
        code: 'TOKEN_VALIDATION_FAILED'
      });
      return;
    }

    if (!decoded || typeof decoded === 'string') {
      console.log('❌ Invalid token payload');
      res.status(401).json({ 
        success: false,
        message: 'Invalid token payload' 
      });
      return;
    }

    if (!decoded.id || !decoded.role) {
      console.log('❌ Token missing required fields:', { 
        hasId: !!decoded.id, 
        hasRole: !!decoded.role 
      });
      res.status(401).json({ 
        success: false,
        message: 'Invalid token - missing user data' 
      });
      return;
    }

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
    res.status(401).json({ 
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
  _res: Response,  // ✅ Added underscore to indicate unused
  next: NextFunction
): void => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      console.log('ℹ️ Optional auth: No token provided, continuing as guest');
      next();
      return;
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      console.log('ℹ️ Optional auth: Invalid format, continuing as guest');
      next();
      return;
    }

    const token = parts[1];

    if (!process.env.JWT_ACCESS_SECRET) {
      console.error('❌ JWT_ACCESS_SECRET not configured');
      next();
      return;
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

export const isSuperAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    console.log('❌ isSuperAdmin: No user found in request');
    res.status(401).json({
      success: false,
      message: 'Unauthorized - No user authenticated',
    });
    return;
  }

  if (req.user.role !== 'super_admin') {
    console.log(`❌ isSuperAdmin: User ${req.user.id} is not super_admin (role: ${req.user.role})`);
    res.status(403).json({
      success: false,
      message: 'Forbidden - Super admin access required',
    });
    return;
  }

  console.log(`✅ Super admin access granted for user: ${req.user.id}`);
  next();
};

export const isAdmin = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    console.log('❌ isAdmin: No user found in request');
    res.status(401).json({
      success: false,
      message: 'Unauthorized - No user authenticated',
    });
    return;
  }

  if (req.user.role !== 'super_admin' && req.user.role !== 'district_admin') {
    console.log(`❌ isAdmin: User ${req.user.id} is not admin (role: ${req.user.role})`);
    res.status(403).json({
      success: false,
      message: 'Forbidden - Admin access required',
    });
    return;
  }

  console.log(`✅ Admin access granted for user: ${req.user.id} (role: ${req.user.role})`);
  next();
};

export const isVeterinarian = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    console.log('❌ isVeterinarian: No user found in request');
    res.status(401).json({
      success: false,
      message: 'Unauthorized - No user authenticated',
    });
    return;
  }

  if (req.user.role !== 'veterinarian') {
    console.log(`❌ isVeterinarian: User ${req.user.id} is not a veterinarian (role: ${req.user.role})`);
    res.status(403).json({
      success: false,
      message: 'Forbidden - Veterinarian access required',
    });
    return;
  }

  console.log(`✅ Veterinarian access granted for user: ${req.user.id}`);
  next();
};

export const isFarmer = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  if (!req.user) {
    console.log('❌ isFarmer: No user found in request');
    res.status(401).json({
      success: false,
      message: 'Unauthorized - No user authenticated',
    });
    return;
  }

  if (req.user.role !== 'farmer') {
    console.log(`❌ isFarmer: User ${req.user.id} is not a farmer (role: ${req.user.role})`);
    res.status(403).json({
      success: false,
      message: 'Forbidden - Farmer access required',
    });
    return;
  }

  console.log(`✅ Farmer access granted for user: ${req.user.id}`);
  next();
};

export const hasRole = (allowedRoles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    if (!req.user) {
      console.log('❌ hasRole: No user found in request');
      res.status(401).json({
        success: false,
        message: 'Unauthorized - No user authenticated',
      });
      return;
    }

    if (!allowedRoles.includes(req.user.role)) {
      console.log(`❌ hasRole: User ${req.user.id} has role ${req.user.role}, allowed: ${allowedRoles.join(', ')}`);
      res.status(403).json({
        success: false,
        message: `Forbidden - Required roles: ${allowedRoles.join(', ')}`,
      });
      return;
    }

    console.log(`✅ Role access granted for user: ${req.user.id} (role: ${req.user.role})`);
    next();
  };
};

export const authMiddleware = authenticate;

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