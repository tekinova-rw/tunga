// backend/src/controllers/animal.controller.ts
import { Response } from 'express';
import { db } from '../config/db';
import { AuthRequest } from '../middleware/auth.middleware';

/**
 * =========================
 * HELPER FUNCTIONS
 * =========================
 */
const isFarmer = (user: any) => user?.role === 'farmer';
const isVeterinarian = (user: any) => user?.role === 'veterinarian';
const isAdmin = (user: any) => user?.role === 'super_admin' || user?.role === 'district_admin';

/**
 * =========================
 * GET ALL ANIMALS (SCOPED BY ROLE)
 * =========================
 */
export const getAnimals = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let query = `
      SELECT a.*, u.full_name as farmer_name
      FROM animals a
      JOIN users u ON a.farmer_id = u.id
      WHERE a.is_deleted = 0
    `;
    const params: any[] = [];

    // Farmers see only their animals
    if (isFarmer(user)) {
      query += ' AND a.farmer_id = ?';
      params.push(user.id);
    }
    // Veterinarians see animals in their district
    else if (isVeterinarian(user)) {
      query += ' AND u.district_id = ?';
      params.push(user.district_id);
    }
    // Admins see all animals (no filter)

    query += ' ORDER BY a.created_at DESC';

    const [animals]: any = await db.query(query, params);

    return res.json({
      success: true,
      data: animals,
    });
  } catch (error) {
    console.error('Get animals error:', error);
    return res.status(500).json({ message: 'Failed to fetch animals' });
  }
};

/**
 * =========================
 * GET MY ANIMALS (FARMER ONLY)
 * =========================
 */
export const getMyAnimals = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user || !isFarmer(user)) {
      return res.status(403).json({ message: 'Only farmers can access their animals' });
    }

    const [animals]: any = await db.query(
      `SELECT * FROM animals 
       WHERE farmer_id = ? AND is_deleted = 0 
       ORDER BY created_at DESC`,
      [user.id]
    );

    return res.json({
      success: true,
      data: animals,
    });
  } catch (error) {
    console.error('Get my animals error:', error);
    return res.status(500).json({ message: 'Failed to fetch animals' });
  }
};

/**
 * =========================
 * GET ANIMAL BY ID
 * =========================
 */
export const getAnimalById = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [animals]: any = await db.query(
      `SELECT a.*, u.full_name as farmer_name, u.phone as farmer_phone
       FROM animals a
       JOIN users u ON a.farmer_id = u.id
       WHERE a.id = ? AND a.is_deleted = 0`,
      [id]
    );

    if (animals.length === 0) {
      return res.status(404).json({ message: 'Animal not found' });
    }

    const animal = animals[0];

    // Check permissions
    if (isFarmer(user) && animal.farmer_id !== user.id) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (isVeterinarian(user) && animal.district_id !== user.district_id) {
      return res.status(403).json({ message: 'Access denied - outside your district' });
    }

    return res.json({
      success: true,
      data: animal,
    });
  } catch (error) {
    console.error('Get animal by id error:', error);
    return res.status(500).json({ message: 'Failed to fetch animal' });
  }
};

/**
 * =========================
 * CREATE ANIMAL
 * =========================
 */
export const createAnimal = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const {
      name,
      category,
      breed,
      age,
      weight,
      health_status,
      notes,
    } = req.body;

    if (!user || !isFarmer(user)) {
      return res.status(403).json({ message: 'Only farmers can add animals' });
    }

    if (!name || !category) {
      return res.status(400).json({ message: 'Name and category are required' });
    }

    const [result]: any = await db.query(
      `INSERT INTO animals (
        farmer_id, name, category, breed, age, weight, 
        health_status, notes, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, NOW(), NOW())`,
      [
        user.id,
        name,
        category,
        breed || null,
        age || null,
        weight || null,
        health_status || 'healthy',
        notes || null,
      ]
    );

    const [newAnimal]: any = await db.query(
      `SELECT * FROM animals WHERE id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Animal added successfully',
      data: newAnimal[0],
    });
  } catch (error) {
    console.error('Create animal error:', error);
    return res.status(500).json({ message: 'Failed to add animal' });
  }
};

/**
 * =========================
 * UPDATE ANIMAL
 * =========================
 */
export const updateAnimal = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const updates = req.body;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Check if animal exists and get permissions
    const [animals]: any = await db.query(
      `SELECT a.*, u.district_id as farmer_district 
       FROM animals a
       JOIN users u ON a.farmer_id = u.id
       WHERE a.id = ? AND a.is_deleted = 0`,
      [id]
    );

    if (animals.length === 0) {
      return res.status(404).json({ message: 'Animal not found' });
    }

    const animal = animals[0];

    // Permission checks
    const canUpdate = 
      isFarmer(user) && animal.farmer_id === user.id || // Owner
      isVeterinarian(user) || // Vets can update health status
      isAdmin(user); // Admins can update anything

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Build update query
    const allowedFields = ['name', 'category', 'breed', 'age', 'weight', 'health_status', 'notes'];
    const updateFields: string[] = [];
    const updateValues: any[] = [];

    for (const field of allowedFields) {
      if (updates[field] !== undefined) {
        updateFields.push(`${field} = ?`);
        updateValues.push(updates[field]);
      }
    }

    if (updateFields.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updateValues.push(id);
    await db.query(
      `UPDATE animals SET ${updateFields.join(', ')}, updated_at = NOW() WHERE id = ?`,
      updateValues
    );

    const [updatedAnimal]: any = await db.query(
      `SELECT * FROM animals WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Animal updated successfully',
      data: updatedAnimal[0],
    });
  } catch (error) {
    console.error('Update animal error:', error);
    return res.status(500).json({ message: 'Failed to update animal' });
  }
};

