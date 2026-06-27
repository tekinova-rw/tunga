// ============================================================
// FILE: backend/src/services/request.service.ts
// DESCRIPTION: Service request service for managing vet service requests
// ============================================================

import { db } from '../config/db';
import { 
  extractRows, 
  extractSingleRow, 
  extractInsertId, 
  getAffectedRows 
} from './db-helpers';

/**
 * =========================
 * TYPES
 * =========================
 */

export type ServiceRequest = {
  id: number;
  farmer_id: number;
  animal_id: number;
  veterinarian_id: number | null;
  request_type: string;
  description: string;
  photo_url: string | null;
  priority: string;
  status: string;
  preferred_date: Date | null;
  completed_at: Date | null;
  created_at: Date;
  updated_at: Date;
  farmer_name?: string;
  farmer_phone?: string;
  animal_name?: string;
  animal_category?: string;
  veterinarian_name?: string;
  veterinarian_phone?: string;
  district_name?: string;
};

export type CreateRequestData = {
  farmer_id: number;
  animal_id: number;
  veterinarian_id?: number | null;
  request_type: string;
  description: string;
  photo_url?: string | null;
  priority?: string;
  preferred_date?: Date | null;
};

export type UpdateRequestData = {
  status?: string;
  veterinarian_id?: number | null;
  description?: string;
  priority?: string;
  preferred_date?: Date | null;
};

export type RequestFilter = {
  farmer_id?: number;
  veterinarian_id?: number;
  district_id?: number;
  status?: string;
  priority?: string;
  request_type?: string;
  page?: number;
  limit?: number;
};

/**
 * =========================
 * REQUEST CRUD OPERATIONS
 * =========================
 */

/**
 * Get service requests with filters
 */
