import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import User from '@/lib/db/models/User';
import { logApiRequest, logApiResponse, logError, logInfo } from '@/lib/logger';

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const url = request.url;
  const method = request.method;

  try {
    logApiRequest(method, url);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 401, duration);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Only DSAs and admins can update application status
    if (!['dsa', 'admin'].includes(session.user.role)) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 403, duration, session.user.id);
      return NextResponse.json({ error: 'Forbidden - Only DSAs and admins can update application status' }, { status: 403 });
    }

    await connectDB();

    const { id } = await params;
    const { status, comments, reviewNotes } = await request.json();

    // Validate required fields
    if (!status) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({ error: 'Status is required' }, { status: 400 });
    }

    // Validate status values
    const validStatuses = ['pending', 'under_review', 'approved', 'rejected', 'requires_documents'];
    if (!validStatuses.includes(status)) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({
        error: 'Invalid status',
        validStatuses
      }, { status: 400 });
    }

    // Check if DSA account is active (not frozen)
    if (session.user.role === 'dsa') {
      const dsaUser = await User.findById(session.user.id);
      if (!dsaUser || !dsaUser.isActive) {
        const duration = Date.now() - startTime;
        logApiResponse(method, url, 403, duration, session.user.id);
        return NextResponse.json({
          error: 'Account frozen - Cannot update applications. Please contact admin or provide clarification for missed deadlines.'
        }, { status: 403 });
      }
    }

    // Find the application
    const application = await LoanApplication.findById(id);
    if (!application) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 404, duration, session.user.id);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Create review entry
    const reviewEntry = {
      dsaId: session.user.id,
      dsaName: `${session.user.firstName} ${session.user.lastName}`,
      status,
      comments: comments || '',
      reviewNotes: reviewNotes || '',
      reviewedAt: new Date(),
      reviewerRole: session.user.role
    };

    // Update application
    const updateData: any = {
      status,
      updatedAt: new Date(),
      $push: {
        reviews: reviewEntry
      }
    };

    // Add specific fields based on status
    if (status === 'approved') {
      updateData.approvedAt = new Date();
      updateData.approvedBy = session.user.id;
    } else if (status === 'rejected') {
      updateData.rejectedAt = new Date();
      updateData.rejectedBy = session.user.id;
      updateData.rejectionReason = comments || reviewNotes;
    }

    const updatedApplication = await LoanApplication.findByIdAndUpdate(
      id,
      updateData,
      { new: true, runValidators: true }
    ).populate('userId', 'firstName lastName email phone');

    // Update DSA activity/stats if it's a DSA making the review
    if (session.user.role === 'dsa') {
      await User.findByIdAndUpdate(session.user.id, {
        $inc: {
          'statistics.totalReviews': 1,
          ...(status === 'approved' && { 'statistics.approvedApplications': 1 }),
          ...(status === 'rejected' && { 'statistics.rejectedApplications': 1 })
        },
        lastActivity: new Date()
      });
    }

    const duration = Date.now() - startTime;
    logInfo('Application status updated successfully', {
      applicationId: id,
      newStatus: status,
      reviewerId: session.user.id,
      reviewerRole: session.user.role
    });
    logApiResponse(method, url, 200, duration, session.user.id);

    return NextResponse.json({
      success: true,
      message: `Application ${status} successfully`,
      application: updatedApplication,
      review: reviewEntry
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Application status update failed', error, { url, method });
    logApiResponse(method, url, 500, duration);

    return NextResponse.json(
      { error: 'Failed to update application status' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const startTime = Date.now();
  const url = request.url;
  const method = request.method;

  try {
    logApiRequest(method, url);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 401, duration);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { id } = await params;

    // Get application with review history
    const application = await LoanApplication.findById(id)
      .populate('userId', 'firstName lastName email')
      .populate('reviews.dsaId', 'firstName lastName email')
      .lean();

    if (!application) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 404, duration, session.user.id);
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check access permissions
    const canAccess = session.user.role === 'admin' ||
                     session.user.role === 'dsa' ||
                     (session.user.role === 'user' && (application as any).userId._id.toString() === session.user.id);

    if (!canAccess) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 403, duration, session.user.id);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const duration = Date.now() - startTime;
    logApiResponse(method, url, 200, duration, session.user.id);

    return NextResponse.json({
      success: true,
      application: {
        _id: application._id,
        status: application.status,
        reviews: (application as any).reviews || [],
        currentStatus: application.status,
        lastUpdated: application.updatedAt
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Get application status failed', error, { url, method });
    logApiResponse(method, url, 500, duration);

    return NextResponse.json(
      { error: 'Failed to fetch application status' },
      { status: 500 }
    );
  }
}