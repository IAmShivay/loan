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

    // Get all applications for this user
    const applications = await LoanApplication.find({ userId: session.user.id })
      .select('_id applicationNumber status createdAt userId')
      .lean();

    console.log('Debug - User applications:', {
      userId: session.user.id,
      userRole: session.user.role,
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
      userId: session.user.id,
      userRole: session.user.role,
      applicationsCount: applications.length,
      applications: applications.map((app: any) => ({
        _id: app._id.toString(),
        applicationNumber: app.applicationNumber,
        status: app.status,
        userId: app.userId.toString(),
        createdAt: app.createdAt
      }))
    });

  } catch (error) {
    console.error('Debug applications error:', error);
    return NextResponse.json(
      { error: 'Internal server error', details: error instanceof Error ? error.message : 'Unknown error' },
      { status: 500 }
    );
  }
}
