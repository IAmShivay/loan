import { getAuthSession } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Calendar, Download, TrendingUp, TrendingDown, BarChart3, PieChart } from 'lucide-react';

export default async function AdminReportsPage() {
  const session = await getAuthSession();
  
  if (!session?.user || session.user.role !== 'admin') {
    redirect('/login');
  }

  // TODO: Replace with actual API calls
  const reportData = {
    totalApplications: 1247,
    approvedApplications: 892,
    rejectedApplications: 203,
    pendingApplications: 152,
    totalLoanAmount: 125000000,
    averageLoanAmount: 750000,
    topInstitutions: [
      { name: 'IIT Delhi', applications: 45, amount: 33750000 },
      { name: 'Stanford University', applications: 32, amount: 48000000 },
      { name: 'Harvard University', applications: 28, amount: 42000000 },
      { name: 'MIT', applications: 25, amount: 37500000 },
      { name: 'Oxford University', applications: 22, amount: 33000000 }
    ],
    monthlyTrends: [
      { month: 'Jan', applications: 89, amount: 6675000 },
      { month: 'Feb', applications: 95, amount: 7125000 },
      { month: 'Mar', applications: 102, amount: 7650000 },
      { month: 'Apr', applications: 87, amount: 6525000 },
      { month: 'May', applications: 110, amount: 8250000 },
      { month: 'Jun', applications: 98, amount: 7350000 }
    ],
    dsaPerformance: [
      { name: 'Jane Smith', bank: 'SBI', applications: 45, approved: 38, successRate: 84.4 },
      { name: 'Mike Wilson', bank: 'HDFC', applications: 42, approved: 35, successRate: 83.3 },
      { name: 'Sarah Davis', bank: 'ICICI', applications: 38, approved: 30, successRate: 78.9 },
      { name: 'John Brown', bank: 'Axis', applications: 35, approved: 26, successRate: 74.3 }
    ]
  };

  const approvalRate = ((reportData.approvedApplications / reportData.totalApplications) * 100).toFixed(1);
  const rejectionRate = ((reportData.rejectedApplications / reportData.totalApplications) * 100).toFixed(1);

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
            <Select>
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
                  <p className="text-2xl font-bold text-slate-900">{reportData.totalApplications.toLocaleString()}</p>
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
                  <p className="text-2xl font-bold text-slate-900">₹{(reportData.totalLoanAmount / 10000000).toFixed(1)}Cr</p>
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
                  <p className="text-2xl font-bold text-slate-900">₹{(reportData.averageLoanAmount / 100000).toFixed(1)}L</p>
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
                {reportData.topInstitutions.map((institution, index) => (
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
                {reportData.dsaPerformance.map((dsa, index) => (
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
                <div className="text-2xl font-bold text-green-600">{reportData.approvedApplications}</div>
                <div className="text-sm text-green-700">Approved ({approvalRate}%)</div>
              </div>
              <div className="text-center p-4 bg-red-50 rounded-lg">
                <div className="text-2xl font-bold text-red-600">{reportData.rejectedApplications}</div>
                <div className="text-sm text-red-700">Rejected ({rejectionRate}%)</div>
              </div>
              <div className="text-center p-4 bg-yellow-50 rounded-lg">
                <div className="text-2xl font-bold text-yellow-600">{reportData.pendingApplications}</div>
                <div className="text-sm text-yellow-700">Pending Review</div>
              </div>
              <div className="text-center p-4 bg-blue-50 rounded-lg">
                <div className="text-2xl font-bold text-blue-600">{reportData.totalApplications}</div>
                <div className="text-sm text-blue-700">Total Applications</div>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
