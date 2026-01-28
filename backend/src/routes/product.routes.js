import express from 'express';
import {
  getAllProducts,
  getProductsByCategory,
  getProductById
} from '../controllers/product.controller.js';

const router = express.Router();

router.get('/', getAllProducts);
router.get('/category/:category', getProductsByCategory);
router.get('/:id', getProductById);

export default router;