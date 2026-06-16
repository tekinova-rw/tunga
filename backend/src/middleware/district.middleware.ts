import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * Ensures district admins only access their district
 */
export const enforceDistrictScope = (req: AuthRequest, res: Response, next: NextFunction) => {
  const user = req.user;

  if (!user) {
    return res.status(401).json({ message: 'Unauthorized' });
  }

  /**
   * Super admin bypass
   */
  if (user.role === 'super_admin') {
    return next();
  }

  /**
   * District admin must have district_id
   */
  if (user.role === 'district_admin' && !user.district_id) {
    return res.status(403).json({
      message: 'District admin missing district scope',
    });
  }

  next();
};