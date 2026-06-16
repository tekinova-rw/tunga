import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * ROLE HIERARCHY (IMPORTANT)
 */
const ROLE_HIERARCHY = {
  super_admin: 3,
  district_admin: 2,
  user: 1,
};

/**
 * Check if user has required role level
 */
export const requireRole = (roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!roles.includes(user.role)) {
      return res.status(403).json({
        message: 'Access denied',
      });
    }

    next();
  };
};

/**
 * STRICT MINIMUM ROLE LEVEL
 */
export const requireMinRole = (minRole: keyof typeof ROLE_HIERARCHY) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userLevel = ROLE_HIERARCHY[user.role as keyof typeof ROLE_HIERARCHY];
    const requiredLevel = ROLE_HIERARCHY[minRole];

    if (userLevel < requiredLevel) {
      return res.status(403).json({
        message: 'Insufficient permissions',
      });
    }

    next();
  };
};