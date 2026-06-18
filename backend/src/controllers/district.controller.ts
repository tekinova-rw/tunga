// backend/src/controllers/district.controller.ts
import { Request, Response } from 'express';
import { db } from '../config/db';

/**
 * GET ALL DISTRICTS
 */
export const getDistricts = async (
  _req: Request,
  res: Response
): Promise<void> => {
  try {
    const [rows]: any = await db.query(`
      SELECT
        id,
        name,
        province
      FROM districts
      ORDER BY name ASC
    `);

    res.status(200).json({
      success: true,
      count: rows.length,
      districts: rows,
    });
  } catch (error) {
    console.error('GET DISTRICTS ERROR:', error);

    res.status(500).json({
      success: false,
      message: 'Failed to fetch districts',
    });
  }
};