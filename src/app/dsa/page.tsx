'use client';



import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import StatCard from '@/components/common/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonStatsGrid, SkeletonList } from '@/components/ui/loading/SkeletonCard';
import { useGetStatisticsQuery, useGetApplicationsQuery } from '@/store/api/apiSlice';
import { formatIndianNumber, formatLoanAmount, formatPercentage, formatFullCurrency } from '@/lib/utils/currency';
import { safeStatistics, safeApplication, safeDate, safeString } from '@/lib/utils/fallbacks';

export default function DSADashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // RTK Query hooks
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    error: statsError 
  } = useGetStatisticsQuery('dsa', {
    skip: !session || session.user.role !== 'dsa'
  });

  const { 
    data: applicationsData, 
    isLoading: applicationsLoading 
  } = useGetApplicationsQuery({ 
    limit: 10, 
    status: 'pending' 
  }, {
    skip: !session || session.user.role !== 'dsa'
  });

  // Safe data with fallbacks
  const stats = safeStatistics(statsData?.statistics);
  const applications = applicationsData?.applications?.map(safeApplication) || [];

  // Redirect if not DSA
  if (status === 'loading') return <div>Loading...</div>;
  if (!session || session.user.role !== 'dsa') {
    router.push('/login');
    return null;
  }

  // Redirect to reactivation request page if account is frozen
  if (session.user.isActive === false) {
    router.push('/dsa/reactivation-request');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex justify-between items-start">
            <div className="space-y-3">
              <h1 className="text-3xl font-bold text-white">Welcome back, {session?.user?.firstName || 'DSA'}!</h1>
              <div className="flex items-center space-x-4">
                <div className="bg-primary/10 px-4 py-2 rounded-full">
                  <p className="text-sm font-semibold text-primary">
                    DSA ID: {session?.user?.dsaId || 'N/A'}
                  </p>
                </div>
                <div className="bg-blue-50 px-4 py-2 rounded-full">
                  <p className="text-sm font-semibold text-blue-600">
                    {session?.user?.bankName || 'N/A'} Bank
                  </p>
                </div>
              </div>
            </div>
            <div className="text-right space-y-2">
              <p className="text-sm text-blue-100 font-medium">Success Rate</p>
              <div className="flex items-center space-x-2">
                <div className="text-3xl font-bold text-white">{stats.successRate?.toFixed(1) || 0}%</div>
                <div className="w-3 h-3 bg-gradient-to-r from-green-400 to-green-500 rounded-full animate-pulse"></div>
              </div>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        {statsLoading ? (
          <SkeletonStatsGrid count={6} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <StatCard
              title="Assigned Applications"
              value={formatIndianNumber(stats.assignedApplications)}
              description="Total assigned to you"
              icon="FileText"
            />
            <StatCard
              title="Pending Review"
              value={formatIndianNumber(stats.pendingReview)}
              description="Awaiting your review"
              icon="Clock"
            />
            <StatCard
              title="Approved Applications"
              value={formatIndianNumber(stats.approvedApplications)}
              description="Successfully approved"
              icon="CheckCircle"
            />
            <StatCard
              title="Total Commission"
              value={formatLoanAmount(stats.totalCommission)}
              description="Total earnings"
              icon="DollarSign"
            />
            <StatCard
              title="This Month Commission"
              value={formatLoanAmount(stats.thisMonthCommission)}
              description="Current month earnings"
              icon="TrendingUp"
            />
            <StatCard
              title="Total Loan Amount"
              value={formatLoanAmount(stats.totalLoanAmount)}
              description="Total processed amount"
              icon="Target"
            />
          </div>
        )}

        {/* Pending Applications */}
        <div className="grid grid-cols-1 gap-6">
          {applicationsLoading ? (
            <SkeletonList items={5} />
          ) : (
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Pending Applications</CardTitle>
                <CardDescription>Applications awaiting your review</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <p className="text-gray-500 text-center py-8">No pending applications</p>
                  ) : (
                    applications.map((app) => (
                      <div key={app._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{app.personalInfo.firstName} {app.personalInfo.lastName}</h3>
                            <Badge variant={app.priority === 'high' ? 'destructive' : app.priority === 'medium' ? 'default' : 'secondary'}>
                              {app.priority} priority
                            </Badge>
                          </div>
                          <div className="grid grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Loan Amount:</strong> {formatFullCurrency(app.loanInfo.amount)}</p>
                              <p><strong>Course:</strong> {app.educationInfo.course}</p>
                            </div>
                            <div>
                              <p><strong>Institute:</strong> {app.educationInfo.instituteName}</p>
                              <p><strong>Applied:</strong> {safeDate(app.createdAt)}</p>
                            </div>
                          </div>
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Button variant="outline" size="sm">
                            View Details
                          </Button>
                          <Button size="sm">
                            Review
                          </Button>
                        </div>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>

        {/* Quick Actions */}
        <Card className="bg-white border border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">Quick Actions</CardTitle>
            <CardDescription>Frequently used actions</CardDescription>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <span className="text-lg">📋</span>
                <span>View All Applications</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <span className="text-lg">💬</span>
                <span>Chat Support</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <span className="text-lg">👤</span>
                <span>Update Profile</span>
              </Button>
              <Button variant="outline" className="h-20 flex flex-col items-center justify-center space-y-2">
                <span className="text-lg">📊</span>
                <span>View Reports</span>
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* DSA Information */}
        <Card className="bg-white border border-slate-200">
          <CardHeader>
            <CardTitle className="text-xl font-semibold text-gray-900">DSA Information</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-6">
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">DSA ID</span>
                  <span className="font-medium">{session?.user?.dsaId || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Bank</span>
                  <span className="font-medium">{session?.user?.bankName || 'N/A'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Status</span>
                  <Badge variant="default">Active</Badge>
                </div>
              </div>
              <div className="space-y-4">
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Success Rate</span>
                  <span className="font-medium">{stats.successRate?.toFixed(1) || 0}%</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Average Processing Time</span>
                  <span className="font-medium">{stats.averageProcessingTime || '0 days'}</span>
                </div>
                <div className="flex justify-between items-center">
                  <span className="text-gray-600">Total Processed</span>
                  <span className="font-medium">{formatIndianNumber(stats.assignedApplications)}</span>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
