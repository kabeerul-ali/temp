// src/controllers/user.controller.js
import User from '../models/User.model.js';

export const getProfile = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('-password');
    
    res.status(200).json({
      success: true,
      data: user
    });

  } catch (error) {
    console.error('Get profile error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get profile',
      error: error.message
    });
  }
};
// ADD: Update wallet controller
export const updateWallet = async (req, res) => {
  try {
    const { amount } = req.body;
    
    if (!amount || typeof amount !== 'number') {
      return res.status(400).json({
        success: false,
        message: 'Valid amount is required'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update wallet
    await user.updateWallet(amount);
    
    res.status(200).json({
      success: true,
      message: amount >= 0 ? 'Wallet credited successfully' : 'Wallet debited successfully',
      data: {
        newBalance: user.wallet,
        previousBalance: user.wallet - amount
      }
    });

  } catch (error) {
    console.error('Update wallet error:', error);
    
    if (error.message === 'Insufficient wallet balance') {
      return res.status(400).json({
        success: false,
        message: error.message
      });
    }
    
    res.status(500).json({
      success: false,
      message: 'Failed to update wallet',
      error: error.message
    });
  }
};

// ADD: Get wallet balance
export const getWalletBalance = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('wallet');
    
    res.status(200).json({
      success: true,
      data: {
        balance: user.wallet
      }
    });

  } catch (error) {
    console.error('Get wallet balance error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get wallet balance',
      error: error.message
    });
  }
};