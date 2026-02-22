import Razorpay from 'razorpay';
import crypto from 'crypto';
import Order from '../models/Order.model.js';

// Initialize Razorpay with error handling
let razorpay;
try {
  razorpay = new Razorpay({
    key_id: process.env.RAZORPAY_KEY_ID,
    key_secret: process.env.RAZORPAY_KEY_SECRET
  });
} catch (error) {
  console.error('Failed to initialize Razorpay:', error);
  razorpay = null;
}

// 1. Create Razorpay Order
export const createRazorpayOrder = async (req, res) => {
  try {
    console.log('=== CREATE RAZORPAY ORDER REQUEST ===');
    console.log('Request body:', req.body);
    
    const { amount, orderId } = req.body;
    
    // Validate required fields
    if (!amount || !orderId) {
      console.log('Missing required fields:', { amount, orderId });
      return res.status(400).json({
        success: false,
        message: 'Amount and orderId are required'
      });
    }
    
    // Validate amount is a number
    const amountNum = Number(amount);
    if (isNaN(amountNum)) {
      console.log('Invalid amount:', amount);
      return res.status(400).json({
        success: false,
        message: 'Invalid amount format'
      });
    }
    
    // Razorpay minimum amount is ₹1 (100 paise)
    // Maximum amount is ₹500000 (5 lakh rupees)
    if (amountNum < 1) {
      console.log('Amount too low:', amountNum);
      return res.status(400).json({
        success: false,
        message: 'Order amount must be at least ₹1'
      });
    }
    
    if (amountNum > 500000) {
      console.log('Amount too high:', amountNum);
      return res.status(400).json({
        success: false,
        message: 'Order amount cannot exceed ₹5,00,000'
      });
    }
    
    // Convert to paise (1 rupee = 100 paise)
    // Razorpay accepts amount in paise
    const amountInPaise = Math.round(amountNum * 100);
    console.log('Amount in paise:', amountInPaise);
    
    // Razorpay absolute minimum is 100 paise (₹1)
    if (amountInPaise < 100) {
      console.log('Amount in paise too low:', amountInPaise);
      return res.status(400).json({
        success: false,
        message: 'Order amount must be at least ₹1'
      });
    }
    
    // Check if Razorpay is initialized
    if (!razorpay) {
      console.error('Razorpay not initialized');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway not configured properly'
      });
    }
    
    // Check if credentials exist
    if (!process.env.RAZORPAY_KEY_ID || !process.env.RAZORPAY_KEY_SECRET) {
      console.error('Razorpay credentials missing in .env');
      return res.status(500).json({
        success: false,
        message: 'Payment gateway configuration missing'
      });
    }
    
    // Create Razorpay order options
    const options = {
      amount: amountInPaise, // Amount in paise
      currency: "INR",
      receipt: `order_${orderId}`,
      payment_capture: 1, // Auto capture payment
      notes: {
        orderId: orderId,
        timestamp: new Date().toISOString()
      }
    };
    
    console.log('Razorpay options:', options);
    
    // Create order with Razorpay
    const razorpayOrder = await razorpay.orders.create(options);
    console.log('Razorpay order created successfully:', razorpayOrder.id);
    
    // Update our order with razorpayOrderId
    const updatedOrder = await Order.findByIdAndUpdate(
      orderId,
      {
        razorpayOrderId: razorpayOrder.id,
        // If order was created with pending status, keep it pending
        // Payment status will update after verification
      },
      { new: true }
    );
    
    if (!updatedOrder) {
      console.error('Order not found for ID:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    console.log('Order updated with Razorpay ID:', updatedOrder._id);
    
    // Return success response
    res.status(200).json({
      success: true,
      message: 'Razorpay order created successfully',
      data: {
        id: razorpayOrder.id,
        amount: razorpayOrder.amount,
        currency: razorpayOrder.currency,
        receipt: razorpayOrder.receipt,
        status: razorpayOrder.status,
        orderId: orderId
      }
    });
    
  } catch (error) {
    console.error('=== RAZORPAY ORDER CREATION ERROR ===');
    console.error('Error name:', error.name);
    console.error('Error message:', error.message);
    console.error('Error status:', error.statusCode);
    console.error('Error description:', error.error?.description);
    console.error('Full error:', error);
    
    // Handle specific Razorpay errors
    let statusCode = 500;
    let errorMessage = 'Failed to create payment order';
    
    if (error.statusCode === 400) {
      statusCode = 400;
      errorMessage = error.error?.description || 'Invalid payment request';
    } else if (error.statusCode === 401) {
      statusCode = 401;
      errorMessage = 'Invalid Razorpay credentials';
    } else if (error.statusCode === 429) {
      statusCode = 429;
      errorMessage = 'Too many requests. Please try again later.';
    }
    
    res.status(statusCode).json({
      success: false,
      message: errorMessage,
      error: error.error?.description || error.message,
      details: error.error
    });
  }
};

