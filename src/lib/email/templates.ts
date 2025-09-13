// Email template functions
export interface EmailTemplateData {
  [key: string]: any;
}

export interface EmailTemplate {
  subject: string;
  html: string;
  text: string;
}

// Base template wrapper
const baseTemplate = (content: string, title: string) => `
<!DOCTYPE html>
<html lang="en">
<head>
    <meta charset="UTF-8">
    <meta name="viewport" content="width=device-width, initial-scale=1.0">
    <title>${title}</title>
    <style>
        body { font-family: Arial, sans-serif; line-height: 1.6; color: #333; max-width: 600px; margin: 0 auto; padding: 20px; }
        .header { background: linear-gradient(135deg, #667eea 0%, #764ba2 100%); color: white; padding: 30px; text-align: center; border-radius: 10px 10px 0 0; }
        .content { background: #f9f9f9; padding: 30px; border-radius: 0 0 10px 10px; }
        .button { display: inline-block; background: #667eea; color: white; padding: 12px 30px; text-decoration: none; border-radius: 5px; margin: 20px 0; }
        .footer { text-align: center; margin-top: 30px; padding-top: 20px; border-top: 1px solid #ddd; color: #666; font-size: 14px; }
        .highlight { background: #e3f2fd; padding: 15px; border-left: 4px solid #2196f3; margin: 20px 0; }
        .status-approved { color: #4caf50; font-weight: bold; }
        .status-rejected { color: #f44336; font-weight: bold; }
        .status-pending { color: #ff9800; font-weight: bold; }
    </style>
</head>
<body>
    <div class="header">
        <h1>Loan Management System</h1>
    </div>
    <div class="content">
        ${content}
    </div>
    <div class="footer">
        <p>© 2024 Loan Management System. All rights reserved.</p>
        <p>If you have any questions, contact us at <a href="mailto:support@loanmanagement.com">support@loanmanagement.com</a></p>
    </div>
</body>
</html>
`;

// Welcome email template
export function welcomeTemplate(data: { firstName: string; email: string; role: string }): EmailTemplate {
  const content = `
    <h2>Welcome to Loan Management System, ${data.firstName}!</h2>
    <p>Thank you for joining our platform. Your account has been successfully created with the following details:</p>
    <div class="highlight">
        <p><strong>Email:</strong> ${data.email}</p>
        <p><strong>Role:</strong> ${data.role.toUpperCase()}</p>
        <p><strong>Account Status:</strong> Active</p>
    </div>
    <p>You can now access your dashboard and start managing your loan applications.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/login" class="button">Login to Your Account</a>
    <p>If you didn't create this account, please contact our support team immediately.</p>
  `;

  return {
    subject: 'Welcome to Loan Management System',
    html: baseTemplate(content, 'Welcome'),
    text: `Welcome to Loan Management System, ${data.firstName}! Your account has been created successfully. Email: ${data.email}, Role: ${data.role}. Login at ${process.env.NEXT_PUBLIC_APP_URL}/login`
  };
}

// Forgot password template
export function forgotPasswordTemplate(data: { firstName: string; resetToken: string; expiresIn: string }): EmailTemplate {
  const resetUrl = `${process.env.NEXT_PUBLIC_APP_URL}/reset-password?token=${data.resetToken}`;
  
  const content = `
    <h2>Password Reset Request</h2>
    <p>Hello ${data.firstName},</p>
    <p>We received a request to reset your password. Click the button below to create a new password:</p>
    <a href="${resetUrl}" class="button">Reset Password</a>
    <div class="highlight">
        <p><strong>Important:</strong> This link will expire in ${data.expiresIn}.</p>
        <p>If you didn't request this password reset, please ignore this email.</p>
    </div>
    <p>For security reasons, please don't share this link with anyone.</p>
  `;

  return {
    subject: 'Reset Your Password - Loan Management System',
    html: baseTemplate(content, 'Password Reset'),
    text: `Password reset requested for ${data.firstName}. Reset your password at: ${resetUrl}. Link expires in ${data.expiresIn}.`
  };
}

