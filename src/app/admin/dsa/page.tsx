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
import { Search, Filter, UserPlus, MoreHorizontal, Eye, Edit, Trash2, Star, TrendingUp } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import { useGetUsersQuery, useUpdateUserStatusMutation } from '@/store/api/apiSlice';
import { SkeletonCard } from '@/components/ui/loading/SkeletonCard';
import { toast } from 'sonner';

export default function AdminDSAPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // All hooks must be called before conditional returns
  const [searchTerm, setSearchTerm] = useState('');
  const [statusFilter, setStatusFilter] = useState('all');
  const [sortBy, setSortBy] = useState('name');

  // Fetch DSA users
  const {
    data: dsaData,
    isLoading: dsaLoading,
    error: dsaError,
    refetch: refetchDSAs
  } = useGetUsersQuery({
    role: 'dsa',
    limit: 50,
    page: 1
  }, {
    skip: !session?.user || session.user.role !== 'admin'
  });

  const [updateUserStatus] = useUpdateUserStatusMutation();

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

  const handleStatusUpdate = async (userId: string, newStatus: boolean) => {
    try {
      await updateUserStatus({
        id: userId,
        status: newStatus ? 'active' : 'inactive'
      }).unwrap();
      toast.success(`DSA ${newStatus ? 'activated' : 'deactivated'} successfully`);
      refetchDSAs();
    } catch (error) {
      toast.error('Failed to update DSA status');
    }
  };

  const handleViewDSA = (dsaId: string) => {
    router.push(`/admin/dsa/${dsaId}`);
  };

  const handleEditDSA = (dsaId: string) => {
    router.push(`/admin/dsa/${dsaId}/edit`);
  };

  const handleAddDSA = () => {
    router.push('/admin/dsa/add');
  };

  if (dsaLoading) {
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

  const dsaList = dsaData?.users || [];
  const filteredDSAs = dsaList.filter(dsa => {
    const matchesSearch = searchTerm === '' ||
      dsa.firstName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dsa.lastName?.toLowerCase().includes(searchTerm.toLowerCase()) ||
      dsa.email?.toLowerCase().includes(searchTerm.toLowerCase());

    const matchesStatus = statusFilter === 'all' ||
      (statusFilter === 'active' && dsa.isActive) ||
      (statusFilter === 'inactive' && !dsa.isActive);

    return matchesSearch && matchesStatus;
  });

  const getStatusColor = (isActive: boolean) => {
    return isActive
      ? 'bg-green-100 text-green-800'
      : 'bg-gray-100 text-gray-800';
  };

  const getBankColor = (bank: string) => {
    switch (bank) {
      case 'SBI':
        return 'bg-blue-100 text-blue-800';
      case 'HDFC':
        return 'bg-red-100 text-red-800';
      case 'ICICI':
        return 'bg-orange-100 text-orange-800';
      case 'Axis':
        return 'bg-purple-100 text-purple-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">DSA Management</h1>
            <p className="text-slate-600">Manage Direct Sales Agents and their performance</p>
          </div>
          <Button
            className="bg-blue-600 hover:bg-blue-700"
            onClick={handleAddDSA}
          >
            <UserPlus className="h-4 w-4 mr-2" />
            Add DSA
          </Button>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Total DSAs</p>
                  <p className="text-2xl font-bold text-slate-900">{filteredDSAs.length}</p>
                </div>
                <div className="p-2 bg-blue-50 rounded-lg">
                  <UserPlus className="h-5 w-5 text-blue-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Active DSAs</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {filteredDSAs.filter(dsa => dsa.isActive).length}
                  </p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <UserPlus className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Avg Success Rate</p>
                  <p className="text-2xl font-bold text-slate-900">
                    {dsaList.length > 0
                      ? (filteredDSAs.reduce((sum, dsa) => sum + (dsa.statistics?.successRate || 0), 0) / filteredDSAs.length).toFixed(1)
                      : '0'
                    }%
                  </p>
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
                  <p className="text-sm font-medium text-slate-600">Total Loan Amount</p>
                  <p className="text-2xl font-bold text-slate-900">
                    ₹{(filteredDSAs.reduce((sum, dsa) => sum + (dsa.statistics?.totalLoanAmount || 0), 0) / 10000000).toFixed(1)}Cr
                  </p>
                </div>
                <div className="p-2 bg-orange-50 rounded-lg">
                  <TrendingUp className="h-5 w-5 text-orange-600" />
                </div>
              </div>
            </CardContent>
          </Card>
        </div>

        {/* Filters */}
        <Card className="bg-white border border-slate-200">
          <CardContent className="p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <div className="relative flex-1">
                <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                <Input
                  placeholder="Search DSAs..."
                  className="pl-10"
                  value={searchTerm}
                  onChange={(e) => setSearchTerm(e.target.value)}
                />
              </div>
              <Select value={statusFilter} onValueChange={setStatusFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Bank" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Banks</SelectItem>
                  <SelectItem value="sbi">SBI</SelectItem>
                  <SelectItem value="hdfc">HDFC</SelectItem>
                  <SelectItem value="icici">ICICI</SelectItem>
                  <SelectItem value="axis">Axis</SelectItem>
                </SelectContent>
              </Select>
              <Select>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Status" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Status</SelectItem>
                  <SelectItem value="active">Active</SelectItem>
                  <SelectItem value="inactive">Inactive</SelectItem>
                  <SelectItem value="suspended">Suspended</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* DSA Table */}
        <Card className="bg-white border border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>DSA List ({filteredDSAs.length})</CardTitle>
            <CardDescription>All registered Direct Sales Agents</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-700">DSA Details</th>
                    <th className="text-left p-4 font-medium text-slate-700">Bank</th>
                    <th className="text-left p-4 font-medium text-slate-700">Performance</th>
                    <th className="text-left p-4 font-medium text-slate-700">Status</th>
                    <th className="text-left p-4 font-medium text-slate-700">Rating</th>
                    <th className="text-left p-4 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {filteredDSAs.map((dsa) => (
                    <tr key={dsa._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div>
                          <div className="font-semibold text-slate-900">
                            {dsa.firstName} {dsa.lastName}
                          </div>
                          <div className="text-sm text-slate-500">{dsa.email}</div>
                          <div className="text-xs text-blue-600 mt-1">{dsa.dsaId || 'N/A'}</div>
                          <div className="text-xs text-slate-500">{dsa.phone || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <Badge className={getBankColor(dsa.bankName || 'Other')}>
                            {dsa.bankName || 'N/A'}
                          </Badge>
                          <div className="text-sm text-slate-500 mt-1">{dsa.branchCode || 'N/A'}</div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div>
                          <div className="text-sm font-medium text-slate-900">
                            {dsa.statistics?.approvedApplications || 0}/{dsa.statistics?.totalApplications || 0} approved
                          </div>
                          <div className="text-sm text-green-600 font-medium">
                            {dsa.statistics?.successRate || 0}% success rate
                          </div>
                          <div className="text-xs text-slate-500">
                            ₹{((dsa.statistics?.totalLoanAmount || 0) / 10000000).toFixed(1)}Cr total
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(dsa.isActive)}>
                          {dsa.isActive ? 'Active' : 'Inactive'}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-1">
                          <Star className="h-4 w-4 text-yellow-400 fill-current" />
                          <span className="font-medium text-slate-900">{dsa.rating || 'N/A'}</span>
                        </div>
                      </td>
                      <td className="p-4">
                        <DropdownMenu>
                          <DropdownMenuTrigger asChild>
                            <Button variant="ghost" size="sm">
                              <MoreHorizontal className="h-4 w-4" />
                            </Button>
                          </DropdownMenuTrigger>
                          <DropdownMenuContent align="end">
                            <DropdownMenuItem onClick={() => handleViewDSA(dsa._id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Profile
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleEditDSA(dsa._id)}>
                              <Edit className="h-4 w-4 mr-2" />
                              Edit DSA
                            </DropdownMenuItem>
                            <DropdownMenuItem
                              className="text-red-600"
                              onClick={() => handleStatusUpdate(dsa._id, !dsa.isActive)}
                            >
                              <Trash2 className="h-4 w-4 mr-2" />
                              Suspend DSA
                            </DropdownMenuItem>
                          </DropdownMenuContent>
                        </DropdownMenu>
                      </td>
                    </tr>
                  ))}
                </tbody>
              </table>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
