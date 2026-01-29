import express from 'express';
import { 
  login,
  sendSignupOTP,
  verifySignupOTP,    // Changed
  completeSignup, 
  sendForgotOTP,
  verifyForgotOTP,
  resetPassword,
  logout
} from '../controllers/auth.controller.js';
import { getProfile } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

// Public routes
router.post('/login', login);
router.post('/signup/send-otp', sendSignupOTP);
router.post('/signup/verify-otp', verifySignupOTP);   // Changed
router.post('/signup/complete', completeSignup);      // New
router.post('/forgot/send-otp', sendForgotOTP);
router.post('/forgot/verify', verifyForgotOTP);
router.get('/profile', protect, getProfile); // Add this line

// Protected routes
router.post('/reset-password', protect, resetPassword);
router.post('/logout', logout);

export default router;