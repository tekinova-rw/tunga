// ============================================================
// FILE: backend/src/services/appointment.service.ts
// DESCRIPTION: Appointment service for managing vet appointments
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

export type Appointment = {
  id: number;
  farmer_id: number;
  veterinarian_id: number;
  animal_id: number | null;
  appointment_date: Date;
  appointment_time: string;
  reason: string;
  notes: string | null;
  appointment_type: string;
  status: string;
  diagnosis: string | null;
  treatment: string | null;
  prescription: string | null;
  completion_notes: string | null;
  cancellation_reason: string | null;
  reschedule_reason: string | null;
  created_by: number;
  created_at: Date;
  updated_at: Date;
  completed_at: Date | null;
  cancelled_at: Date | null;
  farmer_name?: string;
  farmer_phone?: string;
  veterinarian_name?: string;
  veterinarian_phone?: string;
  animal_name?: string;
  animal_category?: string;
  district_name?: string;
};

export type CreateAppointmentData = {
  farmer_id: number;
  veterinarian_id: number;
  animal_id?: number | null;
  appointment_date: Date;
  appointment_time: string;
  reason: string;
  notes?: string | null;
  appointment_type?: string;
  created_by: number;
};

export type UpdateAppointmentData = {
  appointment_date?: Date;
  appointment_time?: string;
  reason?: string;
  notes?: string | null;
  appointment_type?: string;
  status?: string;
  diagnosis?: string | null;
  treatment?: string | null;
  prescription?: string | null;
  completion_notes?: string | null;
  cancellation_reason?: string | null;
  reschedule_reason?: string | null;
};

export type AppointmentFilter = {
  farmer_id?: number;
  veterinarian_id?: number;
  district_id?: number;
  animal_id?: number;
  status?: string;
  appointment_type?: string;
  start_date?: Date;
  end_date?: Date;
  page?: number;
  limit?: number;
};

/**
 * =========================
 * APPOINTMENT CRUD OPERATIONS
 * =========================
 */

/**
 * Get appointments with filters
 */
