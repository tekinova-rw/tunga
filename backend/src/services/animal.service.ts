// ============================================================
// FILE: backend/src/services/animal.service.ts
// DESCRIPTION: Animal service for managing livestock animals
// ============================================================

import { db } from '../config/db';
import { extractRows, extractSingleRow, extractInsertId, getAffectedRows } from './db-helpers';

/**
 * =========================
 * TYPES
 * =========================
 */

export type Animal = {
  id: number;
  farmer_id: number;
  name: string;
  category: string;
  breed: string | null;
  gender: 'male' | 'female' | null;
  birth_date: Date | null;
  age: number | null;
  weight: number | null;
  color: string | null;
  identification_tag: string | null;
  photo_url: string | null;
  health_status: string;
  vaccination_status: string;
  is_pregnant: number;
  expected_delivery_date: Date | null;
  is_deleted: number;
  deleted_at: Date | null;
  notes: string | null;
  created_at: Date;
  updated_at: Date;
  farmer_name?: string;
  farmer_phone?: string;
  district_name?: string;
};

export type CreateAnimalData = {
  farmer_id: number;
  name: string;
  category: string;
  breed?: string | null;
  gender?: 'male' | 'female' | null;
  birth_date?: Date | null;
  age?: number | null;
  weight?: number | null;
  color?: string | null;
  identification_tag?: string | null;
  photo_url?: string | null;
  health_status?: string;
  vaccination_status?: string;
  is_pregnant?: boolean;
  expected_delivery_date?: Date | null;
  notes?: string | null;
};

export type UpdateAnimalData = Partial<CreateAnimalData>;

export type AnimalFilter = {
  farmer_id?: number;
  district_id?: number;
  category?: string;
  health_status?: string;
  search?: string;
  page?: number;
  limit?: number;
};

/**
 * =========================
 * ANIMAL CRUD OPERATIONS
 * =========================
 */

/**
 * Get animals with filters
 */
export async function getAnimals(filter: AnimalFilter = {}): Promise<{ data: Animal[]; total: number }> {
  try {
    const { farmer_id, district_id, category, health_status, search, page = 1, limit = 10 } = filter;

    let query = `
      SELECT 
        a.*,
        u.full_name as farmer_name,
        u.phone as farmer_phone,
        d.name as district_name
      FROM animals a
      LEFT JOIN users u ON a.farmer_id = u.id
      LEFT JOIN districts d ON u.district_id = d.id
      WHERE a.is_deleted = 0
    `;

    const params: any[] = [];

    if (farmer_id) {
      query += ' AND a.farmer_id = ?';
      params.push(farmer_id);
    }

    if (district_id) {
      query += ' AND u.district_id = ?';
      params.push(district_id);
    }

    if (category) {
      query += ' AND a.category = ?';
      params.push(category);
    }

    if (health_status) {
      query += ' AND a.health_status = ?';
      params.push(health_status);
    }

    if (search) {
      query += ' AND (a.name LIKE ? OR a.breed LIKE ? OR a.identification_tag LIKE ?)';
      const searchTerm = `%${search}%`;
      params.push(searchTerm, searchTerm, searchTerm);
    }

    // Get total count
    const countQuery = query.replace(
      /SELECT .*? FROM/,
      'SELECT COUNT(*) as total FROM'
    );
    const countResult = await db.query(countQuery, params);
    const countRow = extractSingleRow(countResult);
    const total = countRow?.total || 0;

    // Add pagination
    const offset = (page - 1) * limit;
    query += ' ORDER BY a.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.query(query, params);
    const rows = extractRows(result);

    return { data: rows, total };
  } catch (error) {
    console.error('❌ getAnimals error:', error);
    throw error;
  }
}

/**
 * Get animal by ID
 */
