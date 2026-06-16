// backend/src/middleware/auth.middleware.ts
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
  district_id?: number;
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
 */
export const authenticate = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  try {
    const authHeader = req.headers.authorization;

    if (!authHeader) {
      return res.status(401).json({ message: 'No token provided' });
    }

    const parts = authHeader.split(' ');

    if (parts.length !== 2 || parts[0] !== 'Bearer') {
      return res.status(401).json({ message: 'Invalid authorization format' });
    }

    const token = parts[1];

    // 🔐 VERIFY ACCESS TOKEN ONLY
    const decoded = jwt.verify(
      token,
      process.env.JWT_ACCESS_SECRET!
    ) as JwtPayload;

    req.user = {
      id: decoded.id,
      role: decoded.role,
      district_id: decoded.district_id,
    };

    next();
  } catch (err: any) {
    if (err.name === 'TokenExpiredError') {
      return res.status(401).json({ message: 'Access token expired' });
    }

    return res.status(401).json({ message: 'Invalid token' });
  }
};