export async function getAppointments(filter: AppointmentFilter = {}): Promise<{ data: Appointment[]; total: number }> {
  try {
    const {
      farmer_id,
      veterinarian_id,
      district_id,
      animal_id,
      status,
      appointment_type,
      start_date,
      end_date,
      page = 1,
      limit = 10,
    } = filter;

    let query = `
      SELECT 
        a.*,
        u.full_name as farmer_name,
        u.phone as farmer_phone,
        v.full_name as veterinarian_name,
        v.phone as veterinarian_phone,
        an.name as animal_name,
        an.category as animal_category,
        d.name as district_name
      FROM appointments a
      LEFT JOIN users u ON a.farmer_id = u.id
      LEFT JOIN users v ON a.veterinarian_id = v.id
      LEFT JOIN animals an ON a.animal_id = an.id
      LEFT JOIN users farmer ON a.farmer_id = farmer.id
      LEFT JOIN districts d ON farmer.district_id = d.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (farmer_id) {
      query += ' AND a.farmer_id = ?';
      params.push(farmer_id);
    }

    if (veterinarian_id) {
      query += ' AND a.veterinarian_id = ?';
      params.push(veterinarian_id);
    }

    if (district_id) {
      query += ' AND farmer.district_id = ?';
      params.push(district_id);
    }

    if (animal_id) {
      query += ' AND a.animal_id = ?';
      params.push(animal_id);
    }

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (appointment_type) {
      query += ' AND a.appointment_type = ?';
      params.push(appointment_type);
    }

    if (start_date) {
      query += ' AND a.appointment_date >= ?';
      params.push(start_date);
    }

    if (end_date) {
      query += ' AND a.appointment_date <= ?';
      params.push(end_date);
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
    query += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC LIMIT ? OFFSET ?';
    params.push(limit, offset);

    const result = await db.query(query, params);
    const rows = extractRows(result);

    return { data: rows, total };
  } catch (error) {
    console.error('❌ getAppointments error:', error);
    throw error;
  }
}

/**
 * Get appointment by ID
 */
export async function getAppointmentById(id: number): Promise<Appointment | null> {
  try {
    const result = await db.query(
      `SELECT 
        a.*,
        u.full_name as farmer_name,
        u.phone as farmer_phone,
        u.email as farmer_email,
        v.full_name as veterinarian_name,
        v.phone as veterinarian_phone,
        v.email as veterinarian_email,
        an.name as animal_name,
        an.category as animal_category,
        an.breed as animal_breed,
        d.name as district_name
      FROM appointments a
      LEFT JOIN users u ON a.farmer_id = u.id
      LEFT JOIN users v ON a.veterinarian_id = v.id
      LEFT JOIN animals an ON a.animal_id = an.id
      LEFT JOIN users farmer ON a.farmer_id = farmer.id
      LEFT JOIN districts d ON farmer.district_id = d.id
      WHERE a.id = ?`,
      [id]
    );
    return extractSingleRow(result);
  } catch (error) {
    console.error('❌ getAppointmentById error:', error);
    throw error;
  }
}

/**
 * Get appointments by farmer ID
 */
export async function getAppointmentsByFarmer(farmerId: number): Promise<Appointment[]> {
  try {
    const result = await db.query(
      `SELECT 
        a.*,
        v.full_name as veterinarian_name,
        v.phone as veterinarian_phone,
        an.name as animal_name
      FROM appointments a
      LEFT JOIN users v ON a.veterinarian_id = v.id
      LEFT JOIN animals an ON a.animal_id = an.id
      WHERE a.farmer_id = ?
      ORDER BY a.appointment_date DESC, a.appointment_time DESC`,
      [farmerId]
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getAppointmentsByFarmer error:', error);
    throw error;
  }
}

/**
 * Get appointments by veterinarian ID
 */
export async function getAppointmentsByVeterinarian(veterinarianId: number): Promise<Appointment[]> {
  try {
    const result = await db.query(
      `SELECT 
        a.*,
        u.full_name as farmer_name,
        u.phone as farmer_phone,
        an.name as animal_name
      FROM appointments a
      LEFT JOIN users u ON a.farmer_id = u.id
      LEFT JOIN animals an ON a.animal_id = an.id
      WHERE a.veterinarian_id = ?
      ORDER BY a.appointment_date ASC, a.appointment_time ASC`,
      [veterinarianId]
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getAppointmentsByVeterinarian error:', error);
    throw error;
  }
}

/**
 * Get upcoming appointments for a veterinarian
 */
export async function getUpcomingAppointments(veterinarianId: number, limit?: number): Promise<Appointment[]> {
  try {
    let query = `
      SELECT 
        a.*,
        u.full_name as farmer_name,
        u.phone as farmer_phone,
        an.name as animal_name
      FROM appointments a
      LEFT JOIN users u ON a.farmer_id = u.id
      LEFT JOIN animals an ON a.animal_id = an.id
      WHERE a.veterinarian_id = ?
        AND a.status = 'scheduled'
        AND a.appointment_date >= CURDATE()
      ORDER BY a.appointment_date ASC, a.appointment_time ASC
    `;

    const params: any[] = [veterinarianId];

    if (limit) {
      query += ' LIMIT ?';
      params.push(limit);
    }

    const result = await db.query(query, params);
    return extractRows(result);
  } catch (error) {
    console.error('❌ getUpcomingAppointments error:', error);
    throw error;
  }
}

/**
 * Get today's appointments for a veterinarian
 */
export async function getTodayAppointments(veterinarianId: number): Promise<Appointment[]> {
  try {
    const result = await db.query(
      `SELECT 
        a.*,
        u.full_name as farmer_name,
        u.phone as farmer_phone,
        an.name as animal_name
      FROM appointments a
      LEFT JOIN users u ON a.farmer_id = u.id
      LEFT JOIN animals an ON a.animal_id = an.id
      WHERE a.veterinarian_id = ?
        AND a.status = 'scheduled'
        AND a.appointment_date = CURDATE()
      ORDER BY a.appointment_time ASC`,
      [veterinarianId]
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getTodayAppointments error:', error);
    throw error;
  }
}

/**
 * Create appointment
 */
export async function createAppointment(data: CreateAppointmentData): Promise<number> {
  try {
    const {
      farmer_id,
      veterinarian_id,
      animal_id = null,
      appointment_date,
      appointment_time,
      reason,
      notes = null,
      appointment_type = 'consultation',
      created_by,
    } = data;

    // Validate appointment type
    const validTypes = ['consultation', 'treatment', 'vaccination', 'insemination', 'pregnancy_diagnosis', 'assisted_delivery', 'emergency'];
    if (!validTypes.includes(appointment_type)) {
      throw new Error('Invalid appointment type');
    }

    // Check for conflicting appointments
    const conflictCheck = await db.query(
      `SELECT id FROM appointments 
       WHERE veterinarian_id = ? 
         AND appointment_date = ? 
         AND appointment_time = ?
         AND status = 'scheduled'`,
      [veterinarian_id, appointment_date, appointment_time]
    );
    const conflicts = extractRows(conflictCheck);

    if (conflicts.length > 0) {
      throw new Error('The veterinarian already has an appointment at this time');
    }

    const result = await db.query(
      `INSERT INTO appointments (
        farmer_id,
        veterinarian_id,
        animal_id,
        appointment_date,
        appointment_time,
        reason,
        notes,
        appointment_type,
        status,
        created_by,
        created_at,
        updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW(), NOW())`,
      [
        farmer_id,
        veterinarian_id,
        animal_id,
        appointment_date,
        appointment_time,
        reason,
        notes,
        appointment_type,
        created_by,
      ]
    );

    return extractInsertId(result);
  } catch (error) {
    console.error('❌ createAppointment error:', error);
    throw error;
  }
}

/**
 * Update appointment
 */
export async function updateAppointment(id: number, data: UpdateAppointmentData): Promise<boolean> {
  try {
    const updates: string[] = [];
    const values: any[] = [];

    if (data.appointment_date !== undefined) {
      updates.push('appointment_date = ?');
      values.push(data.appointment_date);
    }

    if (data.appointment_time !== undefined) {
      updates.push('appointment_time = ?');
      values.push(data.appointment_time);
    }

    if (data.reason !== undefined) {
      updates.push('reason = ?');
      values.push(data.reason);
    }

    if (data.notes !== undefined) {
      updates.push('notes = ?');
      values.push(data.notes);
    }

    if (data.appointment_type !== undefined) {
      updates.push('appointment_type = ?');
      values.push(data.appointment_type);
    }

    if (data.status !== undefined) {
      updates.push('status = ?');
      values.push(data.status);
      
      if (data.status === 'completed') {
        updates.push('completed_at = NOW()');
      }
      if (data.status === 'cancelled') {
        updates.push('cancelled_at = NOW()');
      }
    }

    if (data.diagnosis !== undefined) {
      updates.push('diagnosis = ?');
      values.push(data.diagnosis);
    }

    if (data.treatment !== undefined) {
      updates.push('treatment = ?');
      values.push(data.treatment);
    }

    if (data.prescription !== undefined) {
      updates.push('prescription = ?');
      values.push(data.prescription);
    }

    if (data.completion_notes !== undefined) {
      updates.push('completion_notes = ?');
      values.push(data.completion_notes);
    }

    if (data.cancellation_reason !== undefined) {
      updates.push('cancellation_reason = ?');
      values.push(data.cancellation_reason);
    }

    if (data.reschedule_reason !== undefined) {
      updates.push('reschedule_reason = ?');
      values.push(data.reschedule_reason);
    }

    if (updates.length === 0) {
      return false;
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    const result = await db.query(
      `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ updateAppointment error:', error);
    throw error;
  }
}

