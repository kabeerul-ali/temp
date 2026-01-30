import User from '../models/User.model.js';

// Add to cart
export const addToCart = async (req, res) => {
  try {
    console.log('=== CART ADD REQUEST ===');
    console.log('User ID:', req.user?._id);
    console.log('Body:', req.body);
    
    const { type, itemId, quantity = 1 } = req.body;
    
    // Check if user exists
    const user = await User.findById(req.user._id);
    if (!user) {
      console.log('ERROR: User not found');
      return res.status(404).json({ success: false, message: 'User not found' });
    }
    
    console.log('User found:', user.email);
    console.log('Calling addToCart method...');
    
    await user.addToCart(type, itemId, quantity);
    
    console.log('Cart after add:', user.cart);
    console.log('=== CART ADD SUCCESS ===\n');
    
    res.status(200).json({ 
      success: true, 
      message: 'Added to cart', 
      cart: user.cart 
    });
  } catch (error) {
    console.error('=== CART ADD ERROR ===');
    console.error('Error:', error.message);
    console.error('Stack:', error.stack);
    console.error('=== END ERROR ===\n');
    
    res.status(500).json({ 
      success: false, 
      message: error.message
    });
  }
};

// Remove from cart
export const removeFromCart = async (req, res) => {
  try {
    const { type, itemId } = req.body;
    const user = await User.findById(req.user._id);
    
    await user.removeFromCart(type, itemId);
    
    res.status(200).json({ 
      success: true, 
      message: 'Removed from cart', 
      cart: user.cart 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Update quantity
// In cart.controller.js
export const updateCartQuantity = async (req, res) => {
  try {
    const { type, itemId, quantity } = req.body;
    const user = await User.findById(req.user._id);
    
    if (quantity < 1) {
      return res.status(400).json({ success: false, message: 'Quantity must be at least 1' });
    }
    
    const itemIndex = user.cart.findIndex(item => {
      if (type === 'product') {
        return item.type === 'product' && item.productId.toString() === itemId;
      } else {
        return item.type === 'offer' && item.offerId.toString() === itemId;
      }
    });
    
    if (itemIndex === -1) {
      return res.status(404).json({ success: false, message: 'Item not in cart' });
    }
    
    user.cart[itemIndex].quantity = quantity;
    
    // FIX: Save without validation
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({ 
      success: true, 
      message: 'Quantity updated', 
      cart: user.cart 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Clear cart
export const clearCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id);
    user.cart = [];
    await user.save();
    
    res.status(200).json({ 
      success: true, 
      message: 'Cart cleared' 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};

// Add multiple items
export const addMultipleToCart = async (req, res) => {
  try {
    const { items } = req.body; // items = [{type, itemId, quantity}]
    const user = await User.findById(req.user._id);
    
    for (const item of items) {
      await user.addToCart(item.type, item.itemId, item.quantity || 1);
    }
    
    res.status(200).json({ 
      success: true, 
      message: 'Items added to cart', 
      cart: user.cart 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
// Get cart items with populated data
export const getCart = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .populate({
        path: 'cart.productId',
        select: 'name description images price discountPrice category stock isAvailable unit'
      })
      .populate({
        path: 'cart.offerId',
        select: 'name description image price discount endTime'
      })
      .select('cart');
    
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found' 
      });
    }
    
    // Format cart items with populated data
    const formattedCart = user.cart.map(item => {
      const cartItem = {
        _id: item._id,
        type: item.type,
        quantity: item.quantity,
        createdAt: item.createdAt,
        updatedAt: item.updatedAt
      };
      
      if (item.type === 'product' && item.productId) {
        cartItem.product = {
          _id: item.productId._id,
          name: item.productId.name,
          description: item.productId.description,
          images: item.productId.images,
          price: item.productId.price,
          discountPrice: item.productId.discountPrice,
          category: item.productId.category,
          stock: item.productId.stock,
          isAvailable: item.productId.isAvailable,
          unit: item.productId.unit
        };
        cartItem.productId = item.productId._id;
      } else if (item.type === 'offer' && item.offerId) {
        cartItem.offer = {
          _id: item.offerId._id,
          name: item.offerId.name,
          description: item.offerId.description,
          image: item.offerId.image,
          price: item.offerId.price,
          discount: item.offerId.discount,
          endTime: item.offerId.endTime
        };
        cartItem.offerId = item.offerId._id;
      }
      
      return cartItem;
    });
    
    res.status(200).json({ 
      success: true, 
      message: 'Cart fetched successfully',
      cart: formattedCart,
      totalItems: user.getCartTotal()
    });
    
  } catch (error) {
    console.error('Get cart error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to get cart',
      error: error.message 
    });
  }
};