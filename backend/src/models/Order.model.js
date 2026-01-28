// src/models/Order.model.js
import mongoose from 'mongoose';
import { 
  ORDER_STATUS, 
  PAYMENT_STATUS, 
  PAYMENT_METHOD 
} from '../config/constants.js';

const orderItemSchema = new mongoose.Schema({
  product: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product',
    required: true
  },
  name: {
    type: String,
    required: true
  },
  price: {
    type: Number,
    required: true
  },
  quantity: {
    type: Number,
    required: true,
    min: 1
  },
  image: {
    type: String,
    required: true
  }
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  orderNumber: {
    type: String,
    unique: true,
    required: true
  },
  items: [orderItemSchema],
  
  // Delivery details
  deliveryAddress: {
    type: String,
    required: true,
    trim: true
  },
  phone: {
    type: String,
    required: true,
    trim: true
  },
  
  // Pricing
  subtotal: {
    type: Number,
    required: true,
    min: 0
  },
  deliveryCharge: {
    type: Number,
    required: true,
    min: 0,
    default: 0
  },
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  
  // Payment
  paymentMethod: {
    type: String,
    required: true,
    enum: Object.values(PAYMENT_METHOD)
  },
  paymentStatus: {
    type: String,
    required: true,
    enum: Object.values(PAYMENT_STATUS),
    default: PAYMENT_STATUS.PENDING
  },
  razorpayOrderId: String,
  razorpayPaymentId: String,
  razorpaySignature: String,
  
  // Order status
  status: {
    type: String,
    required: true,
    enum: Object.values(ORDER_STATUS),
    default: ORDER_STATUS.PROCESSING,
    index: true
  },
  
  // Timestamps
  cancelledAt: Date,
  confirmedAt: Date,
  shippedAt: Date,
  deliveredAt: Date,
  
  // Additional info
  cancelReason: String,
  adminNote: String
}, { 
  timestamps: true 
});

// Generate unique order number
orderSchema.pre('validate', function(next) {
  if (!this.orderNumber) {
    const date = new Date();
    const dateStr = date.toISOString().slice(0, 10).replace(/-/g, '');
    const random = Math.floor(1000 + Math.random() * 9000);
    this.orderNumber = `ORD-${dateStr}-${random}`;
  }
  next();
});

// Indexes for better query performance
orderSchema.index({ user: 1, createdAt: -1 });
orderSchema.index({ status: 1, createdAt: -1 });
orderSchema.index({ orderNumber: 1 });

// Check if order can be cancelled
orderSchema.methods.canBeCancelled = function() {
  if (this.status === ORDER_STATUS.CANCELLED || 
      this.status === ORDER_STATUS.DELIVERED) {
    return false;
  }
  
  // Check 10 minute window
  const now = new Date();
  const orderTime = this.createdAt;
  const diffMinutes = (now - orderTime) / (1000 * 60);
  
  return diffMinutes <= 10;
};

// Get total items count
orderSchema.methods.getTotalItems = function() {
  return this.items.reduce((total, item) => total + item.quantity, 0);
};

const Order = mongoose.model('Order', orderSchema);
export default Order;