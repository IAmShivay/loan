'use client';



import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import {
  HelpCircle,
  MessageSquare,
  Phone,
  Mail,
  FileText,
  Clock,
  CheckCircle,
  AlertCircle,
  Search,
  Plus,
  ExternalLink
} from 'lucide-react';
import {
  useGetSupportTicketsQuery,
  useCreateSupportTicketMutation,
  useUpdateSupportTicketMutation
} from '@/store/api/apiSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { safeString, safeDate, safeTimeAgo } from '@/lib/utils/fallbacks';
import { toast } from 'sonner';

export default function DSASupportPage() {
  const { data: session, status } = useSession();
  const router = useRouter();

  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session?.user || session.user.role !== 'dsa') {
    router.push('/login');
    return null;
  }

  const [statusFilter, setStatusFilter] = useState('');
  const [categoryFilter, setCategoryFilter] = useState('');
  const [newTicket, setNewTicket] = useState({
    subject: '',
    description: '',
    category: 'technical' as const,
    priority: 'medium' as const
  });

  // RTK Query hooks
  const {
    data: ticketsData,
    isLoading: ticketsLoading,
    error: ticketsError,
    refetch: refetchTickets
  } = useGetSupportTicketsQuery({
    status: statusFilter && statusFilter !== 'all' ? statusFilter : undefined,
    category: categoryFilter && categoryFilter !== 'all' ? categoryFilter : undefined,
    limit: 20,
    page: 1
  });

  const [createTicket, { isLoading: createLoading }] = useCreateSupportTicketMutation();
  const [updateTicket] = useUpdateSupportTicketMutation();

  const supportTickets = ticketsData?.tickets || [];

  const handleCreateTicket = async (e: React.FormEvent) => {
    e.preventDefault();

    if (!newTicket.subject.trim() || !newTicket.description.trim()) {
      toast.error('Please fill in all required fields');
      return;
    }

    try {
      await createTicket(newTicket).unwrap();
      toast.success('Support ticket created successfully');
      setNewTicket({
        subject: '',
        description: '',
        category: 'technical',
        priority: 'medium'
      });
      refetchTickets();
    } catch (error) {
      toast.error('Failed to create support ticket');
      console.error('Error creating ticket:', error);
    }
  };

  const faqs = [
    {
      question: 'How do I update an application status?',
      answer: 'Go to the Applications page, find the application, click on the three dots menu, and select "Update Status". Choose the new status and add any comments if needed.',
      category: 'Applications'
    },
    {
      question: 'What documents are required for education loans?',
      answer: 'Standard documents include Aadhar card, PAN card, income proof, admission letter, bank statements, and collateral documents (if applicable).',
      category: 'Documentation'
    },
    {
      question: 'How is commission calculated?',
      answer: 'Commission is calculated based on the loan amount and type. Typically 0.5-1% of the approved loan amount, paid after disbursement.',
      category: 'Commission'
    },
    {
      question: 'How to handle rejected applications?',
      answer: 'For rejected applications, provide clear feedback to the applicant, suggest improvements, and guide them on reapplication process if applicable.',
      category: 'Applications'
    }
  ];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open':
        return 'bg-red-100 text-red-800';
      case 'in_progress':
        return 'bg-blue-100 text-blue-800';
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

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'open':
        return <AlertCircle className="h-4 w-4 text-red-600" />;
      case 'in_progress':
        return <Clock className="h-4 w-4 text-blue-600" />;
      case 'resolved':
        return <CheckCircle className="h-4 w-4 text-green-600" />;
      default:
        return <HelpCircle className="h-4 w-4 text-gray-600" />;
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Support Center</h1>
            <p className="text-slate-600">Get help and manage your support tickets</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Plus className="h-4 w-4 mr-2" />
            New Ticket
          </Button>
        </div>

        {/* Quick Actions */}
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6">
          <Card className="bg-white border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 sm:p-6 text-center">
              <MessageSquare className="h-8 w-8 text-blue-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Live Chat</h3>
              <p className="text-sm text-slate-600">Chat with support team</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 sm:p-6 text-center">
              <Phone className="h-8 w-8 text-green-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Call Support</h3>
              <p className="text-sm text-slate-600">+91 1800-123-4567</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 sm:p-6 text-center">
              <Mail className="h-8 w-8 text-purple-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Email Support</h3>
              <p className="text-sm text-slate-600">dsa-support@eduloan.com</p>
            </CardContent>
          </Card>
          <Card className="bg-white border border-slate-200 hover:shadow-md transition-shadow cursor-pointer">
            <CardContent className="p-4 sm:p-6 text-center">
              <FileText className="h-8 w-8 text-orange-600 mx-auto mb-3" />
              <h3 className="font-semibold text-slate-900 mb-1">Documentation</h3>
              <p className="text-sm text-slate-600">View guides & manuals</p>
            </CardContent>
          </Card>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Support Tickets */}
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>My Support Tickets</CardTitle>
                <CardDescription>Track your support requests and their status</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search tickets..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {supportTickets.map((ticket) => (
                    <div key={ticket._id} className="p-4 border-b border-slate-100 last:border-b-0 hover:bg-slate-50 cursor-pointer">
                      <div className="flex items-start justify-between mb-2">
                        <div className="flex items-center gap-2">
                          {getStatusIcon(ticket.status)}
                          <h4 className="font-medium text-slate-900">{safeString(ticket.subject)}</h4>
                        </div>
                        <Badge className={getPriorityColor(ticket.priority)} >
                          {safeString(ticket.priority)}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600 mb-3 line-clamp-2">{safeString(ticket.description)}</p>
                      <div className="flex items-center justify-between">
                        <div className="flex items-center gap-2">
                          <Badge className={getStatusColor(ticket.status)} >
                            {safeString(ticket.status).replace('_', ' ')}
                          </Badge>
                          <span className="text-xs text-slate-500">{safeString(ticket.category)}</span>
                        </div>
                        <div className="text-xs text-slate-500">
                          {safeDate(ticket.createdAt)}
                        </div>
                      </div>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Create New Ticket */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle>Create New Ticket</CardTitle>
                <CardDescription>Submit a new support request</CardDescription>
              </CardHeader>
              <CardContent className="space-y-4">
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Category</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select category" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="technical">Technical Issue</SelectItem>
                      <SelectItem value="process">Process Question</SelectItem>
                      <SelectItem value="financial">Financial Query</SelectItem>
                      <SelectItem value="account">Account Issue</SelectItem>
                      <SelectItem value="other">Other</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Priority</label>
                  <Select>
                    <SelectTrigger>
                      <SelectValue placeholder="Select priority" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="low">Low</SelectItem>
                      <SelectItem value="medium">Medium</SelectItem>
                      <SelectItem value="high">High</SelectItem>
                      <SelectItem value="urgent">Urgent</SelectItem>
                    </SelectContent>
                  </Select>
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Subject</label>
                  <Input placeholder="Brief description of your issue" />
                </div>
                <div>
                  <label className="text-sm font-medium text-slate-700 mb-2 block">Description</label>
                  <Textarea 
                    placeholder="Provide detailed information about your issue..."
                    rows={4}
                  />
                </div>
                <Button className="w-full bg-blue-600 hover:bg-blue-700">
                  Submit Ticket
                </Button>
              </CardContent>
            </Card>
          </div>

          {/* FAQ Section */}
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200">
              <CardHeader className="border-b border-slate-100">
                <CardTitle>Frequently Asked Questions</CardTitle>
                <CardDescription>Find quick answers to common questions</CardDescription>
              </CardHeader>
              <CardContent className="p-0">
                <div className="p-4 border-b border-slate-100">
                  <div className="relative">
                    <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
                    <Input
                      placeholder="Search FAQs..."
                      className="pl-10"
                    />
                  </div>
                </div>
                <div className="max-h-96 overflow-y-auto">
                  {faqs.map((faq, index) => (
                    <div key={index} className="p-4 border-b border-slate-100 last:border-b-0">
                      <div className="flex items-start justify-between mb-2">
                        <h4 className="font-medium text-slate-900 pr-4">{faq.question}</h4>
                        <Badge variant="outline" >
                          {faq.category}
                        </Badge>
                      </div>
                      <p className="text-sm text-slate-600">{faq.answer}</p>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>

            {/* Resources */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle>Helpful Resources</CardTitle>
                <CardDescription>Documentation and guides</CardDescription>
              </CardHeader>
              <CardContent className="space-y-3">
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-blue-600" />
                    <div>
                      <div className="font-medium text-slate-900">DSA Handbook</div>
                      <div className="text-sm text-slate-500">Complete guide for DSAs</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-green-600" />
                    <div>
                      <div className="font-medium text-slate-900">Loan Processing Guide</div>
                      <div className="text-sm text-slate-500">Step-by-step process</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-purple-600" />
                    <div>
                      <div className="font-medium text-slate-900">Commission Structure</div>
                      <div className="text-sm text-slate-500">Payment details</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </div>
                <div className="flex items-center justify-between p-3 border border-slate-200 rounded-lg hover:bg-slate-50 cursor-pointer">
                  <div className="flex items-center gap-3">
                    <FileText className="h-5 w-5 text-orange-600" />
                    <div>
                      <div className="font-medium text-slate-900">Compliance Guidelines</div>
                      <div className="text-sm text-slate-500">Regulatory requirements</div>
                    </div>
                  </div>
                  <ExternalLink className="h-4 w-4 text-slate-400" />
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
