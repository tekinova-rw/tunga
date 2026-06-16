// backend/src/server.ts
import cors from 'cors';
import dotenv from 'dotenv';
import express from 'express';
import http from 'http';

import { initSocket } from './sockets/socket';
import { connectDB } from './config/db';

// Routes
import adminRoutes from './routes/admin.routes';
import authRoutes from './routes/auth.routes';
import chatRoutes from './routes/chat.routes';

dotenv.config();

const app = express();
const server = http.createServer(app);

/**
 * GLOBAL MIDDLEWARE
 */
app.use(
  cors({
    origin: '*',
    credentials: true,
  })
);

app.use(express.json());
app.use(express.urlencoded({ extended: true }));

// Log all requests in development
if (process.env.NODE_ENV !== 'production') {
  app.use((req, res, next) => {
    console.log(`📥 ${req.method} ${req.url}`);
    next();
  });
}

/**
 * ROUTES
 */
app.use('/api/auth', authRoutes);
app.use('/api/chat', chatRoutes);
app.use('/api/admin', adminRoutes);

/**
 * SOCKET.IO
 */
initSocket(server);

/**
 * HEALTH CHECK
 */
app.get('/', (_req, res) => {
  res.status(200).json({
    success: true,
    status: 'OK',
    service: 'VetConnect API',
    timestamp: new Date(),
  });
});

app.get('/api/test', (_req, res) => {
  res.status(200).json({
    success: true,
    message: 'API is working!',
    timestamp: new Date(),
  });
});

/**
 * 404 HANDLER
 */
app.use((req, res) => {
  console.log(`❌ 404 - Route not found: ${req.method} ${req.url}`);
  res.status(404).json({
    success: false,
    message: 'Route not found',
    path: req.originalUrl,
  });
});

/**
 * ERROR HANDLER - IMPROVED WITH DETAILS
 */
app.use((err: any, _req: any, res: any, _next: any) => {
  console.error('🔥 SERVER ERROR:', err);
  console.error('🔥 Error stack:', err.stack);
  console.error('🔥 Error message:', err.message);

  res.status(500).json({
    success: false,
    message: err.message || 'Internal server error',
    error: process.env.NODE_ENV === 'development' ? err.stack : undefined,
  });
});

/**
 * START SERVER
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
      console.log('================================');
      console.log('🚀 VetConnect API Started');
      console.log(`🌐 Port: ${PORT}`);
      console.log(`📡 Local: http://localhost:${PORT}`);
      console.log(`📡 Test: http://localhost:${PORT}/api/test`);
      console.log('================================');
      console.log('✅ Server is ready to accept connections');
    });
  })
  .catch((error) => {
    console.error('💥 Failed to start server:', error);
    process.exit(1);
  });

// Handle graceful shutdown
process.on('SIGINT', () => {
  console.log('\n🛑 Shutting down server...');
  server.close(() => {
    console.log('✅ Server closed');
    process.exit(0);
  });
});