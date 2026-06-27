// ============================================================
// FILE: backend/src/routes/public-chat.routes.ts
// DESCRIPTION: Public chat routes
// ============================================================

import express from 'express';
import {
  getPublicMessages,
  sendPublicMessage,
  deletePublicMessage,
  reportPublicMessage,
} from '../controllers/public-chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Public chat endpoints
router.get('/messages', getPublicMessages);
router.post('/messages', sendPublicMessage);
router.delete('/messages/:id', deletePublicMessage);
router.post('/messages/:id/report', reportPublicMessage);

export default router;