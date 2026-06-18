// ============================================================
// FILE: backend/src/routes/admin.routes.ts
// DESCRIPTION: Admin routes for user management operations
// ============================================================

import express from 'express';
import {
  activateUser,
  approveUser,
  createAdmin,
  dashboardStats,
  deleteUser,
  getUsers,
  getUserById,
  getDistrictStats,
  rejectUser,
  suspendUser,
  updateUserRole,
  testDbConnection,
} from '../controllers/admin.controller';
import { PERMISSIONS } from '../config/permissions';
import { authenticate, AuthRequest } from '../middleware/auth.middleware';
import { enforceDistrictScope } from '../middleware/district.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = express.Router();

/**
 * =========================
 * GLOBAL SECURITY LAYER
 * =========================
 * All admin routes require authentication
 */
router.use(authenticate);

/**
 * =========================
 * DISTRICT SCOPE ENFORCEMENT
 * =========================
 * Super admins bypass, district admins are scoped
 */
router.use(enforceDistrictScope);

/**
 * =========================
 * BASE ADMIN ACCESS
 * =========================
 * Only admin-level roles can access this module
 */
router.use(authorizeRoles('super_admin', 'district_admin'));

/**
 * =========================
 * TEST AUTH ENDPOINT (Debug)
 * =========================
 * GET /api/admin/test-auth - Verify authentication is working
 * Used to debug authentication issues
 */
router.get(
  '/test-auth',
  (req: AuthRequest, res) => {
    res.json({
      success: true,
      message: 'Auth middleware working',
      user: req.user,
    });
  }
);

/**
 * =========================
 * USERS MANAGEMENT
 * =========================
 * GET /api/admin/users - List all users with district scope
 * ✅ Super admins see all users
 * ✅ District admins see only users in their district
 */
router.get(
  '/users',
  requirePermission(PERMISSIONS.USER_READ),
  getUsers
);

/**
 * =========================
 * GET USER BY ID
 * =========================
 * GET /api/admin/users/:id - Get specific user details
 * ✅ Super admins can view any user
 * ✅ District admins can only view users in their district
 * Includes veterinarian/farmer profile data
 */
router.get(
  '/users/:id',
  requirePermission(PERMISSIONS.USER_READ),
  getUserById
);

/**
 * =========================
 * DASHBOARD STATS
 * =========================
 * GET /api/admin/stats - Get dashboard statistics
 * ✅ Super admins see global stats
 * ✅ District admins see stats for their district only
 */
router.get(
  '/stats',
  requirePermission(PERMISSIONS.STATS_VIEW),
  dashboardStats
);

/**
 * =========================
 * DISTRICT STATS (Super Admin Only)
 * =========================
 * GET /api/admin/districts/stats - Get stats for all districts
 * ❌ District admins CANNOT access this endpoint
 * ✅ Only super admins can view district-level statistics
 * Includes: total users, farmers, vets, admins per district
 */
router.get(
  '/districts/stats',
  authorizeRoles('super_admin'),
  requirePermission(PERMISSIONS.STATS_VIEW),
  getDistrictStats
);

/**
 * =========================
 * CREATE ADMIN (SUPER ADMIN ONLY)
 * =========================
 * POST /api/admin/users - Create a new admin user
 * ❌ District admins CANNOT create admins
 * ✅ Only super admins can create admin users
 * Creates a user with 'district_admin' or 'super_admin' role
 */
router.post(
  '/users',
  authorizeRoles('super_admin'),
  requirePermission(PERMISSIONS.USER_CREATE),
  createAdmin
);

/**
 * =========================
 * APPROVE USER
 * =========================
 * PATCH /api/admin/users/:id/approve - Approve a pending user
 * ✅ Super admins can approve any user
 * ✅ District admins can approve users in their district only
 * Changes user status from 'pending' to 'active'
 * Creates/updates veterinarian profile if user is a veterinarian
 */
router.patch(
  '/users/:id/approve',
  requirePermission(PERMISSIONS.USER_APPROVE),
  approveUser
);

/**
 * =========================
 * REJECT USER
 * =========================
 * PATCH /api/admin/users/:id/reject - Reject a pending user
 * ✅ Super admins can reject any user
 * ✅ District admins can reject users in their district only
 * Changes user status from 'pending' to 'rejected'
 */
router.patch(
  '/users/:id/reject',
  requirePermission(PERMISSIONS.USER_REJECT),
  rejectUser
);

/**
 * =========================
 * SUSPEND USER
 * =========================
 * PATCH /api/admin/users/:id/suspend - Suspend an active user
 * ✅ Super admins can suspend any user
 * ✅ District admins can suspend users in their district only
 * Changes user status to 'suspended' and sets is_active = 0
 */
router.patch(
  '/users/:id/suspend',
  requirePermission(PERMISSIONS.USER_SUSPEND),
  suspendUser
);

/**
 * =========================
 * ACTIVATE USER
 * =========================
 * PATCH /api/admin/users/:id/activate - Activate a suspended user
 * ✅ Super admins can activate any user
 * ✅ District admins can activate users in their district only
 * Changes user status to 'active' and sets is_active = 1
 */
router.patch(
  '/users/:id/activate',
  requirePermission(PERMISSIONS.USER_ACTIVATE),
  activateUser
);

/**
 * =========================
 * UPDATE USER ROLE
 * =========================
 * PATCH /api/admin/users/:id/role - Update user role
 * ✅ Super admins can update any user's role (including to super_admin)
 * ✅ District admins can update roles within their district (not to super_admin)
 * Valid roles: 'farmer', 'veterinarian', 'district_admin', 'super_admin'
 */
router.patch(
  '/users/:id/role',
  requirePermission(PERMISSIONS.USER_ROLE_UPDATE),
  updateUserRole
);

/**
 * =========================
 * DELETE USER (SUPER ADMIN ONLY)
 * =========================
 * DELETE /api/admin/users/:id - Soft delete a user
 * ❌ District admins CANNOT delete users
 * ✅ Only super admins can delete users
 * Sets is_deleted = 1 and stores deleted_at timestamp
 */
router.delete(
  '/users/:id',
  authorizeRoles('super_admin'),
  requirePermission(PERMISSIONS.USER_DELETE),
  deleteUser
);

/**
 * =========================
 * DATABASE TEST (Debug)
 * =========================
 * GET /api/admin/test-db - Test database connection
 * ✅ Only available in development mode
 * Tests: database connection, users table, specific user queries
 */
if (process.env.NODE_ENV === 'development') {
  router.get(
    '/test-db',
    testDbConnection
  );
}

export default router;