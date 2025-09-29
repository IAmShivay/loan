import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import logger from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Get all DSAs with pending reactivation requests
    const dsasWithRequests = await User.find({
      role: 'dsa',
      'reactivationRequest.status': 'pending'
    }).select('firstName lastName email reactivationRequest dsaId bankName').lean();

    return NextResponse.json({
      success: true,
      requests: dsasWithRequests
    });

  } catch (error) {
    logger.error('Get DSA reactivation requests error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactivation requests' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { dsaId, action, adminNotes } = await request.json();

    if (!dsaId || !action || !['approve', 'reject'].includes(action)) {
      return NextResponse.json({
        error: 'DSA ID and valid action (approve/reject) are required'
      }, { status: 400 });
    }

    const dsa = await User.findById(dsaId);
    if (!dsa || dsa.role !== 'dsa') {
      return NextResponse.json({ error: 'DSA not found' }, { status: 404 });
    }

    if (!dsa.reactivationRequest || dsa.reactivationRequest.status !== 'pending') {
      return NextResponse.json({
        error: 'No pending reactivation request found'
      }, { status: 400 });
    }

    if (action === 'approve') {
      // Reactivate the DSA account
      dsa.isActive = true;
      dsa.missedDeadlines = 0; // Reset missed deadlines
      dsa.reactivationRequest.status = 'approved';
      dsa.reactivationRequest.reviewedBy = session.user.id;
      dsa.reactivationRequest.reviewedAt = new Date();
      dsa.reactivationRequest.adminNotes = adminNotes;

      logger.info(`DSA account reactivated: ${dsa.email} by admin: ${session.user.email}`);
    } else {
      // Reject the reactivation request
      dsa.reactivationRequest.status = 'rejected';
      dsa.reactivationRequest.reviewedBy = session.user.id;
      dsa.reactivationRequest.reviewedAt = new Date();
      dsa.reactivationRequest.adminNotes = adminNotes;

      logger.info(`DSA reactivation rejected: ${dsa.email} by admin: ${session.user.email}`);
    }

    await dsa.save();

    return NextResponse.json({
      success: true,
      message: `DSA account ${action === 'approve' ? 'reactivated' : 'reactivation rejected'} successfully`
    });

  } catch (error) {
    logger.error('Process DSA reactivation error:', error);
    return NextResponse.json(
      { error: 'Failed to process reactivation request' },
      { status: 500 }
    );
  }
}