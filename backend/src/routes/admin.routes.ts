// backend/src/routes/admin.routes.ts
import express from 'express';

import {
  getUsers,
  approveUser,
  rejectUser,
  deleteUser,
  dashboardStats,
} from '../controllers/admin.controller';

import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = express.Router();

/**
 * =========================
 * GLOBAL SECURITY LAYER
 * =========================
 */
router.use(authenticate);

/**
 * =========================
 * BASE ADMIN ACCESS
 * =========================
 * Only admin-level roles can access this module
 */
router.use(authorizeRoles('super_admin', 'district_admin'));

/**
 * =========================
 * USERS MANAGEMENT
 * =========================
 */
router.get('/users', getUsers);

/**
 * =========================
 * DASHBOARD STATS
 * =========================
 */
router.get('/stats', dashboardStats);

/**
 * =========================
 * USER ACTIONS
 * =========================
 */
router.patch('/users/:id/approve', approveUser);

router.patch('/users/:id/reject', rejectUser);

/**
 * =========================
 * DELETE USER (HARD GUARD)
 * =========================
 * Override global rule: ONLY super_admin
 */
router.delete(
  '/users/:id',
  authenticate,
  authorizeRoles('super_admin'),
  deleteUser
);

export default router;