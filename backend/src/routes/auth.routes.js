// routes/auth.routes.js
import express from 'express';
import {
  registerUser,
  loginUser,
  resetPassword,
  adminResetPassword,
  logoutUser,
  getCurrentUser,
  isAuthenticated
} from '../controllers/auth.controller.js';

const router = express.Router();

// Public routes
router.post('/register', registerUser);
router.post('/login', loginUser);
router.post('/reset-password', resetPassword);
router.post('/admin/reset-password', adminResetPassword);
router.post('/logout', logoutUser);

// Protected routes
router.get('/me', isAuthenticated, getCurrentUser);

export default router;