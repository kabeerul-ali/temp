// src/routes/user.routes.js
import express from 'express';
import { getProfile,getWalletBalance, 
  updateWallet  } from '../controllers/user.controller.js';
import { protect } from '../middleware/auth.middleware.js';

const router = express.Router();

router.get('/profile', protect, getProfile);
router.get('/wallet', protect, getWalletBalance); // GET wallet balance
router.patch('/wallet/update', protect, updateWallet);// UPDATE wallet (+/-)


export default router;