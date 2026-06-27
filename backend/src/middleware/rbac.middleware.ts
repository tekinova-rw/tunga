// ============================================================
// FILE: backend/src/middleware/rbac.middleware.ts
// DESCRIPTION: Role-Based Access Control middleware
// ============================================================

import { NextFunction, Response } from 'express';
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
export type RoleLevel = typeof ROLE_HIERARCHY[UserRole];

/**
 * =========================
 * ROLE PERMISSIONS MAP
 * =========================
 * Defines which roles have access to which resources
 */
export const ROLE_ACCESS: Record<string, string[]> = {
  // Admin routes
  admin: ['super_admin', 'district_admin'],
  
  // User management
  manage_users: ['super_admin', 'district_admin'],
  approve_users: ['super_admin', 'district_admin'],
  delete_users: ['super_admin'],
  
  // Animal management
  manage_animals: ['super_admin', 'district_admin', 'veterinarian', 'farmer'],
  view_animals: ['super_admin', 'district_admin', 'veterinarian', 'farmer'],
  
  // Veterinary services
  manage_appointments: ['super_admin', 'district_admin', 'veterinarian', 'farmer'],
  manage_requests: ['super_admin', 'district_admin', 'veterinarian', 'farmer'],
  
  // District management
  manage_districts: ['super_admin'],
  
  // System
  system_config: ['super_admin'],
  view_reports: ['super_admin', 'district_admin'],
};

/**
 * =========================
 * REQUIRED ROLE MIDDLEWARE
 * =========================
 * Check if user has one of the required roles
 */
