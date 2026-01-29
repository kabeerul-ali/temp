import OTP from '../models/OTP.model.js';

export const generateOTP = OTP.generateOTP;

export const storeOTP = async (email, otp, purpose) => {
  // Delete any existing OTP for same email and purpose
  await OTP.deleteOne({ email, purpose });
  
  const expiresAt = new Date(Date.now() + 10 * 60 * 1000); // 10 minutes
  
  await OTP.create({
    email,
    otp,
    purpose,
    expiresAt
  });
};

export const verifyOTP = async (email, userOTP, purpose) => {
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
  
  const isValid = await otpDoc.verifyOTP(userOTP);
  
  if (isValid) {
    // OTP verified successfully, OTP will be deleted automatically via TTL index
    return { valid: true };
  } else {
    return { 
      valid: false, 
      message: `Invalid OTP. ${3 - otpDoc.attempts} attempts remaining.`
    };
  }
};

export const canSendOTP = async (email, purpose) => {
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
};

export const getRemainingAttempts = async (email, purpose) => {
  const otpDoc = await OTP.findOne({ email, purpose });
  
  if (!otpDoc) return 3;
  
  return Math.max(0, 3 - otpDoc.attempts);
};