import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  createRazorpayOrder,
  verifyPayment,
  getPaymentDetails,
  checkRazorpayConfig // Add this
} from '../controllers/payment.controller.js';

const router = express.Router();

router.use(protect); // All routes require authentication

router.post('/create-order', createRazorpayOrder);
router.post('/verify', verifyPayment);
router.get('/details/:orderId', getPaymentDetails);
router.get('/check-config', checkRazorpayConfig); // Add this route

export default router;