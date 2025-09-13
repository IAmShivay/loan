import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import connectDB from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import User from '@/lib/db/models/User';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const period = searchParams.get('period') || '30'; // days
    const startDate = new Date();
    startDate.setDate(startDate.getDate() - parseInt(period));

    let statistics: unknown = {};

    if (session.user.role === 'admin') {
      // Admin statistics - comprehensive overview
      const [
        totalApplications,
        totalUsers,
        totalDSAs,
        applicationsByStatus,
        applicationsByPriority,
        recentApplications,
        topDSAs,
        monthlyTrends
      ] = await Promise.all([
        // Total applications
        LoanApplication.countDocuments(),
        
        // Total users
        User.countDocuments({ role: 'user' }),
        
        // Total DSAs
        User.countDocuments({ role: 'dsa' }),
        
        // Applications by status
        LoanApplication.aggregate([
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$loanInfo.amount' }
            }
          }
        ]),
        
        // Applications by priority
        LoanApplication.aggregate([
          {
            $group: {
              _id: '$priority',
              count: { $sum: 1 }
            }
          }
        ]),
        
        // Recent applications (last 7 days)
        LoanApplication.countDocuments({
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        
        // Top performing DSAs
        LoanApplication.aggregate([
          { $match: { assignedDSAs: { $exists: true, $ne: [] } } },
          { $unwind: '$assignedDSAs' },
          {
            $group: {
              _id: '$assignedDSAs',
              totalApplications: { $sum: 1 },
              approvedApplications: {
                $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
              },
              totalLoanAmount: { $sum: '$loanInfo.amount' }
            }
          },
          {
            $lookup: {
              from: 'users',
              localField: '_id',
              foreignField: '_id',
              as: 'dsaInfo'
            }
          },
          { $unwind: '$dsaInfo' },
          {
            $project: {
              name: { $concat: ['$dsaInfo.firstName', ' ', '$dsaInfo.lastName'] },
              email: '$dsaInfo.email',
              totalApplications: 1,
              approvedApplications: 1,
              totalLoanAmount: 1,
              successRate: {
                $multiply: [
                  { $divide: ['$approvedApplications', '$totalApplications'] },
                  100
                ]
              }
            }
          },
          { $sort: { successRate: -1 } },
          { $limit: 5 }
        ]),
        
        // Monthly trends (last 6 months)
        LoanApplication.aggregate([
          {
            $match: {
              createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
            }
          },
          {
            $group: {
              _id: {
                year: { $year: '$createdAt' },
                month: { $month: '$createdAt' }
              },
              applications: { $sum: 1 },
              totalAmount: { $sum: '$loanInfo.amount' },
              approved: {
                $sum: { $cond: [{ $eq: ['$status', 'approved'] }, 1, 0] }
              }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

      statistics = {
        overview: {
          totalApplications,
          totalUsers,
          totalDSAs,
          recentApplications,
          averageProcessingTime: 5.2, // TODO: Calculate from actual data
          approvalRate: applicationsByStatus.find(s => s._id === 'approved')?.count || 0
        },
        applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalAmount: item.totalAmount || 0
          };
          return acc;
        }, {}),
        applicationsByPriority: applicationsByPriority.reduce((acc, item) => {
          acc[item._id] = item.count;
          return acc;
        }, {}),
        topDSAs,
        monthlyTrends
      };

    } else if (session.user.role === 'dsa') {
      // DSA statistics - their assigned applications
      const [
        myApplications,
        applicationsByStatus,
        recentApplications,
        monthlyPerformance
      ] = await Promise.all([
        // Total applications assigned to this DSA
        LoanApplication.countDocuments({ assignedDSAs: { $in: [session.user.id] } }),
        
        // My applications by status
        LoanApplication.aggregate([
          { $match: { assignedDSAs: { $in: [session.user.id] } } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$loanInfo.amount' }
            }
          }
        ]),
        
        // Recent applications assigned to me
        LoanApplication.countDocuments({
          assignedDSAs: { $in: [session.user.id] },
          createdAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }),
        
        // Monthly performance
        LoanApplication.aggregate([
          {
            $match: {
              assignedDSAs: { $in: [session.user.id] },
              createdAt: { $gte: new Date(Date.now() - 6 * 30 * 24 * 60 * 60 * 1000) }
            }
          },
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
              totalAmount: { $sum: '$loanInfo.amount' }
            }
          },
          { $sort: { '_id.year': 1, '_id.month': 1 } }
        ])
      ]);

      const approvedCount = applicationsByStatus.find(s => s._id === 'approved')?.count || 0;
      const successRate = myApplications > 0 ? (approvedCount / myApplications) * 100 : 0;

      statistics = {
        overview: {
          totalApplications: myApplications,
          approvedApplications: approvedCount,
          pendingApplications: applicationsByStatus.find(s => s._id === 'pending')?.count || 0,
          recentApplications,
          successRate: Math.round(successRate * 10) / 10,
          totalLoanAmount: applicationsByStatus.reduce((sum, item) => sum + (item.totalAmount || 0), 0)
        },
        applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalAmount: item.totalAmount || 0
          };
          return acc;
        }, {}),
        monthlyPerformance
      };

    } else if (session.user.role === 'user') {
      // User statistics - their applications
      const [
        myApplications,
        applicationsByStatus,
        latestApplication
      ] = await Promise.all([
        // Total applications by this user
        LoanApplication.countDocuments({ userId: session.user.id }),
        
        // My applications by status
        LoanApplication.aggregate([
          { $match: { userId: session.user.id } },
          {
            $group: {
              _id: '$status',
              count: { $sum: 1 },
              totalAmount: { $sum: '$loanInfo.amount' }
            }
          }
        ]),
        
        // Latest application
        LoanApplication.findOne({ userId: session.user.id })
          .sort({ createdAt: -1 })
          .populate('assignedDSAs', 'firstName lastName email')
      ]);

      statistics = {
        overview: {
          totalApplications: myApplications,
          approvedApplications: applicationsByStatus.find(s => s._id === 'approved')?.count || 0,
          pendingApplications: applicationsByStatus.find(s => s._id === 'pending')?.count || 0,
          rejectedApplications: applicationsByStatus.find(s => s._id === 'rejected')?.count || 0,
          totalLoanAmount: applicationsByStatus.reduce((sum, item) => sum + (item.totalAmount || 0), 0),
          activeLoanAmount: applicationsByStatus.find(s => s._id === 'approved')?.totalAmount || 0
        },
        applicationsByStatus: applicationsByStatus.reduce((acc, item) => {
          acc[item._id] = {
            count: item.count,
            totalAmount: item.totalAmount || 0
          };
          return acc;
        }, {}),
        latestApplication: latestApplication ? {
          id: latestApplication._id,
          applicationId: latestApplication.applicationId,
          status: latestApplication.status,
          amount: latestApplication.loanInfo.amount,
          submittedAt: latestApplication.createdAt,
          assignedDSAs: latestApplication.assignedDSAs
        } : null
      };
    }

    return NextResponse.json({ statistics });

  } catch (error) {
    console.error('Error fetching statistics:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
