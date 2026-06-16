import { AuthRequest } from './auth.middleware';
import { Response, NextFunction } from 'express';

export const enforceDistrictScope = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  // super admin bypass
  if (user.role === 'super_admin') {
    return next();
  }

  // ensure district_admin always scoped
  if (user.role === 'district_admin') {
    if (!user.district_id) {
      return res.status(403).json({
        message: 'Missing district scope',
      });
    }
  }

  next();
};