// 2. Verify Payment
export const verifyPayment = async (req, res) => {
  try {
    console.log('=== PAYMENT VERIFICATION REQUEST ===');
    console.log('Request body:', req.body);
    
    const { orderId, razorpayPaymentId, razorpaySignature } = req.body;
    
    // Validate required fields
    if (!orderId || !razorpayPaymentId || !razorpaySignature) {
      return res.status(400).json({
        success: false,
        message: 'orderId, razorpayPaymentId and razorpaySignature are required'
      });
    }
    
    // Find order
    const order = await Order.findById(orderId);
    if (!order) {
      console.error('Order not found:', orderId);
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    console.log('Order found:', order._id);
    console.log('Razorpay Order ID:', order.razorpayOrderId);
    
    // Check if order has razorpayOrderId
    if (!order.razorpayOrderId) {
      console.error('No Razorpay order ID found for order:', orderId);
      return res.status(400).json({
        success: false,
        message: 'Payment order not initialized'
      });
    }
    
    // Generate signature for verification
    // Format: razorpayOrderId + "|" + razorpayPaymentId
    const generatedSignature = crypto
      .createHmac('sha256', process.env.RAZORPAY_KEY_SECRET)
      .update(order.razorpayOrderId + "|" + razorpayPaymentId)
      .digest('hex');
    
    console.log('Generated signature:', generatedSignature);
    console.log('Received signature:', razorpaySignature);
    
    // Verify signature
    const isSignatureValid = generatedSignature === razorpaySignature;
    
    if (!isSignatureValid) {
      console.error('Signature verification failed');
      
      // Mark payment as failed
      order.paymentStatus = 'Failed';
      order.paymentMethod = 'Online';
      order.razorpayPaymentId = razorpayPaymentId;
      order.razorpaySignature = razorpaySignature;
      await order.save();
      
      return res.status(400).json({
        success: false,
        message: 'Payment verification failed - Invalid signature',
        data: {
          orderId: order._id,
          paymentStatus: order.paymentStatus
        }
      });
    }
    
    console.log('Signature verified successfully');
    
    // Update order with payment details
    order.razorpayPaymentId = razorpayPaymentId;
    order.razorpaySignature = razorpaySignature;
    order.paymentStatus = 'Done';
    order.paymentMethod = 'Online';
    order.orderStatus = 'Processing'; // Move to processing after payment
    
    await order.save();
    
    console.log('Order updated successfully:', order._id);
    
    res.status(200).json({
      success: true,
      message: 'Payment verified successfully',
      data: {
        orderId: order._id,
        paymentStatus: order.paymentStatus,
        orderStatus: order.orderStatus,
        paymentMethod: order.paymentMethod,
        totalAmount: order.totalAmount,
        timestamp: new Date().toISOString()
      }
    });
    
  } catch (error) {
    console.error('=== PAYMENT VERIFICATION ERROR ===');
    console.error('Error:', error);
    
    res.status(500).json({
      success: false,
      message: 'Payment verification failed',
      error: error.message
    });
  }
};

// 3. Get Payment Details
export const getPaymentDetails = async (req, res) => {
  try {
    const { orderId } = req.params;
    
    if (!orderId) {
      return res.status(400).json({
        success: false,
        message: 'Order ID is required'
      });
    }
    
    const order = await Order.findById(orderId);
    if (!order) {
      return res.status(404).json({
        success: false,
        message: 'Order not found'
      });
    }
    
    res.status(200).json({
      success: true,
      data: {
        paymentStatus: order.paymentStatus,
        paymentMethod: order.paymentMethod,
        orderStatus: order.orderStatus,
        razorpayOrderId: order.razorpayOrderId,
        razorpayPaymentId: order.razorpayPaymentId,
        totalAmount: order.totalAmount,
        createdAt: order.createdAt
      }
    });
    
  } catch (error) {
    console.error('Get payment details error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get payment details',
      error: error.message
    });
  }
};

// 4. Check Razorpay Configuration (for debugging)
export const checkRazorpayConfig = async (req, res) => {
  try {
    const config = {
      isConfigured: !!(process.env.RAZORPAY_KEY_ID && process.env.RAZORPAY_KEY_SECRET),
      keyIdExists: !!process.env.RAZORPAY_KEY_ID,
      keySecretExists: !!process.env.RAZORPAY_KEY_SECRET,
      keyIdLength: process.env.RAZORPAY_KEY_ID?.length || 0,
      razorpayInitialized: !!razorpay,
      environment: process.env.NODE_ENV,
      minAmount: '₹1 (100 paise)',
      maxAmount: '₹5,00,000 (5 lakh rupees)'
    };
    
    res.status(200).json({
      success: true,
      message: 'Razorpay configuration check',
      data: config
    });
    
  } catch (error) {
    console.error('Config check error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to check configuration',
      error: error.message
    });
  }
};