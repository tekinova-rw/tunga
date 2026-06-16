// backend/src/controllers/appointment.controller.ts
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
 * CREATE APPOINTMENT
 * =========================
 */
export const createAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const {
      veterinarian_id,
      animal_id,
      appointment_date,
      appointment_time,
      reason,
      notes,
      appointment_type,
    } = req.body;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Validation
    if (!veterinarian_id || !appointment_date || !appointment_time || !reason) {
      return res.status(400).json({ 
        message: 'Missing required fields: veterinarian_id, appointment_date, appointment_time, reason' 
      });
    }

    // Determine farmer_id
    let farmer_id = user.id;
    
    // If vet is creating appointment for a farmer
    if (isVeterinarian(user) && req.body.farmer_id) {
      farmer_id = req.body.farmer_id;
    }

    // Check if veterinarian exists and is available
    const [vets]: any = await db.query(
      `SELECT id, full_name, district_id FROM users 
       WHERE id = ? AND role = 'veterinarian' AND status = 'active'`,
      [veterinarian_id]
    );

    if (vets.length === 0) {
      return res.status(404).json({ message: 'Veterinarian not found or unavailable' });
    }

    const vet = vets[0];

    // Check if farmer exists
    const [farmers]: any = await db.query(
      `SELECT id, full_name, district_id FROM users 
       WHERE id = ? AND role = 'farmer' AND status = 'active'`,
      [farmer_id]
    );

    if (farmers.length === 0) {
      return res.status(404).json({ message: 'Farmer not found' });
    }

    const farmer = farmers[0];

    // Check if animal belongs to farmer
    if (animal_id) {
      const [animals]: any = await db.query(
        `SELECT id FROM animals WHERE id = ? AND farmer_id = ? AND is_deleted = 0`,
        [animal_id, farmer_id]
      );
      
      if (animals.length === 0 && animal_id) {
        return res.status(404).json({ message: 'Animal not found or does not belong to farmer' });
      }
    }

    // Check for conflicting appointments
    const [conflicts]: any = await db.query(
      `SELECT id FROM appointments 
       WHERE veterinarian_id = ? AND appointment_date = ? AND appointment_time = ? 
       AND status NOT IN ('cancelled', 'completed')`,
      [veterinarian_id, appointment_date, appointment_time]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Veterinarian already has an appointment at this time' });
    }

    // Create appointment
    const [result]: any = await db.query(
      `INSERT INTO appointments (
        farmer_id, veterinarian_id, animal_id, appointment_date, appointment_time,
        reason, notes, appointment_type, status, created_by, created_at, updated_at
      ) VALUES (?, ?, ?, ?, ?, ?, ?, ?, 'scheduled', ?, NOW(), NOW())`,
      [
        farmer_id,
        veterinarian_id,
        animal_id || null,
        appointment_date,
        appointment_time,
        reason,
        notes || null,
        appointment_type || 'consultation',
        user.id,
      ]
    );

    const [newAppointment]: any = await db.query(
      `SELECT a.*, 
        f.full_name as farmer_name, f.phone as farmer_phone,
        v.full_name as veterinarian_name, v.phone as veterinarian_phone,
        an.name as animal_name, an.category as animal_category
       FROM appointments a
       JOIN users f ON a.farmer_id = f.id
       JOIN users v ON a.veterinarian_id = v.id
       LEFT JOIN animals an ON a.animal_id = an.id
       WHERE a.id = ?`,
      [result.insertId]
    );

    return res.status(201).json({
      success: true,
      message: 'Appointment created successfully',
      data: newAppointment[0],
    });
  } catch (error) {
    console.error('Create appointment error:', error);
    return res.status(500).json({ message: 'Failed to create appointment' });
  }
};

/**
 * =========================
 * GET MY APPOINTMENTS (FARMER)
 * =========================
 */
