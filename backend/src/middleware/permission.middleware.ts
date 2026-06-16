import { Request, Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { ROLE_PERMISSIONS } from '../config/rolePermissions';

export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction) => {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const userPermissions = ROLE_PERMISSIONS[user.role] || [];

    if (!userPermissions.includes(permission)) {
      return res.status(403).json({
        message: 'Permission denied',
      });
    }

    next();
  };
};