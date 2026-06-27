// ============================================================
// FILE: backend/src/routes/ai-chat.routes.ts
// DESCRIPTION: AI Chat routes
// ============================================================

import express from 'express';
import { askAI, getAIHistory } from '../controllers/ai-chat.controller';
import { authenticate } from '../middleware/auth.middleware';

const router = express.Router();

// All routes require authentication
router.use(authenticate);

// Ask AI question
router.post('/ask', askAI);

// Get AI chat history
router.get('/history', getAIHistory);

export default router;