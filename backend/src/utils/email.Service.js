// src/utils/email.service.js
import nodemailer from 'nodemailer';

import dotenv from 'dotenv';
dotenv.config();

// Debug: Check if env variables are loaded

console.log('Email config:', {
  email: process.env.NODEMAILER_EMAIL,
  pass: process.env.NODEMAILER_PASS ? '***' : 'MISSING'
});

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASS
  }
});

// Test connection
transporter.verify((error, success) => {
  if (error) {
    console.error('Email transporter error:', error);
  } else {
    console.log('Email transporter ready');
  }
});

export const sendOTPEmail = async (email, otp, purpose) => {
  try {
    const subject = purpose === 'usersignup' 
      ? 'Verify Your Email - Signup OTP' 
      : 'Reset Your Password - OTP';
    
    const html = `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #4CAF50;">Grocery Store</h2>
        <p>Your OTP for ${purpose === 'usersignup' ? 'signup' : 'password reset'} is:</p>
        <h1 style="background: #f4f4f4; padding: 15px; text-align: center; letter-spacing: 5px;">
          ${otp}
        </h1>
        <p>This OTP is valid for 10 minutes.</p>
        <p>If you didn't request this, please ignore this email.</p>
      </div>
    `;
    
    const mailOptions = {
      from: process.env.NODEMAILER_EMAIL,
      to: email,
      subject: subject,
      html: html
    };
    
   
    const info = await transporter.sendMail(mailOptions);
    console.log('Email sent:', info.response);
    
  } catch (error) {
   
    throw error;
  }
};