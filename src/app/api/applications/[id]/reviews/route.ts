import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import connectDB from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import User from '@/lib/db/models/User';
import { z } from 'zod';

const reviewSchema = z.object({
  status: z.enum(['approved', 'rejected']),
  comments: z.string().optional(),
  documentsReviewed: z.array(z.string()).default([]),
  riskAssessment: z.object({
    creditScore: z.number().min(300).max(900).optional(),
    riskLevel: z.enum(['low', 'medium', 'high']),
    recommendations: z.array(z.string()).default([])
  }).optional()
});

// GET /api/applications/[id]/reviews - Get all DSA reviews for an application
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const application = await LoanApplication.findById(id)
      .populate('dsaReviews.dsaId', 'firstName lastName email profilePicture')
      .populate('userId', 'firstName lastName email');

    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check permissions
    const isOwner = application.userId._id.toString() === session.user.id;
    const isAssignedDSA = application.assignedDSAs.some((dsaId: any) => dsaId.toString() === session.user.id);
    const isAdmin = session.user.role === 'admin';

    if (!isOwner && !isAssignedDSA && !isAdmin) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Format reviews with DSA information
    const reviewsWithDSAInfo = application.dsaReviews.map((review: any) => ({
      dsaId: review.dsaId._id,
      dsaName: `${review.dsaId.firstName} ${review.dsaId.lastName}`,
      dsaEmail: review.dsaId.email,
      dsaProfilePicture: review.dsaId.profilePicture,
      status: review.status,
      comments: review.comments,
      reviewedAt: review.reviewedAt,
      documentsReviewed: review.documentsReviewed,
      riskAssessment: review.riskAssessment
    }));

    const approvalStatus = {
      approved: reviewsWithDSAInfo.filter((r: any) => r.status === 'approved').length,
      rejected: reviewsWithDSAInfo.filter((r: any) => r.status === 'rejected').length,
      pending: reviewsWithDSAInfo.filter((r: any) => r.status === 'pending').length,
      threshold: application.finalApprovalThreshold
    };

    return NextResponse.json({
      success: true,
      reviews: reviewsWithDSAInfo,
      approvalStatus,
      canUserSelectDSA: approvalStatus.approved > 0 || application.status === 'under_review'
    });

  } catch (error) {
    console.error('Error fetching reviews:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/applications/[id]/reviews - Submit DSA review
export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'dsa') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const validatedData = reviewSchema.parse(body);

    await connectDB();

    const application = await LoanApplication.findById(id);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if DSA is assigned to this application
    const isAssigned = application.assignedDSAs.some((dsaId: any) => dsaId.toString() === session.user.id);
    if (!isAssigned) {
      return NextResponse.json({ error: 'Not assigned to this application' }, { status: 403 });
    }

    // Check if DSA has already reviewed
    const existingReviewIndex = application.dsaReviews.findIndex(
      (review: any) => review.dsaId.toString() === session.user.id
    );

    const reviewData = {
      dsaId: session.user.id,
      status: validatedData.status,
      comments: validatedData.comments,
      reviewedAt: new Date(),
      documentsReviewed: validatedData.documentsReviewed,
      riskAssessment: validatedData.riskAssessment
    };

    if (existingReviewIndex >= 0) {
      // Update existing review
      application.dsaReviews[existingReviewIndex] = reviewData;
    } else {
      // Add new review
      application.dsaReviews.push(reviewData);
    }

    await application.save();

    return NextResponse.json({
      success: true,
      message: `Application ${validatedData.status} successfully`,
      review: reviewData
    });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error submitting review:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
