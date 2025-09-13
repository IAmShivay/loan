import nodemailer from 'nodemailer';

// Email configuration
const emailConfig = {
  host: process.env.SMTP_HOST || 'smtp.gmail.com',
  port: parseInt(process.env.SMTP_PORT || '587'),
  secure: process.env.SMTP_SECURE === 'true', // true for 465, false for other ports
  auth: {
    user: process.env.SMTP_USER || 'your-email@gmail.com',
    pass: process.env.SMTP_PASS || 'your-app-password',
  },
};

// Create reusable transporter
export const transporter = nodemailer.createTransport(emailConfig);

// Verify connection configuration
export async function verifyEmailConnection(): Promise<boolean> {
  try {
    await transporter.verify();
    console.log('✅ Email server is ready to take our messages');
    return true;
  } catch (error) {
    console.error('❌ Email server connection failed:', error);
    return false;
  }
}

// Email templates configuration
export const EMAIL_TEMPLATES = {
  WELCOME: {
    subject: 'Welcome to Loan Management System',
    template: 'welcome',
  },
  FORGOT_PASSWORD: {
    subject: 'Reset Your Password',
    template: 'forgot-password',
  },
  PASSWORD_RESET_SUCCESS: {
    subject: 'Password Reset Successful',
    template: 'password-reset-success',
  },
  PROFILE_UPDATE: {
    subject: 'Profile Updated Successfully',
    template: 'profile-update',
  },
  APPLICATION_SUBMITTED: {
    subject: 'Loan Application Submitted',
    template: 'application-submitted',
  },
  APPLICATION_APPROVED: {
    subject: 'Loan Application Approved',
    template: 'application-approved',
  },
  APPLICATION_REJECTED: {
    subject: 'Loan Application Update',
    template: 'application-rejected',
  },
  PAYMENT_SUCCESS: {
    subject: 'Payment Successful',
    template: 'payment-success',
  },
  PAYMENT_FAILED: {
    subject: 'Payment Failed',
    template: 'payment-failed',
  },
  DOCUMENT_REQUIRED: {
    subject: 'Additional Documents Required',
    template: 'document-required',
  },
  DSA_ASSIGNED: {
    subject: 'DSA Assigned to Your Application',
    template: 'dsa-assigned',
  },
  INVOICE: {
    subject: 'Invoice for Your Loan Application',
    template: 'invoice',
  },
};

// Default email options
export const DEFAULT_EMAIL_OPTIONS = {
  from: {
    name: process.env.EMAIL_FROM_NAME || 'Loan Management System',
    address: process.env.EMAIL_FROM_ADDRESS || 'noreply@loanmanagement.com',
  },
  replyTo: process.env.EMAIL_REPLY_TO || 'support@loanmanagement.com',
};

// Email queue configuration (for production use with Redis/Bull)
export const EMAIL_QUEUE_CONFIG = {
  redis: {
    host: process.env.REDIS_HOST || 'localhost',
    port: parseInt(process.env.REDIS_PORT || '6379'),
    password: process.env.REDIS_PASSWORD,
  },
  defaultJobOptions: {
    removeOnComplete: 100,
    removeOnFail: 50,
    attempts: 3,
    backoff: {
      type: 'exponential',
      delay: 2000,
    },
  },
};
