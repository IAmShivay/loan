'use client';

// Force dynamic rendering
export const dynamic = 'force-dynamic';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { DashboardLayout } from '@/components/layout';
import StatCard from '@/components/common/StatCard';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { SkeletonStatsGrid, SkeletonList } from '@/components/ui/loading/SkeletonCard';
import { useGetStatisticsQuery, useGetApplicationsQuery } from '@/store/api/apiSlice';
import { formatIndianNumber, formatLoanAmount, formatFullCurrency } from '@/lib/utils/currency';
import { safeStatistics, safeApplication, safeDate } from '@/lib/utils/fallbacks';

export default function UserDashboard() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // RTK Query hooks
  const { 
    data: statsData, 
    isLoading: statsLoading, 
    error: statsError 
  } = useGetStatisticsQuery('user', {
    skip: !session || session.user.role !== 'user'
  });

  const { 
    data: applicationsData, 
    isLoading: applicationsLoading 
  } = useGetApplicationsQuery({ 
    limit: 5,
    userId: session?.user?.id
  }, {
    skip: !session || session.user.role !== 'user'
  });

  // Safe data with fallbacks
  const stats = safeStatistics(statsData?.statistics);
  const applications = applicationsData?.applications?.map(safeApplication) || [];

  // Redirect if not user
  if (status === 'loading') return <div>Loading...</div>;
  if (!session || session.user.role !== 'user') {
    router.push('/login');
    return null;
  }

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'default';
      case 'rejected': return 'destructive';
      case 'under_review': return 'secondary';
      default: return 'outline';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 p-4 sm:p-6 lg:p-8">
        {/* Header */}
        <div className="bg-gradient-to-r from-blue-600 to-blue-700 rounded-xl p-6 text-white">
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div className="space-y-2">
              <h1 className="text-3xl font-bold text-white">Welcome back, {session?.user?.firstName || 'User'}!</h1>
              <p className="text-blue-100 text-lg">
                Track your education loan applications and manage your profile.
              </p>
            </div>
            <div className="flex space-x-3">
              <Link href="/user/applications/new">
                <Button variant="secondary" size="lg" className="bg-white text-blue-600 hover:bg-blue-50">
                  Apply for Loan
                </Button>
              </Link>
            </div>
          </div>
        </div>

        {/* Statistics Grid */}
        {statsLoading ? (
          <SkeletonStatsGrid count={6} />
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4 lg:gap-6">
            <StatCard
              title="Total Applications"
              value={formatIndianNumber(stats.totalApplications)}
              description="Applications submitted"
              icon="FileText"
            />
            <StatCard
              title="Under Review"
              value={formatIndianNumber(stats.pendingApplications)}
              description="Being processed"
              icon="Clock"
            />
            <StatCard
              title="Approved"
              value={formatIndianNumber(stats.approvedApplications)}
              description="Successfully approved"
              icon="CheckCircle"
            />
            <StatCard
              title="Rejected"
              value={formatIndianNumber(stats.rejectedApplications)}
              description="Applications rejected"
              icon="XCircle"
            />
            <StatCard
              title="Total Loan Amount"
              value={formatLoanAmount(stats.totalLoanAmount)}
              description="Total applied amount"
              icon="DollarSign"
            />
            <StatCard
              title="Approved Amount"
              value={formatLoanAmount(stats.approvedAmount)}
              description="Approved loan amount"
              icon="Target"
            />
          </div>
        )}

        {/* Recent Applications */}
        <div className="grid grid-cols-1 gap-6">
          {applicationsLoading ? (
            <SkeletonList items={5} />
          ) : (
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="text-xl font-semibold text-gray-900">Your Applications</CardTitle>
                <CardDescription>Recent loan applications and their status</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  {applications.length === 0 ? (
                    <div className="text-center py-8">
                      <p className="text-gray-500 mb-4">No applications found</p>
                      <Link href="/user/applications/new">
                        <Button>Apply for Your First Loan</Button>
                      </Link>
                    </div>
                  ) : (
                    applications.map((app) => (
                      <div key={app._id} className="flex items-center justify-between p-4 border rounded-lg hover:bg-gray-50">
                        <div className="flex-1">
                          <div className="flex items-center justify-between mb-2">
                            <h3 className="font-medium">Application #{app.applicationNumber}</h3>
                            <Badge variant={getStatusColor(app.status)}>
                              {app.status.replace('_', ' ')}
                            </Badge>
                          </div>
                          <div className="grid grid-cols-1 sm:grid-cols-2 gap-4 text-sm text-gray-600">
                            <div>
                              <p><strong>Loan Amount:</strong> {formatFullCurrency(app.loanInfo.amount)}</p>
                              <p><strong>Course:</strong> {app.educationInfo.course}</p>
                            </div>
                            <div>
                              <p><strong>Institute:</strong> {app.educationInfo.instituteName}</p>
                              <p><strong>Applied:</strong> {safeDate(app.createdAt)}</p>
                            </div>
                          </div>
                          {!app.serviceChargesPaid && (
                            <div className="mt-2">
                              <Badge variant="destructive" className="text-xs">
                                Service charges pending: ₹99
                              </Badge>
                            </div>
                          )}
                        </div>
                        <div className="flex space-x-2 ml-4">
                          <Link href={`/user/applications/${app._id}`}>
                            <Button variant="outline" size="sm">
                              View Details
                            </Button>
                          </Link>
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
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Quick Actions</CardTitle>
              <CardDescription>Frequently used actions</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 gap-4">
                <Link href="/user/applications/new">
                  <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center space-y-2">
                    <span className="text-lg">📝</span>
                    <span className="text-sm">New Application</span>
                  </Button>
                </Link>
                <Link href="/user/applications">
                  <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center space-y-2">
                    <span className="text-lg">📋</span>
                    <span className="text-sm">View Applications</span>
                  </Button>
                </Link>
                <Link href="/user/calculator">
                  <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center space-y-2">
                    <span className="text-lg">🧮</span>
                    <span className="text-sm">EMI Calculator</span>
                  </Button>
                </Link>
                <Link href="/user/chat">
                  <Button variant="outline" className="h-20 w-full flex flex-col items-center justify-center space-y-2">
                    <span className="text-lg">💬</span>
                    <span className="text-sm">Chat Support</span>
                  </Button>
                </Link>
              </div>
            </CardContent>
          </Card>

          {/* Application Tips */}
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="text-xl font-semibold text-gray-900">Application Tips</CardTitle>
              <CardDescription>Improve your loan approval chances</CardDescription>
            </CardHeader>
            <CardContent>
              <div className="space-y-4">
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-sm">Complete Documentation</h4>
                    <p className="text-xs text-gray-600">Ensure all required documents are uploaded</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-sm">Accurate Information</h4>
                    <p className="text-xs text-gray-600">Double-check all personal and financial details</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-sm">Service Charges</h4>
                    <p className="text-xs text-gray-600">Pay ₹99 service charges to process your application</p>
                  </div>
                </div>
                <div className="flex items-start space-x-3">
                  <div className="w-2 h-2 bg-blue-500 rounded-full mt-2"></div>
                  <div>
                    <h4 className="font-medium text-sm">Follow Up</h4>
                    <p className="text-xs text-gray-600">Stay in touch with your assigned DSA</p>
                  </div>
                </div>
              </div>
            </CardContent>
          </Card>
        </div>
      </div>
    </DashboardLayout>
  );
}
