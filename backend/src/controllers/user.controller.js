// src/controllers/user.controller.js
export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('cart.productId', 'name price discountPrice images')
      .populate('cart.offerId', 'name price discount image');
    
    res.status(200).json({ success: true, data: user });
  } catch (error) {
    res.status(500).json({ success: false, message: error.message });
  }
};
