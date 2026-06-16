import { Request, Response } from 'express';

export const createAppointment =
  async (
    req: Request,
    res: Response
  ) => {
    try {

    } catch (error) {
      res.status(500).json({
        message: 'Failed',
      });
    }
  };

export const getAppointments =
  async (
    req: Request,
    res: Response
  ) => {
    try {

    } catch (error) {
      res.status(500).json({
        message: 'Failed',
      });
    }
  };

export const updateAppointmentStatus =
  async (
    req: Request,
    res: Response
  ) => {
    try {

    } catch (error) {
      res.status(500).json({
        message: 'Failed',
      });
    }
  };