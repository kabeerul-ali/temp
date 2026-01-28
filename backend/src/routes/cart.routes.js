import express from 'express';
import { 
  addToCart, 
  removeFromCart, 
  updateCartQuantity, 
  clearCart,
  addMultipleToCart 
} from '../controllers/cart.controller.js';
import { isAuthenticated } from '../middlewares/auth.middleware.js';

const router = express.Router();

router.post('/add', isAuthenticated, addToCart);
router.post('/remove', isAuthenticated, removeFromCart);
router.put('/update-quantity', isAuthenticated, updateCartQuantity);
router.delete('/clear', isAuthenticated, clearCart);
router.post('/add-multiple', isAuthenticated, addMultipleToCart);

export default router;