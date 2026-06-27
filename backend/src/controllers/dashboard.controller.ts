// ============================================================
// FILE: backend/src/controllers/dashboard.controller.ts
// DESCRIPTION: Dashboard controller for farmers
// ============================================================

import { Request, Response } from 'express';

export const getFarmerDashboard = async (req: Request, res: Response) => {
  try {
    const farmerId = (req as any).user?.id;

    console.log(`📊 Fetching dashboard for farmer ${farmerId}`);

    // Mock data - replace with actual database queries
    const dashboardData = {
      total_animals: 5,
      pending_requests: 2,
      active_appointments: 1,
      unread_notifications: 3,
      recent_activities: [
        {
          id: '1',
          type: 'animal_added',
          message: 'Added new animal: Bella',
          created_at: new Date().toISOString(),
        },
        {
          id: '2',
          type: 'request_submitted',
          message: 'Veterinary request submitted',
          created_at: new Date(Date.now() - 3600000).toISOString(),
        },
        {
          id: '3',
          type: 'appointment_booked',
          message: 'Appointment booked with Dr. Mugisha',
          created_at: new Date(Date.now() - 7200000).toISOString(),
        },
        {
          id: '4',
          type: 'animal_added',
          message: 'Added new animal: Max',
          created_at: new Date(Date.now() - 86400000).toISOString(),
        },
        {
          id: '5',
          type: 'request_completed',
          message: 'Veterinary request completed',
          created_at: new Date(Date.now() - 172800000).toISOString(),
        },
      ],
    };

    return res.status(200).json({
      success: true,
      message: 'Dashboard data retrieved successfully',
      data: dashboardData
    });

  } catch (error: any) {
    console.error('❌ Dashboard fetch error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch dashboard data',
      error: error.message
    });
  }
};

export const getFarmerStats = async (req: Request, res: Response) => {
  try {
    const farmerId = (req as any).user?.id;

    console.log(`📊 Fetching stats for farmer ${farmerId}`);

    // Mock data - replace with actual database queries
    const stats = {
      total_animals: 5,
      total_requests: 3,
      total_appointments: 2,
      unread_messages: 3,
    };

    return res.status(200).json({
      success: true,
      data: stats
    });

  } catch (error: any) {
    console.error('❌ Stats fetch error:', error.message);
    return res.status(500).json({
      success: false,
      message: 'Failed to fetch stats',
      error: error.message
    });
  }
};