export const getMyAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { status, from_date, to_date } = req.query;

    if (!user || !isFarmer(user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = `
      SELECT a.*, 
        v.full_name as veterinarian_name, v.phone as veterinarian_phone,
        an.name as animal_name, an.category as animal_category
      FROM appointments a
      JOIN users v ON a.veterinarian_id = v.id
      LEFT JOIN animals an ON a.animal_id = an.id
      WHERE a.farmer_id = ?
    `;
    const params: any[] = [user.id];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (from_date) {
      query += ' AND a.appointment_date >= ?';
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND a.appointment_date <= ?';
      params.push(to_date);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time ASC';

    const [appointments]: any = await db.query(query, params);

    return res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Get my appointments error:', error);
    return res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

/**
 * =========================
 * GET VET APPOINTMENTS
 * =========================
 */
export const getVetAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { status, date } = req.query;

    if (!user || !isVeterinarian(user)) {
      return res.status(403).json({ message: 'Access denied' });
    }

    let query = `
      SELECT a.*, 
        f.full_name as farmer_name, f.phone as farmer_phone, f.address as farmer_address,
        an.name as animal_name, an.category as animal_category
      FROM appointments a
      JOIN users f ON a.farmer_id = f.id
      LEFT JOIN animals an ON a.animal_id = an.id
      WHERE a.veterinarian_id = ?
    `;
    const params: any[] = [user.id];

    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (date) {
      query += ' AND a.appointment_date = ?';
      params.push(date);
    }

    query += ' ORDER BY a.appointment_date ASC, a.appointment_time ASC';

    const [appointments]: any = await db.query(query, params);

    return res.json({
      success: true,
      data: appointments,
    });
  } catch (error) {
    console.error('Get vet appointments error:', error);
    return res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

/**
 * =========================
 * GET ALL APPOINTMENTS (SCOPED)
 * =========================
 */
export const getAppointments = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { status, veterinarian_id, farmer_id, from_date, to_date, limit = 50, offset = 0 } = req.query;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let query = `
      SELECT a.*, 
        f.full_name as farmer_name, f.phone as farmer_phone,
        v.full_name as veterinarian_name, v.phone as veterinarian_phone,
        an.name as animal_name, an.category as animal_category
      FROM appointments a
      JOIN users f ON a.farmer_id = f.id
      JOIN users v ON a.veterinarian_id = v.id
      LEFT JOIN animals an ON a.animal_id = an.id
      WHERE 1=1
    `;
    const params: any[] = [];

    // Role-based filtering
    if (isFarmer(user)) {
      query += ' AND a.farmer_id = ?';
      params.push(user.id);
    } else if (isVeterinarian(user)) {
      query += ' AND a.veterinarian_id = ?';
      params.push(user.id);
    }

    // Additional filters
    if (status) {
      query += ' AND a.status = ?';
      params.push(status);
    }

    if (veterinarian_id && (isAdmin(user) || isVeterinarian(user))) {
      query += ' AND a.veterinarian_id = ?';
      params.push(veterinarian_id);
    }

    if (farmer_id && isAdmin(user)) {
      query += ' AND a.farmer_id = ?';
      params.push(farmer_id);
    }

    if (from_date) {
      query += ' AND a.appointment_date >= ?';
      params.push(from_date);
    }

    if (to_date) {
      query += ' AND a.appointment_date <= ?';
      params.push(to_date);
    }

    query += ' ORDER BY a.appointment_date DESC, a.appointment_time ASC LIMIT ? OFFSET ?';
    params.push(parseInt(limit as string), parseInt(offset as string));

    const [appointments]: any = await db.query(query, params);

    // Get total count
    let countQuery = `SELECT COUNT(*) as total FROM appointments a WHERE 1=1`;
    const countParams: any[] = [];

    if (isFarmer(user)) {
      countQuery += ' AND a.farmer_id = ?';
      countParams.push(user.id);
    } else if (isVeterinarian(user)) {
      countQuery += ' AND a.veterinarian_id = ?';
      countParams.push(user.id);
    }

    const [total]: any = await db.query(countQuery, countParams);

    return res.json({
      success: true,
      data: appointments,
      pagination: {
        total: total[0].total,
        limit: parseInt(limit as string),
        offset: parseInt(offset as string),
      },
    });
  } catch (error) {
    console.error('Get appointments error:', error);
    return res.status(500).json({ message: 'Failed to fetch appointments' });
  }
};

/**
 * =========================
 * GET APPOINTMENT BY ID
 * =========================
 */
export const getAppointmentById = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [appointments]: any = await db.query(
      `SELECT a.*, 
        f.full_name as farmer_name, f.phone as farmer_phone, f.address as farmer_address,
        v.full_name as veterinarian_name, v.phone as veterinarian_phone, v.email as veterinarian_email,
        an.name as animal_name, an.category as animal_category, an.breed as animal_breed
       FROM appointments a
       JOIN users f ON a.farmer_id = f.id
       JOIN users v ON a.veterinarian_id = v.id
       LEFT JOIN animals an ON a.animal_id = an.id
       WHERE a.id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = appointments[0];

    // Permission check
    const canAccess = 
      appointment.farmer_id === user.id ||
      appointment.veterinarian_id === user.id ||
      isAdmin(user);

    if (!canAccess) {
      return res.status(403).json({ message: 'Access denied' });
    }

    return res.json({
      success: true,
      data: appointment,
    });
  } catch (error) {
    console.error('Get appointment by id error:', error);
    return res.status(500).json({ message: 'Failed to fetch appointment' });
  }
};

/**
 * =========================
 * UPDATE APPOINTMENT
 * =========================
 */
export const updateAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { appointment_date, appointment_time, reason, notes, appointment_type } = req.body;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    // Get appointment
    const [appointments]: any = await db.query(
      `SELECT * FROM appointments WHERE id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = appointments[0];

    // Permission check
    const canUpdate = 
      (isFarmer(user) && appointment.farmer_id === user.id) ||
      (isVeterinarian(user) && appointment.veterinarian_id === user.id) ||
      isAdmin(user);

    if (!canUpdate) {
      return res.status(403).json({ message: 'Access denied' });
    }

    // Check if appointment can be updated (not completed or cancelled)
    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot update completed appointment' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot update cancelled appointment' });
    }

    // Build update query
    const updates: string[] = [];
    const values: any[] = [];

    if (appointment_date) {
      updates.push('appointment_date = ?');
      values.push(appointment_date);
    }

    if (appointment_time) {
      updates.push('appointment_time = ?');
      values.push(appointment_time);
    }

    if (reason) {
      updates.push('reason = ?');
      values.push(reason);
    }

    if (notes !== undefined) {
      updates.push('notes = ?');
      values.push(notes);
    }

    if (appointment_type) {
      updates.push('appointment_type = ?');
      values.push(appointment_type);
    }

    if (updates.length === 0) {
      return res.status(400).json({ message: 'No fields to update' });
    }

    updates.push('updated_at = NOW()');
    values.push(id);

    await db.query(
      `UPDATE appointments SET ${updates.join(', ')} WHERE id = ?`,
      values
    );

    const [updatedAppointment]: any = await db.query(
      `SELECT * FROM appointments WHERE id = ?`,
      [id]
    );

    return res.json({
      success: true,
      message: 'Appointment updated successfully',
      data: updatedAppointment[0],
    });
  } catch (error) {
    console.error('Update appointment error:', error);
    return res.status(500).json({ message: 'Failed to update appointment' });
  }
};

