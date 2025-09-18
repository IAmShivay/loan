import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import connectDB from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import User from '@/lib/db/models/User';

// POST /api/admin/test-assign-dsas - Test endpoint to assign DSAs to pending applications
export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all active DSAs
    const dsas = await User.find({
      role: 'dsa',
      isActive: true,
      isVerified: true
    }).select('_id firstName lastName email');

    if (dsas.length === 0) {
      return NextResponse.json({ 
        error: 'No active DSAs found',
        message: 'Please verify some DSAs first'
      }, { status: 400 });
    }

    // Get pending applications that haven't been assigned
    const pendingApplications = await LoanApplication.find({
      status: 'pending',
      $or: [
        { assignedDSAs: { $exists: false } },
        { assignedDSAs: { $size: 0 } }
      ]
    }).limit(10); // Limit to 10 for testing

    if (pendingApplications.length === 0) {
      return NextResponse.json({
        message: 'No pending applications to assign',
        availableDSAs: dsas.length
      });
    }

    const assignments = [];

    for (const application of pendingApplications) {
      // Assign 2-3 DSAs to each application (random selection)
      const numDSAsToAssign = Math.min(Math.floor(Math.random() * 2) + 2, dsas.length); // 2-3 DSAs
      const selectedDSAs = dsas
        .sort(() => 0.5 - Math.random()) // Shuffle
        .slice(0, numDSAsToAssign)
        .map(dsa => dsa._id);

      // Update application
      application.assignedDSAs = selectedDSAs;
      application.finalApprovalThreshold = Math.min(2, selectedDSAs.length); // Need 2 approvals or all DSAs
      application.status = 'under_review';
      application.assignedAt = new Date();
      
      // Set review deadline (72 hours from now)
      const reviewDeadline = new Date();
      reviewDeadline.setHours(reviewDeadline.getHours() + 72);
      application.reviewDeadline = reviewDeadline;

      // Initialize DSA reviews
      application.dsaReviews = selectedDSAs.map(dsaId => ({
        dsaId,
        status: 'pending',
        documentsReviewed: []
      }));

      await application.save();

      assignments.push({
        applicationId: application._id,
        applicationNumber: application.applicationNumber,
        assignedDSAs: selectedDSAs.map(dsaId => {
          const dsa = dsas.find(d => d._id.toString() === dsaId.toString());
          return {
            id: dsaId,
            name: `${dsa?.firstName} ${dsa?.lastName}`,
            email: dsa?.email
          };
        }),
        threshold: application.finalApprovalThreshold,
        deadline: reviewDeadline
      });
    }

    return NextResponse.json({
      success: true,
      message: `Successfully assigned ${assignments.length} applications to DSAs`,
      assignments,
      summary: {
        applicationsAssigned: assignments.length,
        availableDSAs: dsas.length,
        averageDSAsPerApplication: assignments.reduce((sum, a) => sum + a.assignedDSAs.length, 0) / assignments.length
      }
    });

  } catch (error) {
    console.error('Error in test DSA assignment:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// GET /api/admin/test-assign-dsas - Get current assignment status
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get statistics
    const stats = await Promise.all([
      User.countDocuments({ role: 'dsa', isActive: true, isVerified: true }),
      LoanApplication.countDocuments({ status: 'pending', assignedDSAs: { $size: 0 } }),
      LoanApplication.countDocuments({ status: 'under_review' }),
      LoanApplication.countDocuments({ 
        status: 'under_review',
        reviewDeadline: { $lt: new Date() }
      })
    ]);

    const [activeDSAs, unassignedApplications, underReview, overdue] = stats;

    // Get some sample assignments
    const sampleAssignments = await LoanApplication.find({
      status: 'under_review',
      assignedDSAs: { $exists: true, $not: { $size: 0 } }
    })
    .populate('assignedDSAs', 'firstName lastName email')
    .select('applicationNumber assignedDSAs reviewDeadline finalApprovalThreshold dsaReviews')
    .limit(5);

    return NextResponse.json({
      statistics: {
        activeDSAs,
        unassignedApplications,
        underReview,
        overdue
      },
      sampleAssignments: sampleAssignments.map(app => ({
        applicationNumber: app.applicationNumber,
        assignedDSAs: (app as any).assignedDSAs.map((dsa: any) => ({
          name: `${dsa.firstName} ${dsa.lastName}`,
          email: dsa.email
        })),
        reviewDeadline: app.reviewDeadline,
        threshold: app.finalApprovalThreshold,
        reviewsStatus: {
          pending: app.dsaReviews.filter((r: any) => r.status === 'pending').length,
          approved: app.dsaReviews.filter((r: any) => r.status === 'approved').length,
          rejected: app.dsaReviews.filter((r: any) => r.status === 'rejected').length
        }
      }))
    });

  } catch (error) {
    console.error('Error getting assignment status:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
