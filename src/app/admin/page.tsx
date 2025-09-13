'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import StatCard from '@/components/common/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonStatsGrid, SkeletonTable, SkeletonList } from '@/components/ui/loading/SkeletonCard';
import { useGetStatisticsQuery, useGetApplicationsQuery, useGetUsersQuery } from '@/store/api/apiSlice';
import { formatIndianNumber, formatLoanAmount, formatPercentage } from '@/lib/utils/currency';
import { safeStatistics, safeApplication, safeUser, safeDate } from '@/lib/utils/fallbacks';

export default function AdminDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // RTK Query hooks
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    error: statsError 
  } = useGetStatisticsQuery('admin', {
    skip: !session || session.user.role !== 'admin'
  });

  const { 
    data: applicationsData, 
    isLoading: applicationsLoading 
  } = useGetApplicationsQuery({ 
    limit: 5, 
    status: 'pending' 
  }, {
    skip: !session || session.user.role !== 'admin'
  });

  const { 
    data: usersData, 
    isLoading: usersLoading 
  } = useGetUsersQuery({ 
    limit: 5 
  }, {
    skip: !session || session.user.role !== 'admin'
  });

  // Safe data with fallbacks
  const stats = safeStatistics(statsData?.statistics);
  const applications = applicationsData?.applications?.map(safeApplication) || [];
  const users = usersData?.users?.map(safeUser) || [];

  // Redirect if not admin
  if (status === 'loading') return <div>Loading...</div>;
  if (!session || session.user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">
                Welcome back, {session?.user?.firstName || 'Admin'}!
              </h1>
              <p className="text-blue-100 text-lg">
                Here&apos;s what&apos;s happening with your loan management system today.
              </p>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        {statsLoading ? (
          <SkeletonStatsGrid count={8} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
            <StatCard
              title="Total Users"
              value={formatIndianNumber(stats.totalUsers)}
              description="Registered users"
              icon="Users"
            />
            <StatCard
              title="Total Applications"
              value={formatIndianNumber(stats.totalApplications)}
              description="All applications"
              icon="FileText"
            />
            <StatCard
              title="Pending Applications"
              value={formatIndianNumber(stats.pendingApplications)}
              description="Awaiting review"
              icon="Clock"
            />
            <StatCard
              title="Approved Applications"
              value={formatIndianNumber(stats.approvedApplications)}
              description="Successfully approved"
              icon="CheckCircle"
            />
            <StatCard
              title="Rejected Applications"
              value={formatIndianNumber(stats.rejectedApplications)}
              description="Applications rejected"
              icon="XCircle"
            />
            <StatCard
              title="Active DSAs"
              value={formatIndianNumber(stats.activeDSAs)}
              description="Working DSAs"
              icon="Users"
            />
            <StatCard
              title="Total Loan Amount"
              value={formatLoanAmount(stats.totalLoanAmount)}
              description="Total disbursed amount"
              icon="DollarSign"
            />
            <StatCard
              title="Average Loan Amount"
              value={formatLoanAmount(stats.averageLoanAmount)}
              description="Per application"
              icon="Target"
            />
          </div>
        )}

        {/* Recent Applications and Users */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          {/* Recent Applications */}
          {applicationsLoading ? (
            <SkeletonList items={5} />
          ) : (
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Recent Applications</CardTitle>
                <CardDescription>Latest loan applications submitted</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No applications found</p>
                  ) : (
                    applications.map((app) => (
                      <div key={app._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{app.personalInfo.firstName} {app.personalInfo.lastName}</h3>
                            <Badge variant={app.status === 'approved' ? 'default' : app.status === 'rejected' ? 'destructive' : 'secondary'}>
                              {app.status}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{formatLoanAmount(app.loanInfo.amount)}</p>
                          <p className="text-xs text-gray-500">{safeDate(app.createdAt)}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          View
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}

          {/* Recent Users */}
          {usersLoading ? (
            <SkeletonList items={5} showAvatar />
          ) : (
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Recent Users</CardTitle>
                <CardDescription>Newly registered users</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {users.length === 0 ? (
                    <p className="text-gray-500 text-center py-4">No users found</p>
                  ) : (
                    users.map((user) => (
                      <div key={user._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">{user.firstName} {user.lastName}</h3>
                            <Badge variant={user.isVerified ? 'default' : 'secondary'}>
                              {user.isVerified ? 'Verified' : 'Pending'}
                            </Badge>
                          </div>
                          <p className="text-sm text-gray-600">{user.email}</p>
                          <p className="text-xs text-gray-500">Role: {user.role}</p>
                        </div>
                        <Button variant="outline" size="sm">
                          Manage
                        </Button>
                      </div>
                    ))
                  )}
                </div>
              </CardContent>
            </Card>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
