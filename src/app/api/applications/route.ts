import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import connectDB from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import { z } from 'zod';
import { logApiRequest, logApiResponse, logError, logDbOperation } from '@/lib/logger';

// Validation schema for creating new application
const createApplicationSchema = z.object({
  firstName: z.string().min(2),
  lastName: z.string().min(2),
  email: z.string().email(),
  phone: z.string().min(10),
  dateOfBirth: z.string(),
  aadharNumber: z.string().length(12),
  panNumber: z.string().length(10),
  address: z.string().min(10),
  city: z.string().min(2),
  state: z.string().min(2),
  pincode: z.string().length(6),
  institution: z.string().min(2),
  course: z.string().min(2),
  duration: z.string().min(1),
  admissionDate: z.string(),
  feeStructure: z.number().min(1000),
  loanAmount: z.number().min(50000).max(5000000),
  purpose: z.string().min(10),
  annualIncome: z.number().min(100000),
  employmentType: z.string().min(1),
  employerName: z.string().min(2),
  hasCoApplicant: z.boolean(),
  coApplicantName: z.string().optional(),
  coApplicantRelation: z.string().optional(),
  coApplicantIncome: z.number().optional(),
  agreeToTerms: z.boolean().refine(val => val === true),
  agreeToDataProcessing: z.boolean().refine(val => val === true)
});