// Application submitted template
export function applicationSubmittedTemplate(data: { 
  firstName: string; 
  applicationId: string; 
  loanAmount: string; 
  course: string; 
  institute: string;
}): EmailTemplate {
  const content = `
    <h2>Loan Application Submitted Successfully</h2>
    <p>Dear ${data.firstName},</p>
    <p>Your education loan application has been submitted successfully. Here are the details:</p>
    <div class="highlight">
        <p><strong>Application ID:</strong> ${data.applicationId}</p>
        <p><strong>Loan Amount:</strong> ${data.loanAmount}</p>
        <p><strong>Course:</strong> ${data.course}</p>
        <p><strong>Institute:</strong> ${data.institute}</p>
        <p><strong>Status:</strong> <span class="status-pending">Under Review</span></p>
    </div>
    <p>Our team will review your application and get back to you within 2-3 business days.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/applications" class="button">Track Your Application</a>
    <p>Thank you for choosing our loan management system!</p>
  `;

  return {
    subject: `Loan Application Submitted - ${data.applicationId}`,
    html: baseTemplate(content, 'Application Submitted'),
    text: `Loan application submitted successfully. Application ID: ${data.applicationId}, Amount: ${data.loanAmount}, Course: ${data.course}, Institute: ${data.institute}`
  };
}

// Application approved template
export function applicationApprovedTemplate(data: { 
  firstName: string; 
  applicationId: string; 
  loanAmount: string; 
  approvedAmount: string;
  dsaName: string;
  bankName: string;
}): EmailTemplate {
  const content = `
    <h2>🎉 Congratulations! Your Loan Application is Approved</h2>
    <p>Dear ${data.firstName},</p>
    <p>We're excited to inform you that your education loan application has been <span class="status-approved">APPROVED</span>!</p>
    <div class="highlight">
        <p><strong>Application ID:</strong> ${data.applicationId}</p>
        <p><strong>Requested Amount:</strong> ${data.loanAmount}</p>
        <p><strong>Approved Amount:</strong> ${data.approvedAmount}</p>
        <p><strong>Approved by:</strong> ${data.dsaName} (${data.bankName})</p>
    </div>
    <p>Next steps:</p>
    <ul>
        <li>Our DSA will contact you within 24 hours</li>
        <li>Complete the final documentation process</li>
        <li>Loan disbursement will be processed after verification</li>
    </ul>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/applications/${data.applicationId}" class="button">View Application Details</a>
  `;

  return {
    subject: `🎉 Loan Approved - ${data.applicationId}`,
    html: baseTemplate(content, 'Loan Approved'),
    text: `Congratulations! Your loan application ${data.applicationId} has been approved for ${data.approvedAmount}. DSA: ${data.dsaName} (${data.bankName})`
  };
}

// Payment success template
export function paymentSuccessTemplate(data: { 
  firstName: string; 
  applicationId: string; 
  amount: string; 
  transactionId: string; 
  paymentMethod: string;
}): EmailTemplate {
  const content = `
    <h2>Payment Successful</h2>
    <p>Dear ${data.firstName},</p>
    <p>Your payment has been processed successfully. Here are the transaction details:</p>
    <div class="highlight">
        <p><strong>Application ID:</strong> ${data.applicationId}</p>
        <p><strong>Amount Paid:</strong> ${data.amount}</p>
        <p><strong>Transaction ID:</strong> ${data.transactionId}</p>
        <p><strong>Payment Method:</strong> ${data.paymentMethod}</p>
        <p><strong>Status:</strong> <span class="status-approved">Successful</span></p>
    </div>
    <p>Your application will now be processed by our team.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/applications" class="button">View Application Status</a>
  `;

  return {
    subject: `Payment Successful - ${data.transactionId}`,
    html: baseTemplate(content, 'Payment Successful'),
    text: `Payment successful for application ${data.applicationId}. Amount: ${data.amount}, Transaction ID: ${data.transactionId}`
  };
}

