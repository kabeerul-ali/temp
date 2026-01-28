// controllers/auth.controller.js
import User from '../models/User.model.js';
import OTP from '../models/OTP.model.js';
import jwt from 'jsonwebtoken';

// Register user with verified OTP
export const registerUser = async (req, res) => {
  try {
    const { name, email, mobile, password, otp } = req.body;

    // Validation
    if (!name || !email || !mobile || !password || !otp) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (password.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Verify OTP
    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'usersignup'
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found. Please request a new OTP'
      });
    }

    const isValidOTP = await otpDoc.verifyOTP(otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({
      $or: [{ email: email.toLowerCase() }, { mobile }]
    });

    if (existingUser) {
      return res.status(400).json({
        success: false,
        message: 'User already exists with this email or mobile'
      });
    }

    // Create user
    const user = await User.create({
      name: name.trim(),
      email: email.toLowerCase(),
      mobile,
      password,
      isVerified: true
    });

    // Delete OTP after successful registration
    await otpDoc.deleteOne();

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000 // 7 days
    });

    // Remove password from response
    user.password = undefined;

    res.status(201).json({
      success: true,
      message: 'Registration successful',
      data: user,
      token
    });

  } catch (error) {
    console.error('Registration error:', error);
    res.status(500).json({
      success: false,
      message: 'Registration failed',
      error: error.message
    });
  }
};

// Login user with email/mobile and password
export const loginUser = async (req, res) => {
  try {
    const { emailOrMobile, password } = req.body;

    if (!emailOrMobile || !password) {
      return res.status(400).json({
        success: false,
        message: 'Email/Mobile and password are required'
      });
    }

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
    const isPasswordValid = await user.comparePassword(password);
    if (!isPasswordValid) {
      return res.status(401).json({
        success: false,
        message: 'Invalid credentials'
      });
    }

    // Generate token
    const token = jwt.sign(
      { id: user._id, email: user.email },
      process.env.JWT_SECRET,
      { expiresIn: process.env.JWT_EXPIRE }
    );

    // Set cookie
    res.cookie('token', token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict',
      maxAge: 7 * 24 * 60 * 60 * 1000
    });

    // Remove password from response
    user.password = undefined;

    res.status(200).json({
      success: true,
      message: 'Login successful',
      data: user,
      token
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

// Reset password with OTP
export const resetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    if (newPassword.length < 6) {
      return res.status(400).json({
        success: false,
        message: 'Password must be at least 6 characters'
      });
    }

    // Verify OTP
    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'userforgotpass'
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found'
      });
    }

    const isValidOTP = await otpDoc.verifyOTP(otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Find user and update password
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({
        success: false,
        message: 'User not found'
      });
    }

    user.password = newPassword;
    await user.save();

    // Delete OTP after successful reset
    await otpDoc.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Password reset successful'
    });

  } catch (error) {
    console.error('Reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Password reset failed',
      error: error.message
    });
  }
};

// Admin reset password with OTP
export const adminResetPassword = async (req, res) => {
  try {
    const { email, otp, newPassword } = req.body;

    if (!email || !otp || !newPassword) {
      return res.status(400).json({
        success: false,
        message: 'All fields are required'
      });
    }

    // Verify admin email
    const adminEmail = process.env.SUPERADMIN_EMAIL;
    if (email !== adminEmail) {
      return res.status(403).json({
        success: false,
        message: 'Unauthorized'
      });
    }

    // Verify OTP
    const otpDoc = await OTP.findOne({
      email: email.toLowerCase(),
      purpose: 'adminforgotpass'
    });

    if (!otpDoc) {
      return res.status(400).json({
        success: false,
        message: 'OTP expired or not found'
      });
    }

    const isValidOTP = await otpDoc.verifyOTP(otp);
    if (!isValidOTP) {
      return res.status(400).json({
        success: false,
        message: 'Invalid OTP'
      });
    }

    // Find and update admin (we'll use User model for admin too)
    let admin = await User.findOne({ email: email.toLowerCase() });
    
    if (!admin) {
      // Create admin user if not exists
      admin = await User.create({
        name: 'Super Admin',
        email: adminEmail,
        mobile: '0000000000',
        password: newPassword,
        isVerified: true
      });
    } else {
      // Update admin password
      admin.password = newPassword;
      await admin.save();
    }

    // Delete OTP
    await otpDoc.deleteOne();

    res.status(200).json({
      success: true,
      message: 'Admin password reset successful'
    });

  } catch (error) {
    console.error('Admin reset password error:', error);
    res.status(500).json({
      success: false,
      message: 'Admin password reset failed',
      error: error.message
    });
  }
};

// Logout user
export const logoutUser = (req, res) => {
  try {
    res.clearCookie('token', {
      httpOnly: true,
      secure: process.env.NODE_ENV === 'production',
      sameSite: 'strict'
    });

    res.status(200).json({
      success: true,
      message: 'Logout successful'
    });

  } catch (error) {
    console.error('Logout error:', error);
    res.status(500).json({
      success: false,
      message: 'Logout failed',
      error: error.message
    });
  }
};

// Get current user profile
export const getCurrentUser = async (req, res) => {
  try {
    const user = await User.findById(req.user._id)
      .select('-password')
      .populate('cart.productId', 'name price discountPrice images')
      .populate('cart.offerId', 'name price discount image');

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

// Middleware: Check if user is authenticated
export const isAuthenticated = async (req, res, next) => {
  try {
    const token = req.cookies.token || req.header('Authorization')?.replace('Bearer ', '');

    if (!token) {
      return res.status(401).json({
        success: false,
        message: 'Please login to access this resource'
      });
    }

    const decoded = jwt.verify(token, process.env.JWT_SECRET);
    
    const user = await User.findById(decoded.id).select('-password');
    if (!user) {
      return res.status(401).json({
        success: false,
        message: 'User not found'
      });
    }

    req.user = user;
    next();

  } catch (error) {
    console.error('Auth middleware error:', error);
    res.status(401).json({
      success: false,
      message: 'Invalid or expired token'
    });
  }
};