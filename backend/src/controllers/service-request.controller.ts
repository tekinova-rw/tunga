// // ============================================================
// // FILE: backend/src/controllers/animal.controller.ts
// // DESCRIPTION: Animal controller for managing livestock animals
// // ============================================================

// import { Response } from 'express';
// import { db } from '../config/db';
// import { AuthRequest } from '../middleware/auth.middleware';
// import { isSuperAdmin, isDistrictAdmin, isVeterinarian, isFarmer } from '../config/permissions';

// /**
//  * =========================
//  * HELPER FUNCTIONS
//  * =========================
//  */

// // Extract rows from different database result formats
// const extractRows = (result: any): any[] => {
//   if (!result) return [];
//   if (Array.isArray(result)) {
//     if (result.length > 0 && Array.isArray(result[0])) {
//       return result[0];
//     }
//     return result;
//   }
//   if (result.rows) return result.rows;
//   if (result[0]) return result[0];
//   return result;
// };

// // Extract single row from different database result formats
// const extractSingleRow = (result: any): any => {
//   const rows = extractRows(result);
//   return rows.length > 0 ? rows[0] : null;
// };

// // Check if result has data
// const hasData = (result: any): boolean => {
//   const rows = extractRows(result);
//   return rows.length > 0;
// };

// // Helper to safely parse ID from params
// const parseId = (id: string | string[]): number => {
//   if (Array.isArray(id)) {
//     return parseInt(id[0]);
//   }
//   return parseInt(id);
// };

// /**
//  * =========================
//  * CAN ACCESS ANIMAL HELPER
//  * =========================
//  */
// const canAccessAnimal = (user: any, animal: any): boolean => {
//   // Super admin can access all
//   if (isSuperAdmin(user.role)) return true;
  
//   // Farmer can access their own animals
//   if (isFarmer(user.role)) {
//     return animal.farmer_id === user.id;
//   }
  
//   // Veterinarian can access animals in their district
//   if (isVeterinarian(user.role)) {
//     // Check if the animal's farmer is in the same district
//     return animal.district_id === user.district_id;
//   }
  
//   // District admin can access animals in their district
//   if (isDistrictAdmin(user.role)) {
//     return animal.district_id === user.district_id;
//   }
  
//   return false;
// };

// const canManageAnimal = (user: any, animal: any): boolean => {
//   // Super admin can manage all
//   if (isSuperAdmin(user.role)) return true;
  
//   // Farmer can manage their own animals
//   if (isFarmer(user.role)) {
//     return animal.farmer_id === user.id;
//   }
  
//   // District admin can manage animals in their district
//   if (isDistrictAdmin(user.role)) {
//     return animal.district_id === user.district_id;
//   }
  
//   return false;
// };

// /**
//  * =========================
//  * FARMER ANIMAL ENDPOINTS
//  * =========================
//  */

// /**
//  * GET FARMER'S ANIMALS
//  * GET /api/farmer/animals
//  */
// export const getFarmerAnimals = async (req: AuthRequest, res: Response) => {
//   try {
//     const user = req.user;
//     const { category, health_status, search, page = 1, limit = 10 } = req.query;

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     // Only farmers can access this endpoint
//     if (!isFarmer(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only farmers can access their animals'
//       });
//     }

//     let query = `
//       SELECT 
//         a.*,
//         u.full_name as farmer_name,
//         u.phone as farmer_phone,
//         d.name as district_name
//       FROM animals a
//       LEFT JOIN users u ON a.farmer_id = u.id
//       LEFT JOIN districts d ON u.district_id = d.id
//       WHERE a.farmer_id = ? AND a.is_deleted = 0
//     `;

//     const params: any[] = [user.id];

//     if (category) {
//       query += ' AND a.category = ?';
//       params.push(category);
//     }

//     if (health_status) {
//       query += ' AND a.health_status = ?';
//       params.push(health_status);
//     }

//     if (search) {
//       query += ' AND (a.name LIKE ? OR a.breed LIKE ? OR a.identification_tag LIKE ?)';
//       const searchTerm = `%${search}%`;
//       params.push(searchTerm, searchTerm, searchTerm);
//     }

