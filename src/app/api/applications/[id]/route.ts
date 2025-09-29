import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import FileUpload from '@/lib/db/models/FileUpload';
import { logInfo, logError, logApiResponse } from '@/lib/logger';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const method = 'GET';
  let session: Session | null = null;

  try {
    const { id } = await params;
    const url = `/api/applications/${id}`;

    // Check authentication
    session = await getServerSession(authOptions);
    if (!session?.user) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 401, duration);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Validate ObjectId format
    if (!id.match(/^[0-9a-fA-F]{24}$/)) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({ error: 'Invalid application ID format' }, { status: 400 });
    }

    // Find the application
    const application = await LoanApplication.findById(id)
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedDSAs', 'firstName lastName email bank dsaId')
      .lean();

    console.log('Application lookup:', {
      requestedId: id,
      applicationFound: !!application,
      userId: session.user.id,
      userRole: session.user.role
    });

    if (!application) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 404, duration, session.user.id);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check authorization - users can only see their own applications, DSAs can see all applications (queue-based), admins can see all
    // Handle populated userId field - it could be an object or string
    const applicationUserId = typeof (application as any).userId === 'object'
      ? (application as any).userId._id.toString()
      : (application as any).userId.toString();

    const isOwner = session.user.role === 'user' && applicationUserId === session.user.id;
    const isDSA = session.user.role === 'dsa'; // DSAs can see all applications in queue-based system
    const isAdmin = session.user.role === 'admin';

    const canAccess = isAdmin || isOwner || isDSA;

    console.log('Application access check:', {
      userRole: session.user.role,
      userId: session.user.id,
      applicationUserId,
      isOwner,
      isDSA,
      isAdmin,
      canAccess
    });

    if (!canAccess) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 403, duration, session.user.id);
      console.log('Application access denied - returning 403');
      return NextResponse.json({
        error: 'Forbidden',
        details: 'You do not have permission to view this application'
      }, { status: 403 });
    }

    // Fetch associated documents/files
    const documents = await FileUpload.find({
      applicationId: id,
      isDeleted: false
    }).lean();

    // Transform data to match frontend expectations
    const app = application as any; // Type assertion for flexibility
    const applicationDetails = {
      ...application,
      // Add applicationId for compatibility
      applicationId: app.applicationNumber,

      // Map database fields to frontend expected fields
      personalInfo: app.personalDetails ? {
        firstName: app.personalDetails.fullName?.split(' ')[0] || '',
        lastName: app.personalDetails.fullName?.split(' ').slice(1).join(' ') || '',
        email: app.userId?.email || '',
        phone: app.userId?.phone || '',
        dateOfBirth: app.personalDetails.dateOfBirth,
        address: app.personalDetails.address
      } : undefined,

      loanInfo: app.loanDetails ? {
        amount: app.loanDetails.amount,
        purpose: app.loanDetails.purpose,
        tenure: app.loanDetails.tenure
      } : undefined,

      // Map education info if available
      educationInfo: {
        instituteName: 'Sample University', // This would come from application data
        course: 'Computer Science',
        duration: '4 years',
        feeStructure: app.loanDetails?.amount || 0
      },

      // Financial info mapping
      financialInfo: {
        annualIncome: app.personalDetails?.income || 0,
        employmentType: app.personalDetails?.employment?.type || '',
        employerName: app.personalDetails?.employment?.companyName || '',
        workExperience: app.personalDetails?.employment?.workExperience?.toString() || ''
      },

      // Ensure status and priority
      priority: app.priority || 'medium',

      documents: documents.map(doc => ({
        _id: doc._id,
        originalName: doc.originalName,
        fileUrl: doc.fileUrl,
        fileSize: doc.fileSize,
        mimeType: doc.mimeType,
        documentType: doc.documentType,
        uploadedAt: doc.uploadedAt,
        isImage: doc.mimeType?.startsWith('image/'),
        isPDF: doc.mimeType === 'application/pdf'
      }))
    };

    const duration = Date.now() - startTime;
    logInfo('Application details fetched successfully', { 
      applicationId: id, 
      userId: session.user.id,
      documentsCount: documents.length 
    });
    logApiResponse(method, url, 200, duration, session.user.id);

    return NextResponse.json({
      success: true,
      application: applicationDetails
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const userId = session?.user?.id;
    logError('Application details fetch failed', error, { userId });
    logApiResponse(method, `/api/applications/[id]`, 500, duration, userId);
    
    return NextResponse.json(
      { error: 'Failed to fetch application details' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const method = 'PUT';
  let session: Session | null = null;

  try {
    const { id } = await params;
    const url = `/api/applications/${id}`;

    // Check authentication
    session = await getServerSession(authOptions);
    if (!session?.user) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 401, duration);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only admins and DSAs can update applications
    if (session.user.role === 'user') {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 403, duration, session.user.id);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const updateData = await request.json();
    await connectDB();

    // Find and update the application
    const updatedApplication = await LoanApplication.findByIdAndUpdate(
      id,
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    )
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedDSAs', 'firstName lastName email bank dsaId')
      .lean();

    if (!updatedApplication) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 404, duration, session.user.id);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    const duration = Date.now() - startTime;
    logInfo('Application updated successfully', { 
      applicationId: id, 
      userId: session.user.id,
      updatedFields: Object.keys(updateData)
    });
    logApiResponse(method, url, 200, duration, session.user.id);

    return NextResponse.json({
      success: true,
      application: updatedApplication
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    const userId = session?.user?.id;
    logError('Application update failed', error, { userId });
    logApiResponse(method, `/api/applications/[id]`, 500, duration, userId);
    
    return NextResponse.json(
      { error: 'Failed to update application' },
      { status: 500 }
    );
  }
}
