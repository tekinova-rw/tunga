// ============================================================
// FILE: backend/src/routes/animal.routes.ts
// DESCRIPTION: Animal routes for managing livestock animals
// ============================================================

import express from 'express';
import {
  getAnimals,
  getMyAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  updateAnimalHealth,
  deleteAnimal,
  getAnimalStats,
  getVetAnimals,
  getVetAnimalById,
  bulkDeleteAnimals,
  bulkUpdateHealth
} from '../controllers/animal.controller';
import { PERMISSIONS } from '../config/permissions';
import { authenticate } from '../middleware/auth.middleware';
import { requirePermission } from '../middleware/permission.middleware';
import { authorizeRoles } from '../middleware/role.middleware';

const router = express.Router();

/**
 * =========================
 * GLOBAL SECURITY LAYER
 * =========================
 * All animal routes require authentication
 */
router.use(authenticate);

/**
 * =========================
 * FARMER ANIMAL ENDPOINTS
 * =========================
 * Base path: /api/farmer/animals
 */

/**
 * GET FARMER'S ANIMALS
 * GET /api/farmer/animals
 * Description: Get all animals belonging to the authenticated farmer
 * Query params: category, health_status, search, page, limit
 */
router.get(
  '/farmer/animals',
  authorizeRoles('farmer'),
  requirePermission(PERMISSIONS.ANIMAL_READ),
  getAnimals
);

/**
 * GET MY ANIMALS (Alternative endpoint)
 * GET /api/farmer/animals/my
 * Description: Get all animals for the authenticated farmer (simplified)
 */
router.get(
  '/farmer/animals/my',
  authorizeRoles('farmer'),
  requirePermission(PERMISSIONS.ANIMAL_READ),
  getMyAnimals
);

/**
 * GET FARMER ANIMAL BY ID
 * GET /api/farmer/animals/:id
 * Description: Get a specific animal by ID for the authenticated farmer
 */
router.get(
  '/farmer/animals/:id',
  authorizeRoles('farmer'),
  requirePermission(PERMISSIONS.ANIMAL_READ),
  getAnimalById
);

/**
 * CREATE ANIMAL
 * POST /api/farmer/animals
 * Description: Create a new animal for the authenticated farmer
 * Body: name, category, breed, gender, birth_date, age, weight, 
 *       color, identification_tag, photo_url, health_status, 
 *       vaccination_status, is_pregnant, expected_delivery_date, notes
 */
router.post(
  '/farmer/animals',
  authorizeRoles('farmer'),
  requirePermission(PERMISSIONS.ANIMAL_CREATE),
  createAnimal
);

/**
 * UPDATE ANIMAL
 * PUT /api/farmer/animals/:id
 * Description: Update an existing animal
 * Body: Any animal fields to update
 */
router.put(
  '/farmer/animals/:id',
  authorizeRoles('farmer'),
  requirePermission(PERMISSIONS.ANIMAL_UPDATE),
  updateAnimal
);

/**
 * UPDATE ANIMAL HEALTH STATUS
 * PATCH /api/farmer/animals/:id/health
 * Description: Update the health status of an animal
 * Body: health_status, notes (optional)
 * Allowed: Farmers (own animals) and Veterinarians
 */
router.patch(
  '/farmer/animals/:id/health',
  authorizeRoles('farmer', 'veterinarian'),
  requirePermission(PERMISSIONS.ANIMAL_HEALTH_UPDATE),
  updateAnimalHealth
);

/**
 * DELETE ANIMAL
 * DELETE /api/farmer/animals/:id
 * Description: Soft delete an animal
 * Allowed: Farmers (own animals) and Admins
 */
router.delete(
  '/farmer/animals/:id',
  authorizeRoles('farmer'),
  requirePermission(PERMISSIONS.ANIMAL_DELETE),
  deleteAnimal
);

/**
 * GET ANIMAL STATISTICS
 * GET /api/farmer/animals/stats
 * Description: Get statistics for animals
 * Returns: Total count, health status breakdown, category breakdown
 */
router.get(
  '/farmer/animals/stats',
  authorizeRoles('farmer', 'district_admin'),
  requirePermission(PERMISSIONS.STATS_VIEW),
  getAnimalStats
);

/**
 * BULK DELETE ANIMALS
 * POST /api/farmer/animals/bulk-delete
 * Description: Delete multiple animals at once
 * Body: { ids: string[] }
 */
router.post(
  '/farmer/animals/bulk-delete',
  authorizeRoles('farmer'),
  requirePermission(PERMISSIONS.ANIMAL_DELETE),
  bulkDeleteAnimals
);

/**
 * BULK UPDATE HEALTH STATUS
 * POST /api/farmer/animals/bulk-update-health
 * Description: Update health status for multiple animals at once
 * Body: { updates: [{ id: string, health_status: string }] }
 */
router.post(
  '/farmer/animals/bulk-update-health',
  authorizeRoles('farmer'),
  requirePermission(PERMISSIONS.ANIMAL_HEALTH_UPDATE),
  bulkUpdateHealth
);

/**
 * =========================
 * VETERINARIAN ANIMAL ENDPOINTS
 * =========================
 * Base path: /api/vet/animals
 */

/**
 * GET VETERINARIAN'S ANIMALS
 * GET /api/vet/animals
 * Description: Get all animals in the veterinarian's district
 * Query params: category, health_status, search, page, limit
 */
router.get(
  '/vet/animals',
  authorizeRoles('veterinarian'),
  requirePermission(PERMISSIONS.ANIMAL_READ),
  getVetAnimals
);

/**
 * GET VETERINARIAN ANIMAL BY ID
 * GET /api/vet/animals/:id
 * Description: Get a specific animal by ID (must be in vet's district)
 */
router.get(
  '/vet/animals/:id',
  authorizeRoles('veterinarian'),
  requirePermission(PERMISSIONS.ANIMAL_READ),
  getVetAnimalById
);

/**
 * =========================
 * ADMIN ANIMAL ENDPOINTS
 * =========================
 * Base path: /api/admin/animals
 * (These are already covered by the main admin routes)
 */

/**
 * =========================
 * EXPORT ROUTER
 * =========================
 */
export default router;