import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import connectDB from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import User from '@/lib/db/models/User';
import { z } from 'zod';

const selectDSASchema = z.object({
  dsaId: z.string()
});

// POST /api/applications/[id]/select-dsa - User selects DSA for communication
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dsaId } = selectDSASchema.parse(body);

    await connectDB();

    const application = await LoanApplication.findById(id)
      .populate('dsaReviews.dsaId', 'firstName lastName email profilePicture');

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if user owns this application
    if (application.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user can select DSA (at least one approval or under review)
    const approvedReviews = application.dsaReviews.filter((review: any) => review.status === 'approved');
    const canSelect = approvedReviews.length > 0 || application.status === 'under_review';

    if (!canSelect) {
      return NextResponse.json({ 
        error: 'Cannot select DSA until application is under review or has approvals' 
      }, { status: 400 });
    }

    // Check if selected DSA is assigned to this application
    const isAssigned = application.assignedDSAs.some((assignedDsaId: any) => assignedDsaId.toString() === dsaId);
    if (!isAssigned) {
      return NextResponse.json({ 
        error: 'Selected DSA is not assigned to this application' 
      }, { status: 400 });
    }

    // Get DSA details
    const dsa = await User.findById(dsaId).select('firstName lastName email profilePicture specialization');
    if (!dsa) {
      return NextResponse.json({ error: 'DSA not found' }, { status: 404 });
    }

    // Update primary DSA for communication
    application.dsaId = dsaId;
    await application.save();

    return NextResponse.json({
      success: true,
      message: 'DSA selected for communication',
      selectedDSA: {
        id: dsa._id,
        name: `${dsa.firstName} ${dsa.lastName}`,
        email: dsa.email,
        profilePicture: dsa.profilePicture,
        specialization: dsa.specialization || []
      }
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error selecting DSA:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/applications/[id]/select-dsa - Get available DSAs for user selection
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'user') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const application = await LoanApplication.findById(id)
      .populate('dsaReviews.dsaId', 'firstName lastName email profilePicture specialization')
      .populate('dsaId', 'firstName lastName email profilePicture specialization');

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if user owns this application
    if (application.userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Check if user can select DSA
    const approvedReviews = application.dsaReviews.filter((review: any) => review.status === 'approved');
    const canSelect = approvedReviews.length > 0 || application.status === 'under_review';

    if (!canSelect) {
      return NextResponse.json({ 
        error: 'Cannot select DSA until application is under review or has approvals',
        canSelect: false
      });
    }

    // Get all assigned DSAs with their review status
    const availableDSAs = application.dsaReviews.map((review: any) => ({
      id: review.dsaId._id,
      name: `${review.dsaId.firstName} ${review.dsaId.lastName}`,
      email: review.dsaId.email,
      profilePicture: review.dsaId.profilePicture,
      specialization: review.dsaId.specialization || [],
      reviewStatus: review.status,
      reviewedAt: review.reviewedAt,
      comments: review.comments,
      riskAssessment: review.riskAssessment,
      isSelected: application.dsaId?.toString() === review.dsaId._id.toString()
    }));

    // Separate by approval status for better UX
    const approvedDSAs = availableDSAs.filter((dsa: any) => dsa.reviewStatus === 'approved');
    const pendingDSAs = availableDSAs.filter((dsa: any) => dsa.reviewStatus === 'pending');
    const rejectedDSAs = availableDSAs.filter((dsa: any) => dsa.reviewStatus === 'rejected');

    return NextResponse.json({
      success: true,
      canSelect,
      currentlySelected: application.dsaId ? {
        id: application.dsaId._id,
        name: `${application.dsaId.firstName} ${application.dsaId.lastName}`,
        email: application.dsaId.email,
        profilePicture: application.dsaId.profilePicture,
        specialization: application.dsaId.specialization || []
      } : null,
      availableDSAs: {
        approved: approvedDSAs,
        pending: pendingDSAs,
        rejected: rejectedDSAs
      },
      approvalStatus: {
        approved: approvedDSAs.length,
        rejected: rejectedDSAs.length,
        pending: pendingDSAs.length,
        threshold: application.finalApprovalThreshold
      }
    });

  } catch (error) {
    console.error('Error fetching DSA selection options:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
