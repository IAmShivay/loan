'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';
import { useGetAnalyticsQuery } from '@/store/api/apiSlice';
import { SkeletonCard } from '@/components/ui/loading/SkeletonCard';
import { formatCurrency } from '@/lib/utils/fallbacks';

export default function AdminReportsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [timeRange, setTimeRange] = useState('30d');

  // Fetch analytics data for reports
  const {
    data: analyticsData,
    isLoading: analyticsLoading,
    error: analyticsError
  } = useGetAnalyticsQuery({ timeRange }, {
    skip: !session?.user || session.user.role !== 'admin'
  });

  // Conditional returns after all hooks
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="space-y-6 lg:space-y-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user || session.user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  if (analyticsLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 lg:space-y-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  const reportData = analyticsData?.analytics || {
    overview: {
      totalApplications: 0,
      totalUsers: 0,
      totalLoanAmount: 0,
      approvalRate: 0,
      avgLoanAmount: 0
    },
    trends: {
      applicationTrends: [],
      statusDistribution: [],
      loanAmountDistribution: []
    },
    performance: {
      dsaPerformance: [],
      recentApplications: []
    }
  };

  const approvalRate = reportData.overview.approvalRate;
  const rejectionRate = 100 - approvalRate;

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Reports & Analytics</h1>
            <p className="text-slate-600">Comprehensive insights into education loan performance</p>
          </div>
          <div className="flex gap-2">
            <Select value={timeRange} onValueChange={setTimeRange}>
              <SelectTrigger className="w-40">
                <SelectValue placeholder="Time Period" />
              </SelectTrigger>
              <SelectContent>
                <SelectItem value="7d">Last 7 days</SelectItem>
                <SelectItem value="30d">Last 30 days</SelectItem>
                <SelectItem value="90d">Last 90 days</SelectItem>
                <SelectItem value="1y">Last year</SelectItem>
              </SelectContent>
            </Select>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <Download className="h-4 w-4 mr-2" />
              Export Report
            </Button>
          </div>
        </div>

        {/* Key Metrics */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Applications</p>
                  <p className="text-2xl font-bold text-slate-900">{reportData.overview.totalApplications.toLocaleString()}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+12.5% from last month</span>
                  </div>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Approval Rate</p>
                  <p className="text-2xl font-bold text-slate-900">{approvalRate}%</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+2.3% from last month</span>
                  </div>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <PieChart className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total Loan Amount</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(reportData.overview.totalLoanAmount)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingUp className="h-4 w-4 text-green-600 mr-1" />
                    <span className="text-sm text-green-600">+18.7% from last month</span>
                  </div>
                </div>
                <div className="p-2 bg-purple-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-purple-600" />
                </div>
              </div>
            </CardContent>
          </Card>

          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Average Loan</p>
                  <p className="text-2xl font-bold text-slate-900">{formatCurrency(reportData.overview.avgLoanAmount)}</p>
                  <div className="flex items-center mt-2">
                    <TrendingDown className="h-4 w-4 text-red-600 mr-1" />
                    <span className="text-sm text-red-600">-1.2% from last month</span>
                  </div>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <BarChart3 className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Charts Row */}
        <div className="grid grid-cols-1 lg:grid-cols-2 gap-4 lg:gap-6">
          {/* Top Institutions */}
          <Card className="bg-white border border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>Top Educational Institutions</CardTitle>
              <CardDescription>Most popular institutions for education loans</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {/* TODO: Add top institutions to API response */}
                {(reportData as any).topInstitutions?.map((institution: any, index: number) => (
                  <div key={institution.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-blue-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-blue-600">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{institution.name}</div>
                        <div className="text-sm text-slate-500">{institution.applications} applications</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">₹{(institution.amount / 10000000).toFixed(1)}Cr</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>

          {/* DSA Performance */}
          <Card className="bg-white border border-slate-200">
            <CardHeader className="border-b border-slate-100">
              <CardTitle>DSA Performance</CardTitle>
              <CardDescription>Top performing DSAs by success rate</CardDescription>
            </CardHeader>
            <CardContent className="p-4 sm:p-6">
              <div className="space-y-4">
                {reportData.performance.dsaPerformance?.map((dsa: any, index: number) => (
                  <div key={dsa.name} className="flex items-center justify-between">
                    <div className="flex items-center space-x-3">
                      <div className="w-8 h-8 bg-green-100 rounded-full flex items-center justify-center">
                        <span className="text-sm font-semibold text-green-600">{index + 1}</span>
                      </div>
                      <div>
                        <div className="font-medium text-slate-900">{dsa.name}</div>
                        <div className="text-sm text-slate-500">{dsa.bank} Bank</div>
                      </div>
                    </div>
                    <div className="text-right">
                      <div className="font-semibold text-slate-900">{dsa.successRate}%</div>
                      <div className="text-sm text-slate-500">{dsa.approved}/{dsa.applications}</div>
                    </div>
                  </div>
                ))}
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Application Status Breakdown */}
        <Card className="bg-white border border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Application Status Breakdown</CardTitle>
            <CardDescription>Current status distribution of all applications</CardDescription>
          </CardHeader>
          <CardContent className="p-4 sm:p-6">
            <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4">
              <div className="text-center p-4 bg-green-50 rounded-lg">
                <div className="text-2xl font-bold text-green-600">
                  {Math.round((reportData.overview.totalApplications * approvalRate) / 100)}
                </div>
                <div className="text-sm text-green-700">Approved ({approvalRate}%)</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">
                  {Math.round((reportData.overview.totalApplications * rejectionRate) / 100)}
                </div>
                <div className="text-sm text-red-700">Rejected ({rejectionRate.toFixed(1)}%)</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">
                  {reportData.overview.totalApplications - Math.round((reportData.overview.totalApplications * approvalRate) / 100) - Math.round((reportData.overview.totalApplications * rejectionRate) / 100)}
                </div>
                <div className="text-sm text-yellow-700">Pending Review</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.overview.totalApplications}</div>
                <div className="text-sm text-blue-700">Total Applications</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