// DSA assigned template
export function dsaAssignedTemplate(data: { 
  firstName: string; 
  applicationId: string; 
  dsaName: string; 
  dsaEmail: string; 
  dsaPhone: string; 
  bankName: string;
}): EmailTemplate {
  const content = `
    <h2>DSA Assigned to Your Application</h2>
    <p>Dear ${data.firstName},</p>
    <p>A Direct Sales Agent (DSA) has been assigned to your loan application. They will guide you through the remaining process.</p>
    <div class="highlight">
        <p><strong>Application ID:</strong> ${data.applicationId}</p>
        <p><strong>DSA Name:</strong> ${data.dsaName}</p>
        <p><strong>Bank:</strong> ${data.bankName}</p>
        <p><strong>Email:</strong> ${data.dsaEmail}</p>
        <p><strong>Phone:</strong> ${data.dsaPhone}</p>
    </div>
    <p>Your DSA will contact you within 24 hours to discuss the next steps.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/chat" class="button">Chat with Your DSA</a>
  `;

  return {
    subject: `DSA Assigned - ${data.applicationId}`,
    html: baseTemplate(content, 'DSA Assigned'),
    text: `DSA assigned to application ${data.applicationId}. DSA: ${data.dsaName} (${data.bankName}), Email: ${data.dsaEmail}, Phone: ${data.dsaPhone}`
  };
}

// Profile update template
export function profileUpdateTemplate(data: { firstName: string; updatedFields: string[] }): EmailTemplate {
  const content = `
    <h2>Profile Updated Successfully</h2>
    <p>Dear ${data.firstName},</p>
    <p>Your profile has been updated successfully. The following information was changed:</p>
    <div class="highlight">
        <ul>
            ${data.updatedFields.map(field => `<li>${field}</li>`).join('')}
        </ul>
    </div>
    <p>If you didn't make these changes, please contact our support team immediately.</p>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/profile" class="button">View Profile</a>
  `;

  return {
    subject: 'Profile Updated Successfully',
    html: baseTemplate(content, 'Profile Update'),
    text: `Profile updated successfully. Updated fields: ${data.updatedFields.join(', ')}`
  };
}

// Invoice template
export function invoiceTemplate(data: {
  firstName: string;
  applicationId: string;
  invoiceNumber: string;
  amount: string;
  dueDate: string;
  items: Array<{ description: string; amount: string; }>;
}): EmailTemplate {
  const itemsHtml = data.items.map(item =>
    `<tr><td>${item.description}</td><td style="text-align: right;">${item.amount}</td></tr>`
  ).join('');

  const content = `
    <h2>Invoice for Your Loan Application</h2>
    <p>Dear ${data.firstName},</p>
    <p>Please find your invoice details below:</p>
    <div class="highlight">
        <p><strong>Invoice Number:</strong> ${data.invoiceNumber}</p>
        <p><strong>Application ID:</strong> ${data.applicationId}</p>
        <p><strong>Due Date:</strong> ${data.dueDate}</p>
    </div>
    <table style="width: 100%; border-collapse: collapse; margin: 20px 0;">
        <thead>
            <tr style="background: #f5f5f5;">
                <th style="padding: 10px; text-align: left; border: 1px solid #ddd;">Description</th>
                <th style="padding: 10px; text-align: right; border: 1px solid #ddd;">Amount</th>
            </tr>
        </thead>
        <tbody>
            ${itemsHtml}
            <tr style="background: #f9f9f9; font-weight: bold;">
                <td style="padding: 10px; border: 1px solid #ddd;">Total</td>
                <td style="padding: 10px; text-align: right; border: 1px solid #ddd;">${data.amount}</td>
            </tr>
        </tbody>
    </table>
    <a href="${process.env.NEXT_PUBLIC_APP_URL}/user/applications/${data.applicationId}" class="button">Pay Now</a>
  `;

  return {
    subject: `Invoice ${data.invoiceNumber} - ${data.applicationId}`,
    html: baseTemplate(content, 'Invoice'),
    text: `Invoice ${data.invoiceNumber} for application ${data.applicationId}. Amount: ${data.amount}, Due: ${data.dueDate}`
  };
}
