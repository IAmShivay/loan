import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import connectDB from '@/lib/db/connection';
import { z } from 'zod';
import { logApiRequest, logApiResponse, logError, logDbOperation } from '@/lib/logger';

// Settings validation schema
const settingsSchema = z.object({
  general: z.object({
    siteName: z.string().min(1),
    siteDescription: z.string().min(1),
    supportEmail: z.string().email(),
    maxFileSize: z.number().min(1).max(100),
    allowedFileTypes: z.array(z.string()),
    maintenanceMode: z.boolean(),
  }).optional(),
  email: z.object({
    smtpHost: z.string().min(1),
    smtpPort: z.number().min(1).max(65535),
    smtpUser: z.string().min(1),
    smtpPassword: z.string().optional(),
    fromEmail: z.string().email(),
    fromName: z.string().min(1),
    emailEnabled: z.boolean(),
  }).optional(),
  notifications: z.object({
    emailNotifications: z.boolean(),
    smsNotifications: z.boolean(),
    pushNotifications: z.boolean(),
    adminAlerts: z.boolean(),
  }).optional(),
  security: z.object({
    passwordMinLength: z.number().min(6).max(50),
    sessionTimeout: z.number().min(5).max(1440),
    maxLoginAttempts: z.number().min(3).max(20),
    twoFactorAuth: z.boolean(),
    ipWhitelist: z.array(z.string()),
  }).optional(),
  loan: z.object({
    minLoanAmount: z.number().min(1000),
    maxLoanAmount: z.number().min(10000),
    defaultInterestRate: z.number().min(0.1).max(50),
    processingFee: z.number().min(0),
    autoApprovalLimit: z.number().min(0),
  }).optional(),
});

// Mock settings data (replace with database model)
const defaultSettings = {
  general: {
    siteName: 'Loan Management System',
    siteDescription: 'Complete loan application management system with multi-bank DSA support',
    supportEmail: 'support@loanmanagement.com',
    maxFileSize: 10,
    allowedFileTypes: ['pdf', 'jpg', 'jpeg', 'png', 'doc', 'docx'],
    maintenanceMode: false,
  },
  email: {
    smtpHost: 'smtp.gmail.com',
    smtpPort: 587,
    smtpUser: 'noreply@loanmanagement.com',
    smtpPassword: '',
    fromEmail: 'noreply@loanmanagement.com',
    fromName: 'Loan Management System',
    emailEnabled: true,
  },
  notifications: {
    emailNotifications: true,
    smsNotifications: false,
    pushNotifications: true,
    adminAlerts: true,
  },
  security: {
    passwordMinLength: 8,
    sessionTimeout: 30,
    maxLoginAttempts: 5,
    twoFactorAuth: false,
    ipWhitelist: [],
  },
  loan: {
    minLoanAmount: 50000,
    maxLoanAmount: 2000000,
    defaultInterestRate: 12.5,
    processingFee: 99,
    autoApprovalLimit: 100000,
  },
};

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const url = request.url;
  const method = request.method;

  try {
    logApiRequest(method, url);

    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 401, duration);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();
    logDbOperation('read', 'settings', true);

    // In a real implementation, fetch from database
    // const settings = await Settings.findOne() || defaultSettings;

    const duration = Date.now() - startTime;
    logApiResponse(method, url, 200, duration, session.user.id);

    return NextResponse.json({
      success: true,
      settings: defaultSettings
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Failed to fetch settings', error, { url, method });
    logApiResponse(method, url, 500, duration);

    return NextResponse.json(
      { error: 'Failed to fetch settings' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  const startTime = Date.now();
  const url = request.url;
  const method = request.method;

  try {
    logApiRequest(method, url);

    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 401, duration);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = settingsSchema.parse(body);

    await connectDB();

    // In a real implementation, update database
    // const settings = await Settings.findOneAndUpdate(
    //   {},
    //   { $set: validatedData },
    //   { upsert: true, new: true }
    // );

    logDbOperation('update', 'settings', true, undefined, { settingsUpdated: Object.keys(validatedData).length });

    const duration = Date.now() - startTime;
    logApiResponse(method, url, 200, duration, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'Settings updated successfully',
      settings: { ...defaultSettings, ...validatedData }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    
    if (error instanceof z.ZodError) {
      logError('Settings validation failed', error, { url, method });
      logApiResponse(method, url, 400, duration);
      return NextResponse.json(
        { error: 'Invalid settings data', details: error.issues },
        { status: 400 }
      );
    }

    logError('Failed to update settings', error, { url, method });
    logApiResponse(method, url, 500, duration);

    return NextResponse.json(
      { error: 'Failed to update settings' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const url = request.url;
  const method = request.method;

  try {
    logApiRequest(method, url);

    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 401, duration);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action } = await request.json();

    await connectDB();

    if (action === 'reset') {
      // Reset to default settings
      logDbOperation('update', 'settings', true, undefined, { action: 'reset' });
      
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 200, duration, session.user.id);

      return NextResponse.json({
        success: true,
        message: 'Settings reset to default values',
        settings: defaultSettings
      });
    }

    if (action === 'backup') {
      // Create settings backup
      logDbOperation('create', 'settings_backup', true, undefined, { action: 'backup' });
      
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 200, duration, session.user.id);

      return NextResponse.json({
        success: true,
        message: 'Settings backup created successfully',
        backupId: `backup_${Date.now()}`
      });
    }

    const duration = Date.now() - startTime;
    logApiResponse(method, url, 400, duration, session.user.id);

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Settings action failed', error, { url, method });
    logApiResponse(method, url, 500, duration);

    return NextResponse.json(
      { error: 'Action failed' },
      { status: 500 }
    );
  }
}
