import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/connection';
import Payment from '@/lib/db/models/Payment';
import LoanApplication from '@/lib/db/models/LoanApplication';
import User from '@/lib/db/models/User';
import { logInfo, logError } from '@/lib/logger';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '20');
    const status = searchParams.get('status');
    const paymentMethod = searchParams.get('paymentMethod');
    const dateFrom = searchParams.get('dateFrom');
    const dateTo = searchParams.get('dateTo');
    const search = searchParams.get('search');

    // Build filter query
    const filter: any = {};

    if (status && status !== 'all') {
      filter.status = status;
    }

    if (paymentMethod && paymentMethod !== 'all') {
      filter.paymentMethod = paymentMethod;
    }

    if (dateFrom || dateTo) {
      filter.createdAt = {};
      if (dateFrom) {
        filter.createdAt.$gte = new Date(dateFrom);
      }
      if (dateTo) {
        filter.createdAt.$lte = new Date(dateTo);
      }
    }

    // Search functionality
    let searchFilter = {};
    if (search) {
      searchFilter = {
        $or: [
          { paymentId: { $regex: search, $options: 'i' } },
          { transactionRef: { $regex: search, $options: 'i' } },
          { gatewayTransactionId: { $regex: search, $options: 'i' } },
        ]
      };
    }

    const finalFilter = search ? { ...filter, ...searchFilter } : filter;

    // Get payments with pagination
    const skip = (page - 1) * limit;
    const [payments, totalCount] = await Promise.all([
      Payment.find(finalFilter)
        .populate('userId', 'firstName lastName email phone')
        .populate('applicationId', 'applicationNumber personalDetails.fullName')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      Payment.countDocuments(finalFilter)
    ]);

    // Get payment statistics
    const [
      totalPayments,
      completedPayments,
      failedPayments,
      pendingPayments,
      totalRevenue,
      todayRevenue,
      monthlyRevenue
    ] = await Promise.all([
      Payment.countDocuments(),
      Payment.countDocuments({ status: 'completed' }),
      Payment.countDocuments({ status: 'failed' }),
      Payment.countDocuments({ status: { $in: ['initiated', 'pending', 'processing'] } }),
      Payment.aggregate([
        { $match: { status: 'completed' } },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        {
          $match: {
            status: 'completed',
            completedAt: {
              $gte: new Date(new Date().setHours(0, 0, 0, 0)),
              $lt: new Date(new Date().setHours(23, 59, 59, 999))
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ]),
      Payment.aggregate([
        {
          $match: {
            status: 'completed',
            completedAt: {
              $gte: new Date(new Date().getFullYear(), new Date().getMonth(), 1),
              $lt: new Date(new Date().getFullYear(), new Date().getMonth() + 1, 1)
            }
          }
        },
        { $group: { _id: null, total: { $sum: '$amount' } } }
      ])
    ]);

    // Get payment method breakdown
    const paymentMethodStats = await Payment.aggregate([
      { $match: { status: 'completed' } },
      {
        $group: {
          _id: '$paymentMethod',
          count: { $sum: 1 },
          totalAmount: { $sum: '$amount' }
        }
      },
      { $sort: { count: -1 } }
    ]);

    // Get daily revenue for the last 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);

    const dailyRevenue = await Payment.aggregate([
      {
        $match: {
          status: 'completed',
          completedAt: { $gte: thirtyDaysAgo }
        }
      },
      {
        $group: {
          _id: {
            year: { $year: '$completedAt' },
            month: { $month: '$completedAt' },
            day: { $dayOfMonth: '$completedAt' }
          },
          revenue: { $sum: '$amount' },
          count: { $sum: 1 }
        }
      },
      { $sort: { '_id.year': 1, '_id.month': 1, '_id.day': 1 } }
    ]);

    const statistics = {
      totalPayments,
      completedPayments,
      failedPayments,
      pendingPayments,
      totalRevenue: totalRevenue[0]?.total || 0,
      todayRevenue: todayRevenue[0]?.total || 0,
      monthlyRevenue: monthlyRevenue[0]?.total || 0,
      successRate: totalPayments > 0 ? ((completedPayments / totalPayments) * 100).toFixed(2) : '0.00',
      paymentMethodStats,
      dailyRevenue: dailyRevenue.map(item => ({
        date: `${item._id.year}-${String(item._id.month).padStart(2, '0')}-${String(item._id.day).padStart(2, '0')}`,
        revenue: item.revenue,
        count: item.count
      }))
    };

    const totalPages = Math.ceil(totalCount / limit);

    logInfo('Admin payments retrieved', {
      userId: session.user.id,
      page,
      limit,
      totalCount,
      filters: finalFilter
    });

    return NextResponse.json({
      payments: payments.map(payment => ({
        _id: payment._id,
        paymentId: payment.paymentId,
        transactionRef: payment.transactionRef,
        applicationId: payment.applicationId?._id,
        applicationNumber: payment.applicationId?.applicationNumber,
        customerName: payment.applicationId?.personalDetails?.fullName || 
                     `${payment.userId?.firstName || ''} ${payment.userId?.lastName || ''}`.trim() ||
                     payment.userId?.email,
        customerEmail: payment.userId?.email,
        customerPhone: payment.userId?.phone,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        status: payment.status,
        gatewayTransactionId: payment.gatewayTransactionId,
        failureReason: payment.failureReason,
        completedAt: payment.completedAt,
        createdAt: payment.createdAt,
        updatedAt: payment.updatedAt,
        metadata: payment.metadata
      })),
      pagination: {
        currentPage: page,
        totalPages,
        totalCount,
        hasNextPage: page < totalPages,
        hasPrevPage: page > 1
      },
      statistics
    });

  } catch (error) {
    const session = await getServerSession(authOptions);
    logError('Admin payments retrieval failed', error, {
      userId: session?.user?.id
    });
    
    return NextResponse.json({
      error: 'Failed to retrieve payments',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    }, { status: 500 });
  }
}

// Export payment data (CSV/Excel)
export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { format = 'csv', filters = {} } = body;

    // Build filter query
    const filter: any = {};
    
    if (filters.status && filters.status !== 'all') {
      filter.status = filters.status;
    }
    
    if (filters.dateFrom || filters.dateTo) {
      filter.createdAt = {};
      if (filters.dateFrom) {
        filter.createdAt.$gte = new Date(filters.dateFrom);
      }
      if (filters.dateTo) {
        filter.createdAt.$lte = new Date(filters.dateTo);
      }
    }

    // Get all payments matching filters
    const payments = await Payment.find(filter)
      .populate('userId', 'firstName lastName email phone')
      .populate('applicationId', 'applicationNumber personalDetails.fullName')
      .sort({ createdAt: -1 })
      .lean();

    // Format data for export
    const exportData = payments.map(payment => ({
      'Payment ID': payment.paymentId,
      'Transaction Ref': payment.transactionRef,
      'Application Number': payment.applicationId?.applicationNumber || 'N/A',
      'Customer Name': payment.applicationId?.personalDetails?.fullName || 
                      `${payment.userId?.firstName || ''} ${payment.userId?.lastName || ''}`.trim() ||
                      payment.userId?.email,
      'Customer Email': payment.userId?.email,
      'Customer Phone': payment.userId?.phone || 'N/A',
      'Amount': payment.amount,
      'Currency': payment.currency,
      'Payment Method': payment.paymentMethod,
      'Status': payment.status,
      'Gateway Transaction ID': payment.gatewayTransactionId || 'N/A',
      'Failure Reason': payment.failureReason || 'N/A',
      'Completed At': payment.completedAt ? new Date(payment.completedAt).toISOString() : 'N/A',
      'Created At': new Date(payment.createdAt).toISOString(),
      'IP Address': payment.metadata?.ipAddress || 'N/A'
    }));

    if (format === 'csv') {
      // Generate CSV
      const headers = Object.keys(exportData[0] || {});
      const csvContent = [
        headers.join(','),
        ...exportData.map(row => 
          headers.map(header => `"${(row as any)[header] || ''}"`).join(',')
        )
      ].join('\n');

      return new NextResponse(csvContent, {
        headers: {
          'Content-Type': 'text/csv',
          'Content-Disposition': `attachment; filename="payments_export_${new Date().toISOString().split('T')[0]}.csv"`
        }
      });
    }

    // Return JSON for other formats
    return NextResponse.json({
      success: true,
      data: exportData,
      count: exportData.length,
      exportedAt: new Date().toISOString()
    });

  } catch (error) {
    const session = await getServerSession(authOptions);
    logError('Payment export failed', error, {
      userId: session?.user?.id
    });
    
    return NextResponse.json({
      error: 'Failed to export payments',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    }, { status: 500 });
  }
}
