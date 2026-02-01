import mongoose from 'mongoose';

const orderItemSchema = new mongoose.Schema({
  type: {
    type: String,
    enum: ['product', 'offer'],
    required: true
  },
  productId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Product'
  },
  offerId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'Offer'
  },
  name: String,
  quantity: Number,
  price: Number,
  image: String
}, { _id: false });

const orderSchema = new mongoose.Schema({
  user: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  address: {
    localAddress: String,
    city: String,
    district: String,
    state: String,
    pincode: String,
    country: { type: String, default: 'India' }
  },
  items: [orderItemSchema],
  totalAmount: {
    type: Number,
    required: true,
    min: 0
  },
  paymentMethod: {
    type: String,
    enum: ['COD', 'Online', 'Wallet'],
    default: 'COD'
  },
  paymentStatus: {
    type: String,
    enum: ['Pending', 'Done', 'Failed'],
    default: 'Pending'
  },
  orderStatus: {
    type: String,
    enum: ['Processing', 'Shipping', 'Cancelled', 'Delivered'],
    default: 'Processing'
  },
  transactionId: String,
  notes: String,
  cancelledAt: Date,
  deliveredAt: Date
}, { timestamps: true });

const Order = mongoose.model('Order', orderSchema);
export default Order;