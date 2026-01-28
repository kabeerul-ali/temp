// utils/emailService.js
import nodemailer from 'nodemailer';

const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASS
  }
});

export const sendOTPEmail = async (email, otp, type) => {
  try {
    let subject, html;

    switch (type) {
      case 'signup':
        subject = `Your Signup OTP: ${otp}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #10B981;">Welcome to Grocery Store!</h2>
            <p>Your OTP for signup is:</p>
            <h1 style="background: #10B981; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; letter-spacing: 5px;">
              ${otp}
            </h1>
            <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            <p>Use this OTP to complete your registration.</p>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              If you didn't request this OTP, please ignore this email.
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">
              © ${new Date().getFullYear()} Grocery Store. All rights reserved.
            </p>
          </div>
        `;
        break;

      case 'forgot-password':
        subject = `Password Reset OTP: ${otp}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #EF4444;">Password Reset Request</h2>
            <p>Your OTP for password reset is:</p>
            <h1 style="background: #EF4444; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; letter-spacing: 5px;">
              ${otp}
            </h1>
            <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            <p>Use this OTP to reset your password.</p>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              If you didn't request a password reset, please secure your account.
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">
              © ${new Date().getFullYear()} Grocery Store. All rights reserved.
            </p>
          </div>
        `;
        break;

      case 'admin-forgot-password':
        subject = `Admin Password Reset OTP: ${otp}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #8B5CF6;">Admin Password Reset</h2>
            <p>Your admin password reset OTP is:</p>
            <h1 style="background: #8B5CF6; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; letter-spacing: 5px;">
              ${otp}
            </h1>
            <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            <p>Use this OTP to reset your admin password.</p>
            <p style="color: #6B7280; font-size: 14px; margin-top: 30px;">
              If you didn't request this, please contact system administrator immediately.
            </p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">
              © ${new Date().getFullYear()} Grocery Store Admin. All rights reserved.
            </p>
          </div>
        `;
        break;

      default:
        subject = `Your OTP: ${otp}`;
        html = `
          <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
            <h2 style="color: #3B82F6;">Your OTP</h2>
            <p>Your OTP is:</p>
            <h1 style="background: #3B82F6; color: white; padding: 15px; border-radius: 8px; text-align: center; font-size: 32px; letter-spacing: 5px;">
              ${otp}
            </h1>
            <p>This OTP is valid for <strong>10 minutes</strong>.</p>
            <hr style="border: none; border-top: 1px solid #E5E7EB; margin: 30px 0;">
            <p style="color: #9CA3AF; font-size: 12px;">
              © ${new Date().getFullYear()} Grocery Store. All rights reserved.
            </p>
          </div>
        `;
    }

    await transporter.sendMail({
      from: `"Grocery Store" <${process.env.NODEMAILER_EMAIL}>`,
      to: email,
      subject: subject,
      html: html
    });

    console.log(`OTP email sent to ${email}`);
    return true;

  } catch (error) {
    console.error('Email sending error:', error);
    throw new Error('Failed to send OTP email');
  }
};