// ============================================================
// FILE: backend/src/services/animal-service.ts
// DESCRIPTION: Animal service for backend API calls
// ============================================================

import { db } from '../config/db';

/**
 * =========================
 * TYPES
 * =========================
 */

export type Animal = {
  id: string;
  name: string;
  category: string;
  breed: string;
  age: number;
  weight: number;
  health_status: 'healthy' | 'sick' | 'recovering' | 'under_treatment' | 'critical' | 'deceased' | 'quarantined';
  notes: string;
  farmer_id: string;
  farmer_name?: string;
  created_at: string;
  updated_at: string;
};

export type AnimalFilter = {
  category?: string;
  health_status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

export type CreateAnimalPayload = {
  name: string;
  category: string;
  breed?: string;
  age?: number;
  weight?: number;
  health_status?: string;
  notes?: string;
};

export type UpdateAnimalPayload = Partial<CreateAnimalPayload>;

export type HealthUpdatePayload = {
  health_status: string;
  notes?: string;
};

export type AnimalResponse = {
  success: boolean;
  data: Animal | Animal[];
  message?: string;
  pagination?: {
    total: number;
    page: number;
    limit: number;
    total_pages: number;
  };
};

/**
 * =========================
 * HELPER FUNCTIONS
 * =========================
 */

// Extract rows from different database result formats
const extractRows = (result: any): any[] => {
  if (!result) return [];
  if (Array.isArray(result)) {
    if (result.length > 0 && Array.isArray(result[0])) {
      return result[0];
    }
    return result;
  }
  if (result.rows) return result.rows;
  if (result[0]) return result[0];
  return result;
};

// Extract single row from different database result formats
const extractSingleRow = (result: any): any => {
  const rows = extractRows(result);
  return rows.length > 0 ? rows[0] : null;
};

// Extract insert ID from different database result formats
const extractInsertId = (result: any): number => {
  if (!result) return 0;
  if (result.insertId) return result.insertId;
  if (result[0] && result[0].insertId) return result[0].insertId;
  if (result.rows && result.rows.insertId) return result.rows.insertId;
  return 0;
};

/**
 * =========================
 * FARMER ANIMAL ENDPOINTS
 * =========================
 */

/**
 * Get animals with filters
 */
export const getAnimals = async (filter?: AnimalFilter): Promise<Animal[]> => {
  try {
    let query = `
      SELECT 
        a.*,
        u.full_name as farmer_name
      FROM animals a
      LEFT JOIN users u ON a.farmer_id = u.id
      WHERE a.is_deleted = 0
    `;
    const params: any[] = [];

    if (filter?.category) {
      query += ' AND a.category = ?';
      params.push(filter.category);
    }

    if (filter?.health_status) {
      query += ' AND a.health_status = ?';
      params.push(filter.health_status);
    }

    if (filter?.search) {
      query += ' AND (a.name LIKE ? OR a.breed LIKE ? OR a.identification_tag LIKE ?)';
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filter?.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
      if (filter?.page) {
        const offset = (filter.page - 1) * filter.limit;
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await db.query(query, params);
    const rows = extractRows(result);

    return rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      category: row.category,
      breed: row.breed || '',
      age: row.age || 0,
      weight: row.weight || 0,
      health_status: row.health_status || 'healthy',
      notes: row.notes || '',
      farmer_id: row.farmer_id.toString(),
      farmer_name: row.farmer_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error('❌ getAnimals error:', error);
    throw error;
  }
};

/**
 * Get animal by ID
 */
export const getAnimalById = async (id: string): Promise<Animal> => {
  try {
    const result = await db.query(
      `SELECT 
        a.*,
        u.full_name as farmer_name
      FROM animals a
      LEFT JOIN users u ON a.farmer_id = u.id
      WHERE a.id = ? AND a.is_deleted = 0`,
      [id]
    );

    const row = extractSingleRow(result);

    if (!row) {
      throw new Error('Animal not found');
    }

    return {
      id: row.id.toString(),
      name: row.name,
      category: row.category,
      breed: row.breed || '',
      age: row.age || 0,
      weight: row.weight || 0,
      health_status: row.health_status || 'healthy',
      notes: row.notes || '',
      farmer_id: row.farmer_id.toString(),
      farmer_name: row.farmer_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (error) {
    console.error('❌ getAnimalById error:', error);
    throw error;
  }
};

/**
 * Create animal
 */
export const createAnimal = async (payload: CreateAnimalPayload, farmerId: string): Promise<Animal> => {
  try {
    const {
      name,
      category,
      breed,
      age,
      weight,
      health_status,
      notes,
    } = payload;

    const result = await db.query(
      `INSERT INTO animals (
        farmer_id,
        name,
        category,
        breed,
        age,
        weight,
        health_status,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        farmerId,
        name,
        category,
        breed || null,
        age || null,
        weight || null,
        health_status || 'healthy',
        notes || null,
      ]
    );

    const newId = extractInsertId(result);
    const animal = await getAnimalById(newId.toString());
    return animal;
  } catch (error) {
    console.error('❌ createAnimal error:', error);
    throw error;
  }
};

/**
 * Update animal
 */
export const updateAnimal = async (id: string, payload: UpdateAnimalPayload, farmerId: string): Promise<Animal> => {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    const fields = ['name', 'category', 'breed', 'age', 'weight', 'health_status', 'notes'];
    
    for (const field of fields) {
      if (payload[field as keyof UpdateAnimalPayload] !== undefined) {
        updates.push(`${field} = ?`);
        values.push(payload[field as keyof UpdateAnimalPayload]);
      }
    }

    if (updates.length === 0) {
      throw new Error('No fields to update');
    }

    updates.push('updated_at = NOW()');
    values.push(id);
    values.push(farmerId);

    await db.query(
      `UPDATE animals SET ${updates.join(', ')} WHERE id = ? AND farmer_id = ? AND is_deleted = 0`,
      values
    );

    const animal = await getAnimalById(id);
    return animal;
  } catch (error) {
    console.error('❌ updateAnimal error:', error);
    throw error;
  }
};

/**
 * Update animal health status
 */
export const updateAnimalHealth = async (id: string, payload: HealthUpdatePayload, farmerId: string): Promise<Animal> => {
  try {
    const { health_status, notes } = payload;

    const noteText = notes ? `\n[Health Update] ${new Date().toISOString()}: ${notes}` : '';

    await db.query(
      `UPDATE animals 
       SET health_status = ?, notes = CONCAT(IFNULL(notes, ''), ?), updated_at = NOW() 
       WHERE id = ? AND farmer_id = ? AND is_deleted = 0`,
      [health_status, noteText, id, farmerId]
    );

    const animal = await getAnimalById(id);
    return animal;
  } catch (error) {
    console.error('❌ updateAnimalHealth error:', error);
    throw error;
  }
};

/**
 * Delete animal (soft delete)
 */
export const deleteAnimal = async (id: string, farmerId: string): Promise<{ success: boolean; message: string }> => {
  try {
    await db.query(
      `UPDATE animals SET is_deleted = 1, deleted_at = NOW() WHERE id = ? AND farmer_id = ?`,
      [id, farmerId]
    );

    // Update farmer's total animals count
    await db.query(
      'UPDATE farmer_profiles SET total_animals = total_animals - 1 WHERE user_id = ? AND total_animals > 0',
      [farmerId]
    );

    return {
      success: true,
      message: 'Animal deleted successfully',
    };
  } catch (error) {
    console.error('❌ deleteAnimal error:', error);
    throw error;
  }
};

/**
 * Get animal statistics
 */
export const getAnimalStats = async (farmerId: string): Promise<{
  total_animals: number;
  by_category: Record<string, number>;
  by_health_status: Record<string, number>;
}> => {
  try {
    // Total count
    const totalResult = await db.query(
      'SELECT COUNT(*) as total FROM animals WHERE farmer_id = ? AND is_deleted = 0',
      [farmerId]
    );
    const totalRow = extractSingleRow(totalResult);
    const total_animals = totalRow?.total || 0;

    // By category
    const categoryResult = await db.query(
      'SELECT category, COUNT(*) as count FROM animals WHERE farmer_id = ? AND is_deleted = 0 GROUP BY category',
      [farmerId]
    );
    const categories = extractRows(categoryResult);
    const by_category: Record<string, number> = {};
    categories.forEach((c: any) => {
      by_category[c.category] = c.count;
    });

    // By health status
    const healthResult = await db.query(
      'SELECT health_status, COUNT(*) as count FROM animals WHERE farmer_id = ? AND is_deleted = 0 GROUP BY health_status',
      [farmerId]
    );
    const healthStatuses = extractRows(healthResult);
    const by_health_status: Record<string, number> = {};
    healthStatuses.forEach((h: any) => {
      by_health_status[h.health_status] = h.count;
    });

    return {
      total_animals,
      by_category,
      by_health_status,
    };
  } catch (error) {
    console.error('❌ getAnimalStats error:', error);
    throw error;
  }
};

/**
 * =========================
 * VET ANIMAL ENDPOINTS
 * =========================
 */

/**
 * Get vet animals (only in vet's district)
 */
export const getVetAnimals = async (vetId: string, filter?: AnimalFilter): Promise<Animal[]> => {
  try {
    let query = `
      SELECT 
        a.*,
        u.full_name as farmer_name
      FROM animals a
      LEFT JOIN users u ON a.farmer_id = u.id
      WHERE a.is_deleted = 0
        AND u.district_id = (SELECT district_id FROM users WHERE id = ?)
    `;
    const params: any[] = [vetId];

    if (filter?.category) {
      query += ' AND a.category = ?';
      params.push(filter.category);
    }

    if (filter?.health_status) {
      query += ' AND a.health_status = ?';
      params.push(filter.health_status);
    }

    if (filter?.search) {
      query += ' AND (a.name LIKE ? OR a.breed LIKE ? OR u.full_name LIKE ?)';
      const searchTerm = `%${filter.search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    if (filter?.limit) {
      query += ' LIMIT ?';
      params.push(filter.limit);
      if (filter?.page) {
        const offset = (filter.page - 1) * filter.limit;
        query += ' OFFSET ?';
        params.push(offset);
      }
    }

    query += ' ORDER BY a.created_at DESC';

    const result = await db.query(query, params);
    const rows = extractRows(result);

    return rows.map((row: any) => ({
      id: row.id.toString(),
      name: row.name,
      category: row.category,
      breed: row.breed || '',
      age: row.age || 0,
      weight: row.weight || 0,
      health_status: row.health_status || 'healthy',
      notes: row.notes || '',
      farmer_id: row.farmer_id.toString(),
      farmer_name: row.farmer_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
    }));
  } catch (error) {
    console.error('❌ getVetAnimals error:', error);
    throw error;
  }
};

/**
 * Get vet animal by ID
 */
export const getAnimalByVet = async (id: string, vetId: string): Promise<Animal> => {
  try {
    const result = await db.query(
      `SELECT 
        a.*,
        u.full_name as farmer_name
      FROM animals a
      LEFT JOIN users u ON a.farmer_id = u.id
      WHERE a.id = ? AND a.is_deleted = 0
        AND u.district_id = (SELECT district_id FROM users WHERE id = ?)`,
      [id, vetId]
    );

    const row = extractSingleRow(result);

    if (!row) {
      throw new Error('Animal not found or not in your district');
    }

    return {
      id: row.id.toString(),
      name: row.name,
      category: row.category,
      breed: row.breed || '',
      age: row.age || 0,
      weight: row.weight || 0,
      health_status: row.health_status || 'healthy',
      notes: row.notes || '',
      farmer_id: row.farmer_id.toString(),
      farmer_name: row.farmer_name,
      created_at: row.created_at,
      updated_at: row.updated_at,
    };
  } catch (error) {
    console.error('❌ getAnimalByVet error:', error);
    throw error;
  }
};

/**
 * =========================
 * HELPER FUNCTIONS
 * =========================
 */

export const getHealthStatusColor = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'healthy': return '#4CAF50';
    case 'sick': return '#f44336';
    case 'recovering': return '#FF9800';
    case 'under_treatment': return '#2196F3';
    case 'critical': return '#D32F2F';
    case 'deceased': return '#757575';
    case 'quarantined': return '#9C27B0';
    default: return '#999';
  }
};

export const getHealthStatusIcon = (status: string): string => {
  switch (status?.toLowerCase()) {
    case 'healthy': return 'checkmark-circle-outline';
    case 'sick': return 'warning-outline';
    case 'recovering': return 'fitness-outline';
    case 'under_treatment': return 'medkit-outline';
    case 'critical': return 'alert-circle-outline';
    case 'deceased': return 'sad-outline';
    case 'quarantined': return 'lock-closed-outline';
    default: return 'help-outline';
  }
};

export const getCategoryIcon = (category: string): string => {
  switch (category?.toLowerCase()) {
    case 'cow': return '🐄';
    case 'goat': return '🐐';
    case 'sheep': return '🐑';
    case 'pig': return '🐷';
    case 'chicken': return '🐔';
    case 'rabbit': return '🐰';
    case 'horse': return '🐴';
    case 'duck': return '🦆';
    case 'turkey': return '🦃';
    default: return '🐾';
  }
};

export const getAnimalCategoryEmoji = (category: string): string => {
  return getCategoryIcon(category);
};

export const validateAnimal = (data: Partial<CreateAnimalPayload>): { valid: boolean; errors: string[] } => {
  const errors: string[] = [];
  
  if (!data.name || data.name.trim().length < 2) {
    errors.push('Animal name must be at least 2 characters');
  }
  
  if (!data.category) {
    errors.push('Category is required');
  }
  
  if (data.age !== undefined && (isNaN(data.age) || data.age < 0)) {
    errors.push('Age must be a positive number');
  }
  
  if (data.weight !== undefined && (isNaN(data.weight) || data.weight < 0)) {
    errors.push('Weight must be a positive number');
  }
  
  return {
    valid: errors.length === 0,
    errors,
  };
};

// Export all functions as a service object
const animalService = {
  getAnimals,
  getAnimalById,
  createAnimal,
  updateAnimal,
  updateAnimalHealth,
  deleteAnimal,
  getVetAnimals,
  getAnimalByVet,
  getAnimalStats,
  getHealthStatusColor,
  getHealthStatusIcon,
  getCategoryIcon,
  getAnimalCategoryEmoji,
  validateAnimal,
};

export default animalService;