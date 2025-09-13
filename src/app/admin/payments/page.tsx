'use client';

import { useState } from 'react';
import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Badge } from '@/components/ui/badge';
import { 
  Search, 
  Download, 
  Filter, 
  RefreshCw,
  CreditCard,
  TrendingUp,
  TrendingDown,
  DollarSign,
  Calendar,
  Users,
  CheckCircle,
  XCircle,
  Clock,
  AlertTriangle
} from 'lucide-react';
import { useGetAdminPaymentsQuery, useExportPaymentsMutation } from '@/store/api/apiSlice';
import { SkeletonCard } from '@/components/ui/loading/SkeletonCard';
import { safeString, safeNumber, safeDate } from '@/lib/utils/fallbacks';
import { toast } from 'sonner';

export default function AdminPaymentsPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  
  // State for filters and pagination
  const [page, setPage] = useState(1);
  const [search, setSearch] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [paymentMethodFilter, setPaymentMethodFilter] = useState('all');
  const [dateFrom, setDateFrom] = useState('');
  const [dateTo, setDateTo] = useState('');

  // RTK Query hooks
  const {
    data: paymentsData,
    isLoading: paymentsLoading,
    error: paymentsError,
    refetch: refetchPayments
  } = useGetAdminPaymentsQuery({
    page,
    limit: 20,
    search: search || undefined,
    status: statusFilter !== 'all' ? statusFilter : undefined,
    paymentMethod: paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined,
    dateFrom: dateFrom || undefined,
    dateTo: dateTo || undefined,
  }, {
    skip: !session?.user || session.user.role !== 'admin'
  });

  const [exportPayments, { isLoading: isExporting }] = useExportPaymentsMutation();

  if (status === 'loading' || paymentsLoading) {
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
    router.push('/auth/signin');
    return null;
  }

  if (paymentsError) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Error Loading Payments</h2>
            <p className="text-slate-600 mb-4">Failed to load payment data.</p>
            <Button onClick={() => refetchPayments()}>
              <RefreshCw className="h-4 w-4 mr-2" />
              Retry
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const payments = paymentsData?.payments || [];
  const pagination = paymentsData?.pagination;
  const statistics = paymentsData?.statistics;

  const handleExport = async (format: string = 'csv') => {
    try {
      const filters = {
        status: statusFilter !== 'all' ? statusFilter : undefined,
        paymentMethod: paymentMethodFilter !== 'all' ? paymentMethodFilter : undefined,
        dateFrom: dateFrom || undefined,
        dateTo: dateTo || undefined,
      };

      await exportPayments({ format, filters }).unwrap();
      toast.success('Payment data exported successfully');
    } catch (error) {
      toast.error('Failed to export payment data');
      console.error('Export error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'completed':
        return 'bg-green-100 text-green-800';
      case 'failed':
        return 'bg-red-100 text-red-800';
      case 'cancelled':
        return 'bg-gray-100 text-gray-800';
      case 'pending':
      case 'processing':
        return 'bg-yellow-100 text-yellow-800';
      case 'initiated':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'completed':
        return <CheckCircle className="h-4 w-4" />;
      case 'failed':
      case 'cancelled':
        return <XCircle className="h-4 w-4" />;
      case 'pending':
      case 'processing':
      case 'initiated':
        return <Clock className="h-4 w-4" />;
      default:
        return <AlertTriangle className="h-4 w-4" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Payment Management</h1>
            <p className="text-slate-600">Monitor and manage all payment transactions</p>
          </div>
          <div className="flex items-center gap-3">
            <Button
              variant="outline"
              onClick={() => refetchPayments()}
              disabled={paymentsLoading}
            >
              <RefreshCw className={`h-4 w-4 mr-2 ${paymentsLoading ? 'animate-spin' : ''}`} />
              Refresh
            </Button>
            <Button
              variant="outline"
              onClick={() => handleExport('csv')}
              disabled={isExporting}
            >
              <Download className="h-4 w-4 mr-2" />
              Export CSV
            </Button>
          </div>
        </div>

        {/* Statistics Cards */}
        {statistics && (
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-6">
            <Card className="bg-white border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ₹{safeNumber(statistics.totalRevenue).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <DollarSign className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <TrendingUp className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">Today: ₹{safeNumber(statistics.todayRevenue).toLocaleString('en-IN')}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Total Payments</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {safeNumber(statistics.totalPayments).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3 bg-blue-100 rounded-full">
                    <CreditCard className="h-6 w-6 text-blue-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Users className="h-4 w-4 text-blue-500 mr-1" />
                  <span className="text-blue-600">Completed: {safeNumber(statistics.completedPayments)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Success Rate</p>
                    <p className="text-2xl font-bold text-slate-900">
                      {safeString(statistics.successRate)}%
                    </p>
                  </div>
                  <div className="p-3 bg-green-100 rounded-full">
                    <TrendingUp className="h-6 w-6 text-green-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <CheckCircle className="h-4 w-4 text-green-500 mr-1" />
                  <span className="text-green-600">Failed: {safeNumber(statistics.failedPayments)}</span>
                </div>
              </CardContent>
            </Card>

            <Card className="bg-white border border-slate-200">
              <CardContent className="p-6">
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Monthly Revenue</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ₹{safeNumber(statistics.monthlyRevenue).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div className="p-3 bg-purple-100 rounded-full">
                    <Calendar className="h-6 w-6 text-purple-600" />
                  </div>
                </div>
                <div className="mt-4 flex items-center text-sm">
                  <Clock className="h-4 w-4 text-yellow-500 mr-1" />
                  <span className="text-yellow-600">Pending: {safeNumber(statistics.pendingPayments)}</span>
                </div>
              </CardContent>
            </Card>
          </div>
        )}

        {/* Filters */}
        <Card className="bg-white border border-slate-200">
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Filter className="h-5 w-5" />
              Filters
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-6 gap-4">
              <div className="relative">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search payments..."
                  value={search}
                  onChange={(e) => setSearch(e.target.value)}
                  className="pl-10"
                />
              </div>
              
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="completed">Completed</SelectItem>
                  <SelectItem value="pending">Pending</SelectItem>
                  <SelectItem value="processing">Processing</SelectItem>
                  <SelectItem value="failed">Failed</SelectItem>
                  <SelectItem value="cancelled">Cancelled</SelectItem>
                </SelectContent>
              </Select>

              <Select value={paymentMethodFilter} onValueChange={setPaymentMethodFilter}>
                <SelectTrigger>
                  <SelectValue placeholder="Payment Method" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Methods</SelectItem>
                  <SelectItem value="card">Card</SelectItem>
                  <SelectItem value="upi">UPI</SelectItem>
                  <SelectItem value="netbanking">Net Banking</SelectItem>
                  <SelectItem value="wallet">Wallet</SelectItem>
                </SelectContent>
              </Select>

              <Input
                type="date"
                placeholder="From Date"
                value={dateFrom}
                onChange={(e) => setDateFrom(e.target.value)}
              />

              <Input
                type="date"
                placeholder="To Date"
                value={dateTo}
                onChange={(e) => setDateTo(e.target.value)}
              />

              <Button
                variant="outline"
                onClick={() => {
                  setSearch('');
                  setStatusFilter('all');
                  setPaymentMethodFilter('all');
                  setDateFrom('');
                  setDateTo('');
                  setPage(1);
                }}
              >
                Clear Filters
              </Button>
            </div>
          </CardContent>
        </Card>

        {/* Payments Table */}
        <Card className="bg-white border border-slate-200">
          <CardHeader>
            <CardTitle>Payment Transactions</CardTitle>
          </CardHeader>
          <CardContent>
            {payments.length === 0 ? (
              <div className="text-center py-12">
                <CreditCard className="h-12 w-12 text-slate-400 mx-auto mb-4" />
                <h3 className="text-lg font-medium text-slate-900 mb-2">No payments found</h3>
                <p className="text-slate-600">No payment transactions match your current filters.</p>
              </div>
            ) : (
              <div className="overflow-x-auto">
                <table className="w-full">
                  <thead>
                    <tr className="border-b border-slate-200">
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Payment ID</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Customer</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Application</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Amount</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Method</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Status</th>
                      <th className="text-left py-3 px-4 font-medium text-slate-600">Date</th>
                    </tr>
                  </thead>
                  <tbody>
                    {payments.map((payment) => (
                      <tr key={payment._id} className="border-b border-slate-100 hover:bg-slate-50">
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-900">{safeString(payment.paymentId)}</p>
                            {payment.gatewayTransactionId && (
                              <p className="text-sm text-slate-600">{safeString(payment.gatewayTransactionId)}</p>
                            )}
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="font-medium text-slate-900">{safeString(payment.customerName)}</p>
                            <p className="text-sm text-slate-600">{safeString(payment.customerEmail)}</p>
                          </div>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">{safeString(payment.applicationNumber)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="font-medium text-slate-900">
                            ₹{safeNumber(payment.amount).toLocaleString('en-IN')}
                          </p>
                          <p className="text-sm text-slate-600">{safeString(payment.currency)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <p className="capitalize text-slate-900">{safeString(payment.paymentMethod)}</p>
                        </td>
                        <td className="py-3 px-4">
                          <Badge className={getStatusColor(payment.status)}>
                            <div className="flex items-center gap-1">
                              {getStatusIcon(payment.status)}
                              {safeString(payment.status)}
                            </div>
                          </Badge>
                        </td>
                        <td className="py-3 px-4">
                          <div>
                            <p className="text-slate-900">{safeDate(payment.createdAt)}</p>
                            {payment.completedAt && (
                              <p className="text-sm text-slate-600">
                                Completed: {safeDate(payment.completedAt)}
                              </p>
                            )}
                          </div>
                        </td>
                      </tr>
                    ))}
                  </tbody>
                </table>
              </div>
            )}

            {/* Pagination */}
            {pagination && pagination.totalPages > 1 && (
              <div className="flex items-center justify-between mt-6">
                <p className="text-sm text-slate-600">
                  Showing {((pagination.currentPage - 1) * 20) + 1} to {Math.min(pagination.currentPage * 20, pagination.totalCount)} of {pagination.totalCount} payments
                </p>
                <div className="flex items-center gap-2">
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page - 1)}
                    disabled={!pagination.hasPrevPage}
                  >
                    Previous
                  </Button>
                  <span className="text-sm text-slate-600">
                    Page {pagination.currentPage} of {pagination.totalPages}
                  </span>
                  <Button
                    variant="outline"
                    size="sm"
                    onClick={() => setPage(page + 1)}
                    disabled={!pagination.hasNextPage}
                  >
                    Next
                  </Button>
                </div>
              </div>
            )}
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