export async function getRequests(filter: RequestFilter = {}): Promise<{ data: ServiceRequest[]; total: number }> {
  try {
    const {
      farmer_id,
      veterinarian_id,
      district_id,
      status,
      priority,
      request_type,
      page = 1,
      limit = 10,
    } = filter;

    let query = `
      SELECT 
        sr.*,
        u.full_name as farmer_name,
        u.phone as farmer_phone,
        a.name as animal_name,
        a.category as animal_category,
        v.full_name as veterinarian_name,
        v.phone as veterinarian_phone,
        d.name as district_name
      FROM service_requests sr
      LEFT JOIN users u ON sr.farmer_id = u.id
      LEFT JOIN animals a ON sr.animal_id = a.id
      LEFT JOIN users v ON sr.veterinarian_id = v.id
      LEFT JOIN users farmer ON sr.farmer_id = farmer.id
      LEFT JOIN districts d ON farmer.district_id = d.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (farmer_id) {
      query += ' AND sr.farmer_id = ?';
      params.push(farmer_id);
    }

    if (veterinarian_id) {
      query += ' AND sr.veterinarian_id = ?';
      params.push(veterinarian_id);
    }

    if (district_id) {
      query += ' AND farmer.district_id = ?';
      params.push(district_id);
    }

    if (status) {
      query += ' AND sr.status = ?';
      params.push(status);
    }

    if (priority) {
      query += ' AND sr.priority = ?';
      params.push(priority);
    }

    if (request_type) {
      query += ' AND sr.request_type = ?';
      params.push(request_type);
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
    query += ' ORDER BY sr.created_at DESC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.query(query, params);
    const rows = extractRows(result);

    return { data: rows, total };
  } catch (error) {
    console.error('❌ getRequests error:', error);
    throw error;
  }
}

/**
 * Get service request by ID
 */
export async function getRequestById(id: number): Promise<ServiceRequest | null> {
  try {
    const result = await db.query(
      `SELECT 
        sr.*,
        u.full_name as farmer_name,
        u.phone as farmer_phone,
        u.email as farmer_email,
        a.name as animal_name,
        a.category as animal_category,
        a.breed as animal_breed,
        a.gender as animal_gender,
        a.age as animal_age,
        v.full_name as veterinarian_name,
        v.phone as veterinarian_phone,
        v.email as veterinarian_email,
        d.name as district_name,
        d.province as province
      FROM service_requests sr
      LEFT JOIN users u ON sr.farmer_id = u.id
      LEFT JOIN animals a ON sr.animal_id = a.id
      LEFT JOIN users v ON sr.veterinarian_id = v.id
      LEFT JOIN users farmer ON sr.farmer_id = farmer.id
      LEFT JOIN districts d ON farmer.district_id = d.id
      WHERE sr.id = ?`,
      [id]
    );
    return extractSingleRow(result);
  } catch (error) {
    console.error('❌ getRequestById error:', error);
    throw error;
  }
}

/**
 * Get requests by farmer ID
 */
export async function getRequestsByFarmer(farmerId: number): Promise<ServiceRequest[]> {
  try {
    const result = await db.query(
      `SELECT 
        sr.*,
        a.name as animal_name,
        a.category as animal_category,
        v.full_name as veterinarian_name
      FROM service_requests sr
      LEFT JOIN animals a ON sr.animal_id = a.id
      LEFT JOIN users v ON sr.veterinarian_id = v.id
      WHERE sr.farmer_id = ?
      ORDER BY sr.created_at DESC`,
      [farmerId]
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getRequestsByFarmer error:', error);
    throw error;
  }
}

/**
 * Get requests by veterinarian ID
 */
export async function getRequestsByVeterinarian(veterinarianId: number): Promise<ServiceRequest[]> {
  try {
    const result = await db.query(
      `SELECT 
        sr.*,
        u.full_name as farmer_name,
        a.name as animal_name,
        a.category as animal_category
      FROM service_requests sr
      LEFT JOIN users u ON sr.farmer_id = u.id
      LEFT JOIN animals a ON sr.animal_id = a.id
      WHERE sr.veterinarian_id = ?
      ORDER BY sr.created_at DESC`,
      [veterinarianId]
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getRequestsByVeterinarian error:', error);
    throw error;
  }
}

/**
 * Create service request
 */
export async function createRequest(data: CreateRequestData): Promise<number> {
  try {
    const {
      farmer_id,
      animal_id,
      veterinarian_id = null,
      request_type,
      description,
      photo_url = null,
      priority = 'normal',
      preferred_date = null,
    } = data;

    // Validate request type
    const validTypes = ['treatment', 'vaccination', 'insemination', 'pregnancy_diagnosis', 'assisted_delivery', 'consultation', 'emergency'];
    if (!validTypes.includes(request_type)) {
      throw new Error('Invalid request type');
    }

    // Validate priority
    const validPriorities = ['normal', 'urgent', 'emergency'];
    if (!validPriorities.includes(priority)) {
      throw new Error('Invalid priority');
    }

    const result = await db.query(
      `INSERT INTO service_requests (
        farmer_id,
        animal_id,
        veterinarian_id,
        request_type,
        description,
        photo_url,
        priority,
        preferred_date,
        status,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'pending', NOW(), NOW())`,
      [
        farmer_id,
        animal_id,
        veterinarian_id,
        request_type,
        description,
        photo_url,
        priority,
        preferred_date,
      ]
    );

    return extractInsertId(result);
  } catch (error) {
    console.error('❌ createRequest error:', error);
    throw error;
  }
}

/**
 * Update service request
 */
export async function updateRequest(id: number, data: UpdateRequestData): Promise<boolean> {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
      
      // If status is 'completed', set completed_at
      if (data.status === 'completed') {
        updates.push('completed_at = NOW()');
      }
    }

    if (data.veterinarian_id !== undefined) {
      updates.push('veterinarian_id = ?');
      values.push(data.veterinarian_id);
    }

    if (data.description !== undefined) {
      updates.push('description = ?');
      values.push(data.description);
    }

    if (data.priority !== undefined) {
      updates.push('priority = ?');
      values.push(data.priority);
    }

    if (data.preferred_date !== undefined) {
      updates.push('preferred_date = ?');
      values.push(data.preferred_date);
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await db.query(
      `UPDATE service_requests SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ updateRequest error:', error);
    throw error;
  }
}

/**
 * Update request status
 */