//     // Get total count
//     const countQuery = query.replace(
//       /SELECT .*? FROM/,
//       'SELECT COUNT(*) as total FROM'
//     );
//     const countResult = await db.query(countQuery, params);
//     const countRow = extractSingleRow(countResult);
//     const total = countRow?.total || 0;

//     // Add pagination
//     const offset = (Number(page) - 1) * Number(limit);
//     query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
//     params.push(Number(limit), offset);

//     const result = await db.query(query, params);
//     const rows = extractRows(result);

//     return res.json({
//       success: true,
//       data: rows,
//       pagination: {
//         total,
//         page: Number(page),
//         limit: Number(limit),
//         total_pages: Math.ceil(total / Number(limit))
//       }
//     });
//   } catch (error) {
//     console.error('❌ Get farmer animals error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch animals'
//     });
//   }
// };

// /**
//  * GET FARMER ANIMAL BY ID
//  * GET /api/farmer/animals/:id
//  */
// export const getFarmerAnimalById = async (req: AuthRequest, res: Response) => {
//   try {
//     const user = req.user;
//     const { id } = req.params;

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     if (!isFarmer(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only farmers can view their animals'
//       });
//     }

//     const result = await db.query(
//       `SELECT 
//         a.*,
//         u.full_name as farmer_name,
//         u.phone as farmer_phone,
//         u.email as farmer_email,
//         d.name as district_name
//       FROM animals a
//       LEFT JOIN users u ON a.farmer_id = u.id
//       LEFT JOIN districts d ON u.district_id = d.id
//       WHERE a.id = ? AND a.farmer_id = ? AND a.is_deleted = 0`,
//       [id, user.id]
//     );

//     const animal = extractSingleRow(result);

//     if (!animal) {
//       return res.status(404).json({
//         success: false,
//         message: 'Animal not found'
//       });
//     }

//     return res.json({
//       success: true,
//       data: animal
//     });
//   } catch (error) {
//     console.error('❌ Get farmer animal error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch animal'
//     });
//   }
// };

// /**
//  * CREATE ANIMAL
//  * POST /api/farmer/animals
//  */
// export const createAnimal = async (req: AuthRequest, res: Response) => {
//   try {
//     const user = req.user;
//     const {
//       name,
//       category,
//       breed,
//       gender,
//       birth_date,
//       age,
//       weight,
//       color,
//       identification_tag,
//       photo_url,
//       health_status,
//       vaccination_status,
//       is_pregnant,
//       expected_delivery_date,
//       notes
//     } = req.body;

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     if (!isFarmer(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only farmers can create animals'
//       });
//     }

//     // Validate required fields
//     if (!name || !category) {
//       return res.status(400).json({
//         success: false,
//         message: 'Name and category are required'
//       });
//     }

//     // Validate category
//     const validCategories = ['cow', 'goat', 'sheep', 'pig', 'chicken', 'rabbit', 'horse', 'duck', 'turkey', 'other'];
//     if (!validCategories.includes(category)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid category. Valid categories: ' + validCategories.join(', ')
//       });
//     }

//     // Validate health status
//     const validHealthStatuses = ['healthy', 'sick', 'recovering', 'under_treatment', 'critical', 'deceased', 'quarantined'];
//     if (health_status && !validHealthStatuses.includes(health_status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid health status. Valid statuses: ' + validHealthStatuses.join(', ')
//       });
//     }

//     // Validate vaccination status
//     const validVaccinationStatuses = ['up_to_date', 'overdue', 'partial', 'not_vaccinated'];
//     if (vaccination_status && !validVaccinationStatuses.includes(vaccination_status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid vaccination status. Valid statuses: ' + validVaccinationStatuses.join(', ')
//       });
//     }

//     // Insert animal
//     const insertResult = await db.query(
//       `INSERT INTO animals (
//         farmer_id,
//         name,
//         category,
//         breed,
//         gender,
//         birth_date,
//         age,
//         weight,
//         color,
//         identification_tag,
//         photo_url,
//         health_status,
//         vaccination_status,
//         is_pregnant,
//         expected_delivery_date,
//         notes,
//         created_at,
//         updated_at
//       ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
//       [
//         user.id,
//         name,
//         category,
//         breed || null,
//         gender || null,
//         birth_date || null,
//         age || null,
//         weight || null,
//         color || null,
//         identification_tag || null,
//         photo_url || null,
//         health_status || 'healthy',
//         vaccination_status || 'not_vaccinated',
//         is_pregnant || false,
//         expected_delivery_date || null,
//         notes || null
//       ]
//     );

//     const newId = insertResult.insertId || (insertResult[0]?.insertId);

//     // Get created animal
//     const result = await db.query(
//       `SELECT 
//         a.*,
//         u.full_name as farmer_name
//       FROM animals a
//       LEFT JOIN users u ON a.farmer_id = u.id
//       WHERE a.id = ?`,
//       [newId]
//     );

//     const animal = extractSingleRow(result);

//     // Update farmer's total animals count
//     await db.query(
//       'UPDATE farmer_profiles SET total_animals = total_animals + 1 WHERE user_id = ?',
//       [user.id]
//     );

//     return res.status(201).json({
//       success: true,
//       message: 'Animal created successfully',
//       data: animal
//     });
//   } catch (error) {
//     console.error('❌ Create animal error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to create animal',
//       error: error instanceof Error ? error.message : 'Unknown error'
//     });
//   }
// };

// /**
//  * UPDATE ANIMAL
//  * PUT /api/farmer/animals/:id
//  */
// export const updateAnimal = async (req: AuthRequest, res: Response) => {
//   try {
//     const user = req.user;
//     const { id } = req.params;
//     const {
//       name,
//       category,
//       breed,
//       gender,
//       birth_date,
//       age,
//       weight,
//       color,
//       identification_tag,
//       photo_url,
//       health_status,
//       vaccination_status,
//       is_pregnant,
//       expected_delivery_date,
//       notes
//     } = req.body;

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     if (!isFarmer(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only farmers can update their animals'
//       });
//     }

//     // Check if animal exists and belongs to the farmer
//     const animalResult = await db.query(
//       'SELECT id FROM animals WHERE id = ? AND farmer_id = ? AND is_deleted = 0',
//       [id, user.id]
//     );
//     const animal = extractSingleRow(animalResult);

//     if (!animal) {
//       return res.status(404).json({
//         success: false,
//         message: 'Animal not found or you do not have permission to update it'
//       });
//     }

//     // Build update query dynamically
//     const updates: string[] = [];
//     const params: any[] = [];

//     if (name !== undefined) {
//       updates.push('name = ?');
//       params.push(name);
//     }
//     if (category !== undefined) {
//       updates.push('category = ?');
//       params.push(category);
//     }
//     if (breed !== undefined) {
//       updates.push('breed = ?');
//       params.push(breed);
//     }
//     if (gender !== undefined) {
//       updates.push('gender = ?');
//       params.push(gender);
//     }
//     if (birth_date !== undefined) {
//       updates.push('birth_date = ?');
//       params.push(birth_date);
//     }
//     if (age !== undefined) {
//       updates.push('age = ?');
//       params.push(age);
//     }
//     if (weight !== undefined) {
//       updates.push('weight = ?');
//       params.push(weight);
//     }
//     if (color !== undefined) {
//       updates.push('color = ?');
//       params.push(color);
//     }
//     if (identification_tag !== undefined) {
//       updates.push('identification_tag = ?');
//       params.push(identification_tag);
//     }
//     if (photo_url !== undefined) {
//       updates.push('photo_url = ?');
//       params.push(photo_url);
//     }
//     if (health_status !== undefined) {
//       updates.push('health_status = ?');
//       params.push(health_status);
//     }
//     if (vaccination_status !== undefined) {
//       updates.push('vaccination_status = ?');
//       params.push(vaccination_status);
//     }
//     if (is_pregnant !== undefined) {
//       updates.push('is_pregnant = ?');
//       params.push(is_pregnant);
//     }
//     if (expected_delivery_date !== undefined) {
//       updates.push('expected_delivery_date = ?');
//       params.push(expected_delivery_date);
//     }
//     if (notes !== undefined) {
//       updates.push('notes = ?');
//       params.push(notes);
//     }

//     if (updates.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'No fields to update'
//       });
//     }

//     updates.push('updated_at = NOW()');
//     params.push(id);

//     await db.query(
//       `UPDATE animals SET ${updates.join(', ')} WHERE id = ? AND farmer_id = ? AND is_deleted = 0`,
//       [...params, user.id]
//     );

//     // Get updated animal
//     const result = await db.query(
//       `SELECT 
//         a.*,
//         u.full_name as farmer_name
//       FROM animals a
//       LEFT JOIN users u ON a.farmer_id = u.id
//       WHERE a.id = ?`,
//       [id]
//     );

//     const updatedAnimal = extractSingleRow(result);

//     return res.json({
//       success: true,
//       message: 'Animal updated successfully',
//       data: updatedAnimal
//     });
//   } catch (error) {
//     console.error('❌ Update animal error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update animal'
//     });
//   }
// };

// /**
//  * UPDATE ANIMAL HEALTH STATUS
//  * PATCH /api/farmer/animals/:id/health
//  */
// export const updateAnimalHealth = async (req: AuthRequest, res: Response) => {
//   try {
//     const user = req.user;
//     const { id } = req.params;
//     const { health_status, notes } = req.body;

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     if (!health_status) {
//       return res.status(400).json({
//         success: false,
//         message: 'health_status is required'
//       });
//     }

//     const validHealthStatuses = ['healthy', 'sick', 'recovering', 'under_treatment', 'critical', 'deceased', 'quarantined'];
//     if (!validHealthStatuses.includes(health_status)) {
//       return res.status(400).json({
//         success: false,
//         message: 'Invalid health status. Valid statuses: ' + validHealthStatuses.join(', ')
//       });
//     }

//     // Check if animal exists and user has permission
//     const animalResult = await db.query(
//       'SELECT id, farmer_id FROM animals WHERE id = ? AND is_deleted = 0',
//       [id]
//     );
//     const animal = extractSingleRow(animalResult);

//     if (!animal) {
//       return res.status(404).json({
//         success: false,
//         message: 'Animal not found'
//       });
//     }

//     // Check permission: farmer or veterinarian can update health
//     if (!isFarmer(user.role) && !isVeterinarian(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only farmers or veterinarians can update animal health'
//       });
//     }

//     // If farmer, check if it's their animal
//     if (isFarmer(user.role) && animal.farmer_id !== user.id) {
//       return res.status(403).json({
//         success: false,
//         message: 'You can only update health for your own animals'
//       });
//     }

//     // Update health status
//     await db.query(
//       `UPDATE animals 
//        SET health_status = ?, notes = CONCAT(IFNULL(notes, ''), ?, '\n'), updated_at = NOW() 
//        WHERE id = ? AND is_deleted = 0`,
//       [health_status, `[Health Update] ${new Date().toISOString()}: ${notes || 'No additional notes'}`, id]
//     );

//     // Get updated animal
//     const result = await db.query(
//       `SELECT 
//         a.*,
//         u.full_name as farmer_name
//       FROM animals a
//       LEFT JOIN users u ON a.farmer_id = u.id
//       WHERE a.id = ?`,
//       [id]
//     );

//     const updatedAnimal = extractSingleRow(result);

//     return res.json({
//       success: true,
//       message: `Animal health status updated to '${health_status}'`,
//       data: updatedAnimal
//     });
//   } catch (error) {
//     console.error('❌ Update animal health error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update animal health'
//     });
//   }
// };

// /**
//  * DELETE ANIMAL
//  * DELETE /api/farmer/animals/:id
//  */
// export const deleteAnimal = async (req: AuthRequest, res: Response) => {
//   try {
//     const user = req.user;
//     const { id } = req.params;

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     if (!isFarmer(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only farmers can delete their animals'
//       });
//     }

//     // Check if animal exists and belongs to the farmer
//     const animalResult = await db.query(
//       'SELECT id FROM animals WHERE id = ? AND farmer_id = ? AND is_deleted = 0',
//       [id, user.id]
//     );
//     const animal = extractSingleRow(animalResult);

//     if (!animal) {
//       return res.status(404).json({
//         success: false,
//         message: 'Animal not found or you do not have permission to delete it'
//       });
//     }

//     // Soft delete
//     await db.query(
//       'UPDATE animals SET is_deleted = 1, deleted_at = NOW() WHERE id = ?',
//       [id]
//     );

//     // Update farmer's total animals count
//     await db.query(
//       'UPDATE farmer_profiles SET total_animals = total_animals - 1 WHERE user_id = ? AND total_animals > 0',
//       [user.id]
//     );

//     return res.json({
//       success: true,
//       message: 'Animal deleted successfully'
//     });
//   } catch (error) {
//     console.error('❌ Delete animal error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete animal'
//     });
//   }
// };

// /**
//  * GET ANIMAL STATISTICS
//  * GET /api/farmer/animals/stats
//  */
// export const getAnimalStats = async (req: AuthRequest, res: Response) => {
//   try {
//     const user = req.user;

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     let query = `
//       SELECT 
//         COUNT(*) as total_animals,
//         SUM(CASE WHEN health_status = 'healthy' THEN 1 ELSE 0 END) as healthy_count,
//         SUM(CASE WHEN health_status = 'sick' THEN 1 ELSE 0 END) as sick_count,
//         SUM(CASE WHEN health_status = 'recovering' THEN 1 ELSE 0 END) as recovering_count,
//         SUM(CASE WHEN health_status = 'under_treatment' THEN 1 ELSE 0 END) as under_treatment_count,
//         SUM(CASE WHEN health_status = 'critical' THEN 1 ELSE 0 END) as critical_count,
//         SUM(CASE WHEN health_status = 'deceased' THEN 1 ELSE 0 END) as deceased_count,
//         SUM(CASE WHEN health_status = 'quarantined' THEN 1 ELSE 0 END) as quarantined_count,
//         SUM(CASE WHEN is_pregnant = 1 THEN 1 ELSE 0 END) as pregnant_count
//       FROM animals
//       WHERE is_deleted = 0
//     `;

//     const params: any[] = [];

//     // If farmer, only their animals
//     if (isFarmer(user.role)) {
//       query += ' AND farmer_id = ?';
//       params.push(user.id);
//     }
//     // If district admin, only animals in their district
//     else if (isDistrictAdmin(user.role)) {
//       query += ' AND farmer_id IN (SELECT id FROM users WHERE district_id = ?)';
//       params.push(user.district_id);
//     }

//     const result = await db.query(query, params);
//     const stats = extractSingleRow(result);

//     // Get category breakdown
//     let categoryQuery = `
//       SELECT 
//         category,
//         COUNT(*) as count
//       FROM animals
//       WHERE is_deleted = 0
//     `;

//     if (isFarmer(user.role)) {
//       categoryQuery += ' AND farmer_id = ?';
//     } else if (isDistrictAdmin(user.role)) {
//       categoryQuery += ' AND farmer_id IN (SELECT id FROM users WHERE district_id = ?)';
//     }

//     categoryQuery += ' GROUP BY category ORDER BY count DESC';

//     const categoryResult = await db.query(categoryQuery, params);
//     const categories = extractRows(categoryResult);

//     // Get health status breakdown
//     let healthQuery = `
//       SELECT 
//         health_status,
//         COUNT(*) as count
//       FROM animals
//       WHERE is_deleted = 0
//     `;

//     if (isFarmer(user.role)) {
//       healthQuery += ' AND farmer_id = ?';
//     } else if (isDistrictAdmin(user.role)) {
//       healthQuery += ' AND farmer_id IN (SELECT id FROM users WHERE district_id = ?)';
//     }

//     healthQuery += ' GROUP BY health_status ORDER BY count DESC';

//     const healthResult = await db.query(healthQuery, params);
//     const healthStatuses = extractRows(healthResult);

//     const byCategory: Record<string, number> = {};
//     categories.forEach((c: any) => {
//       byCategory[c.category] = c.count;
//     });

//     const byHealthStatus: Record<string, number> = {};
//     healthStatuses.forEach((h: any) => {
//       byHealthStatus[h.health_status] = h.count;
//     });

//     return res.json({
//       success: true,
//       data: {
//         ...stats,
//         by_category: byCategory,
//         by_health_status: byHealthStatus
//       }
//     });
//   } catch (error) {
//     console.error('❌ Get animal stats error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch animal statistics'
//     });
//   }
// };

// /**
//  * =========================
//  * VETERINARIAN ANIMAL ENDPOINTS
//  * =========================
//  */

// /**
//  * GET VETERINARIAN'S ANIMALS
//  * GET /api/vet/animals
//  */
// export const getVetAnimals = async (req: AuthRequest, res: Response) => {
//   try {
//     const user = req.user;
//     const { category, health_status, search, page = 1, limit = 10 } = req.query;

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     if (!isVeterinarian(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only veterinarians can access this endpoint'
//       });
//     }

//     let query = `
//       SELECT 
//         a.*,
//         u.full_name as farmer_name,
//         u.phone as farmer_phone,
//         u.email as farmer_email,
//         d.name as district_name
//       FROM animals a
//       LEFT JOIN users u ON a.farmer_id = u.id
//       LEFT JOIN districts d ON u.district_id = d.id
//       WHERE a.is_deleted = 0
//         AND u.district_id = ?
//     `;

//     const params: any[] = [user.district_id];

//     if (category) {
//       query += ' AND a.category = ?';
//       params.push(category);
//     }

//     if (health_status) {
//       query += ' AND a.health_status = ?';
//       params.push(health_status);
//     }

//     if (search) {
//       query += ' AND (a.name LIKE ? OR a.breed LIKE ? OR u.full_name LIKE ?)';
//       const searchTerm = `%${search}%`;
//       params.push(searchTerm, searchTerm, searchTerm);
//     }

//     // Get total count
//     const countQuery = query.replace(
//       /SELECT .*? FROM/,
//       'SELECT COUNT(*) as total FROM'
//     );
//     const countResult = await db.query(countQuery, params);
//     const countRow = extractSingleRow(countResult);
//     const total = countRow?.total || 0;

//     // Add pagination
//     const offset = (Number(page) - 1) * Number(limit);
//     query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
//     params.push(Number(limit), offset);

//     const result = await db.query(query, params);
//     const rows = extractRows(result);

//     return res.json({
//       success: true,
//       data: rows,
//       pagination: {
//         total,
//         page: Number(page),
//         limit: Number(limit),
//         total_pages: Math.ceil(total / Number(limit))
//       }
//     });
//   } catch (error) {
//     console.error('❌ Get vet animals error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch animals'
//     });
//   }
// };

// /**
//  * GET VETERINARIAN ANIMAL BY ID
//  * GET /api/vet/animals/:id
//  */
// export const getVetAnimalById = async (req: AuthRequest, res: Response) => {
//   try {
//     const user = req.user;
//     const { id } = req.params;

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     if (!isVeterinarian(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only veterinarians can view animals'
//       });
//     }

//     const result = await db.query(
//       `SELECT 
//         a.*,
//         u.full_name as farmer_name,
//         u.phone as farmer_phone,
//         u.email as farmer_email,
//         d.name as district_name
//       FROM animals a
//       LEFT JOIN users u ON a.farmer_id = u.id
//       LEFT JOIN districts d ON u.district_id = d.id
//       WHERE a.id = ? AND a.is_deleted = 0 AND u.district_id = ?`,
//       [id, user.district_id]
//     );

//     const animal = extractSingleRow(result);

//     if (!animal) {
//       return res.status(404).json({
//         success: false,
//         message: 'Animal not found or not in your district'
//       });
//     }

//     return res.json({
//       success: true,
//       data: animal
//     });
//   } catch (error) {
//     console.error('❌ Get vet animal error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to fetch animal'
//     });
//   }
// };

// /**
//  * =========================
//  * BATCH OPERATIONS
//  * =========================
//  */

// /**
//  * BULK DELETE ANIMALS
//  * POST /api/farmer/animals/bulk-delete
//  */
// export const bulkDeleteAnimals = async (req: AuthRequest, res: Response) => {
//   try {
//     const user = req.user;
//     const { ids } = req.body;

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     if (!isFarmer(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only farmers can delete animals'
//       });
//     }

//     if (!ids || !Array.isArray(ids) || ids.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Array of animal IDs is required'
//       });
//     }

//     // Verify all animals belong to the farmer
//     const placeholders = ids.map(() => '?').join(',');
//     const checkResult = await db.query(
//       `SELECT id FROM animals WHERE id IN (${placeholders}) AND farmer_id = ? AND is_deleted = 0`,
//       [...ids, user.id]
//     );
//     const validAnimals = extractRows(checkResult);

//     if (validAnimals.length === 0) {
//       return res.status(404).json({
//         success: false,
//         message: 'No valid animals found to delete'
//       });
//     }

//     const validIds = validAnimals.map((a: any) => a.id);

//     // Soft delete
//     const deletePlaceholders = validIds.map(() => '?').join(',');
//     await db.query(
//       `UPDATE animals SET is_deleted = 1, deleted_at = NOW() WHERE id IN (${deletePlaceholders})`,
//       validIds
//     );

//     // Update farmer's total animals count
//     await db.query(
//       `UPDATE farmer_profiles SET total_animals = total_animals - ? WHERE user_id = ? AND total_animals >= ?`,
//       [validIds.length, user.id, validIds.length]
//     );

//     return res.json({
//       success: true,
//       message: `${validIds.length} animals deleted successfully`,
//       deleted_count: validIds.length
//     });
//   } catch (error) {
//     console.error('❌ Bulk delete error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to delete animals'
//     });
//   }
// };

// /**
//  * BULK UPDATE HEALTH STATUS
//  * POST /api/farmer/animals/bulk-update-health
//  */
// export const bulkUpdateHealth = async (req: AuthRequest, res: Response) => {
//   try {
//     const user = req.user;
//     const { updates } = req.body;

//     if (!user) {
//       return res.status(401).json({
//         success: false,
//         message: 'Unauthorized'
//       });
//     }

//     if (!isFarmer(user.role)) {
//       return res.status(403).json({
//         success: false,
//         message: 'Only farmers can update animal health'
//       });
//     }

//     if (!updates || !Array.isArray(updates) || updates.length === 0) {
//       return res.status(400).json({
//         success: false,
//         message: 'Array of updates is required'
//       });
//     }

//     let updatedCount = 0;

//     for (const update of updates) {
//       const { id, health_status } = update;

//       if (!id || !health_status) {
//         continue;
//       }

//       // Check if animal belongs to farmer
//       const animalResult = await db.query(
//         'SELECT id FROM animals WHERE id = ? AND farmer_id = ? AND is_deleted = 0',
//         [id, user.id]
//       );
//       const animal = extractSingleRow(animalResult);

//       if (!animal) {
//         continue;
//       }

//       await db.query(
//         `UPDATE animals 
//          SET health_status = ?, updated_at = NOW() 
//          WHERE id = ? AND farmer_id = ? AND is_deleted = 0`,
//         [health_status, id, user.id]
//       );

//       updatedCount++;
//     }

//     return res.json({
//       success: true,
//       message: `${updatedCount} animals updated successfully`,
//       updated_count: updatedCount
//     });
//   } catch (error) {
//     console.error('❌ Bulk update health error:', error);
//     return res.status(500).json({
//       success: false,
//       message: 'Failed to update animal health'
//     });
//   }
// };