/**
 * =========================
 * RESCHEDULE APPOINTMENT
 * =========================
 */
export const rescheduleAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { appointment_date, appointment_time, reason } = req.body;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    if (!appointment_date || !appointment_time) {
      return res.status(400).json({ message: 'New date and time are required' });
    }

    const [appointments]: any = await db.query(
      `SELECT * FROM appointments WHERE id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = appointments[0];

    const canReschedule = 
      (isFarmer(user) && appointment.farmer_id === user.id) ||
      (isVeterinarian(user) && appointment.veterinarian_id === user.id) ||
      isAdmin(user);

    if (!canReschedule) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (appointment.status !== 'scheduled') {
      return res.status(400).json({ message: 'Only scheduled appointments can be rescheduled' });
    }

    // Check for conflicts
    const [conflicts]: any = await db.query(
      `SELECT id FROM appointments 
       WHERE veterinarian_id = ? AND appointment_date = ? AND appointment_time = ? 
       AND id != ? AND status NOT IN ('cancelled', 'completed')`,
      [appointment.veterinarian_id, appointment_date, appointment_time, id]
    );

    if (conflicts.length > 0) {
      return res.status(409).json({ message: 'Veterinarian already has an appointment at this time' });
    }

    await db.query(
      `UPDATE appointments 
       SET appointment_date = ?, appointment_time = ?, 
           reschedule_reason = ?, status = 'scheduled',
           updated_at = NOW()
       WHERE id = ?`,
      [appointment_date, appointment_time, reason || null, id]
    );

    return res.json({
      success: true,
      message: 'Appointment rescheduled successfully',
    });
  } catch (error) {
    console.error('Reschedule appointment error:', error);
    return res.status(500).json({ message: 'Failed to reschedule appointment' });
  }
};

/**
 * =========================
 * CANCEL APPOINTMENT
 * =========================
 */
export const cancelAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { cancellation_reason } = req.body;

    // ✅ FIXED: Check if user exists first
    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    const [appointments]: any = await db.query(
      `SELECT * FROM appointments WHERE id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = appointments[0];

    const canCancel = 
      (isFarmer(user) && appointment.farmer_id === user.id) ||
      (isVeterinarian(user) && appointment.veterinarian_id === user.id) ||
      isAdmin(user);

    if (!canCancel) {
      return res.status(403).json({ message: 'Access denied' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Cannot cancel completed appointment' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Appointment already cancelled' });
    }

    await db.query(
      `UPDATE appointments 
       SET status = 'cancelled', cancellation_reason = ?, cancelled_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [cancellation_reason || 'Cancelled by user', id]
    );

    return res.json({
      success: true,
      message: 'Appointment cancelled successfully',
    });
  } catch (error) {
    console.error('Cancel appointment error:', error);
    return res.status(500).json({ message: 'Failed to cancel appointment' });
  }
};

/**
 * =========================
 * COMPLETE APPOINTMENT
 * =========================
 */
export const completeAppointment = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;
    const { id } = req.params;
    const { diagnosis, treatment, prescription, notes } = req.body;

    if (!user || (!isVeterinarian(user) && !isAdmin(user))) {
      return res.status(403).json({ message: 'Only veterinarians can complete appointments' });
    }

    const [appointments]: any = await db.query(
      `SELECT * FROM appointments WHERE id = ?`,
      [id]
    );

    if (appointments.length === 0) {
      return res.status(404).json({ message: 'Appointment not found' });
    }

    const appointment = appointments[0];

    if (appointment.veterinarian_id !== user.id && !isAdmin(user)) {
      return res.status(403).json({ message: 'This appointment is not assigned to you' });
    }

    if (appointment.status === 'completed') {
      return res.status(400).json({ message: 'Appointment already completed' });
    }

    if (appointment.status === 'cancelled') {
      return res.status(400).json({ message: 'Cannot complete cancelled appointment' });
    }

    await db.query(
      `UPDATE appointments 
       SET status = 'completed', 
           diagnosis = ?, treatment = ?, prescription = ?, 
           completion_notes = ?,
           completed_at = NOW(), updated_at = NOW()
       WHERE id = ?`,
      [diagnosis || null, treatment || null, prescription || null, notes || null, id]
    );

    return res.json({
      success: true,
      message: 'Appointment marked as completed',
    });
  } catch (error) {
    console.error('Complete appointment error:', error);
    return res.status(500).json({ message: 'Failed to complete appointment' });
  }
};

/**
 * =========================
 * GET APPOINTMENT STATISTICS
 * =========================
 */
export const getAppointmentStats = async (req: AuthRequest, res: Response) => {
  try {
    const user = req.user;

    if (!user) {
      return res.status(401).json({ message: 'Unauthorized' });
    }

    let query = `
      SELECT 
        COUNT(*) as total,
        COUNT(CASE WHEN status = 'scheduled' THEN 1 END) as scheduled,
        COUNT(CASE WHEN status = 'completed' THEN 1 END) as completed,
        COUNT(CASE WHEN status = 'cancelled' THEN 1 END) as cancelled,
        COUNT(CASE WHEN appointment_date = CURDATE() THEN 1 END) as today,
        COUNT(CASE WHEN appointment_date > CURDATE() THEN 1 END) as upcoming
      FROM appointments
      WHERE 1=1
    `;
    const params: any[] = [];

    if (isFarmer(user)) {
      query += ' AND farmer_id = ?';
      params.push(user.id);
    } else if (isVeterinarian(user)) {
      query += ' AND veterinarian_id = ?';
      params.push(user.id);
    }

    const [stats]: any = await db.query(query, params);

    return res.json({
      success: true,
      data: stats[0],
    });
  } catch (error) {
    console.error('Get appointment stats error:', error);
    return res.status(500).json({ message: 'Failed to fetch statistics' });
  }
};