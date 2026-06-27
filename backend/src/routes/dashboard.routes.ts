// ============================================================
// FILE: backend/src/routes/dashboard.routes.ts
// DESCRIPTION: Dashboard routes for farmers
// ============================================================

import express from 'express';
import { authenticate } from '../middleware/auth.middleware';
import { authorizeRoles } from '../middleware/role.middleware';
import { getFarmerDashboard, getFarmerStats } from '../controllers/dashboard.controller';

const router = express.Router();

/**
 * =========================
 * SECURITY LAYER
 * =========================
 * All dashboard routes require authentication
 */
router.use(authenticate);

/**
 * =========================
 * FARMER DASHBOARD ENDPOINTS
 * =========================
 * Base path: /api/farmer/dashboard
 */

/**
 * GET FARMER DASHBOARD
 * GET /api/farmer/dashboard
 * Description: Get all dashboard statistics for a farmer
 * Returns: total_animals, pending_requests, active_appointments, 
 *          unread_notifications, recent_activities
 */
router.get(
  '/farmer/dashboard',
  authorizeRoles('farmer'),
  getFarmerDashboard
);

/**
 * GET FARMER DASHBOARD STATS (Alternative endpoint)
 * GET /api/farmer/dashboard/stats
 * Description: Get dashboard statistics for a farmer
 * This is an alias for the main dashboard endpoint
 */
router.get(
  '/farmer/dashboard/stats',
  authorizeRoles('farmer'),
  getFarmerDashboard
);

/**
 * GET FARMER STATS
 * GET /api/farmer/stats
 * Description: Get simplified farmer statistics
 */
router.get(
  '/farmer/stats',
  authorizeRoles('farmer'),
  getFarmerStats
);

// ✅ MAKE SURE THIS IS HERE - Default export
export default router;