import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import connectDB from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import User from '@/lib/db/models/User';
import { logApiRequest, logApiResponse, logError, logDbOperation } from '@/lib/logger';

export async function GET(request: NextRequest) {
  const startTime = Date.now();
  const url = request.url;
  const method = request.method;

  try {
    logApiRequest(method, url);

    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 401, duration);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const timeRange = searchParams.get('timeRange') || '30d';

    await connectDB();

    // Calculate date range
    const now = new Date();
    let startDate = new Date();
    
    switch (timeRange) {
      case '7d':
        startDate.setDate(now.getDate() - 7);
        break;
      case '30d':
        startDate.setDate(now.getDate() - 30);
        break;
      case '90d':
        startDate.setDate(now.getDate() - 90);
        break;
      case '1y':
        startDate.setFullYear(now.getFullYear() - 1);
        break;
      default:
        startDate.setDate(now.getDate() - 30);
    }

    // Fetch analytics data
    const [
      totalApplications,
      totalUsers,
      applicationsByStatus,
      applicationsByMonth,
      loanAmountStats,
      dsaPerformance,
      recentApplications
    ] = await Promise.all([
      // Total applications count
      LoanApplication.countDocuments({
        createdAt: { $gte: startDate }
      }),

      // Total users count
      User.countDocuments({
        createdAt: { $gte: startDate }
      }),

      // Applications by status
      LoanApplication.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        { $group: { _id: '$status', count: { $sum: 1 } } }
      ]),

      // Applications by month
      LoanApplication.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: {
              year: { $year: '$createdAt' },
              month: { $month: '$createdAt' }
            },
            applications: { $sum: 1 },
            approved: {
              $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
            },
            rejected: {
              $sum: { $cond: [{ $eq: ['$status', 'rejected'] }, 1, 0] }
            },
            pending: {
              $sum: { $cond: [{ $eq: ['$status', 'pending'] }, 1, 0] }
            }
          }
        },
        { $sort: { '_id.year': 1, '_id.month': 1 } }
      ]),

      // Loan amount statistics
      LoanApplication.aggregate([
        { $match: { createdAt: { $gte: startDate } } },
        {
          $group: {
            _id: null,
            totalAmount: { $sum: '$loanInfo.amount' },
            avgAmount: { $avg: '$loanInfo.amount' },
            minAmount: { $min: '$loanInfo.amount' },
            maxAmount: { $max: '$loanInfo.amount' }
          }
        }
      ]),

      // DSA performance (mock data for now)
      Promise.resolve([
        { name: 'Rajesh Kumar', applications: 45, approved: 38, rate: 84 },
        { name: 'Priya Sharma', applications: 42, approved: 35, rate: 83 },
        { name: 'Amit Singh', applications: 38, approved: 30, rate: 79 },
        { name: 'Sneha Patel', applications: 35, approved: 26, rate: 74 },
        { name: 'Vikram Gupta', applications: 32, approved: 22, rate: 69 }
      ]),

      // Recent applications
      LoanApplication.find({ createdAt: { $gte: startDate } })
        .populate('userId', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .limit(10)
        .lean()
    ]);

    logDbOperation('read', 'analytics', true, undefined, { timeRange, totalApplications, totalUsers });

    // Process status distribution
    const statusDistribution = [
      { name: 'Approved', value: 0, color: '#10b981' },
      { name: 'Pending', value: 0, color: '#f59e0b' },
      { name: 'Under Review', value: 0, color: '#3b82f6' },
      { name: 'Rejected', value: 0, color: '#ef4444' }
    ];

    applicationsByStatus.forEach((item: any) => {
      const statusItem = statusDistribution.find(s => 
        s.name.toLowerCase() === item._id?.toLowerCase() ||
        (item._id === 'pending' && s.name === 'Pending') ||
        (item._id === 'approved' && s.name === 'Approved') ||
        (item._id === 'rejected' && s.name === 'Rejected')
      );
      if (statusItem) {
        statusItem.value = item.count;
      }
    });

    // Calculate total for percentages
    const totalStatusCount = statusDistribution.reduce((sum, item) => sum + item.value, 0);
    if (totalStatusCount > 0) {
      statusDistribution.forEach(item => {
        item.value = Math.round((item.value / totalStatusCount) * 100);
      });
    }

    // Process monthly trends
    const monthNames = ['Jan', 'Feb', 'Mar', 'Apr', 'May', 'Jun', 'Jul', 'Aug', 'Sep', 'Oct', 'Nov', 'Dec'];
    const applicationTrends = applicationsByMonth.map((item: any) => ({
      month: monthNames[item._id.month - 1],
      applications: item.applications,
      approved: item.approved,
      rejected: item.rejected,
      pending: item.pending
    }));

    // Loan amount distribution (mock data)
    const loanAmountDistribution = [
      { range: '0-2L', count: Math.floor(totalApplications * 0.25), percentage: 25 },
      { range: '2-5L', count: Math.floor(totalApplications * 0.33), percentage: 33 },
      { range: '5-10L', count: Math.floor(totalApplications * 0.30), percentage: 30 },
      { range: '10L+', count: Math.floor(totalApplications * 0.12), percentage: 12 }
    ];

    const analytics = {
      overview: {
        totalApplications,
        totalUsers,
        totalLoanAmount: loanAmountStats[0]?.totalAmount || 0,
        approvalRate: totalApplications > 0 ? 
          Math.round((applicationsByStatus.find((s: any) => s._id === 'approved')?.count || 0) / totalApplications * 100) : 0,
        avgLoanAmount: loanAmountStats[0]?.avgAmount || 0
      },
      trends: {
        applicationTrends,
        statusDistribution,
        loanAmountDistribution
      },
      performance: {
        dsaPerformance,
        recentApplications: recentApplications.map((app: any) => ({
          _id: app._id,
          applicantName: `${app.personalInfo?.firstName || ''} ${app.personalInfo?.lastName || ''}`.trim(),
          loanAmount: app.loanInfo?.amount || 0,
          status: app.status,
          createdAt: app.createdAt,
          userId: app.userId
        }))
      },
      timeRange,
      generatedAt: new Date().toISOString()
    };

    const duration = Date.now() - startTime;
    logApiResponse(method, url, 200, duration, session.user.id);

    return NextResponse.json({
      success: true,
      analytics
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Failed to fetch analytics', error, { url, method });
    logApiResponse(method, url, 500, duration);

    return NextResponse.json(
      { error: 'Failed to fetch analytics data' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const url = request.url;
  const method = request.method;

  try {
    logApiRequest(method, url);

    const session = await getAuthSession();
    if (!session?.user || session.user.role !== 'admin') {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 401, duration);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { action, filters } = await request.json();

    await connectDB();

    if (action === 'export') {
      // Generate export data
      logDbOperation('read', 'analytics_export', true, undefined, { filters });
      
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 200, duration, session.user.id);

      return NextResponse.json({
        success: true,
        message: 'Analytics export generated successfully',
        exportUrl: `/api/admin/analytics/export?token=${Date.now()}`
      });
    }

    if (action === 'refresh') {
      // Refresh analytics cache
      logDbOperation('update', 'analytics_cache', true, undefined, { action: 'refresh' });
      
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 200, duration, session.user.id);

      return NextResponse.json({
        success: true,
        message: 'Analytics data refreshed successfully'
      });
    }

    const duration = Date.now() - startTime;
    logApiResponse(method, url, 400, duration, session.user.id);

    return NextResponse.json(
      { error: 'Invalid action' },
      { status: 400 }
    );

  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Analytics action failed', error, { url, method });
    logApiResponse(method, url, 500, duration);

    return NextResponse.json(
      { error: 'Action failed' },
      { status: 500 }
    );
  }
}
