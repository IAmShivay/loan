import { transporter, DEFAULT_EMAIL_OPTIONS } from './config';
import * as templates from './templates';

export interface SendEmailOptions {
  to: string | string[];
  cc?: string | string[];
  bcc?: string | string[];
  replyTo?: string;
  priority?: 'high' | 'normal' | 'low';
}

export interface EmailResult {
  success: boolean;
  messageId?: string;
  error?: string;
}

/**
 * Send email using template
 */
export async function sendEmail(
  templateName: keyof typeof templates,
  templateData: any,
  options: SendEmailOptions
): Promise<EmailResult> {
  try {
    // Get template function
    const templateFunction = templates[templateName];
    if (!templateFunction) {
      throw new Error(`Template ${templateName} not found`);
    }

    // Generate email content
    const emailContent = templateFunction(templateData);

    // Prepare email options
    const mailOptions = {
      from: `${DEFAULT_EMAIL_OPTIONS.from.name} <${DEFAULT_EMAIL_OPTIONS.from.address}>`,
      to: Array.isArray(options.to) ? options.to.join(', ') : options.to,
      cc: options.cc ? (Array.isArray(options.cc) ? options.cc.join(', ') : options.cc) : undefined,
      bcc: options.bcc ? (Array.isArray(options.bcc) ? options.bcc.join(', ') : options.bcc) : undefined,
      replyTo: options.replyTo || DEFAULT_EMAIL_OPTIONS.replyTo,
      subject: emailContent.subject,
      html: emailContent.html,
      text: emailContent.text,
      priority: options.priority || 'normal',
    };

    // Send email
    const result = await transporter.sendMail(mailOptions);

    return {
      success: true,
      messageId: result.messageId,
    };
  } catch (error) {
    console.error('Email sending failed:', error);
    return {
      success: false,
      error: error instanceof Error ? error.message : 'Unknown error',
    };
  }
}

/**
 * Send welcome email
 */
export async function sendWelcomeEmail(
  userData: { firstName: string; email: string; role: string }
): Promise<EmailResult> {
  return sendEmail('welcomeTemplate', userData, {
    to: userData.email,
    priority: 'high',
  });
}

/**
 * Send forgot password email
 */
export async function sendForgotPasswordEmail(
  userData: { firstName: string; email: string; resetToken: string }
): Promise<EmailResult> {
  return sendEmail('forgotPasswordTemplate', {
    ...userData,
    expiresIn: '1 hour',
  }, {
    to: userData.email,
    priority: 'high',
  });
}

/**
 * Send application submitted email
 */
export async function sendApplicationSubmittedEmail(
  applicationData: {
    firstName: string;
    email: string;
    applicationId: string;
    loanAmount: string;
    course: string;
    institute: string;
  }
): Promise<EmailResult> {
  return sendEmail('applicationSubmittedTemplate', applicationData, {
    to: applicationData.email,
  });
}

/**
 * Send application approved email
 */
export async function sendApplicationApprovedEmail(
  applicationData: {
    firstName: string;
    email: string;
    applicationId: string;
    loanAmount: string;
    approvedAmount: string;
    dsaName: string;
    bankName: string;
  }
): Promise<EmailResult> {
  return sendEmail('applicationApprovedTemplate', applicationData, {
    to: applicationData.email,
    priority: 'high',
  });
}

/**
 * Send payment success email
 */
export async function sendPaymentSuccessEmail(
  paymentData: {
    firstName: string;
    email: string;
    applicationId: string;
    amount: string;
    transactionId: string;
    paymentMethod: string;
  }
): Promise<EmailResult> {
  return sendEmail('paymentSuccessTemplate', paymentData, {
    to: paymentData.email,
  });
}

/**
 * Send DSA assigned email
 */
export async function sendDSAAssignedEmail(
  assignmentData: {
    firstName: string;
    email: string;
    applicationId: string;
    dsaName: string;
    dsaEmail: string;
    dsaPhone: string;
    bankName: string;
  }
): Promise<EmailResult> {
  return sendEmail('dsaAssignedTemplate', assignmentData, {
    to: assignmentData.email,
  });
}

/**
 * Send profile update email
 */
export async function sendProfileUpdateEmail(
  userData: {
    firstName: string;
    email: string;
    updatedFields: string[];
  }
): Promise<EmailResult> {
  return sendEmail('profileUpdateTemplate', userData, {
    to: userData.email,
  });
}

/**
 * Send invoice email
 */
export async function sendInvoiceEmail(
  invoiceData: {
    firstName: string;
    email: string;
    applicationId: string;
    invoiceNumber: string;
    amount: string;
    dueDate: string;
    items: Array<{ description: string; amount: string; }>;
  }
): Promise<EmailResult> {
  return sendEmail('invoiceTemplate', invoiceData, {
    to: invoiceData.email,
  });
}

/**
 * Send bulk emails (for notifications, newsletters, etc.)
 */
export async function sendBulkEmails(
  templateName: keyof typeof templates,
  recipients: Array<{ email: string; data: any }>,
  options: Omit<SendEmailOptions, 'to'> = {}
): Promise<EmailResult[]> {
  const results: EmailResult[] = [];

  for (const recipient of recipients) {
    const result = await sendEmail(templateName, recipient.data, {
      ...options,
      to: recipient.email,
    });
    results.push(result);

    // Add delay to avoid rate limiting
    await new Promise(resolve => setTimeout(resolve, 100));
  }

  return results;
}

/**
 * Validate email address
 */
export function isValidEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

/**
 * Format email addresses for display
 */
export function formatEmailAddress(name: string, email: string): string {
  return `${name} <${email}>`;
}