export async function getAnimalById(id: number): Promise<Animal | null> {
  try {
    const result = await db.query(
      `SELECT 
        a.*,
        u.full_name as farmer_name,
        u.phone as farmer_phone,
        u.email as farmer_email,
        d.name as district_name
      FROM animals a
      LEFT JOIN users u ON a.farmer_id = u.id
      LEFT JOIN districts d ON u.district_id = d.id
      WHERE a.id = ? AND a.is_deleted = 0`,
      [id]
    );
    return extractSingleRow(result);
  } catch (error) {
    console.error('❌ getAnimalById error:', error);
    throw error;
  }
}

/**
 * Get animals by farmer ID
 */
export async function getAnimalsByFarmer(farmerId: number): Promise<Animal[]> {
  try {
    const result = await db.query(
      `SELECT * FROM animals WHERE farmer_id = ? AND is_deleted = 0 ORDER BY created_at DESC`,
      [farmerId]
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getAnimalsByFarmer error:', error);
    throw error;
  }
}

/**
 * Create animal
 */
export async function createAnimal(data: CreateAnimalData): Promise<number> {
  try {
    const {
      farmer_id,
      name,
      category,
      breed = null,
      gender = null,
      birth_date = null,
      age = null,
      weight = null,
      color = null,
      identification_tag = null,
      photo_url = null,
      health_status = 'healthy',
      vaccination_status = 'not_vaccinated',
      is_pregnant = false,
      expected_delivery_date = null,
      notes = null,
    } = data;

    const result = await db.query(
      `INSERT INTO animals (
        farmer_id,
        name,
        category,
        breed,
        gender,
        birth_date,
        age,
        weight,
        color,
        identification_tag,
        photo_url,
        health_status,
        vaccination_status,
        is_pregnant,
        expected_delivery_date,
        notes,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        farmer_id,
        name,
        category,
        breed,
        gender,
        birth_date,
        age,
        weight,
        color,
        identification_tag,
        photo_url,
        health_status,
        vaccination_status,
        is_pregnant ? 1 : 0,
        expected_delivery_date,
        notes,
      ]
    );

    const newId = extractInsertId(result);

    // Update farmer's total animals count
    await db.query(
      'UPDATE farmer_profiles SET total_animals = total_animals + 1 WHERE user_id = ?',
      [farmer_id]
    );

    return newId;
  } catch (error) {
    console.error('❌ createAnimal error:', error);
    throw error;
  }
}

/**
 * Update animal
 */
export async function updateAnimal(id: number, data: UpdateAnimalData): Promise<boolean> {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    const fields = [
      'name',
      'category',
      'breed',
      'gender',
      'birth_date',
      'age',
      'weight',
      'color',
      'identification_tag',
      'photo_url',
      'health_status',
      'vaccination_status',
      'is_pregnant',
      'expected_delivery_date',
      'notes',
    ];

    for (const field of fields) {
      if (data[field as keyof UpdateAnimalData] !== undefined) {
        let value = data[field as keyof UpdateAnimalData];
        if (field === 'is_pregnant') {
          value = value ? 1 : 0;
        }
        updates.push(`${field} = ?`);
        values.push(value);
      }
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await db.query(
      `UPDATE animals SET ${updates.join(', ')} WHERE id = ? AND is_deleted = 0`,
      values
    );

    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ updateAnimal error:', error);
    throw error;
  }
}

/**
 * Update animal health status
 */
export async function updateAnimalHealth(id: number, health_status: string, notes?: string): Promise<boolean> {
  try {
    const noteText = notes ? `\n[Health Update] ${new Date().toISOString()}: ${notes}` : '';
    const result = await db.query(
      `UPDATE animals 
       SET health_status = ?, notes = CONCAT(IFNULL(notes, ''), ?), updated_at = NOW() 
       WHERE id = ? AND is_deleted = 0`,
      [health_status, noteText, id]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ updateAnimalHealth error:', error);
    throw error;
  }
}

/**
 * Delete animal (soft delete)
 */
export async function deleteAnimal(id: number): Promise<boolean> {
  try {
    // Get farmer_id before deleting
    const animal = await getAnimalById(id);
    if (!animal) return false;

    const result = await db.query(
      `UPDATE animals SET is_deleted = 1, deleted_at = NOW() WHERE id = ?`,
      [id]
    );

    const affectedRows = getAffectedRows(result);

    if (affectedRows > 0) {
      // Update farmer's total animals count
      await db.query(
        'UPDATE farmer_profiles SET total_animals = total_animals - 1 WHERE user_id = ? AND total_animals > 0',
        [animal.farmer_id]
      );
    }

    return affectedRows > 0;
  } catch (error) {
    console.error('❌ deleteAnimal error:', error);
    throw error;
  }
}

/**
 * Bulk delete animals
 */
export async function bulkDeleteAnimals(ids: number[], farmerId: number): Promise<number> {
  try {
    if (!ids || ids.length === 0) return 0;

    const placeholders = ids.map(() => '?').join(',');
    const result = await db.query(
      `UPDATE animals SET is_deleted = 1, deleted_at = NOW() 
       WHERE id IN (${placeholders}) AND farmer_id = ? AND is_deleted = 0`,
      [...ids, farmerId]
    );

    const affectedRows = getAffectedRows(result);

    if (affectedRows > 0) {
      await db.query(
        'UPDATE farmer_profiles SET total_animals = total_animals - ? WHERE user_id = ? AND total_animals >= ?',
        [affectedRows, farmerId, affectedRows]
      );
    }

    return affectedRows;
  } catch (error) {
    console.error('❌ bulkDeleteAnimals error:', error);
    throw error;
  }
}

/**
 * Get animal statistics
 */
export async function getAnimalStats(farmerId?: number, districtId?: number): Promise<any> {
  try {
    let query = `
      SELECT 
        COUNT(*) as total_animals,
        SUM(CASE WHEN health_status = 'healthy' THEN 1 ELSE 0 END) as healthy_count,
        SUM(CASE WHEN health_status = 'sick' THEN 1 ELSE 0 END) as sick_count,
        SUM(CASE WHEN health_status = 'recovering' THEN 1 ELSE 0 END) as recovering_count,
        SUM(CASE WHEN health_status = 'under_treatment' THEN 1 ELSE 0 END) as under_treatment_count,
        SUM(CASE WHEN health_status = 'critical' THEN 1 ELSE 0 END) as critical_count,
        SUM(CASE WHEN health_status = 'deceased' THEN 1 ELSE 0 END) as deceased_count,
        SUM(CASE WHEN health_status = 'quarantined' THEN 1 ELSE 0 END) as quarantined_count,
        SUM(CASE WHEN is_pregnant = 1 THEN 1 ELSE 0 END) as pregnant_count
      FROM animals
      WHERE is_deleted = 0
    `;

    const params: any[] = [];

    if (farmerId) {
      query += ' AND farmer_id = ?';
      params.push(farmerId);
    } else if (districtId) {
      query += ' AND farmer_id IN (SELECT id FROM users WHERE district_id = ?)';
      params.push(districtId);
    }

    const result = await db.query(query, params);
    const stats = extractSingleRow(result);

    // Get category breakdown
    let categoryQuery = `
      SELECT category, COUNT(*) as count
      FROM animals
      WHERE is_deleted = 0
    `;

    if (farmerId) {
      categoryQuery += ' AND farmer_id = ?';
    } else if (districtId) {
      categoryQuery += ' AND farmer_id IN (SELECT id FROM users WHERE district_id = ?)';
    }

    categoryQuery += ' GROUP BY category ORDER BY count DESC';

    const categoryResult = await db.query(categoryQuery, params);
    const categories = extractRows(categoryResult);

    const byCategory: Record<string, number> = {};
    categories.forEach((c: any) => {
      byCategory[c.category] = c.count;
    });

    return {
      ...stats,
      by_category: byCategory,
    };
  } catch (error) {
    console.error('❌ getAnimalStats error:', error);
    throw error;
  }
}

// Export all functions as a service object
const animalService = {
  getAnimals,
  getAnimalById,
  getAnimalsByFarmer,
  createAnimal,
  updateAnimal,
  updateAnimalHealth,
  deleteAnimal,
  bulkDeleteAnimals,
  getAnimalStats,
};

export default animalService;