export async function updateRequestStatus(id: number, status: string): Promise<boolean> {
  try {
    const validStatuses = ['pending', 'accepted', 'in_progress', 'completed', 'cancelled'];
    if (!validStatuses.includes(status)) {
      throw new Error('Invalid status');
    }

    let query = 'UPDATE service_requests SET status = ?, updated_at = NOW()';
    const params: any[] = [status];

    if (status === 'completed') {
      query += ', completed_at = NOW()';
    }

    query += ' WHERE id = ?';
    params.push(id);

    const result = await db.query(query, params);
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ updateRequestStatus error:', error);
    throw error;
  }
}

/**
 * Assign veterinarian to request
 */
export async function assignVeterinarian(requestId: number, veterinarianId: number): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE service_requests 
       SET veterinarian_id = ?, updated_at = NOW() 
       WHERE id = ? AND status IN ('pending', 'accepted')`,
      [veterinarianId, requestId]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ assignVeterinarian error:', error);
    throw error;
  }
}

/**
 * Accept request (by veterinarian)
 */
export async function acceptRequest(id: number, veterinarianId: number): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE service_requests 
       SET status = 'accepted', veterinarian_id = ?, updated_at = NOW() 
       WHERE id = ? AND status = 'pending'`,
      [veterinarianId, id]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ acceptRequest error:', error);
    throw error;
  }
}

/**
 * Start request (mark as in progress)
 */
export async function startRequest(id: number): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE service_requests 
       SET status = 'in_progress', updated_at = NOW() 
       WHERE id = ? AND status = 'accepted'`,
      [id]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ startRequest error:', error);
    throw error;
  }
}

/**
 * Complete request
 */
export async function completeRequest(id: number): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE service_requests 
       SET status = 'completed', completed_at = NOW(), updated_at = NOW() 
       WHERE id = ? AND status IN ('in_progress', 'accepted')`,
      [id]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ completeRequest error:', error);
    throw error;
  }
}

/**
 * Cancel request
 */
export async function cancelRequest(id: number): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE service_requests 
       SET status = 'cancelled', updated_at = NOW() 
       WHERE id = ? AND status IN ('pending', 'accepted')`,
      [id]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ cancelRequest error:', error);
    throw error;
  }
}

/**
 * Delete service request (hard delete)
 */
export async function deleteRequest(id: number): Promise<boolean> {
  try {
    const result = await db.query(
      `DELETE FROM service_requests WHERE id = ? AND status IN ('pending', 'cancelled')`,
      [id]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ deleteRequest error:', error);
    throw error;
  }
}

/**
 * Get request statistics
 */
export async function getRequestStats(farmerId?: number, veterinarianId?: number, districtId?: number): Promise<any> {
  try {
    let query = `
      SELECT 
        COUNT(*) as total_requests,
        SUM(CASE WHEN status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN status = 'accepted' THEN 1 ELSE 0 END) as accepted_count,
        SUM(CASE WHEN status = 'in_progress' THEN 1 ELSE 0 END) as in_progress_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN priority = 'normal' THEN 1 ELSE 0 END) as normal_priority,
        SUM(CASE WHEN priority = 'urgent' THEN 1 ELSE 0 END) as urgent_priority,
        SUM(CASE WHEN priority = 'emergency' THEN 1 ELSE 0 END) as emergency_priority,
        SUM(CASE WHEN request_type = 'treatment' THEN 1 ELSE 0 END) as treatment_count,
        SUM(CASE WHEN request_type = 'vaccination' THEN 1 ELSE 0 END) as vaccination_count,
        SUM(CASE WHEN request_type = 'consultation' THEN 1 ELSE 0 END) as consultation_count,
        SUM(CASE WHEN request_type = 'emergency' THEN 1 ELSE 0 END) as emergency_count
      FROM service_requests sr
      LEFT JOIN users farmer ON sr.farmer_id = farmer.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (farmerId) {
      query += ' AND sr.farmer_id = ?';
      params.push(farmerId);
    }

    if (veterinarianId) {
      query += ' AND sr.veterinarian_id = ?';
      params.push(veterinarianId);
    }

    if (districtId) {
      query += ' AND farmer.district_id = ?';
      params.push(districtId);
    }

    const result = await db.query(query, params);
    return extractSingleRow(result) || {
      total_requests: 0,
      pending_count: 0,
      accepted_count: 0,
      in_progress_count: 0,
      completed_count: 0,
      cancelled_count: 0,
      normal_priority: 0,
      urgent_priority: 0,
      emergency_priority: 0,
      treatment_count: 0,
      vaccination_count: 0,
      consultation_count: 0,
      emergency_count: 0,
    };
  } catch (error) {
    console.error('❌ getRequestStats error:', error);
    throw error;
  }
}

