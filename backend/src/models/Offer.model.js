// src/models/Offer.model.js
import mongoose from 'mongoose';

const offerSchema = new mongoose.Schema({
  name: {
    type: String,
    required: true,
    trim: true,
    minlength: 3,
    maxlength: 100
  },
  description: {
    type: String,
    required: true,
    trim: true,
    maxlength: 500
  },
  price: {
    type: Number,
    required: true,
    min: 0
  },
  discount: {
    type: Number,
    required: true,
    min: 0
  },
  image: {
    type: String,
    required: true,
    trim: true
  },
  startTime: {
    type: Date,
    required: true
  },
  endTime: {
    type: Date,
    required: true
  },
  active: {
    type: Boolean,
    default: true
  }
}, { 
  timestamps: true 
});

// Indexes
offerSchema.index({ startTime: 1, endTime: 1 });
offerSchema.index({ active: 1 });

// Check if offer is currently active
offerSchema.methods.isActiveNow = function() {
  const now = new Date();
  return this.active && now >= this.startTime && now <= this.endTime;
};

const Offer = mongoose.model('Offer', offerSchema);
export default Offer;