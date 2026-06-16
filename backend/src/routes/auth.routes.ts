// backend/src/routes/auth.routes.ts
import { Router } from 'express';

import {
  register,
  login,
  verifyEmail,
  forgotPassword,
  resetPassword,
  refreshToken,
  logout,
  getProfile, // ✅ Add this import
} from '../controllers/auth.controller';
import { authenticate } from '../middleware/auth.middleware'; // ✅ Add this

const router = Router();

/**
 * ====================================
 * AUTH ROUTES (FULL SYSTEM)
 * ====================================
 */

// REGISTER
router.post('/register', register);

// LOGIN (returns access + refresh token)
router.post('/login', login);

// VERIFY EMAIL
router.get('/verify/:token', verifyEmail);

// FORGOT PASSWORD
router.post('/forgot-password', forgotPassword);

// RESET PASSWORD
router.post('/reset-password', resetPassword);

// REFRESH ACCESS TOKEN 🔄
router.post('/refresh', refreshToken);

// LOGOUT (delete refresh token)
router.post('/logout', logout);

// ✅ GET USER PROFILE (authenticated)
router.get('/profile', authenticate, getProfile);

export default router;