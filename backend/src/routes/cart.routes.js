import express from 'express';
import { 
  addToCart, 
  removeFromCart, 
  updateCartQuantity, 
  clearCart,
  addMultipleToCart 
} from '../controllers/cart.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.post('/add', protect, addToCart);
router.post('/remove', protect, removeFromCart);
router.put('/update-quantity', protect, updateCartQuantity);
router.delete('/clear', protect, clearCart);
router.post('/add-multiple', protect, addMultipleToCart);

export default router;