/**
 * Cancel appointment
 */
export async function cancelAppointment(id: number, reason: string): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE appointments 
       SET status = 'cancelled', 
           cancellation_reason = ?, 
           cancelled_at = NOW(),
           updated_at = NOW()
       WHERE id = ? AND status = 'scheduled'`,
      [reason, id]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ cancelAppointment error:', error);
    throw error;
  }
}

/**
 * Complete appointment
 */
export async function completeAppointment(
  id: number,
  diagnosis: string,
  treatment?: string,
  prescription?: string,
  notes?: string
): Promise<boolean> {
  try {
    const result = await db.query(
      `UPDATE appointments 
       SET status = 'completed',
           diagnosis = ?,
           treatment = ?,
           prescription = ?,
           completion_notes = ?,
           completed_at = NOW(),
           updated_at = NOW()
       WHERE id = ? AND status IN ('scheduled', 'in_progress')`,
      [diagnosis, treatment || null, prescription || null, notes || null, id]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ completeAppointment error:', error);
    throw error;
  }
}

/**
 * Reschedule appointment
 */
export async function rescheduleAppointment(
  id: number,
  newDate: Date,
  newTime: string,
  reason: string
): Promise<boolean> {
  try {
    // Check for conflicting appointments
    const appointment = await getAppointmentById(id);
    if (!appointment) {
      throw new Error('Appointment not found');
    }

    const conflictCheck = await db.query(
      `SELECT id FROM appointments 
       WHERE veterinarian_id = ? 
         AND appointment_date = ? 
         AND appointment_time = ?
         AND status = 'scheduled'
         AND id != ?`,
      [appointment.veterinarian_id, newDate, newTime, id]
    );
    const conflicts = extractRows(conflictCheck);

    if (conflicts.length > 0) {
      throw new Error('The veterinarian already has an appointment at this time');
    }

    const result = await db.query(
      `UPDATE appointments 
       SET appointment_date = ?,
           appointment_time = ?,
           reschedule_reason = ?,
           updated_at = NOW()
       WHERE id = ? AND status = 'scheduled'`,
      [newDate, newTime, reason, id]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ rescheduleAppointment error:', error);
    throw error;
  }
}

/**
 * Delete appointment (hard delete)
 */
export async function deleteAppointment(id: number): Promise<boolean> {
  try {
    const result = await db.query(
      `DELETE FROM appointments WHERE id = ? AND status IN ('scheduled', 'cancelled')`,
      [id]
    );
    const affectedRows = getAffectedRows(result);
    return affectedRows > 0;
  } catch (error) {
    console.error('❌ deleteAppointment error:', error);
    throw error;
  }
}

/**
 * Get appointment statistics
 */
export async function getAppointmentStats(
  farmerId?: number,
  veterinarianId?: number,
  districtId?: number
): Promise<any> {
  try {
    let query = `
      SELECT 
        COUNT(*) as total_appointments,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed_count,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled_count,
        SUM(CASE WHEN appointment_type = 'consultation' THEN 1 ELSE 0 END) as consultation_count,
        SUM(CASE WHEN appointment_type = 'treatment' THEN 1 ELSE 0 END) as treatment_count,
        SUM(CASE WHEN appointment_type = 'vaccination' THEN 1 ELSE 0 END) as vaccination_count,
        SUM(CASE WHEN appointment_type = 'emergency' THEN 1 ELSE 0 END) as emergency_count
      FROM appointments a
      LEFT JOIN users farmer ON a.farmer_id = farmer.id
      WHERE 1=1
    `;

    const params: any[] = [];

    if (farmerId) {
      query += ' AND a.farmer_id = ?';
      params.push(farmerId);
    }

    if (veterinarianId) {
      query += ' AND a.veterinarian_id = ?';
      params.push(veterinarianId);
    }

    if (districtId) {
      query += ' AND farmer.district_id = ?';
      params.push(districtId);
    }

    const result = await db.query(query, params);
    return extractSingleRow(result) || {
      total_appointments: 0,
      scheduled_count: 0,
      completed_count: 0,
      cancelled_count: 0,
      consultation_count: 0,
      treatment_count: 0,
      vaccination_count: 0,
      emergency_count: 0,
    };
  } catch (error) {
    console.error('❌ getAppointmentStats error:', error);
    throw error;
  }
}

/**
 * Get appointments by date range
 */
export async function getAppointmentsByDateRange(
  startDate: Date,
  endDate: Date,
  veterinarianId?: number
): Promise<Appointment[]> {
  try {
    let query = `
      SELECT 
        a.*,
        u.full_name as farmer_name,
        an.name as animal_name
      FROM appointments a
      LEFT JOIN users u ON a.farmer_id = u.id
      LEFT JOIN animals an ON a.animal_id = an.id
      WHERE a.appointment_date BETWEEN ? AND ?
        AND a.status = 'scheduled'
    `;

    const params: any[] = [startDate, endDate];

    if (veterinarianId) {
      query += ' AND a.veterinarian_id = ?';
      params.push(veterinarianId);
    }

    query += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC';

    const result = await db.query(query, params);
    return extractRows(result);
  } catch (error) {
    console.error('❌ getAppointmentsByDateRange error:', error);
    throw error;
  }
}

/**
 * Get appointments by animal ID
 */
export async function getAppointmentsByAnimal(animalId: number): Promise<Appointment[]> {
  try {
    const result = await db.query(
      `SELECT 
        a.*,
        u.full_name as farmer_name,
        v.full_name as veterinarian_name
      FROM appointments a
      LEFT JOIN users u ON a.farmer_id = u.id
      LEFT JOIN users v ON a.veterinarian_id = v.id
      WHERE a.animal_id = ?
      ORDER BY a.appointment_date DESC`,
      [animalId]
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getAppointmentsByAnimal error:', error);
    throw error;
  }
}

/**
 * Check if time slot is available
 */
export async function isTimeSlotAvailable(
  veterinarianId: number,
  date: Date,
  time: string,
  excludeAppointmentId?: number
): Promise<boolean> {
  try {
    let query = `
      SELECT id FROM appointments 
      WHERE veterinarian_id = ? 
        AND appointment_date = ? 
        AND appointment_time = ?
        AND status = 'scheduled'
    `;

    const params: any[] = [veterinarianId, date, time];

    if (excludeAppointmentId) {
      query += ' AND id != ?';
      params.push(excludeAppointmentId);
    }

    const result = await db.query(query, params);
    const conflicts = extractRows(result);
    return conflicts.length === 0;
  } catch (error) {
    console.error('❌ isTimeSlotAvailable error:', error);
    throw error;
  }
}

/**
 * Get appointment count by district
 */
export async function getAppointmentCountByDistrict(): Promise<any[]> {
  try {
    const result = await db.query(`
      SELECT 
        d.id,
        d.name,
        d.province,
        COUNT(a.id) as total_appointments,
        SUM(CASE WHEN a.status = 'scheduled' THEN 1 ELSE 0 END) as scheduled_count,
        SUM(CASE WHEN a.status = 'completed' THEN 1 ELSE 0 END) as completed_count
      FROM districts d
      LEFT JOIN users u ON u.district_id = d.id
      LEFT JOIN appointments a ON a.farmer_id = u.id
      GROUP BY d.id, d.name, d.province
      ORDER BY total_appointments DESC
    `);
    return extractRows(result);
  } catch (error) {
    console.error('❌ getAppointmentCountByDistrict error:', error);
    throw error;
  }
}

/**
 * Get weekly appointment summary for a veterinarian
 */
export async function getWeeklyAppointmentSummary(veterinarianId: number): Promise<any> {
  try {
    const result = await db.query(
      `SELECT 
        DAYOFWEEK(appointment_date) as day_of_week,
        DATE(appointment_date) as date,
        COUNT(*) as total,
        SUM(CASE WHEN status = 'scheduled' THEN 1 ELSE 0 END) as scheduled,
        SUM(CASE WHEN status = 'completed' THEN 1 ELSE 0 END) as completed,
        SUM(CASE WHEN status = 'cancelled' THEN 1 ELSE 0 END) as cancelled
      FROM appointments
      WHERE veterinarian_id = ?
        AND appointment_date >= DATE_SUB(CURDATE(), INTERVAL 7 DAY)
      GROUP BY DATE(appointment_date), DAYOFWEEK(appointment_date)
      ORDER BY appointment_date ASC`,
      [veterinarianId]
    );
    return extractRows(result);
  } catch (error) {
    console.error('❌ getWeeklyAppointmentSummary error:', error);
    throw error;
  }
}

// Export all functions as a service object
const appointmentService = {
  getAppointments,
  getAppointmentById,
  getAppointmentsByFarmer,
  getAppointmentsByVeterinarian,
  getUpcomingAppointments,
  getTodayAppointments,
  createAppointment,
  updateAppointment,
  cancelAppointment,
  completeAppointment,
  rescheduleAppointment,
  deleteAppointment,
  getAppointmentStats,
  getAppointmentsByDateRange,
  getAppointmentsByAnimal,
  isTimeSlotAvailable,
  getAppointmentCountByDistrict,
  getWeeklyAppointmentSummary,
};

export default appointmentService;