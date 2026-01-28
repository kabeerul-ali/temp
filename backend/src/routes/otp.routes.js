// routes/otp.routes.js
import express from 'express';
import {
  sendSignupOTP,
  sendUserForgotPasswordOTP,
  sendAdminForgotPasswordOTP,
  verifyOTP,
  resendOTP
} from '../controllers/otp.controller.js';

const router = express.Router();

// User OTP routes
router.post('/send-signup-otp', sendSignupOTP);
router.post('/send-forgot-password-otp', sendUserForgotPasswordOTP);
router.post('/send-admin-forgot-password-otp', sendAdminForgotPasswordOTP);

// Common OTP routes
router.post('/verify', verifyOTP);
router.post('/resend', resendOTP);

export default router;