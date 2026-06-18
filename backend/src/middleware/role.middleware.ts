// backend/src/middleware/role.middleware.ts
import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';

/**
 * =========================
 * ROLE HIERARCHY
 * =========================
 * Defines role levels for permission checking
 * Higher number = more permissions
 */
export const ROLE_HIERARCHY = {
  super_admin: 4,
  district_admin: 3,
  veterinarian: 2,
  farmer: 1,
} as const;

export type UserRole = keyof typeof ROLE_HIERARCHY;

/**
 * =========================
 * ROLE CHECK MIDDLEWARE
 * =========================
 * Authorize users with specific roles
 */
export const authorizeRoles = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login',
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${roles.join(', ')}`,
          requiredRoles: roles,
          userRole: req.user.role,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * =========================
 * AUTHORIZE MINIMUM ROLE
 * =========================
 * Authorize users with at least the minimum role level
 */
export const authorizeMinRole = (minRole: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login',
        });
        return;
      }

      const userLevel = ROLE_HIERARCHY[req.user.role as UserRole];
      const requiredLevel = ROLE_HIERARCHY[minRole];

      if (!userLevel || userLevel < requiredLevel) {
        res.status(403).json({
          success: false,
          message: `Insufficient permissions. Minimum role required: ${minRole}`,
          requiredLevel: minRole,
          userRole: req.user.role,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Minimum role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * =========================
 * AUTHORIZE EXACT ROLE
 * =========================
 * Authorize users with exactly the specified role
 */
export const authorizeExactRole = (role: UserRole) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login',
        });
        return;
      }

      if (req.user.role !== role) {
        res.status(403).json({
          success: false,
          message: `Access denied. Only ${role} can access this resource.`,
          requiredRole: role,
          userRole: req.user.role,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Exact role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * =========================
 * AUTHORIZE ANY ROLE
 * =========================
 * Authorize users with any of the specified roles
 */
export const authorizeAnyRole = (...roles: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      if (!req.user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login',
        });
        return;
      }

      if (!roles.includes(req.user.role)) {
        res.status(403).json({
          success: false,
          message: `Access denied. One of these roles required: ${roles.join(', ')}`,
          requiredRoles: roles,
          userRole: req.user.role,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Any role middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * =========================
 * HELPER FUNCTIONS
 * =========================
 */

/**
 * Check if user has a specific role
 */
export const hasRole = (user: any, role: string): boolean => {
  if (!user) return false;
  return user.role === role;
};

/**
 * Check if user has any of the specified roles
 */
export const hasAnyRole = (user: any, roles: string[]): boolean => {
  if (!user) return false;
  return roles.includes(user.role);
};

/**
 * Check if user has at least the minimum role level
 */
export const hasMinRole = (user: any, minRole: UserRole): boolean => {
  if (!user) return false;
  
  const userLevel = ROLE_HIERARCHY[user.role as UserRole];
  const requiredLevel = ROLE_HIERARCHY[minRole];
  
  return userLevel >= requiredLevel;
};

/**
 * Check if user is an admin (super_admin or district_admin)
 */
export const isAdmin = (user: any): boolean => {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'district_admin';
};

/**
 * Check if user is a super admin
 */
export const isSuperAdmin = (user: any): boolean => {
  if (!user) return false;
  return user.role === 'super_admin';
};

/**
 * Check if user is a district admin
 */
export const isDistrictAdmin = (user: any): boolean => {
  if (!user) return false;
  return user.role === 'district_admin';
};

/**
 * Check if user is a veterinarian
 */
export const isVeterinarian = (user: any): boolean => {
  if (!user) return false;
  return user.role === 'veterinarian';
};

/**
 * Check if user is a farmer
 */
export const isFarmer = (user: any): boolean => {
  if (!user) return false;
  return user.role === 'farmer';
};

/**
 * Get role display name
 */
export const getRoleDisplayName = (role: string): string => {
  const names: Record<string, string> = {
    super_admin: 'Super Admin',
    district_admin: 'District Admin',
    veterinarian: 'Veterinarian',
    farmer: 'Farmer',
  };
  return names[role] || role;
};

/**
 * Get role color
 */
export const getRoleColor = (role: string): string => {
  const colors: Record<string, string> = {
    super_admin: '#D32F2F',
    district_admin: '#FF9800',
    veterinarian: '#9C27B0',
    farmer: '#2196F3',
  };
  return colors[role] || '#666';
};

/**
 * Get role level
 */
export const getRoleLevel = (role: UserRole): number | null => {
  return ROLE_HIERARCHY[role] || null;
};

/**
 * Get role badge style
 */
export const getRoleBadgeStyle = (role: string): { backgroundColor: string; color: string } => {
  const styles: Record<string, { backgroundColor: string; color: string }> = {
    super_admin: { backgroundColor: '#D32F2F', color: '#fff' },
    district_admin: { backgroundColor: '#FF9800', color: '#fff' },
    veterinarian: { backgroundColor: '#9C27B0', color: '#fff' },
    farmer: { backgroundColor: '#2196F3', color: '#fff' },
  };
  return styles[role] || { backgroundColor: '#666', color: '#fff' };
};