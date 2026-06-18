// backend/src/middleware/district.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * =========================
 * DISTRICT SCOPE MIDDLEWARE
 * =========================
 * Ensures district admins only access their district
 * Super admins bypass this restriction
 */

export const enforceDistrictScope = (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): void => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
      });
      return;
    }

    // Super admin bypass - can access all districts
    if (user.role === 'super_admin') {
      console.log(`🔓 Super admin bypassing district scope: ${user.id}`);
      return next();
    }

    // District admin must have a district_id
    if (user.role === 'district_admin') {
      if (!user.district_id) {
        console.error(`❌ District admin missing district_id: ${user.id}`);
        res.status(403).json({
          success: false,
          message: 'Missing district scope. Please contact your administrator.',
        });
        return;
      }

      // Attach district_id to request for filtering
      req.districtScope = user.district_id;
      console.log(`🔒 District admin scoped to district: ${user.district_id}`);
      return next();
    }

    // Other roles (farmer, veterinarian) - block access to admin endpoints
    if (user.role !== 'super_admin' && user.role !== 'district_admin') {
      console.warn(`⚠️ Unauthorized role attempting to access admin: ${user.role}`);
      res.status(403).json({
        success: false,
        message: `Access denied. Role '${user.role}' does not have admin privileges.`,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('❌ District scope guard error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * =========================
 * DISTRICT FILTER HELPER
 * =========================
 * Helper to add district filtering to SQL queries
 */

export const addDistrictFilter = (
  query: string,
  user: any,
  tableAlias: string = '',
  hasWhere: boolean = false
): { query: string; params: any[] } => {
  const params: any[] = [];

  // Super admin - no filter
  if (user?.role === 'super_admin') {
    return { query, params };
  }

  // District admin - filter by their district
  if (user?.role === 'district_admin' && user.district_id) {
    const alias = tableAlias ? `${tableAlias}.` : '';
    const whereClause = hasWhere ? ' AND' : ' WHERE';
    return {
      query: `${query}${whereClause} ${alias}district_id = ?`,
      params: [user.district_id],
    };
  }

  // Other roles - return empty result (no access)
  return {
    query: `${query} AND 1 = 0`,
    params: [],
  };
};

/**
 * =========================
 * CHECK DISTRICT ACCESS
 * =========================
 * Check if a user can access a specific district
 */

export const canAccessDistrict = (
  user: any,
  districtId: number
): boolean => {
  if (!user) return false;

  // Super admin can access all districts
  if (user.role === 'super_admin') return true;

  // District admin can only access their own district
  if (user.role === 'district_admin') {
    return user.district_id === districtId;
  }

  // Other roles cannot access district-level data
  return false;
};

/**
 * =========================
 * GET DISTRICT SCOPE
 * =========================
 * Get the district scope for the current user
 */

export const getDistrictScope = (user: any): number | null => {
  if (!user) return null;

  // Super admin has no district restriction
  if (user.role === 'super_admin') return null;

  // District admin has a specific district
  if (user.role === 'district_admin') {
    return user.district_id || null;
  }

  return null;
};

/**
 * =========================
 * REQUIRE DISTRICT ACCESS
 * =========================
 * Middleware to ensure user can access a specific district (from params)
 */

export const requireDistrictAccess = (districtIdParam: string = 'districtId') => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      // ✅ FIX: Handle string | string[] properly
      const paramValue = req.params[districtIdParam];
      const districtId = typeof paramValue === 'string' ? parseInt(paramValue) : parseInt(paramValue?.[0] || '');

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login',
        });
        return;
      }

      if (isNaN(districtId)) {
        res.status(400).json({
          success: false,
          message: 'Invalid district ID',
        });
        return;
      }

      if (!canAccessDistrict(user, districtId)) {
        res.status(403).json({
          success: false,
          message: 'Access denied. You do not have access to this district.',
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Require district access error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

// Extend AuthRequest to include districtScope
declare module 'express' {
  export interface Request {
    districtScope?: number;
  }
}