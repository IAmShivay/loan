import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import connectDB from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import User from '@/lib/db/models/User';
import { z } from 'zod';

const assignDSAsSchema = z.object({
  dsaIds: z.array(z.string()).min(1).max(5),
  finalApprovalThreshold: z.number().min(1).max(5).default(2),
  reviewDeadlineHours: z.number().min(24).max(168).default(72) // 24 hours to 7 days, default 3 days
});

// POST /api/applications/[id]/assign-dsas - Assign multiple DSAs to application (Admin only)
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { dsaIds, finalApprovalThreshold, reviewDeadlineHours } = assignDSAsSchema.parse(body);

    await connectDB();

    const application = await LoanApplication.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Verify all DSA IDs are valid and active
    const dsas = await User.find({
      _id: { $in: dsaIds },
      role: 'dsa',
      isActive: true
    });

    if (dsas.length !== dsaIds.length) {
      return NextResponse.json({ 
        error: 'One or more DSA IDs are invalid or inactive' 
      }, { status: 400 });
    }

    // Update application with assigned DSAs
    application.assignedDSAs = dsaIds;
    application.finalApprovalThreshold = finalApprovalThreshold;
    application.status = 'under_review';
    application.assignedAt = new Date();

    // Set review deadline
    const reviewDeadline = new Date();
    reviewDeadline.setHours(reviewDeadline.getHours() + reviewDeadlineHours);
    application.reviewDeadline = reviewDeadline;

    // Initialize DSA reviews
    application.dsaReviews = dsaIds.map(dsaId => ({
      dsaId,
      status: 'pending',
      documentsReviewed: []
    }));

    await application.save();

    // Get DSA details for response
    const dsaDetails = dsas.map(dsa => ({
      id: dsa._id,
      name: `${dsa.firstName} ${dsa.lastName}`,
      email: dsa.email,
      specialization: dsa.specialization || []
    }));

    return NextResponse.json({
      success: true,
      message: `Application assigned to ${dsaIds.length} DSAs`,
      assignedDSAs: dsaDetails,
      finalApprovalThreshold
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error assigning DSAs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/applications/[id]/assign-dsas - Get available DSAs for assignment
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const application = await LoanApplication.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Get all active DSAs with their workload
    const dsas = await User.aggregate([
      {
        $match: {
          role: 'dsa',
          isActive: true
        }
      },
      {
        $lookup: {
          from: 'loanapplications',
          let: { dsaId: '$_id' },
          pipeline: [
            {
              $match: {
                $expr: {
                  $in: ['$$dsaId', '$assignedDSAs']
                },
                status: { $in: ['under_review', 'pending'] }
              }
            }
          ],
          as: 'activeApplications'
        }
      },
      {
        $project: {
          _id: 1,
          firstName: 1,
          lastName: 1,
          email: 1,
          specialization: 1,
          profilePicture: 1,
          workload: { $size: '$activeApplications' },
          isCurrentlyAssigned: {
            $in: ['$_id', application.assignedDSAs || []]
          }
        }
      },
      {
        $sort: { workload: 1, firstName: 1 }
      }
    ]);

    const availableDSAs = dsas.map(dsa => ({
      id: dsa._id,
      name: `${dsa.firstName} ${dsa.lastName}`,
      email: dsa.email,
      specialization: dsa.specialization || [],
      profilePicture: dsa.profilePicture,
      workload: dsa.workload,
      isCurrentlyAssigned: dsa.isCurrentlyAssigned
    }));

    return NextResponse.json({
      success: true,
      availableDSAs,
      currentAssignments: application.assignedDSAs || [],
      currentThreshold: application.finalApprovalThreshold || 2
    });

  } catch (error) {
    console.error('Error fetching available DSAs:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
