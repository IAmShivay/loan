import nodemailer from 'nodemailer';
import { logInfo, logError } from '@/lib/logger';

export interface EmailOptions {
  to: string | string[];
  subject: string;
  template?: string;
  html?: string;
  text?: string;
  data?: Record<string, any>;
  attachments?: Array<{
    filename: string;
    content: Buffer | string;
    contentType?: string;
  }>;
}

// Email templates
const templates = {
  'payment-confirmation': (data: any) => ({
    subject: `Payment Confirmation - ${data.applicationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Payment Confirmation</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your payment has been successfully processed for loan application <strong>${data.applicationNumber}</strong>.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Payment Details</h3>
          <table style="width: 100%; border-collapse: collapse;">
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Payment ID:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${data.paymentId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Transaction ID:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${data.transactionId}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Amount:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">₹${data.amount} ${data.currency}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;"><strong>Payment Method:</strong></td>
              <td style="padding: 8px 0; border-bottom: 1px solid #e2e8f0;">${data.paymentMethod}</td>
            </tr>
            <tr>
              <td style="padding: 8px 0;"><strong>Date & Time:</strong></td>
              <td style="padding: 8px 0;">${new Date(data.completedAt).toLocaleString('en-IN')}</td>
            </tr>
          </table>
        </div>
        
        <p>Your loan application is now being processed. You will receive updates on the status via email and SMS.</p>
        
        <p>If you have any questions, please contact our support team.</p>
        
        <p>Best regards,<br>Loan Management Team</p>
      </div>
    `,
    text: `
      Payment Confirmation
      
      Dear ${data.customerName},
      
      Your payment has been successfully processed for loan application ${data.applicationNumber}.
      
      Payment Details:
      - Payment ID: ${data.paymentId}
      - Transaction ID: ${data.transactionId}
      - Amount: ₹${data.amount} ${data.currency}
      - Payment Method: ${data.paymentMethod}
      - Date & Time: ${new Date(data.completedAt).toLocaleString('en-IN')}
      
      Your loan application is now being processed. You will receive updates on the status via email and SMS.
      
      If you have any questions, please contact our support team.
      
      Best regards,
      Loan Management Team
    `
  }),

  'application-status-update': (data: any) => ({
    subject: `Application Status Update - ${data.applicationNumber}`,
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Application Status Update</h2>
        <p>Dear ${data.customerName},</p>
        <p>Your loan application <strong>${data.applicationNumber}</strong> status has been updated.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Status Details</h3>
          <p><strong>Current Status:</strong> <span style="color: #059669;">${data.status}</span></p>
          <p><strong>Updated By:</strong> ${data.updatedBy}</p>
          <p><strong>Date:</strong> ${new Date(data.updatedAt).toLocaleString('en-IN')}</p>
          ${data.comments ? `<p><strong>Comments:</strong> ${data.comments}</p>` : ''}
        </div>
        
        <p>You can track your application status by logging into your account.</p>
        
        <p>Best regards,<br>Loan Management Team</p>
      </div>
    `,
    text: `
      Application Status Update
      
      Dear ${data.customerName},
      
      Your loan application ${data.applicationNumber} status has been updated.
      
      Status Details:
      - Current Status: ${data.status}
      - Updated By: ${data.updatedBy}
      - Date: ${new Date(data.updatedAt).toLocaleString('en-IN')}
      ${data.comments ? `- Comments: ${data.comments}` : ''}
      
      You can track your application status by logging into your account.
      
      Best regards,
      Loan Management Team
    `
  }),

  'welcome': (data: any) => ({
    subject: 'Welcome to Loan Management System',
    html: `
      <div style="font-family: Arial, sans-serif; max-width: 600px; margin: 0 auto;">
        <h2 style="color: #2563eb;">Welcome to Loan Management System</h2>
        <p>Dear ${data.name},</p>
        <p>Welcome to our Loan Management System! Your account has been successfully created.</p>
        
        <div style="background-color: #f8fafc; padding: 20px; border-radius: 8px; margin: 20px 0;">
          <h3 style="margin-top: 0;">Account Details</h3>
          <p><strong>Email:</strong> ${data.email}</p>
          <p><strong>Role:</strong> ${data.role}</p>
        </div>
        
        <p>You can now log in to your account and start managing your loan applications.</p>
        
        <p>Best regards,<br>Loan Management Team</p>
      </div>
    `,
    text: `
      Welcome to Loan Management System
      
      Dear ${data.name},
      
      Welcome to our Loan Management System! Your account has been successfully created.
      
      Account Details:
      - Email: ${data.email}
      - Role: ${data.role}
      
      You can now log in to your account and start managing your loan applications.
      
      Best regards,
      Loan Management Team
    `
  })
};

// Create transporter
const createTransporter = () => {
  return nodemailer.createTransport({
    host: process.env.SMTP_HOST || 'smtp.gmail.com',
    port: parseInt(process.env.SMTP_PORT || '587'),
    secure: process.env.SMTP_SECURE === 'true',
    auth: {
      user: process.env.SMTP_USER,
      pass: process.env.SMTP_PASS,
    },
  });
};

export async function sendEmail(options: EmailOptions): Promise<void> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      logError('Email configuration missing', new Error('SMTP credentials not configured'));
      return;
    }

    const transporter = createTransporter();

    let emailContent = {
      subject: options.subject,
      html: options.html,
      text: options.text,
    };

    // Use template if specified
    if (options.template && templates[options.template as keyof typeof templates]) {
      const templateFn = templates[options.template as keyof typeof templates];
      const templateContent = templateFn(options.data || {});
      emailContent = {
        subject: templateContent.subject,
        html: templateContent.html,
        text: templateContent.text,
      };
    }

    const mailOptions = {
      from: `"Loan Management System" <${process.env.SMTP_USER}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      attachments: options.attachments,
    };

    const result = await transporter.sendMail(mailOptions);

    logInfo('Email sent successfully', {
      to: options.to,
      subject: emailContent.subject,
      messageId: result.messageId,
      template: options.template
    });

  } catch (error) {
    logError('Failed to send email', error, {
      to: options.to,
      subject: options.subject,
      template: options.template
    });
    throw error;
  }
}

export async function sendBulkEmail(recipients: string[], options: Omit<EmailOptions, 'to'>): Promise<void> {
  const promises = recipients.map(recipient => 
    sendEmail({ ...options, to: recipient })
  );

  try {
    await Promise.allSettled(promises);
    logInfo('Bulk email sent', { recipientCount: recipients.length });
  } catch (error) {
    logError('Bulk email failed', error, { recipientCount: recipients.length });
    throw error;
  }
}

export async function verifyEmailConfiguration(): Promise<boolean> {
  try {
    if (!process.env.SMTP_USER || !process.env.SMTP_PASS) {
      return false;
    }

    const transporter = createTransporter();
    await transporter.verify();
    return true;
  } catch (error) {
    logError('Email configuration verification failed', error);
    return false;
  }
}
