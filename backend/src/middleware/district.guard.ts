// backend/src/middleware/district.guard.ts
import { AuthRequest } from './auth.middleware';
import { Response, NextFunction } from 'express';

/**
 * =========================
 * DISTRICT SCOPE GUARD
 * =========================
 * Ensures that district admins can only access data within their district
 * Super admins bypass this restriction
 */

export const enforceDistrictScope = async (
  req: AuthRequest,
  res: Response,
  next: NextFunction
): Promise<void> => {
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
      console.log('🔓 Super admin bypassing district scope');
      return next();
    }

    // District admin must have a district_id
    if (user.role === 'district_admin') {
      if (!user.district_id) {
        console.error('❌ District admin missing district_id:', user.id);
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

    // Other roles (farmer, veterinarian) - check if they should be restricted
    // For admin endpoints, only super_admin and district_admin should pass
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
  tableAlias: string = ''
): { query: string; params: any[] } => {
  const params: any[] = [];

  // Super admin - no filter
  if (user?.role === 'super_admin') {
    return { query, params };
  }

  // District admin - filter by their district
  if (user?.role === 'district_admin' && user.district_id) {
    const alias = tableAlias ? `${tableAlias}.` : '';
    const whereClause = query.includes('WHERE') ? ' AND' : ' WHERE';
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

// Extend AuthRequest to include districtScope
declare module 'express' {
  export interface Request {
    districtScope?: number;
  }
}