const nodemailer = require('nodemailer');
const logger = require('./logger');

/**
 * Email sender utility
 * @module utils/emailSender
 */

/**
 * Create a transporter object
 * @private
 */
const createTransporter = () => {
  return nodemailer.createTransport({
    service: process.env.EMAIL_SERVICE,
    auth: {
      user: process.env.EMAIL_USERNAME,
      pass: process.env.EMAIL_PASSWORD
    }
  });
};

/**
 * Send an email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.subject - Email subject
 * @param {string} options.text - Plain text content
 * @param {string} options.html - HTML content
 * @returns {Promise<Object>} - Nodemailer info object
 */
const sendEmail = async (options) => {
  try {
    const transporter = createTransporter();
    
    const message = {
      from: process.env.EMAIL_FROM || 'noreply@dern-support.com',
      to: options.to,
      subject: options.subject,
      text: options.text,
      html: options.html
    };
    
    const info = await transporter.sendMail(message);
    logger.info(`Email sent: ${info.messageId}`);
    return info;
  } catch (error) {
    logger.error(`Error sending email: ${error.message}`);
    throw error;
  }
};

/**
 * Send a verification email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.token - Verification token
 * @returns {Promise<Object>} - Nodemailer info object
 */
const sendVerificationEmail = async (options) => {
  const verificationUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth/verify?token=${options.token}`;
  
  return sendEmail({
    to: options.to,
    subject: 'Email Verification - Dern Support',
    text: `Hello ${options.name},\n\nPlease verify your email by clicking the link: ${verificationUrl}\n\nIf you did not request this, please ignore this email.\n`,
    html: `
      <h1>Email Verification</h1>
      <p>Hello ${options.name},</p>
      <p>Please verify your email by clicking the link below:</p>
      <a href="${verificationUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Verify Email</a>
      <p>If you did not request this, please ignore this email.</p>
    `
  });
};

/**
 * Send a password reset email
 * @param {Object} options - Email options
 * @param {string} options.to - Recipient email
 * @param {string} options.name - Recipient name
 * @param {string} options.token - Reset token
 * @returns {Promise<Object>} - Nodemailer info object
 */
const sendPasswordResetEmail = async (options) => {
  const resetUrl = `${process.env.FRONTEND_URL || 'http://localhost:8080'}/auth/reset-password?token=${options.token}`;
  
  return sendEmail({
    to: options.to,
    subject: 'Password Reset - Dern Support',
    text: `Hello ${options.name},\n\nYou requested a password reset. Please go to: ${resetUrl}\n\nIf you did not request this, please ignore this email.\n`,
    html: `
      <h1>Password Reset</h1>
      <p>Hello ${options.name},</p>
      <p>You requested a password reset. Please click the link below to reset your password:</p>
      <a href="${resetUrl}" style="display: inline-block; padding: 10px 20px; background-color: #4CAF50; color: white; text-decoration: none; border-radius: 5px;">Reset Password</a>
      <p>If you did not request this, please ignore this email.</p>
      <p>This link will expire in 10 minutes.</p>
    `
  });
};

module.exports = {
  sendEmail,
  sendVerificationEmail,
  sendPasswordResetEmail
};