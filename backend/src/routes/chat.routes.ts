// src/routes/chat.routes.ts
import express from 'express';
import {
  createConversation,
  getMessages,
  sendMessage,
} from '../controllers/chat.controller';

const router = express.Router();

router.post('/conversation', createConversation);
router.get('/messages/:conversationId', getMessages);
router.post('/message', sendMessage);

export default router;