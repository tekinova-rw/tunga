// backend/src/app.ts
import express from 'express';
import cors from 'cors';
import dotenv from 'dotenv';

// Routes
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';

dotenv.config();

const app = express();

/**
 * =========================
 * MIDDLEWARE
 * =========================
 */
app.use(
  cors({
    origin: '*', // dev only
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

/**
 * =========================
 * ROUTES
 * =========================
 */
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

/**
 * =========================
 * HEALTH CHECK
 * =========================
 */
app.get('/', (_req, res) => {
  res.status(200).json({
    name: 'VetConnect API',
    status: 'running',
    time: new Date(),
  });
});

/**
 * =========================
 * TEST ENDPOINT
 * =========================
 */
app.get('/api/test', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working!',
  });
});

/**
 * =========================
 * 404 HANDLER (IMPORTANT FIX)
 * =========================
 */
app.use((req, res) => {
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

/**
 * =========================
 * GLOBAL ERROR HANDLER (IMPORTANT UPGRADE)
 * =========================
 */
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('🔥 APP ERROR:', err);

  res.status(500).json({
    success: false,
    message: 'Internal server error',
  });
});

export default app;