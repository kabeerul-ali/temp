// src/utils/otp.service.js
import OTP from '../models/OTP.model.js';
import bcrypt from 'bcryptjs';

export const generateOTP = OTP.generateOTP;

export const storeOTP = async (email, otp, purpose) => {
  try {
    // Delete any existing OTP for same email and purpose
    await OTP.deleteOne({ email, purpose });
    
    const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
    
    // HASH the OTP before storing
    const salt = await bcrypt.genSalt(10);
    const hashedOTP = await bcrypt.hash(otp, salt);
    
    await OTP.create({
      email,
      otp: hashedOTP, // Store HASHED OTP
      purpose,
      expiresAt,
      attempts: 0,
      lastAttempt: new Date()
    });
  } catch (error) {
    console.error('Store OTP error:', error);
    throw error;
  }
};

export const verifyOTP = async (email, userOTP, purpose) => {
  try {
    const otpDoc = await OTP.findOne({ email, purpose });
    
    if (!otpDoc) {
      return { valid: false, message: 'OTP not found' };
    }
    
    if (otpDoc.isExpired()) {
      await otpDoc.deleteOne();
      return { valid: false, message: 'OTP expired' };
    }
    
    if (otpDoc.isLocked()) {
      await otpDoc.deleteOne();
      return { valid: false, message: 'Too many attempts. Request new OTP.' };
    }
    
    const isValid = await bcrypt.compare(userOTP, otpDoc.otp);
    
    if (isValid) {
      // OTP verified successfully - delete it
      await otpDoc.deleteOne();
      return { valid: true };
    } else {
      // Invalid OTP - increment attempts
      otpDoc.attempts += 1;
      otpDoc.lastAttempt = new Date();
      await otpDoc.save();
      
      if (otpDoc.attempts >= 3) {
        await otpDoc.deleteOne();
        return { valid: false, message: 'Too many attempts. OTP locked.' };
      }
      
      return { 
        valid: false, 
        message: `Invalid OTP. ${3 - otpDoc.attempts} attempts remaining.`
      };
    }
  } catch (error) {
    console.error('Verify OTP error:', error);
    return { valid: false, message: 'OTP verification failed' };
  }
};

export const canSendOTP = async (email, purpose) => {
  try {
    const otpDoc = await OTP.findOne({ email, purpose });
    
    if (!otpDoc) return true;
    
    // Check if locked
    if (otpDoc.isLocked()) {
      return false;
    }
    
    // Check time since last attempt (1 minute cooldown)
    const timeSinceLast = Date.now() - otpDoc.lastAttempt;
    if (timeSinceLast < 60000) {
      return false;
    }
    
    return true;
  } catch (error) {
    console.error('Can send OTP error:', error);
    return true; // Default to allowing if error
  }
};

export const getRemainingAttempts = async (email, purpose) => {
  try {
    const otpDoc = await OTP.findOne({ email, purpose });
    
    if (!otpDoc) return 3;
    
    return Math.max(0, 3 - otpDoc.attempts);
  } catch (error) {
    console.error('Get remaining attempts error:', error);
    return 3;
  }
};