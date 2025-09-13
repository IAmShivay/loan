import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { sendEmail } from '@/lib/email/service';
import * as templates from '@/lib/email/templates';
import { logApiRequest, logApiResponse, logError, logEmailOperation } from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and DSA can send emails manually
    if (!['admin', 'dsa'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { templateName, templateData, recipients, options = {} } = await request.json();

    if (!templateName || !templateData || !recipients) {
      return NextResponse.json({ 
        error: 'Template name, template data, and recipients are required' 
      }, { status: 400 });
    }

    // Validate template name
    if (!(templateName in templates)) {
      return NextResponse.json({ 
        error: 'Invalid template name' 
      }, { status: 400 });
    }

    // Ensure recipients is an array
    const recipientList = Array.isArray(recipients) ? recipients : [recipients];

    const results = [];

    for (const recipient of recipientList) {
      const result = await sendEmail(templateName, templateData, {
        to: recipient,
        ...options
      });
      results.push({ recipient, ...result });
    }

    const successCount = results.filter(r => r.success).length;
    const failureCount = results.length - successCount;

    return NextResponse.json({
      success: true,
      results,
      summary: {
        total: results.length,
        successful: successCount,
        failed: failureCount
      }
    });

  } catch (error) {
    console.error('Send email error:', error);
    return NextResponse.json(
      { error: 'Failed to send email' },
      { status: 500 }
    );
  }
}

// Get available email templates
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admin and DSA can view templates
    if (!['admin', 'dsa'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const availableTemplates = Object.keys(templates).map(templateName => ({
      name: templateName,
      displayName: templateName.replace(/([A-Z])/g, ' $1').replace(/^./, str => str.toUpperCase()),
      description: getTemplateDescription(templateName)
    }));

    return NextResponse.json({
      success: true,
      templates: availableTemplates
    });

  } catch (error) {
    console.error('Get templates error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch templates' },
      { status: 500 }
    );
  }
}

function getTemplateDescription(templateName: string): string {
  const descriptions: Record<string, string> = {
    welcomeTemplate: 'Welcome email for new users',
    forgotPasswordTemplate: 'Password reset email',
    applicationSubmittedTemplate: 'Confirmation email when application is submitted',
    applicationApprovedTemplate: 'Notification when application is approved',
    applicationRejectedTemplate: 'Notification when application is rejected',
    paymentSuccessTemplate: 'Confirmation email for successful payments',
    paymentFailedTemplate: 'Notification for failed payments',
    dsaAssignedTemplate: 'Notification when DSA is assigned to application',
    profileUpdateTemplate: 'Confirmation email for profile updates',
    invoiceTemplate: 'Invoice email for payments'
  };
  
  return descriptions[templateName] || 'Email template';
}