// GET /api/applications - Get applications based on user role
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    console.log('Applications API - Session:', session?.user ? { id: session.user.id, role: session.user.role, email: session.user.email } : 'No session');

    if (!session?.user) {
      console.log('Applications API - No session found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const priority = searchParams.get('priority');
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const skip = (page - 1) * limit;

    const query: Record<string, unknown> = {};

    // Filter based on user role
    if (session.user.role === 'user') {
      query.userId = session.user.id;
    }
    // DSAs and Admins can see all applications (no filter for queue-based system)
    // DSAs will review applications based on their own choice and deadlines

    // Apply status filter
    if (status && status !== 'all') {
      query.status = status;
    }

    // Apply priority filter
    if (priority && priority !== 'all') {
      query.priority = priority;
    }

    const applications = await LoanApplication.find(query)
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedDSAs', 'firstName lastName email bankName dsaId')
      .sort({ createdAt: -1 })
      .skip(skip)
      .limit(limit);

    const total = await LoanApplication.countDocuments(query);

    // Transform data to match frontend expectations
    const transformedApplications = applications.map(app => {
      const transformed = app.toObject();

      // Map database fields to frontend expected fields
      if (transformed.personalDetails) {
        transformed.personalInfo = {
          firstName: transformed.personalDetails.fullName?.split(' ')[0] || '',
          lastName: transformed.personalDetails.fullName?.split(' ').slice(1).join(' ') || '',
          email: transformed.userId?.email || '',
          phone: transformed.userId?.phone || '',
          dateOfBirth: transformed.personalDetails.dateOfBirth,
          address: transformed.personalDetails.address
        };
      }

      if (transformed.loanDetails) {
        transformed.loanInfo = {
          amount: transformed.loanDetails.amount,
          purpose: transformed.loanDetails.purpose,
          tenure: transformed.loanDetails.tenure
        };
      }

      // Add application ID for compatibility
      if (transformed.applicationNumber) {
        transformed.applicationId = transformed.applicationNumber;
      }

      // Ensure status mapping
      if (!transformed.priority) {
        transformed.priority = 'medium';
      }

      return transformed;
    });

    return NextResponse.json({
      applications: transformedApplications,
      pagination: {
        page,
        limit,
        total,
        pages: Math.ceil(total / limit)
      }
    });

  } catch (error) {
    console.error('Error fetching applications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/applications - Create new application
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    
    // Validate request body
    const validatedData = createApplicationSchema.parse(body);

    await connectDB();

    // Generate application ID
    const currentYear = new Date().getFullYear();
    const currentMonth = String(new Date().getMonth() + 1).padStart(2, '0');
    const count = await LoanApplication.countDocuments({
      createdAt: {
        $gte: new Date(currentYear, new Date().getMonth(), 1),
        $lt: new Date(currentYear, new Date().getMonth() + 1, 1)
      }
    });
    const applicationId = `LA${currentYear}${currentMonth}${String(count + 1).padStart(3, '0')}`;

    // Find available DSA (simple round-robin assignment)
    // TODO: Implement more sophisticated DSA assignment logic
    const availableDSAs = await LoanApplication.aggregate([
      { $match: { assignedDSA: { $exists: true } } },
      { $group: { _id: '$assignedDSA', count: { $sum: 1 } } },
      { $sort: { count: 1 } },
      { $limit: 1 }
    ]);

    let assignedDSA = null;
    if (availableDSAs.length > 0) {
      assignedDSA = availableDSAs[0]._id;
    }

    // Create new application
    const newApplication = new LoanApplication({
      applicationId,
      userId: session.user.id,
      assignedDSA,
      personalInfo: {
        firstName: validatedData.firstName,
        lastName: validatedData.lastName,
        email: validatedData.email,
        phone: validatedData.phone,
        dateOfBirth: new Date(validatedData.dateOfBirth),
        aadharNumber: validatedData.aadharNumber,
        panNumber: validatedData.panNumber
      },
      addressInfo: {
        address: validatedData.address,
        city: validatedData.city,
        state: validatedData.state,
        pincode: validatedData.pincode
      },
      educationInfo: {
        institution: validatedData.institution,
        course: validatedData.course,
        duration: validatedData.duration,
        admissionDate: new Date(validatedData.admissionDate),
        feeStructure: validatedData.feeStructure
      },
      loanInfo: {
        amount: validatedData.loanAmount,
        purpose: validatedData.purpose
      },
      financialInfo: {
        annualIncome: validatedData.annualIncome,
        employmentType: validatedData.employmentType,
        employerName: validatedData.employerName
      },
      coApplicantInfo: validatedData.hasCoApplicant ? {
        name: validatedData.coApplicantName,
        relation: validatedData.coApplicantRelation,
        annualIncome: validatedData.coApplicantIncome
      } : undefined,
      status: 'pending',
      priority: validatedData.loanAmount > 1000000 ? 'high' :
                validatedData.loanAmount > 500000 ? 'medium' : 'low',

      // Payment Information
      paymentStatus: 'pending',
      serviceChargesPaid: false,

      documentsRequired: [
        'aadhar_card',
        'pan_card',
        'income_proof',
        'admission_letter',
        'bank_statements'
      ],
      documentsSubmitted: [],
      timeline: [{
        date: new Date(),
        status: 'submitted',
        description: 'Application submitted successfully',
        updatedBy: session.user.id
      }]
    });

    await newApplication.save();

    return NextResponse.json({
      success: true,
      applicationId: newApplication.applicationId,
      message: 'Application submitted successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/applications - Update application status (DSA/Admin only)
export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user || !['admin', 'dsa'].includes(session.user.role)) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, status, comments, documentsRequired } = body;

    if (!applicationId || !status) {
      return NextResponse.json(
        { error: 'Application ID and status are required' },
        { status: 400 }
      );
    }

    await connectDB();

    const application = await LoanApplication.findOne({ applicationId });
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    // Check if DSA can only update their assigned applications
    if (session.user.role === 'dsa' && application.assignedDSA?.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Update application
    application.status = status;
    if (comments) {
      application.comments = comments;
    }
    if (documentsRequired) {
      application.documentsRequired = documentsRequired;
    }

    // Add timeline entry
    application.timeline.push({
      date: new Date(),
      status,
      description: comments || `Status updated to ${status}`,
      updatedBy: session.user.id
    });

    await application.save();

    return NextResponse.json({
      success: true,
      message: 'Application updated successfully'
    });

  } catch (error) {
    console.error('Error updating application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
