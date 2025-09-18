import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import { connectDB } from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId');
    const sortBy = searchParams.get('sortBy') || 'newest';

    console.log('Debug Applications List API:', {
      sessionUserId: session.user.id,
      queryUserId: userId,
      sortBy,
      userRole: session.user.role
    });

    // Build query
    const query: any = {};
    
    // Filter based on user role
    if (session.user.role === 'user') {
      query.userId = session.user.id;
    } else if (session.user.role === 'dsa') {
      query.assignedDSAs = { $in: [session.user.id] };
    }
    // Admin can see all applications (no additional filter)

    // Apply additional filters
    if (userId && session.user.role !== 'user') {
      query.userId = userId;
    }

    console.log('Debug Applications List Query:', query);

    // Get applications
    const applications = await LoanApplication.find(query)
      .populate('userId', 'firstName lastName email phone')
      .populate('assignedDSAs', 'firstName lastName email bank dsaId')
      .sort({ createdAt: sortBy === 'newest' ? -1 : 1 })
      .lean();

    console.log('Debug Applications List Results:', {
      applicationsFound: applications.length,
      applications: applications.map((app: any) => ({
        _id: app._id.toString(),
        applicationNumber: app.applicationNumber,
        status: app.status,
        userId: app.userId.toString(),
        createdAt: app.createdAt
      }))
    });

    return NextResponse.json({
      success: true,
      query,
      applicationsCount: applications.length,
      applications: applications.map((app: any) => ({
        _id: app._id.toString(),
        applicationNumber: app.applicationNumber,
        status: app.status,
        userId: app.userId.toString(),
        createdAt: app.createdAt,
        loanInfo: app.loanInfo
      }))
    });

  } catch (error) {
    console.error('Debug applications list error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
