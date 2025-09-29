import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';
import logger from '@/lib/logger';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'dsa') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { reason, clarification } = await request.json();

    if (!reason || !clarification) {
      return NextResponse.json({
        error: 'Reason and clarification are required'
      }, { status: 400 });
    }

    if (reason.length < 10 || clarification.length < 20) {
      return NextResponse.json({
        error: 'Reason must be at least 10 characters and clarification at least 20 characters'
      }, { status: 400 });
    }

    const dsa = await User.findById(session.user.id);
    if (!dsa || dsa.role !== 'dsa') {
      return NextResponse.json({ error: 'DSA not found' }, { status: 404 });
    }

    // Check if account is actually frozen/inactive
    if (dsa.isActive) {
      return NextResponse.json({
        error: 'Account is already active'
      }, { status: 400 });
    }

    // Check if there's already a pending request
    if (dsa.reactivationRequest && dsa.reactivationRequest.status === 'pending') {
      return NextResponse.json({
        error: 'You already have a pending reactivation request'
      }, { status: 400 });
    }

    // Create or update reactivation request
    dsa.reactivationRequest = {
      reason: reason.trim(),
      clarification: clarification.trim(),
      requestedAt: new Date(),
      status: 'pending'
    };

    await dsa.save();

    logger.info(`DSA reactivation request submitted: ${dsa.email}`);

    return NextResponse.json({
      success: true,
      message: 'Reactivation request submitted successfully. Admin will review your request.'
    });

  } catch (error) {
    logger.error('Submit DSA reactivation request error:', error);
    return NextResponse.json(
      { error: 'Failed to submit reactivation request' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'dsa') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const dsa = await User.findById(session.user.id).select('reactivationRequest').lean();
    if (!dsa) {
      return NextResponse.json({ error: 'DSA not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      reactivationRequest: (dsa as any).reactivationRequest || null
    });

  } catch (error) {
    logger.error('Get DSA reactivation request error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch reactivation request' },
      { status: 500 }
    );
  }
}