// ============================================================
// FILE: backend/src/services/district.service.ts
// DESCRIPTION: District service for managing districts
// ============================================================

import { db } from '../config/db';

/**
 * =========================
 * TYPES
 * =========================
 */

export type District = {
  id: number;
  name: string;
  province: string;
  created_at: Date;
};

// Helper to extract rows
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

const extractSingleRow = (result: any): any => {
  const rows = extractRows(result);
  return rows.length > 0 ? rows[0] : null;
};

/**
 * Get all districts
 */
export async function getAllDistricts(): Promise<District[]> {
  try {
    const result = await db.query(
      `SELECT * FROM districts ORDER BY province, name`
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getAllDistricts error:', error);
    throw error;
  }
}

/**
 * Get district by ID
 */
export async function getDistrictById(id: number): Promise<District | null> {
  try {
    const result = await db.query(
      `SELECT * FROM districts WHERE id = ?`,
      [id]
    );
    return extractSingleRow(result);
  } catch (error) {
    console.error('❌ getDistrictById error:', error);
    throw error;
  }
}

/**
 * Get districts by province
 */
export async function getDistrictsByProvince(province: string): Promise<District[]> {
  try {
    const result = await db.query(
      `SELECT * FROM districts WHERE province = ? ORDER BY name`,
      [province]
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getDistrictsByProvince error:', error);
    throw error;
  }
}

/**
 * Get all provinces
 */
export async function getAllProvinces(): Promise<string[]> {
  try {
    const result = await db.query(
      `SELECT DISTINCT province FROM districts ORDER BY province`
    );
    const rows = extractRows(result);
    return rows.map((r: any) => r.province);
  } catch (error) {
    console.error('❌ getAllProvinces error:', error);
    throw error;
  }
}

/**
 * Get district stats
 */
export async function getDistrictStats(): Promise<any[]> {
  try {
    const result = await db.query(`
      SELECT 
        d.id,
        d.name,
        d.province,
        COUNT(DISTINCT u.id) as total_users,
        SUM(CASE WHEN u.role = 'farmer' THEN 1 ELSE 0 END) as total_farmers,
        SUM(CASE WHEN u.role = 'veterinarian' THEN 1 ELSE 0 END) as total_vets,
        SUM(CASE WHEN u.role = 'district_admin' THEN 1 ELSE 0 END) as total_admins,
        SUM(CASE WHEN u.status = 'pending' THEN 1 ELSE 0 END) as pending_users,
        SUM(CASE WHEN u.status = 'active' THEN 1 ELSE 0 END) as active_users
      FROM districts d
      LEFT JOIN users u ON u.district_id = d.id AND u.is_deleted = 0
      GROUP BY d.id, d.name, d.province
      ORDER BY d.name
    `);
    return extractRows(result);
  } catch (error) {
    console.error('❌ getDistrictStats error:', error);
    throw error;
  }
}

// Export all functions as a service object
const districtService = {
  getAllDistricts,
  getDistrictById,
  getDistrictsByProvince,
  getAllProvinces,
  getDistrictStats,
};

export default districtService;