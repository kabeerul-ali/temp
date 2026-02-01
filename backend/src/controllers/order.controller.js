import Order from '../models/Order.model.js';
import User from '../models/User.model.js';
import Product from '../models/Product.model.js';
import Offer from '../models/Offer.model.js';

// Helper: Find or create processing order
const getOrCreateProcessingOrder = async (userId, address, paymentMethod) => {
  let order = await Order.findOne({
    user: userId,
    orderStatus: 'Processing'
  });

  if (!order) {
    order = await Order.create({
      user: userId,
      address,
      items: [],
      totalAmount: 0,
      paymentMethod: paymentMethod || 'COD',
      paymentStatus: 'Pending',
      orderStatus: 'Processing'
    });
  }

  return order;
};

// Helper: Update item quantity in order
const updateOrderItem = (order, type, itemId, quantity) => {
  const itemIndex = order.items.findIndex(item => {
    if (type === 'product') {
      return item.type === 'product' && 
             item.productId.toString() === itemId.toString();
    } else {
      return item.type === 'offer' && 
             item.offerId.toString() === itemId.toString();
    }
  });

  if (itemIndex > -1) {
    // Update existing item quantity
    order.items[itemIndex].quantity += quantity;
  } else {
    // Add new item (will be populated later)
    const newItem = {
      type,
      quantity
    };
    if (type === 'product') {
      newItem.productId = itemId;
    } else {
      newItem.offerId = itemId;
    }
    order.items.push(newItem);
  }
};

// Add cart to order
export const addCartOrder = async (req, res) => {
  try {
    const { addressIndex, paymentMethod } = req.body;
    const user = await User.findById(req.user._id).populate('cart.productId cart.offerId');

    if (!user.cart || user.cart.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'Cart is empty'
      });
    }

    if (!user.addresses[addressIndex]) {
      return res.status(400).json({
        success: false,
        message: 'Address not found'
      });
    }

    const address = user.addresses[addressIndex];

    // Get or create processing order
    const order = await getOrCreateProcessingOrder(user._id, address, paymentMethod);

    // Add cart items to order
    for (const cartItem of user.cart) {
      updateOrderItem(order, cartItem.type, 
        cartItem.type === 'product' ? cartItem.productId._id : cartItem.offerId._id, 
        cartItem.quantity);
    }

    // Clear user's cart
    user.cart = [];
    await user.save({ validateBeforeSave: false });

    await order.save();
    
    res.status(200).json({
      success: true,
      message: 'Cart added to order successfully',
      data: order
    });

  } catch (error) {
    console.error('Add cart order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add cart to order',
      error: error.message
    });
  }
};

// Add single item to order
export const addSingleOrder = async (req, res) => {
  try {
    const { type, itemId, quantity = 1, addressIndex, paymentMethod } = req.body;
    
    if (!type || !itemId || !addressIndex) {
      return res.status(400).json({
        success: false,
        message: 'Type, itemId and addressIndex are required'
      });
    }

    const user = await User.findById(req.user._id);
    
    if (!user.addresses[addressIndex]) {
      return res.status(400).json({
        success: false,
        message: 'Address not found'
      });
    }

    const address = user.addresses[addressIndex];
    
    // Get or create processing order
    const order = await getOrCreateProcessingOrder(user._id, address, paymentMethod);
    
    // Add/update item in order
    updateOrderItem(order, type, itemId, quantity);
    
    await order.save();
    
    res.status(200).json({
      success: true,
      message: 'Item added to order successfully',
      data: order
    });

  } catch (error) {
    console.error('Add single order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add item to order',
      error: error.message
    });
  }
};

// Cancel single order
export const cancelOrder = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    const order = await Order.findById(orderId);
    
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    if (order.user.toString() !== req.user._id.toString()) {
      return res.status(403).json({
        success: false,
        message: 'Not authorized to cancel this order'
      });
    }
    
    if (order.orderStatus !== 'Processing') {
      return res.status(400).json({
        success: false,
        message: 'Only Processing orders can be cancelled'
      });
    }
    
    // Update order status
    order.orderStatus = 'Cancelled';
    order.cancelledAt = new Date();
    
    // Refund to wallet if payment was done
    if (order.paymentStatus === 'Done') {
      const user = await User.findById(req.user._id);
      await user.updateWallet(order.totalAmount);
      await user.save();
    }
    
    await order.save();
    
    res.status(200).json({
      success: true,
      message: 'Order cancelled successfully',
      data: order
    });

  } catch (error) {
    console.error('Cancel order error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel order',
      error: error.message
    });
  }
};

// Cancel all processing orders
export const cancelAllOrders = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    const processingOrders = await Order.find({
      user: user._id,
      orderStatus: 'Processing'
    });
    
    if (processingOrders.length === 0) {
      return res.status(400).json({
        success: false,
        message: 'No processing orders found'
      });
    }
    
    let totalRefund = 0;
    
    for (const order of processingOrders) {
      order.orderStatus = 'Cancelled';
      order.cancelledAt = new Date();
      
      if (order.paymentStatus === 'Done') {
        totalRefund += order.totalAmount;
      }
      
      await order.save();
    }
    
    // Refund total amount to wallet
    if (totalRefund > 0) {
      await user.updateWallet(totalRefund);
      await user.save();
    }
    
    res.status(200).json({
      success: true,
      message: `Cancelled ${processingOrders.length} order(s)`,
      data: {
        cancelledCount: processingOrders.length,
        refundAmount: totalRefund
      }
    });

  } catch (error) {
    console.error('Cancel all orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to cancel all orders',
      error: error.message
    });
  }
};

// Get user's orders
export const getUserOrders = async (req, res) => {
  try {
    const orders = await Order.find({ user: req.user._id })
      .sort({ createdAt: -1 })
      .populate('items.productId items.offerId');
    
    res.status(200).json({
      success: true,
      count: orders.length,
      data: orders
    });

  } catch (error) {
    console.error('Get user orders error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get orders',
      error: error.message
    });
  }
};