/**
 * =========================
 * UPDATE ANIMAL HEALTH STATUS
 * =========================
 */
export const updateAnimalHealth = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { health_status, notes } = req.body;

    if (!user || !isVeterinarian(user)) {
      return res.status(403).json({ message: 'Only veterinarians can update health status' });
    }

    if (!health_status) {
      return res.status(400).json({ message: 'Health status is required' });
    }

    const [animals]: any = await db.query(
      `SELECT a.* FROM animals a
       JOIN users u ON a.farmer_id = u.id
       WHERE a.id = ? AND a.is_deleted = 0`,
      [id]
    );

    if (animals.length === 0) {
      return res.status(404).json({ message: 'Animal not found' });
    }

    await db.query(
      `UPDATE animals 
       SET health_status = ?, notes = CONCAT(notes, ?), updated_at = NOW() 
       WHERE id = ?`,
      [health_status, notes ? `\nVet note: ${notes}` : '', id]
    );

    return res.json({
      success: true,
      message: 'Health status updated successfully',
    });
  } catch (error) {
    console.error('Update health error:', error);
    return res.status(500).json({ message: 'Failed to update health status' });
  }
};

/**
 * =========================
 * DELETE ANIMAL
 * =========================
 */
export const deleteAnimal = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [animals]: any = await db.query(
      `SELECT * FROM animals WHERE id = ? AND is_deleted = 0`,
      [id]
    );

    if (animals.length === 0) {
      return res.status(404).json({ message: 'Animal not found' });
    }

    const animal = animals[0];

    // Farmers can delete their own, admins can delete any
    const canDelete = 
      (isFarmer(user) && animal.farmer_id === user.id) ||
      isAdmin(user);

    if (!canDelete) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Soft delete
    await db.query(
      `UPDATE animals SET is_deleted = 1, deleted_at = NOW() WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Animal deleted successfully',
    });
  } catch (error) {
    console.error('Delete animal error:', error);
    return res.status(500).json({ message: 'Failed to delete animal' });
  }
};

/**
 * =========================
 * GET ANIMAL STATISTICS
 * =========================
 */
export const getAnimalStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN health_status = 'healthy' THEN 1 END) as healthy,
        COUNT(CASE WHEN health_status = 'sick' THEN 1 END) as sick,
        COUNT(CASE WHEN health_status = 'recovering' THEN 1 END) as recovering,
        COUNT(CASE WHEN health_status = 'under_treatment' THEN 1 END) as under_treatment,
        COUNT(CASE WHEN category = 'cow' THEN 1 END) as cows,
        COUNT(CASE WHEN category = 'goat' THEN 1 END) as goats,
        COUNT(CASE WHEN category = 'sheep' THEN 1 END) as sheep,
        COUNT(CASE WHEN category = 'pig' THEN 1 END) as pigs,
        COUNT(CASE WHEN category = 'chicken' THEN 1 END) as chickens
      FROM animals a
      JOIN users u ON a.farmer_id = u.id
      WHERE a.is_deleted = 0
    `;
    const params: any[] = [];

    if (isFarmer(user)) {
      query += ' AND a.farmer_id = ?';
      params.push(user.id);
    } else if (isVeterinarian(user)) {
      query += ' AND u.district_id = ?';
      params.push(user.district_id);
    }

    const [stats]: any = await db.query(query, params);

    return res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error('Get animal stats error:', error);
    return res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};