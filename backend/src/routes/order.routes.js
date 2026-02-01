import express from 'express';
import { protect } from '../middleware/auth.middleware.js';
import {
  addCartOrder,
  addSingleOrder,
  cancelOrder,
  cancelAllOrders,
  getUserOrders
} from '../controllers/order.controller.js';

const router = express.Router();

// All routes require authentication
router.use(protect);

router.post('/cart', addCartOrder);
router.post('/single', addSingleOrder);
router.put('/:orderId/cancel', cancelOrder);
router.put('/cancel-all', cancelAllOrders);
router.get('/my-orders', getUserOrders);

export default router;