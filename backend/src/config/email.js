// src/config/email.js
import nodemailer from 'nodemailer';
import dotenv from "dotenv";
dotenv.config();

// Create transporter
const transporter = nodemailer.createTransport({
  service: 'gmail',
  auth: {
    user: process.env.NODEMAILER_EMAIL,
    pass: process.env.NODEMAILER_PASS
  }
});

// Verify transporter on startup
transporter.verify((error, success) => {
  if (error) {
    console.error('❌ Email configuration error:', error);
  } else {
    console.log('✅ Email server ready');
  }
});

/**
 * Send email
 * @param {Object} options - Email options
 * @param {String} options.to - Recipient email
 * @param {String} options.subject - Email subject
 * @param {String} options.text - Plain text content
 * @param {String} options.html - HTML content (optional)
 * @returns {Promise}
 */
export const sendEmail = async ({ to, subject, text, html }) => {
  try {
    const mailOptions = {
      from: `"${process.env.APP_NAME || 'Grocery Store'}" <${process.env.NODEMAILER_EMAIL}>`,
      to,
      subject,
      text,
      html: html || text
    };

    const info = await transporter.sendMail(mailOptions);
    console.log('✅ Email sent:', info.messageId);
    return info;
  } catch (error) {
    console.error('❌ Email send error:', error);
    throw error;
  }
};

export default transporter;