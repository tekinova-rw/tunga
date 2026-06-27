// ============================================================
// FILE: backend/src/server.ts
// DESCRIPTION: Main server file for VetConnect API
// ============================================================

import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';

import { connectDB } from './config/db';
import { initSocket } from './sockets/socket';

// Routes
import adminRoutes from './routes/admin.routes';
import aiChatRoutes from './routes/ai-chat.routes';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';
import dashboardRoutes from './routes/dashboard.routes';
import publicChatRoutes from './routes/public-chat.routes';

// Load environment variables
dotenv.config();

const app = express();
const server = http.createServer(app);

/**
 * =========================
 * GLOBAL MIDDLEWARE
 * =========================
 */
app.use(
  cors({
    origin: '*', // Allow all origins for development
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, _res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
  });
}

/**
 * =========================
 * API ROUTES
 * =========================
 * All routes are prefixed with /api
 */
app.use('/api/auth', authRoutes);           // Authentication routes
app.use('/api/chat', chatRoutes);           // Private chat routes
app.use('/api/admin', adminRoutes);         // Admin management routes
app.use('/api', dashboardRoutes);           // Dashboard routes
app.use('/api/public-chat', publicChatRoutes); // Public chat routes
app.use('/api/ai-chat', aiChatRoutes);      // AI Chat routes

/**
 * =========================
 * SOCKET.IO
 * =========================
 * Real-time communication
 */
initSocket(server);

/**
 * =========================
 * HEALTH CHECK ENDPOINTS
 * =========================
 */
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    service: 'VetConnect API',
    version: '1.0.0',
    timestamp: new Date().toISOString(),
  });
});

app.get('/api/test', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working!',
    timestamp: new Date().toISOString(),
  });
});

/**
 * =========================
 * 404 HANDLER
 * =========================
 * Catch all unmatched routes
 */
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
    method: req.method,
  });
});

/**
 * =========================
 * GLOBAL ERROR HANDLER
 * =========================
 */
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('🔥 SERVER ERROR:', err);
  console.error('🔥 Error stack:', err.stack);
  console.error('🔥 Error message:', err.message);

  res.status(err.status || 500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

/**
 * =========================
 * START SERVER
 * =========================
 */
const PORT = Number(process.env.PORT) || 5000;

// Connect to database first, then start server
connectDB()
  .then((connected) => {
    if (!connected) {
      console.error('💥 Cannot start server - database connection failed');
      console.log('Please check your .env file and make sure MySQL is running');
      process.exit(1);
    }

    server.listen(PORT, '0.0.0.0', () => {
      console.log('========================================');
      console.log('🚀 VetConnect API Started Successfully');
      console.log('========================================');
      console.log(`🌐 Port: ${PORT}`);
      console.log(`📡 Local: http://localhost:${PORT}`);
      console.log(`📡 Test: http://localhost:${PORT}/api/test`);
      console.log('========================================');
      console.log('📋 Available Routes:');
      console.log(`  🔐 /api/auth        - Authentication`);
      console.log(`  💬 /api/chat        - Private Chat`);
      console.log(`  👑 /api/admin       - Admin Management`);
      console.log(`  📊 /api/dashboard   - Dashboard Stats`);
      console.log(`  🌍 /api/public-chat - Public Chat`);
      console.log(`  🤖 /api/ai-chat     - AI Assistant`);
      console.log('========================================');
      console.log('✅ Server is ready to accept connections');
      console.log('========================================');
    });
  })
  .catch((error) => {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  });

/**
 * =========================
 * GRACEFUL SHUTDOWN
 * =========================
 * Handle process termination gracefully
 */
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

process.on('SIGTERM', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});

export default app;