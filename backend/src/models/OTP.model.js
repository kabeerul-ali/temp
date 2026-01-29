// models/OTP.model.js
import mongoose from 'mongoose';
import bcrypt from 'bcryptjs';

const otpSchema = new mongoose.Schema({
  email: {
    type: String,
    required: true,
    lowercase: true,
    trim: true,
    index: true
  },
  otp: {
    type: String,
    required: true
  },
  purpose: {
    type: String,
    enum: ['usersignup', 'userforgotpass', 'adminforgotpass'],
    required: true,
    index: true
  },
  expiresAt: {
    type: Date,
    required: true,
    index: { expires: '10m' } // Auto delete after 10 minutes
  },
  attempts: {
    type: Number,
    default: 0,
    max: 3
  },
  lastAttempt: {
    type: Date,
    default: Date.now
  }
}, { 
  timestamps: true 
});

// NO PRE-SAVE HOOK AT ALL - Remove completely

// Generate 6 digit OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Verify OTP - SIMPLEST VERSION
otpSchema.methods.verifyOTP = async function(candidateOTP) {
  try {
    const isMatch = await bcrypt.compare(candidateOTP, this.otp);
    return isMatch;
  } catch (error) {
    console.error('OTP comparison error:', error);
    return false;
  }
};

// Check if OTP is expired
otpSchema.methods.isExpired = function() {
  return new Date() > this.expiresAt;
};

// Check if OTP is locked (too many attempts)
otpSchema.methods.isLocked = function() {
  return this.attempts >= 3;
};

export default mongoose.model('OTP', otpSchema);