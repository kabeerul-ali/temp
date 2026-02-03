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

//mangage address
// ✅ ADD: Get all addresses
export const getAllAddresses = async (req, res) => {
  try {
    const user = await User.findById(req.user._id).select('addresses');
    
    res.status(200).json({
      success: true,
      data: user.addresses,
      total: user.addresses.length
    });

  } catch (error) {
    console.error('Get addresses error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to get addresses',
      error: error.message
    });
  }
};

// ✅ ADD: Add new address
export const addAddress = async (req, res) => {
  try {
    const { localAddress, city, district, state, pincode, country, isDefault } = req.body;
    
    // Validate required fields
    if (!localAddress || !city || !district || !state || !pincode) {
      return res.status(400).json({
        success: false,
        message: 'Please provide all required address fields'
      });
    }
    
    // Validate pincode format
    if (!/^\d{6}$/.test(pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format. Must be 6 digits'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Create new address object
    const newAddress = {
      localAddress: localAddress.trim(),
      city: city.trim(),
      district: district.trim(),
      state: state.trim(),
      pincode: pincode.trim(),
      country: country?.trim() || "India",
      isDefault: isDefault || false
    };
    
    // If this is the first address, set as default
    if (user.addresses.length === 0) {
      newAddress.isDefault = true;
    }
    
    // If setting as default, remove default from other addresses
    if (newAddress.isDefault) {
      user.addresses.forEach(addr => {
        addr.isDefault = false;
      });
    }
    
    // Add new address
    user.addresses.push(newAddress);
    await user.save({ validateBeforeSave: false });
    
    res.status(201).json({
      success: true,
      message: 'Address added successfully',
      data: newAddress
    });

  } catch (error) {
    console.error('Add address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to add address',
      error: error.message
    });
  }
};

// ✅ ADD: Edit address
export const editAddress = async (req, res) => {
  try {
    const { id } = req.params;
    const updateData = req.body;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Address ID is required'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Find address index
    const addressIndex = user.addresses.findIndex(addr => 
      addr._id.toString() === id
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // If pincode is being updated, validate it
    if (updateData.pincode && !/^\d{6}$/.test(updateData.pincode)) {
      return res.status(400).json({
        success: false,
        message: 'Invalid pincode format. Must be 6 digits'
      });
    }
    
    // Update address fields
    Object.keys(updateData).forEach(key => {
      if (key !== '_id' && key !== '__v') {
        if (typeof user.addresses[addressIndex][key] !== 'undefined') {
          user.addresses[addressIndex][key] = updateData[key];
        }
      }
    });
    
    // If setting as default, remove default from other addresses
    if (updateData.isDefault === true) {
      user.addresses.forEach((addr, idx) => {
        if (idx !== addressIndex) {
          addr.isDefault = false;
        }
      });
    }
    
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      success: true,
      message: 'Address updated successfully',
      data: user.addresses[addressIndex]
    });

  } catch (error) {
    console.error('Edit address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to update address',
      error: error.message
    });
  }
};

// ✅ ADD: Set default address
export const setDefaultAddress = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Address ID is required'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Find address
    const addressIndex = user.addresses.findIndex(addr => 
      addr._id.toString() === id
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Remove default from all addresses
    user.addresses.forEach(addr => {
      addr.isDefault = false;
    });
    
    // Set selected address as default
    user.addresses[addressIndex].isDefault = true;
    
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      success: true,
      message: 'Default address set successfully',
      data: user.addresses[addressIndex]
    });

  } catch (error) {
    console.error('Set default address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to set default address',
      error: error.message
    });
  }
};

// ✅ ADD: Remove address
export const removeAddress = async (req, res) => {
  try {
    const { id } = req.params;
    
    if (!id) {
      return res.status(400).json({
        success: false,
        message: 'Address ID is required'
      });
    }
    
    const user = await User.findById(req.user._id);
    
    // Check if address exists
    const addressIndex = user.addresses.findIndex(addr => 
      addr._id.toString() === id
    );
    
    if (addressIndex === -1) {
      return res.status(404).json({
        success: false,
        message: 'Address not found'
      });
    }
    
    // Check if this is the last address
    if (user.addresses.length === 1) {
      return res.status(400).json({
        success: false,
        message: 'Cannot delete the only address. Please add another address first.'
      });
    }
    
    const wasDefault = user.addresses[addressIndex].isDefault;
    
    // Remove address
    user.addresses.splice(addressIndex, 1);
    
    // If default was deleted, set first address as default
    if (wasDefault && user.addresses.length > 0) {
      user.addresses[0].isDefault = true;
    }
    
    await user.save({ validateBeforeSave: false });
    
    res.status(200).json({
      success: true,
      message: 'Address removed successfully',
      data: { deletedAddressId: id }
    });

  } catch (error) {
    console.error('Remove address error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to remove address',
      error: error.message
    });
  }
};