export const requireRole = (roles: UserRole | UserRole[]) => {
  return (req: AuthRequest, res: Response, next: NextFunction): void => {
    try {
      const user = req.user;
      const allowedRoles = Array.isArray(roles) ? roles : [roles];

      if (!user) {
        res.status(401).json({
          success: false,
          message: 'Unauthorized - Please login',
        });
        return;
      }

      if (!allowedRoles.includes(user.role as UserRole)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Required roles: ${allowedRoles.join(', ')}`,
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
 * =========================
 * MINIMUM ROLE LEVEL
 * =========================
 * Check if user has at least the minimum role level
 */
export const requireMinRole = (minRole: UserRole) => {
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

      const userLevel = ROLE_HIERARCHY[user.role as UserRole];
      const requiredLevel = ROLE_HIERARCHY[minRole];

      if (!userLevel || userLevel < requiredLevel) {
        res.status(403).json({
          success: false,
          message: `Insufficient permissions. Minimum role required: ${minRole}`,
          requiredLevel: minRole,
          userRole: user.role,
          userLevel: userLevel,
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
 * HAS ACCESS TO RESOURCE
 * =========================
 * Check if user has access to a specific resource
 */
export const requireAccess = (resource: keyof typeof ROLE_ACCESS) => {
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

      const allowedRoles = ROLE_ACCESS[resource] || [];
      
      if (!allowedRoles.includes(user.role)) {
        res.status(403).json({
          success: false,
          message: `Access denied. Resource '${resource}' requires: ${allowedRoles.join(', ')}`,
          resource,
          requiredRoles: allowedRoles,
          userRole: user.role,
        });
        return;
      }

      next();
    } catch (error) {
      console.error('❌ Resource access middleware error:', error);
      res.status(500).json({
        success: false,
        message: 'Internal server error',
      });
    }
  };
};

/**
 * =========================
 * HAS PERMISSION (FUNCTION)
 * =========================
 * Check if user has a specific permission (for use in controllers)
 */
export const hasRolePermission = (
  user: any,
  requiredRole: UserRole | UserRole[]
): boolean => {
  if (!user) return false;
  
  const roles = Array.isArray(requiredRole) ? requiredRole : [requiredRole];
  return roles.includes(user.role as UserRole);
};

/**
 * =========================
 * HAS MIN ROLE (FUNCTION)
 * =========================
 * Check if user has at least the minimum role (for use in controllers)
 */
export const hasMinRole = (user: any, minRole: UserRole): boolean => {
  if (!user) return false;
  
  const userLevel = ROLE_HIERARCHY[user.role as UserRole];
  const requiredLevel = ROLE_HIERARCHY[minRole];
  
  return userLevel >= requiredLevel;
};

/**
 * =========================
 * GET ROLE LEVEL
 * =========================
 * Get the level of a role
 */
export const getRoleLevel = (role: UserRole): RoleLevel | null => {
  return ROLE_HIERARCHY[role] || null;
};

/**
 * =========================
 * IS ADMIN
 * =========================
 * Check if user is an admin (super_admin or district_admin)
 */
export const isAdmin = (user: any): boolean => {
  if (!user) return false;
  return user.role === 'super_admin' || user.role === 'district_admin';
};

/**
 * =========================
 * IS SUPER ADMIN
 * =========================
 */
export const isSuperAdmin = (user: any): boolean => {
  if (!user) return false;
  return user.role === 'super_admin';
};

/**
 * =========================
 * IS DISTRICT ADMIN
 * =========================
 */
export const isDistrictAdmin = (user: any): boolean => {
  if (!user) return false;
  return user.role === 'district_admin';
};

/**
 * =========================
 * IS VETERINARIAN
 * =========================
 */
export const isVeterinarian = (user: any): boolean => {
  if (!user) return false;
  return user.role === 'veterinarian';
};

/**
 * =========================
 * IS FARMER
 * =========================
 */
export const isFarmer = (user: any): boolean => {
  if (!user) return false;
  return user.role === 'farmer';
};

/**
 * =========================
 * GET HIGHEST ROLE
 * =========================
 * Get the highest role from an array of roles
 */
export const getHighestRole = (roles: UserRole[]): UserRole | null => {
  if (roles.length === 0) return null;
  
  return roles.reduce((highest, current) => {
    const highestLevel = ROLE_HIERARCHY[highest];
    const currentLevel = ROLE_HIERARCHY[current];
    return currentLevel > highestLevel ? current : highest;
  });
};

/**
 * =========================
 * CAN ACCESS DISTRICT
 * =========================
 * Check if user can access a specific district
 */
export const canAccessDistrict = (user: any, districtId: number): boolean => {
  if (!user) return false;
  
  // Super admin can access all districts
  if (user.role === 'super_admin') return true;
  
  // District admin can only access their own district
  if (user.role === 'district_admin') {
    return user.district_id === districtId;
  }
  
  // Other users can only access their own district
  return user.district_id === districtId;
};

/**
 * =========================
 * CAN ACCESS USER
 * =========================
 * Check if user can access/modify another user
 * Note: This is a basic check - for full implementation,
 * you might need to query the database to check district
 */
export const canAccessUser = (currentUser: any, targetUserId: number): boolean => {
  if (!currentUser) return false;
  
  // Super admin can access all users
  if (currentUser.role === 'super_admin') return true;
  
  // Users can access themselves
  if (currentUser.id === targetUserId) return true;
  
  // District admin can access users in their district
  // This would require a database query to check the target user's district
  // For now, we'll return false for district admins unless it's themselves
  if (currentUser.role === 'district_admin') {
    // You would need to query the database here
    // return await userIsInDistrict(targetUserId, currentUser.district_id);
    return false;
  }
  
  return false;
};

// Export all functions as default
export default {
  ROLE_HIERARCHY,
  ROLE_ACCESS,
  requireRole,
  requireMinRole,
  requireAccess,
  hasRolePermission,
  hasMinRole,
  getRoleLevel,
  isAdmin,
  isSuperAdmin,
  isDistrictAdmin,
  isVeterinarian,
  isFarmer,
  getHighestRole,
  canAccessDistrict,
  canAccessUser,
};