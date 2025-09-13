'use client';



import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Search, Plus, FileText, Eye, Download, Upload, CheckCircle, XCircle, Clock, AlertCircle } from 'lucide-react';
import Link from 'next/link';
import { useGetApplicationsQuery } from '@/store/api/apiSlice';
import { SkeletonCard } from '@/components/ui/loading/SkeletonCard';
import { formatFullCurrency, formatLoanAmount } from '@/lib/utils/currency';
import { safeApplication } from '@/lib/utils/fallbacks';

export default function UserApplicationsPage() {
  // All hooks must be called before any conditional returns
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('newest');

  // Fetch applications using RTK Query
  const {
    data: applicationsData,
    isLoading,
    error,
    refetch
  } = useGetApplicationsQuery({
    userId: session?.user?.id || '',
    status: statusFilter !== 'all' ? statusFilter : undefined,
    search: searchTerm || undefined,
    sortBy,
  }, {
    skip: !session?.user || session.user.role !== 'user'
  });

  // Conditional returns after all hooks
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session?.user || session.user.role !== 'user') {
    router.push('/login');
    return null;
  }

  const applications = applicationsData?.applications || [];

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-4 w-4 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-4 w-4 text-red-500" />;
      case 'under_review':
        return <Clock className="h-4 w-4 text-yellow-500" />;
      case 'partially_approved':
        return <AlertCircle className="h-4 w-4 text-blue-500" />;
      case 'pending':
        return <Clock className="h-4 w-4 text-gray-500" />;
      default:
        return <FileText className="h-4 w-4 text-gray-400" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800 border-green-200';
      case 'rejected':
        return 'bg-red-100 text-red-800 border-red-200';
      case 'under_review':
        return 'bg-yellow-100 text-yellow-800 border-yellow-200';
      case 'partially_approved':
        return 'bg-blue-100 text-blue-800 border-blue-200';
      case 'pending':
        return 'bg-gray-100 text-gray-800 border-gray-200';
      default:
        return 'bg-gray-100 text-gray-600 border-gray-200';
    }
  };

  const getStatusText = (status: string) => {
    switch (status) {
      case 'approved':
        return 'Approved';
      case 'rejected':
        return 'Rejected';
      case 'under_review':
        return 'Under Review';
      case 'partially_approved':
        return 'Partially Approved';
      case 'pending':
        return 'Pending';
      default:
        return 'Unknown';
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Applications</h3>
            <p className="text-gray-600 mb-4">Failed to load your applications. Please try again.</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Applications</h1>
            <p className="text-gray-600">Track and manage your loan applications</p>
          </div>
          <Link href="/user/applications/new">
            <Button className="flex items-center gap-2">
              <Plus className="h-4 w-4" />
              New Application
            </Button>
          </Link>
        </div>

        {/* Filters */}
        <Card>
          <CardContent className="p-4">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="flex-1">
                <div className="relative">
                  <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 text-gray-400 h-4 w-4" />
                  <Input
                    placeholder="Search applications..."
                    value={searchTerm}
                    onChange={(e) => setSearchTerm(e.target.value)}
                    className="pl-10"
                  />
                </div>
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Filter by status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="under_review">Under Review</SelectItem>
                  <SelectItem value="partially_approved">Partially Approved</SelectItem>
                  <SelectItem value="approved">Approved</SelectItem>
                  <SelectItem value="rejected">Rejected</SelectItem>
                </SelectContent>
              </Select>
              <Select value={sortBy} onValueChange={setSortBy}>
                <SelectTrigger className="w-full sm:w-48">
                  <SelectValue placeholder="Sort by" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="newest">Newest First</SelectItem>
                  <SelectItem value="oldest">Oldest First</SelectItem>
                  <SelectItem value="amount_high">Amount: High to Low</SelectItem>
                  <SelectItem value="amount_low">Amount: Low to High</SelectItem>
                  <SelectItem value="status">Status</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Applications List */}
        {isLoading ? (
          <div className="grid gap-6">
            {[...Array(3)].map((_, i) => (
              <SkeletonCard key={i} />
            ))}
          </div>
        ) : applications.length === 0 ? (
          <Card>
            <CardContent className="text-center py-12">
              <FileText className="h-12 w-12 text-gray-400 mx-auto mb-4" />
              <h3 className="text-lg font-semibold text-gray-900 mb-2">No Applications Found</h3>
              <p className="text-gray-600 mb-4">
                {searchTerm || statusFilter !== 'all' 
                  ? 'No applications match your current filters.' 
                  : 'You haven\'t submitted any loan applications yet.'
                }
              </p>
              {!searchTerm && statusFilter === 'all' && (
                <Link href="/user/applications/new">
                  <Button>
                    <Plus className="h-4 w-4 mr-2" />
                    Create Your First Application
                  </Button>
                </Link>
              )}
            </CardContent>
          </Card>
        ) : (
          <div className="grid gap-6">
            {applications.map((app) => {
              const safeApp = safeApplication(app);
              return (
                <Card key={safeApp._id} className="hover:shadow-md transition-shadow">
                  <CardHeader className="pb-3">
                    <div className="flex items-start justify-between">
                      <div className="space-y-1">
                        <CardTitle className="text-lg">
                          Application #{safeApp.applicationNumber}
                        </CardTitle>
                        <CardDescription>
                          {safeApp.educationInfo.course} at {safeApp.educationInfo.instituteName}
                        </CardDescription>
                      </div>
                      <Badge className={`${getStatusColor(safeApp.status)} border`}>
                        <div className="flex items-center gap-1">
                          {getStatusIcon(safeApp.status)}
                          {getStatusText(safeApp.status)}
                        </div>
                      </Badge>
                    </div>
                  </CardHeader>
                  <CardContent className="space-y-4">
                    <div className="grid grid-cols-1 md:grid-cols-3 gap-4">
                      <div>
                        <p className="text-sm font-medium text-gray-500">Loan Amount</p>
                        <p className="text-lg font-semibold text-gray-900">
                          {formatLoanAmount(safeApp.loanInfo.amount)}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Submitted</p>
                        <p className="text-sm text-gray-900">
                          {new Date(safeApp.createdAt).toLocaleDateString()}
                        </p>
                      </div>
                      <div>
                        <p className="text-sm font-medium text-gray-500">Last Updated</p>
                        <p className="text-sm text-gray-900">
                          {new Date(safeApp.updatedAt).toLocaleDateString()}
                        </p>
                      </div>
                    </div>

                    {/* DSA Information */}
                    {safeApp.assignedDSAs && safeApp.assignedDSAs.length > 0 && (
                      <div className="border-t pt-4">
                        <p className="text-sm font-medium text-gray-500 mb-2">Assigned DSAs</p>
                        <div className="flex flex-wrap gap-2">
                          {safeApp.assignedDSAs.map((dsa: any, index: number) => (
                            <Badge key={index} variant="outline" className="text-xs">
                              {dsa.name} ({dsa.bankName})
                            </Badge>
                          ))}
                        </div>
                      </div>
                    )}

                    {/* Action Buttons */}
                    <div className="flex items-center justify-between pt-4 border-t">
                      <div className="flex items-center gap-2">
                        <Link href={`/user/applications/${safeApp._id}`}>
                          <Button variant="outline" size="sm">
                            <Eye className="h-4 w-4 mr-2" />
                            View Details
                          </Button>
                        </Link>
                        {safeApp.status === 'partially_approved' && (
                          <Link href={`/user/chat?applicationId=${safeApp._id}`}>
                            <Button variant="outline" size="sm">
                              <FileText className="h-4 w-4 mr-2" />
                              Chat with DSA
                            </Button>
                          </Link>
                        )}
                      </div>
                      <div className="flex items-center gap-2">
                        {safeApp.documents && (
                          <Button variant="ghost" size="sm">
                            <Download className="h-4 w-4 mr-2" />
                            Documents ({safeApp.documents.length})
                          </Button>
                        )}
                      </div>
                    </div>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        )}

        {/* Summary Stats */}
        {applications.length > 0 && (
          <Card>
            <CardHeader>
              <CardTitle className="text-lg">Application Summary</CardTitle>
            </CardHeader>
            <CardContent>
              <div className="grid grid-cols-2 md:grid-cols-4 gap-4">
                <div className="text-center">
                  <p className="text-2xl font-bold text-gray-900">{applications.length}</p>
                  <p className="text-sm text-gray-600">Total Applications</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-green-600">
                    {applications.filter(app => app.status === 'approved').length}
                  </p>
                  <p className="text-sm text-gray-600">Approved</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-yellow-600">
                    {applications.filter(app => ['under_review', 'partially_approved'].includes(app.status)).length}
                  </p>
                  <p className="text-sm text-gray-600">In Progress</p>
                </div>
                <div className="text-center">
                  <p className="text-2xl font-bold text-blue-600">
                    {formatLoanAmount(applications.reduce((sum, app) => sum + (app.loanInfo?.amount || 0), 0))}
                  </p>
                  <p className="text-sm text-gray-600">Total Amount</p>
                </div>
              </div>
            </CardContent>
          </Card>
        )}
      </div>
    </DashboardLayout>
  );
}
