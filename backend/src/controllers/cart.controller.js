import User from '../models/User.model.js';

// Add to cart
export const addToCart = async (req, res) => {
  try {
    const { type, itemId, quantity = 1 } = req.body;
    const user = await User.findById(req.user._id);
    
    await user.addToCart(type, itemId, quantity);
    
    res.status(200).json({ 
      success: true, 
      message: 'Added to cart', 
      cart: user.cart 
    });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
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
    await user.save();
    
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