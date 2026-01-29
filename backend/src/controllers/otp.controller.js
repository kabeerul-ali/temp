// controllers/otp.controller.js
import OTP from '../models/OTP.model.js';
import User from '../models/User.model.js';
import { sendOTPEmail } from '../utils/email.Service.js';

// Rate limiting helper
const rateLimit = new Map();

const checkRateLimit = (email, purpose) => {
  const key = `${email}:${purpose}`;
  const now = Date.now();
  
  if (rateLimit.has(key)) {
    const lastRequest = rateLimit.get(key);
    const timeDiff = now - lastRequest;
    
    // 60 seconds cooldown
    if (timeDiff < 60000) {
      return false;
    }
  }
  
  rateLimit.set(key, now);
  return true;
};

// Send OTP for user signup
export const sendSignupOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check rate limit
    if (!checkRateLimit(email, 'usersignup')) {
      return res.status(429).json({ 
        success: false, 
        message: 'Please wait 60 seconds before requesting another OTP' 
      });
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email: email.toLowerCase() });
    if (existingUser) {
      return res.status(400).json({ 
        success: false, 
        message: 'User already registered with this email' 
      });
    }

    // Check if active OTP already exists
    const existingOTP = await OTP.findOne({ 
      email: email.toLowerCase(), 
      purpose: 'usersignup' 
    });

    if (existingOTP && !existingOTP.isExpired()) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP already sent. Please check your email or wait for expiry' 
      });
    }

    // Generate new OTP
    const otpCode = OTP.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes

    // Create OTP document
    const otp = new OTP({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose: 'usersignup',
      expiresAt
    });

    await otp.save();

    // Send email
    await sendOTPEmail(email, otpCode, 'signup');

    res.status(200).json({ 
      success: true, 
      message: 'OTP sent successfully to your email' 
    });

  } catch (error) {
    console.error('Send signup OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP' 
    });
  }
};

// Send OTP for user forgot password
export const sendUserForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check rate limit
    if (!checkRateLimit(email, 'userforgotpass')) {
      return res.status(429).json({ 
        success: false, 
        message: 'Please wait 60 seconds before requesting another OTP' 
      });
    }

    // Check if user exists
    const user = await User.findOne({ email: email.toLowerCase() });
    if (!user) {
      return res.status(404).json({ 
        success: false, 
        message: 'User not found with this email' 
      });
    }

    // Check if active OTP already exists
    const existingOTP = await OTP.findOne({ 
      email: email.toLowerCase(), 
      purpose: 'userforgotpass' 
    });

    if (existingOTP && !existingOTP.isExpired()) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP already sent. Please check your email or wait for expiry' 
      });
    }

    // Generate new OTP
    const otpCode = OTP.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Create OTP document
    const otp = new OTP({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose: 'userforgotpass',
      expiresAt
    });

    await otp.save();

    // Send email
    await sendOTPEmail(email, otpCode, 'forgot-password');

    res.status(200).json({ 
      success: true, 
      message: 'Password reset OTP sent successfully' 
    });

  } catch (error) {
    console.error('Send forgot password OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP' 
    });
  }
};

// Send OTP for admin forgot password
export const sendAdminForgotPasswordOTP = async (req, res) => {
  try {
    const { email } = req.body;

    if (!email) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email is required' 
      });
    }

    // Check rate limit
    if (!checkRateLimit(email, 'adminforgotpass')) {
      return res.status(429).json({ 
        success: false, 
        message: 'Please wait 60 seconds before requesting another OTP' 
      });
    }

    // Check if admin exists (superadmin email from env)
    const adminEmail = process.env.SUPERADMIN_EMAIL;
    if (email !== adminEmail) {
      return res.status(404).json({ 
        success: false, 
        message: 'Admin not found' 
      });
    }

    // Check if active OTP already exists
    const existingOTP = await OTP.findOne({ 
      email: email.toLowerCase(), 
      purpose: 'adminforgotpass' 
    });

    if (existingOTP && !existingOTP.isExpired()) {
      return res.status(400).json({ 
        success: false, 
        message: 'OTP already sent. Please check your email or wait for expiry' 
      });
    }

    // Generate new OTP
    const otpCode = OTP.generateOTP();
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000);

    // Create OTP document
    const otp = new OTP({
      email: email.toLowerCase(),
      otp: otpCode,
      purpose: 'adminforgotpass',
      expiresAt
    });

    await otp.save();

    // Send email
    await sendOTPEmail(email, otpCode, 'admin-forgot-password');

    res.status(200).json({ 
      success: true, 
      message: 'Admin password reset OTP sent successfully' 
    });

  } catch (error) {
    console.error('Send admin forgot password OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to send OTP' 
    });
  }
};

// Verify OTP
export const verifyOTP = async (req, res) => {
  try {
    const { email, otp, purpose } = req.body;

    if (!email || !otp || !purpose) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email, OTP and purpose are required' 
      });
    }

    // Find OTP
    const otpDoc = await OTP.findOne({ 
      email: email.toLowerCase(), 
      purpose 
    });

    if (!otpDoc) {
      return res.status(404).json({ 
        success: false, 
        message: 'OTP not found or expired' 
      });
    }

    // Check if OTP is locked
    if (otpDoc.isLocked()) {
      await otpDoc.deleteOne();
      return res.status(400).json({ 
        success: false, 
        message: 'OTP locked due to too many attempts. Please request a new OTP' 
      });
    }

    // Check if OTP is expired
    if (otpDoc.isExpired()) {
      await otpDoc.deleteOne();
      return res.status(400).json({ 
        success: false, 
        message: 'OTP expired. Please request a new OTP' 
      });
    }

    // Verify OTP
    const isValid = await otpDoc.verifyOTP(otp);

    if (!isValid) {
      return res.status(400).json({ 
        success: false, 
        message: 'Invalid OTP', 
        attemptsLeft: 3 - otpDoc.attempts 
      });
    }

    // OTP verified successfully
    res.status(200).json({ 
      success: true, 
      message: 'OTP verified successfully',
      verified: true
    });

  } catch (error) {
    console.error('Verify OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to verify OTP' 
    });
  }
};

// Resend OTP
export const resendOTP = async (req, res) => {
  try {
    const { email, purpose } = req.body;

    if (!email || !purpose) {
      return res.status(400).json({ 
        success: false, 
        message: 'Email and purpose are required' 
      });
    }

    // Delete existing OTP
    await OTP.deleteOne({ 
      email: email.toLowerCase(), 
      purpose 
    });

    // Call appropriate send OTP function based on purpose
    let sendFunction;
    switch (purpose) {
      case 'usersignup':
        sendFunction = sendSignupOTP;
        break;
      case 'userforgotpass':
        sendFunction = sendUserForgotPasswordOTP;
        break;
      case 'adminforgotpass':
        sendFunction = sendAdminForgotPasswordOTP;
        break;
      default:
        return res.status(400).json({ 
          success: false, 
          message: 'Invalid purpose' 
        });
    }

    // Call the send function
    return sendFunction(req, res);

  } catch (error) {
    console.error('Resend OTP error:', error);
    res.status(500).json({ 
      success: false, 
      message: 'Failed to resend OTP' 
    });
  }
};