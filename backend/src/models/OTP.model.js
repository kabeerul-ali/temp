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

// Encrypt OTP before saving
otpSchema.pre('save', async function(next) {
  if (!this.isModified('otp')) return next();
  
  try {
    const salt = await bcrypt.genSalt(10);
    this.otp = await bcrypt.hash(this.otp, salt);
    next();
  } catch (error) {
    next(error);
  }
});

// Generate 6 digit OTP
otpSchema.statics.generateOTP = function() {
  return Math.floor(100000 + Math.random() * 900000).toString();
};

// Verify OTP
otpSchema.methods.verifyOTP = async function(candidateOTP) {
  try {
    const isMatch = await bcrypt.compare(candidateOTP, this.otp);
    
    if (isMatch) {
      this.attempts = 0;
      await this.save();
      return true;
    } else {
      this.attempts += 1;
      this.lastAttempt = new Date();
      await this.save();
      
      if (this.attempts >= 3) {
        await this.deleteOne();
      }
      
      return false;
    }
  } catch (error) {
    throw new Error('OTP verification failed');
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