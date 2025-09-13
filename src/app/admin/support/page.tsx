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
import { Search, Filter, MoreHorizontal, Eye, MessageSquare, Clock, User, AlertCircle } from 'lucide-react';
import { DropdownMenu, DropdownMenuContent, DropdownMenuItem, DropdownMenuTrigger } from '@/components/ui/dropdown-menu';
import {
  useGetSupportTicketsQuery,
  useUpdateSupportTicketMutation,
  useDeleteSupportTicketMutation
} from '@/store/api/apiSlice';
import { Skeleton } from '@/components/ui/skeleton';
import { safeString, safeDate, safeTimeAgo } from '@/lib/utils/fallbacks';
import { toast } from 'sonner';

export default function AdminSupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  // All hooks must be called before conditional returns
  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [priorityFilter, setPriorityFilter] = useState('');
  const [searchTerm, setSearchTerm] = useState('');

  // RTK Query hooks - must be called before conditional returns
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets
  } = useGetSupportTicketsQuery({
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined,
    priority: priorityFilter && priorityFilter !== 'all' ? priorityFilter : undefined,
    limit: 50,
    page: 1
  }, {
    skip: !session?.user || session.user.role !== 'admin'
  });

  const [updateTicket] = useUpdateSupportTicketMutation();
  const [deleteTicket] = useDeleteSupportTicketMutation();

  // Conditional returns after all hooks
  if (status === 'loading') {
    return (
      <DashboardLayout>
        <div className="space-y-6 lg:space-y-8">
          {/* Header Skeleton */}
          <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
            <div>
              <Skeleton className="h-8 w-48 mb-2" />
              <Skeleton className="h-4 w-96" />
            </div>
            <div className="flex gap-2">
              <Skeleton className="h-10 w-24" />
              <Skeleton className="h-10 w-32" />
            </div>
          </div>

          {/* Filters Skeleton */}
          <div className="bg-white border border-slate-200 rounded-lg p-4 sm:p-6">
            <div className="flex flex-col sm:flex-row gap-4">
              <Skeleton className="h-10 flex-1" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
              <Skeleton className="h-10 w-40" />
            </div>
          </div>

          {/* Table Skeleton */}
          <div className="bg-white border border-slate-200 rounded-lg">
            <div className="p-6">
              <div className="space-y-4">
                {[1, 2, 3, 4, 5].map((i) => (
                  <div key={i} className="flex items-center justify-between p-4 border rounded-lg">
                    <div className="flex-1 space-y-2">
                      <Skeleton className="h-4 w-3/4" />
                      <Skeleton className="h-3 w-1/2" />
                    </div>
                    <div className="flex items-center gap-2">
                      <Skeleton className="h-6 w-16" />
                      <Skeleton className="h-8 w-8" />
                    </div>
                  </div>
                ))}
              </div>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user || session.user.role !== 'admin') {
    router.push('/login');
    return null;
  }

  const supportTickets = ticketsData?.tickets || [];

  const handleStatusUpdate = async (ticketId: string, newStatus: string) => {
    try {
      await updateTicket({ ticketId, status: newStatus }).unwrap();
      toast.success('Ticket status updated successfully');
      refetchTickets();
    } catch (error) {
      toast.error('Failed to update ticket status');
      console.error('Error updating ticket:', error);
    }
  };

  const handleAssignTicket = async (ticketId: string, assignedTo: string) => {
    try {
      await updateTicket({ ticketId, assignedTo }).unwrap();
      toast.success('Ticket assigned successfully');
      refetchTickets();
    } catch (error) {
      toast.error('Failed to assign ticket');
      console.error('Error assigning ticket:', error);
    }
  };

  const handleDeleteTicket = async (ticketId: string) => {
    if (!confirm('Are you sure you want to delete this ticket?')) return;

    try {
      await deleteTicket(ticketId).unwrap();
      toast.success('Ticket deleted successfully');
      refetchTickets();
    } catch (error) {
      toast.error('Failed to delete ticket');
      console.error('Error deleting ticket:', error);
    }
  };

  const handleViewTicket = (ticketId: string) => {
    router.push(`/admin/support/${ticketId}`);
  };

  const handleReplyTicket = (ticketId: string) => {
    router.push(`/admin/support/${ticketId}?action=reply`);
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-yellow-100 text-yellow-800';
      case 'resolved':
        return 'bg-green-100 text-green-800';
      case 'closed':
        return 'bg-gray-100 text-gray-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'high':
        return 'bg-red-100 text-red-800';
      case 'medium':
        return 'bg-yellow-100 text-yellow-800';
      case 'low':
        return 'bg-green-100 text-green-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  const getCategoryColor = (category: string) => {
    switch (category) {
      case 'technical':
        return 'bg-blue-100 text-blue-800';
      case 'general':
        return 'bg-gray-100 text-gray-800';
      case 'billing':
        return 'bg-green-100 text-green-800';
      case 'process':
        return 'bg-purple-100 text-purple-800';
      case 'other':
        return 'bg-orange-100 text-orange-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };



  const openTickets = supportTickets.filter(ticket => ticket.status === 'open').length;
  const inProgressTickets = supportTickets.filter(ticket => ticket.status === 'in_progress').length;
  const resolvedTickets = supportTickets.filter(ticket => ticket.status === 'resolved').length;
  const highPriorityTickets = supportTickets.filter(ticket => ticket.priority === 'high').length;

  

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Support Tickets</h1>
            <p className="text-slate-600">Manage customer support requests and inquiries</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline">
              <Filter className="h-4 w-4 mr-2" />
              Filters
            </Button>
            <Button className="bg-blue-600 hover:bg-blue-700">
              <MessageSquare className="h-4 w-4 mr-2" />
              New Ticket
            </Button>
          </div>
        </div>

        {/* Stats Cards */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Open Tickets</p>
                  <p className="text-2xl font-bold text-red-600">{openTickets}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">In Progress</p>
                  <p className="text-2xl font-bold text-yellow-600">{inProgressTickets}</p>
                </div>
                <div className="p-2 bg-yellow-50 rounded-lg">
                  <Clock className="h-5 w-5 text-yellow-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">Resolved</p>
                  <p className="text-2xl font-bold text-green-600">{resolvedTickets}</p>
                </div>
                <div className="p-2 bg-green-50 rounded-lg">
                  <MessageSquare className="h-5 w-5 text-green-600" />
                </div>
              </div>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200">
            <CardContent className="p-4 sm:p-6">
              <div className="flex items-center justify-between">
                <div>
                  <p className="text-sm font-medium text-slate-600">High Priority</p>
                  <p className="text-2xl font-bold text-red-600">{highPriorityTickets}</p>
                </div>
                <div className="p-2 bg-red-50 rounded-lg">
                  <AlertCircle className="h-5 w-5 text-red-600" />
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
                  placeholder="Search tickets..."
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
                  <SelectItem value="open">Open</SelectItem>
                  <SelectItem value="in_progress">In Progress</SelectItem>
                  <SelectItem value="resolved">Resolved</SelectItem>
                  <SelectItem value="closed">Closed</SelectItem>
                </SelectContent>
              </Select>
              <Select value={priorityFilter} onValueChange={setPriorityFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Priority" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Priority</SelectItem>
                  <SelectItem value="high">High</SelectItem>
                  <SelectItem value="medium">Medium</SelectItem>
                  <SelectItem value="low">Low</SelectItem>
                </SelectContent>
              </Select>
              <Select value={categoryFilter} onValueChange={setCategoryFilter}>
                <SelectTrigger className="w-full sm:w-40">
                  <SelectValue placeholder="Category" />
                </SelectTrigger>
                <SelectContent>
                  <SelectItem value="all">All Categories</SelectItem>
                  <SelectItem value="technical">Technical</SelectItem>
                  <SelectItem value="loan_inquiry">Loan Inquiry</SelectItem>
                  <SelectItem value="document">Document</SelectItem>
                  <SelectItem value="general">General</SelectItem>
                </SelectContent>
              </Select>
            </div>
          </CardContent>
        </Card>

        {/* Tickets Table */}
        <Card className="bg-white border border-slate-200">
          <CardHeader className="border-b border-slate-100">
            <CardTitle>Support Tickets ({supportTickets.length})</CardTitle>
            <CardDescription>All customer support requests</CardDescription>
          </CardHeader>
          <CardContent className="p-0">
            <div className="overflow-x-auto">
              <table className="w-full">
                <thead className="bg-slate-50">
                  <tr>
                    <th className="text-left p-4 font-medium text-slate-700">Ticket</th>
                    <th className="text-left p-4 font-medium text-slate-700">Customer</th>
                    <th className="text-left p-4 font-medium text-slate-700">Category</th>
                    <th className="text-left p-4 font-medium text-slate-700">Status</th>
                    <th className="text-left p-4 font-medium text-slate-700">Priority</th>
                    <th className="text-left p-4 font-medium text-slate-700">Assigned To</th>
                    <th className="text-left p-4 font-medium text-slate-700">Last Updated</th>
                    <th className="text-left p-4 font-medium text-slate-700">Actions</th>
                  </tr>
                </thead>
                <tbody>
                  {supportTickets.map((ticket) => (
                    <tr key={ticket._id} className="border-b border-slate-100 hover:bg-slate-50">
                      <td className="p-4">
                        <div>
                          <div className="font-semibold text-slate-900">#{safeString(ticket.ticketNumber)}</div>
                          <div className="text-sm text-slate-600 max-w-xs truncate">{safeString(ticket.subject)}</div>
                          <div className="text-xs text-slate-500 mt-1">
                            Created {safeDate(ticket.createdAt)}
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="flex items-center gap-2">
                          <div className="w-8 h-8 bg-blue-600 rounded-full flex items-center justify-center">
                            <User className="h-4 w-4 text-white" />
                          </div>
                          <div>
                            <div className="font-medium text-slate-900">
                              {safeString(ticket.userId?.firstName)} {safeString(ticket.userId?.lastName)}
                            </div>
                            <div className="text-sm text-slate-500">{safeString(ticket.userId?.email)}</div>
                          </div>
                        </div>
                      </td>
                      <td className="p-4">
                        <Badge className={getCategoryColor(ticket.category)}>
                          {ticket.category}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getStatusColor(ticket.status)}>
                          {ticket.status.replace('_', ' ')}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <Badge className={getPriorityColor(ticket.priority)}>
                          {ticket.priority}
                        </Badge>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-900">
                          {ticket.assignedTo ?
                            `${safeString(ticket.assignedTo.firstName)} ${safeString(ticket.assignedTo.lastName)}` :
                            'Unassigned'
                          }
                        </div>
                      </td>
                      <td className="p-4">
                        <div className="text-sm text-slate-900">
                          {safeDate(ticket.updatedAt)}
                        </div>
                        <div className="text-xs text-slate-500">
                          {safeTimeAgo(ticket.updatedAt)}
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
                            <DropdownMenuItem onClick={() => handleViewTicket(ticket._id)}>
                              <Eye className="h-4 w-4 mr-2" />
                              View Details
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleReplyTicket(ticket._id)}>
                              <MessageSquare className="h-4 w-4 mr-2" />
                              Reply
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleAssignTicket(ticket._id, 'admin')}>
                              <User className="h-4 w-4 mr-2" />
                              Assign to Me
                            </DropdownMenuItem>
                            <DropdownMenuItem onClick={() => handleStatusUpdate(ticket._id, ticket.status === 'open' ? 'in_progress' : 'resolved')}>
                              <Clock className="h-4 w-4 mr-2" />
                              {ticket.status === 'open' ? 'Mark In Progress' : 'Mark Resolved'}
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
