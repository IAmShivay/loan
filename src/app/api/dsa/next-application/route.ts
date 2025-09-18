import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import connectDB from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import User from '@/lib/db/models/User';
import { logApiRequest, logApiResponse, logError } from '@/lib/logger';

// GET /api/dsa/next-application - Get next application for DSA to review (one-by-one workflow)
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user || session.user.role !== 'dsa') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    logApiRequest('GET', '/api/dsa/next-application', session.user.id);

    await connectDB();

    // Check if DSA is verified and active
    const dsa = await User.findById(session.user.id);
    if (!dsa || !dsa.isVerified || !dsa.isActive) {
      return NextResponse.json({ 
        error: 'DSA account is not verified or active',
        requiresVerification: true
      }, { status: 403 });
    }

    // Find the next application assigned to this DSA that they haven't reviewed yet
    const nextApplication = await LoanApplication.findOne({
      assignedDSAs: { $in: [session.user.id] },
      'dsaReviews.dsaId': { $ne: session.user.id }, // DSA hasn't reviewed yet
      status: 'under_review',
      reviewDeadline: { $gte: new Date() } // Not expired
    })
    .populate('userId', 'firstName lastName email phone')
    .populate('assignedDSAs', 'firstName lastName email')
    .sort({ assignedAt: 1 }); // Oldest first

    if (!nextApplication) {
      // Check if there are any pending applications that could be assigned
      const pendingApplications = await LoanApplication.countDocuments({
        status: 'pending',
        assignedDSAs: { $size: 0 }
      });

      return NextResponse.json({
        application: null,
        message: 'No applications available for review',
        pendingApplications,
        hasCompletedAll: true
      });
    }

    // Check deadline status
    const now = new Date();
    const timeRemaining = nextApplication.reviewDeadline 
      ? Math.max(0, Math.floor((new Date(nextApplication.reviewDeadline).getTime() - now.getTime()) / (1000 * 60 * 60)))
      : null;

    // Get DSA's review status for this application
    const dsaReview = nextApplication.dsaReviews.find((review: any) => 
      review.dsaId.toString() === session.user.id
    );

    const applicationData = {
      _id: nextApplication._id,
      applicationNumber: nextApplication.applicationNumber,
      userId: nextApplication.userId,
      personalDetails: nextApplication.personalDetails,
      loanDetails: nextApplication.loanDetails,
      documents: nextApplication.documents,
      status: nextApplication.status,
      assignedAt: nextApplication.assignedAt,
      reviewDeadline: nextApplication.reviewDeadline,
      timeRemainingHours: timeRemaining,
      finalApprovalThreshold: nextApplication.finalApprovalThreshold,
      dsaReviews: nextApplication.dsaReviews,
      myReview: dsaReview || null,
      createdAt: nextApplication.createdAt,
      updatedAt: nextApplication.updatedAt
    };

    logApiResponse('GET', '/api/dsa/next-application', 200, 0, session.user.id, {
      applicationId: nextApplication._id,
      timeRemaining: timeRemaining
    });

    return NextResponse.json({
      application: applicationData,
      message: 'Next application ready for review',
      timeRemainingHours: timeRemaining,
      isUrgent: timeRemaining !== null && timeRemaining < 24
    });

  } catch (error) {
    logError('Error fetching next application', error);
    console.error('Error fetching next application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/dsa/next-application - Mark current application as reviewed and get next one
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user || session.user.role !== 'dsa') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { applicationId, skipToNext } = body;

    await connectDB();

    if (skipToNext && applicationId) {
      // Mark the current application as "skipped" or handle it appropriately
      const application = await LoanApplication.findById(applicationId);
      if (application) {
        // Add a note that this DSA skipped this application
        // This could be used for analytics or reassignment logic
        logApiRequest('POST', '/api/dsa/next-application', session.user.id, {
          action: 'skip',
          applicationId
        });
      }
    }

    // Get the next application using the same logic as GET
    const nextApplication = await LoanApplication.findOne({
      assignedDSAs: { $in: [session.user.id] },
      'dsaReviews.dsaId': { $ne: session.user.id },
      status: 'under_review',
      reviewDeadline: { $gte: new Date() },
      ...(applicationId && { _id: { $ne: applicationId } }) // Exclude current application
    })
    .populate('userId', 'firstName lastName email phone')
    .populate('assignedDSAs', 'firstName lastName email')
    .sort({ assignedAt: 1 });

    if (!nextApplication) {
      return NextResponse.json({
        application: null,
        message: 'No more applications available for review',
        hasCompletedAll: true
      });
    }

    const now = new Date();
    const timeRemaining = nextApplication.reviewDeadline 
      ? Math.max(0, Math.floor((new Date(nextApplication.reviewDeadline).getTime() - now.getTime()) / (1000 * 60 * 60)))
      : null;

    const applicationData = {
      _id: nextApplication._id,
      applicationNumber: nextApplication.applicationNumber,
      userId: nextApplication.userId,
      personalDetails: nextApplication.personalDetails,
      loanDetails: nextApplication.loanDetails,
      documents: nextApplication.documents,
      status: nextApplication.status,
      assignedAt: nextApplication.assignedAt,
      reviewDeadline: nextApplication.reviewDeadline,
      timeRemainingHours: timeRemaining,
      finalApprovalThreshold: nextApplication.finalApprovalThreshold,
      dsaReviews: nextApplication.dsaReviews,
      createdAt: nextApplication.createdAt,
      updatedAt: nextApplication.updatedAt
    };

    return NextResponse.json({
      application: applicationData,
      message: 'Next application ready for review',
      timeRemainingHours: timeRemaining,
      isUrgent: timeRemaining !== null && timeRemaining < 24
    });

  } catch (error) {
    logError('Error getting next application', error);
    console.error('Error getting next application:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