/**
 * Get requests by status
 */
export async function getRequestsByStatus(status: string, limit?: number): Promise<ServiceRequest[]> {
  try {
    let query = `
      SELECT 
        sr.*,
        u.full_name as farmer_name,
        a.name as animal_name,
        v.full_name as veterinarian_name
      FROM service_requests sr
      LEFT JOIN users u ON sr.farmer_id = u.id
      LEFT JOIN animals a ON sr.animal_id = a.id
      LEFT JOIN users v ON sr.veterinarian_id = v.id
      WHERE sr.status = ?
      ORDER BY sr.created_at DESC
    `;

    const params: any[] = [status];

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const result = await db.query(query, params);
    return extractRows(result);
  } catch (error) {
    console.error('❌ getRequestsByStatus error:', error);
    throw error;
  }
}

/**
 * Get pending requests (for veterinarians)
 */
export async function getPendingRequests(districtId?: number, limit?: number): Promise<ServiceRequest[]> {
  try {
    let query = `
      SELECT 
        sr.*,
        u.full_name as farmer_name,
        u.phone as farmer_phone,
        a.name as animal_name,
        a.category as animal_category
      FROM service_requests sr
      LEFT JOIN users u ON sr.farmer_id = u.id
      LEFT JOIN animals a ON sr.animal_id = a.id
      WHERE sr.status = 'pending'
    `;

    const params: any[] = [];

    if (districtId) {
      query += ' AND u.district_id = ?';
      params.push(districtId);
    }

    query += ' ORDER BY sr.priority DESC, sr.created_at ASC';

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const result = await db.query(query, params);
    return extractRows(result);
  } catch (error) {
    console.error('❌ getPendingRequests error:', error);
    throw error;
  }
}

/**
 * Get requests by date range
 */
export async function getRequestsByDateRange(startDate: Date, endDate: Date, farmerId?: number): Promise<ServiceRequest[]> {
  try {
    let query = `
      SELECT 
        sr.*,
        u.full_name as farmer_name,
        a.name as animal_name
      FROM service_requests sr
      LEFT JOIN users u ON sr.farmer_id = u.id
      LEFT JOIN animals a ON sr.animal_id = a.id
      WHERE sr.created_at BETWEEN ? AND ?
    `;

    const params: any[] = [startDate, endDate];

    if (farmerId) {
      query += ' AND sr.farmer_id = ?';
      params.push(farmerId);
    }

    query += ' ORDER BY sr.created_at DESC';

    const result = await db.query(query, params);
    return extractRows(result);
  } catch (error) {
    console.error('❌ getRequestsByDateRange error:', error);
    throw error;
  }
}

/**
 * Get request count by district
 */
export async function getRequestCountByDistrict(): Promise<any[]> {
  try {
    const result = await db.query(`
      SELECT 
        d.id,
        d.name,
        d.province,
        COUNT(sr.id) as total_requests,
        SUM(CASE WHEN sr.status = 'pending' THEN 1 ELSE 0 END) as pending_count,
        SUM(CASE WHEN sr.status = 'completed' THEN 1 ELSE 0 END) as completed_count
      FROM districts d
      LEFT JOIN users u ON u.district_id = d.id
      LEFT JOIN service_requests sr ON sr.farmer_id = u.id
      GROUP BY d.id, d.name, d.province
      ORDER BY total_requests DESC
    `);
    return extractRows(result);
  } catch (error) {
    console.error('❌ getRequestCountByDistrict error:', error);
    throw error;
  }
}

// Export all functions as a service object
const requestService = {
  getRequests,
  getRequestById,
  getRequestsByFarmer,
  getRequestsByVeterinarian,
  createRequest,
  updateRequest,
  updateRequestStatus,
  assignVeterinarian,
  acceptRequest,
  startRequest,
  completeRequest,
  cancelRequest,
  deleteRequest,
  getRequestStats,
  getRequestsByStatus,
  getPendingRequests,
  getRequestsByDateRange,
  getRequestCountByDistrict,
};

export default requestService;