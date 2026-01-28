import Offer from '../models/Offer.model.js';

// Get all active offers
export const getActiveOffers = async (req, res) => {
  try {
    const now = new Date();
    const offers = await Offer.find({
      active: true,
      startTime: { $lte: now },
      endTime: { $gte: now }
    });
    res.status(200).json({ success: true, data: offers });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Get offer by ID
export const getOfferById = async (req, res) => {
  try {
    const { id } = req.params;
    const offer = await Offer.findById(id);
    
    if (!offer) {
      return res.status(404).json({ success: false, message: 'Offer not found' });
    }
    
    res.status(200).json({ success: true, data: offer });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};