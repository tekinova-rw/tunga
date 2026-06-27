// ============================================================
// FILE: backend/src/middleware/permission.middleware.ts
// DESCRIPTION: Permission-based access control middleware
// ============================================================

import { Response, NextFunction } from 'express';
import { AuthRequest } from './auth.middleware';
import { 
  ROLE_PERMISSIONS, 
  getRoleName,
  getRoleColor,
  isSuperAdmin,
  isDistrictAdmin,
  isVeterinarian,
  isFarmer
} from '../config/permissions';

/**
 * =========================
 * PERMISSION MIDDLEWARE
 * =========================
 * Middleware to check if a user has a specific permission
 */

/**
 * Check if user has a specific permission
 */
export const requirePermission = (permission: string) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login',
        });
        return;
      }

      const userPermissions = ROLE_PERMISSIONS[user.role] || [];

      if (!userPermissions.includes(permission)) {
        const roleName = getRoleName(user.role);
        res.status(403).json({
          success: false,
          message: `Permission denied. Role '${roleName}' does not have permission: ${permission}`,
          requiredPermission: permission,
          userRole: user.role,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * Check if user has ALL of the required permissions
 */
export const requirePermissions = (permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login',
        });
        return;
      }

      const userPermissions = ROLE_PERMISSIONS[user.role] || [];
      const missingPermissions = permissions.filter(p => !userPermissions.includes(p));

      if (missingPermissions.length > 0) {
        const roleName = getRoleName(user.role);
        res.status(403).json({
          success: false,
          message: `Permission denied. Role '${roleName}' is missing permissions: ${missingPermissions.join(', ')}`,
          missingPermissions,
          userRole: user.role,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * Check if user has ANY of the required permissions
 */
export const requireAnyPermission = (permissions: string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login',
        });
        return;
      }

      const userPermissions = ROLE_PERMISSIONS[user.role] || [];
      const hasAny = permissions.some(p => userPermissions.includes(p));

      if (!hasAny) {
        const roleName = getRoleName(user.role);
        res.status(403).json({
          success: false,
          message: `Permission denied. Role '${roleName}' does not have any of the required permissions: ${permissions.join(', ')}`,
          requiredPermissions: permissions,
          userRole: user.role,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Permission middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * Check if user has a specific role
 */
export const requireRole = (roles: string | string[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login',
        });
        return;
      }

      const allowedRoles = Array.isArray(roles) ? roles : [roles];
      
      if (!allowedRoles.includes(user.role)) {
        const roleName = getRoleName(user.role);
        res.status(403).json({
          success: false,
          message: `Access denied. Role '${roleName}' is not allowed. Required roles: ${allowedRoles.join(', ')}`,
          requiredRoles: allowedRoles,
          userRole: user.role,
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
 * Check if user is Super Admin
 */
export const requireSuperAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
      });
      return;
    }

    if (!isSuperAdmin(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Super Admin role required.',
        userRole: user.role,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('❌ Super Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Check if user is District Admin
 */
export const requireDistrictAdmin = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
      });
      return;
    }

    if (!isDistrictAdmin(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. District Admin role required.',
        userRole: user.role,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('❌ District Admin middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Check if user is Veterinarian
 */
export const requireVeterinarian = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
      });
      return;
    }

    if (!isVeterinarian(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Veterinarian role required.',
        userRole: user.role,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('❌ Veterinarian middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * Check if user is Farmer
 */
export const requireFarmer = (req: AuthRequest, res: Response, next: NextFunction): void => {
  try {
    const user = req.user;

    if (!user) {
      res.status(401).json({
        success: false,
        message: 'Unauthorized - Please login',
      });
      return;
    }

    if (!isFarmer(user.role)) {
      res.status(403).json({
        success: false,
        message: 'Access denied. Farmer role required.',
        userRole: user.role,
      });
      return;
    }

    next();
  } catch (error) {
    console.error('❌ Farmer middleware error:', error);
    res.status(500).json({
      success: false,
      message: 'Internal server error',
    });
  }
};

/**
 * =========================
 * HELPER FUNCTIONS FOR CONTROLLERS
 * =========================
 */

/**
 * Check if user has a specific permission (for use in controllers)
 */
export const checkPermission = (user: any, permission: string): boolean => {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return userPermissions.includes(permission);
};

/**
 * Check if user has all permissions (for use in controllers)
 */
export const checkPermissions = (user: any, permissions: string[]): boolean => {
  if (!user) return false;
  const userPermissions = ROLE_PERMISSIONS[user.role] || [];
  return permissions.every(p => userPermissions.includes(p));
};

/**
 * Get all permissions for a user role
 */
export const getUserPermissions = (user: any): string[] => {
  if (!user) return [];
  return ROLE_PERMISSIONS[user.role] || [];
};

/**
 * Get user role information
 */
export const getUserRoleInfo = (user: any) => {
  if (!user) return null;
  return {
    role: user.role,
    roleName: getRoleName(user.role),
    color: getRoleColor(user.role),
    permissions: getUserPermissions(user),
  };
};

/**
 * Check if user can access a resource based on district
 */
export const canAccessDistrict = (user: any, targetDistrictId: number | null): boolean => {
  if (!user) return false;
  
  // Super admins can access all districts
  if (isSuperAdmin(user.role)) return true;
  
  // District admins can only access their own district
  if (isDistrictAdmin(user.role)) {
    return user.district_id === targetDistrictId;
  }
  
  // Other users can only access their own district
  return user.district_id === targetDistrictId;
};