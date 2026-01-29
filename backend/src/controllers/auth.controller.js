import jwt from 'jsonwebtoken';
import User from '../models/User.model.js';
import { sendOTPEmail } from '../utils/email.service.js';
import { 
  generateOTP, 
  storeOTP, 
  verifyOTP, 
  canSendOTP,
  getRemainingAttempts 
} from '../utils/otp.service.js';

// Set token cookie helper
const setTokenCookie = (res, token) => {
  res.cookie('token', token, {
    httpOnly: true,
    secure: process.env.NODE_ENV === 'production',
    sameSite: 'strict',
    maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
  });
};

// Generate JWT
const generateToken = (id) => {
  return jwt.sign({ id }, process.env.JWT_SECRET, {
    expiresIn: process.env.JWT_EXPIRE
  });
};

// Login with mobile/email
export const login = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;
    
    // Find user by email or mobile
    const user = await User.findOne({
      $or: [
        { email: emailOrMobile.toLowerCase() },
        { mobile: emailOrMobile }
      ]
    }).select('+password');
    
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Check password
    const isMatch = await user.comparePassword(password);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }
    
    // Generate token
    const token = generateToken(user._id);
    
    // Set cookie
    setTokenCookie(res, token);
    
    // Remove password from response
    user.password = undefined;
    
    res.status(200).json({
      success: true,
      message: 'Login successful',
      user
    });
    
  } catch (error) {
    console.error('Login error:', error);
    res.status(500).json({
      success: false,
      message: 'Login failed',
      error: error.message
    });
  }
};

// Send OTP for signup (only email)
export const sendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    if (!email) {
      return res.status(400).json({
        success: false,
        message: 'Email is required'
      });
    }
    
    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Check OTP send attempts
    if (!(await canSendOTP(email, 'usersignup'))) {
      return res.status(429).json({
        success: false,
        message: 'OTP limit reached. Try after some time.',
        remainingAttempts: 0
      });
    }
    
    // Generate and store OTP
    const otp = generateOTP();
    await storeOTP(email, otp, 'usersignup');
    
    // Send OTP email
    await sendOTPEmail(email, otp, 'usersignup');
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      remainingAttempts: await getRemainingAttempts(email, 'usersignup')
    });
    
  } catch (error) {
    console.error('Send OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

// Verify OTP only (doesn't create user)
export const verifySignupOTP = async (req, res) => {
  try {
    const { email, otp } = req.body;
    
    if (!email || !otp) {
      return res.status(400).json({
        success: false,
        message: 'Email and OTP are required'
      });
    }
    
    // Verify OTP
    const otpCheck = await verifyOTP(email, otp, 'usersignup');
    if (!otpCheck.valid) {
      return res.status(400).json({
        success: false,
        message: otpCheck.message
      });
    }
    
    res.status(200).json({
      success: true,
      message: 'OTP verified successfully',
      email: email.toLowerCase()
    });
    
  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'OTP verification failed',
      error: error.message
    });
  }
};

// Complete signup after OTP verification
export const completeSignup = async (req, res) => {
  try {
    const { name, email, mobile, password } = req.body;
    
    // Check all required fields
    if (!name || !email || !mobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }
    
    // Double-check if user already exists
    const existingUser = await User.findOne({ 
      $or: [
        { email: email.toLowerCase() },
        { mobile: mobile }
      ]
    });
    
    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists'
      });
    }
    
    // Create user
    const user = await User.create({
      name,
      email: email.toLowerCase(),
      mobile,
      password,
      isVerified: true
    });
    
    // Generate token
    const token = generateToken(user._id);
    
    // Set cookie
    setTokenCookie(res, token);
    
    // Remove password from response
    user.password = undefined;
    
    res.status(201).json({
      success: true,
      message: 'Account created successfully',
      user
    });
    
  } catch (error) {
    console.error('Complete signup error:', error);
    res.status(500).json({
      success: false,
      message: 'Signup failed',
      error: error.message
    });
  }
};

// Send OTP for forgot password
export const sendForgotOTP = async (req, res) => {
  try {
    const { email } = req.body;
    
    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Check OTP send attempts
    if (!(await canSendOTP(email, 'userforgotpass'))) {
      return res.status(429).json({
        success: false,
        message: 'OTP limit reached. Try after some time.',
        remainingAttempts: 0
      });
    }
    
    // Generate and store OTP
    const otp = generateOTP();
    await storeOTP(email, otp, 'userforgotpass');
    
    // Send OTP email
    await sendOTPEmail(email, otp, 'userforgotpass');
    
    res.status(200).json({
      success: true,
      message: 'OTP sent successfully',
      remainingAttempts: await getRemainingAttempts(email, 'userforgotpass')
    });
    
  } catch (error) {
    console.error('Forgot OTP error:', error);
    res.status(500).json({
      success: false,
      message: 'Failed to send OTP',
      error: error.message
    });
  }
};

// Verify OTP and reset password (forgot)
// In auth.controller.js - verifyForgotOTP function
export const verifyForgotOTP = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;
    
    // Verify OTP
    const otpCheck = await verifyOTP(email, otp, 'userforgotpass');
    if (!otpCheck.valid) {
      return res.status(400).json({
        success: false,
        message: otpCheck.message
      });
    }
    
    // Find user
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }
    
    // Update password - SAVE WITHOUT VALIDATION
    user.password = newPassword;
    await user.save({ validateBeforeSave: false }); // ADD THIS
    
    res.status(200).json({
      success: true,
      message: 'Password reset successfully'
    });
    
  } catch (error) {
    console.error('Forgot password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
};

// Reset password (logged in user)
export const resetPassword = async (req, res) => {
  try {
    const { currentPassword, newPassword } = req.body;
    
    // Get user with password
    const user = await User.findById(req.user._id).select('+password');
    
    // Verify current password
    const isMatch = await user.comparePassword(currentPassword);
    if (!isMatch) {
      return res.status(401).json({
        success: false,
        message: 'Current password is incorrect'
      });
    }
    
    // Update password - SAVE WITHOUT VALIDATION
    user.password = newPassword;
    await user.save({ validateBeforeSave: false }); // ADD THIS
    
    res.status(200).json({
      success: true,
      message: 'Password updated successfully'
    });
    
  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password update failed',
      error: error.message
    });
  }
};

// Logout
export const logout = (req, res) => {
  res.clearCookie('token');
  res.status(200).json({
    success: true,
    message: 'Logged out successfully'
  });
};