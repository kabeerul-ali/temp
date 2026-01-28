import express from 'express';
import {
  getActiveOffers,
  getOfferById
} from '../controllers/offer.controller.js';

const router = express.Router();

router.get('/allactive', getActiveOffers);
router.get('/:id', getOfferById);

export default router;