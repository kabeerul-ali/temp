// src/models/Product.model.js
import mongoose from 'mongoose';
import { PRODUCT_CATEGORIES } from '../config/constants.js';

const productSchema = new mongoose.Schema({
  name: {
    type: String,
    required: [true, 'Product name is required'],
    trim: true,
    minlength: [3, 'Name must be at least 3 characters'],
    maxlength: [100, 'Name cannot exceed 100 characters']
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    trim: true,
    maxlength: [500, 'Description cannot exceed 500 characters']
  },
  category: {
    type: String,
    required: [true, 'Category is required'],
    enum: Object.values(PRODUCT_CATEGORIES),
    lowercase: true
  },
  price: {
    type: Number,
    required: [true, 'Price is required'],
    min: [0, 'Price cannot be negative']
  },
  discountPrice: {
    type: Number,
    min: [0, 'Discount price cannot be negative'],
    validate: {
      validator: function(value) {
        return !value || value < this.price;
      },
      message: 'Discount price must be less than original price'
    }
  },
  unit: {
    type: String,
    required: [true, 'Unit is required'],
    trim: true,
    enum: ['kg', 'gm', 'ltr', 'ml', 'piece', 'dozen', 'packet']
  },
  stock: {
    type: Number,
    required: [true, 'Stock is required'],
    min: [0, 'Stock cannot be negative'],
    default: 0
  },
  images: [{
    type: String,
    required: true
  }],
  isAvailable: {
    type: Boolean,
    default: true
  },
  sold: {
    type: Number,
    default: 0,
    min: 0
  }
}, { 
  timestamps: true 
});

// Indexes for better query performance
productSchema.index({ category: 1, isAvailable: 1 });
productSchema.index({ name: 'text', description: 'text' });

// Virtual for final price
productSchema.virtual('finalPrice').get(function() {
  return this.discountPrice || this.price;
});

// Virtual for discount percentage
productSchema.virtual('discountPercentage').get(function() {
  if (!this.discountPrice) return 0;
  return Math.round(((this.price - this.discountPrice) / this.price) * 100);
});

// Check if product is in stock
productSchema.methods.isInStock = function(quantity = 1) {
  return this.isAvailable && this.stock >= quantity;
};

// Reduce stock after order
productSchema.methods.reduceStock = async function(quantity) {
  if (this.stock < quantity) {
    throw new Error('Insufficient stock');
  }
  this.stock -= quantity;
  this.sold += quantity;
  
  // Auto-disable if out of stock
  if (this.stock === 0) {
    this.isAvailable = false;
  }
  
  await this.save();
};

// Ensure virtuals are included in JSON
productSchema.set('toJSON', { virtuals: true });
productSchema.set('toObject', { virtuals: true });

const Product = mongoose.model('Product', productSchema);
export default Product;