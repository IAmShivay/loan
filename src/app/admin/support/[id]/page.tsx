'use client';

import { useState, useEffect } from 'react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { Textarea } from '@/components/ui/textarea';
import { ArrowLeft, Send, Paperclip, User, Clock, MessageSquare } from 'lucide-react';
import { 
  useGetSupportTicketQuery, 
  useAddSupportTicketMessageMutation,
  useUpdateSupportTicketMutation 
} from '@/store/api/apiSlice';
import { SkeletonCard } from '@/components/ui/loading/SkeletonCard';
import { safeString, safeDate } from '@/lib/utils/fallbacks';
import { toast } from 'sonner';

interface AdminSupportDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function AdminSupportDetailPage({ params }: AdminSupportDetailPageProps) {
  const router = useRouter();
  const searchParams = useSearchParams();
  const { data: session, status } = useSession();
  const [id, setId] = useState<string>('');
  const [newMessage, setNewMessage] = useState('');
  const [isReplying, setIsReplying] = useState(false);

  // Resolve params
  useEffect(() => {
    params.then((resolvedParams) => {
      setId(resolvedParams.id);
    });
  }, [params]);

  const {
    data: ticket,
    isLoading: ticketLoading,
    error: ticketError,
    refetch: refetchTicket
  } = useGetSupportTicketQuery(id, {
    skip: !id || !session?.user || session.user.role !== 'admin'
  });

  const [addMessage, { isLoading: addingMessage }] = useAddSupportTicketMessageMutation();
  const [updateTicket] = useUpdateSupportTicketMutation();

  // Auto-open reply if action=reply in URL
  useEffect(() => {
    if (searchParams.get('action') === 'reply') {
      setIsReplying(true);
    }
  }, [searchParams]);

  // Conditional returns after all hooks
  if (status === 'loading' || !id) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  if (status === 'unauthenticated' || session?.user?.role !== 'admin') {
    router.push('/auth/signin');
    return null;
  }

  if (ticketLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6">
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  if (ticketError) {
    console.error('Ticket error:', ticketError);
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Error Loading Ticket</h3>
            <p className="text-slate-600 mb-4">
              {ticketError && 'data' in ticketError && ticketError.data
                ? (ticketError.data as any).error || 'Failed to load support ticket'
                : 'Failed to load support ticket'
              }
            </p>
            <div className="flex gap-2 justify-center">
              <Button onClick={() => router.push('/admin/support')}>
                <ArrowLeft className="h-4 w-4 mr-2" />
                Back to Support
              </Button>
              <Button variant="outline" onClick={() => refetchTicket()}>
                Try Again
              </Button>
            </div>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (!ticket) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h3 className="text-lg font-medium text-slate-900 mb-2">Ticket Not Found</h3>
            <p className="text-slate-600 mb-4">The support ticket you're looking for doesn't exist.</p>
            <Button onClick={() => router.push('/admin/support')}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Support
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const handleSendMessage = async () => {
    if (!newMessage.trim()) {
      toast.error('Please enter a message');
      return;
    }

    try {
      await addMessage({
        ticketId: ticket._id,
        message: newMessage.trim()
      }).unwrap();

      setNewMessage('');
      setIsReplying(false);
      toast.success('Message sent successfully');
      refetchTicket();
    } catch (error) {
      toast.error('Failed to send message');
      console.error('Error sending message:', error);
    }
  };

  const handleStatusUpdate = async (newStatus: string) => {
    try {
      await updateTicket({
        ticketId: ticket._id,
        status: newStatus
      }).unwrap();

      toast.success('Ticket status updated');
      refetchTicket();
    } catch (error) {
      toast.error('Failed to update status');
      console.error('Error updating status:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'open': return 'bg-blue-100 text-blue-800';
      case 'in_progress': return 'bg-yellow-100 text-yellow-800';
      case 'resolved': return 'bg-green-100 text-green-800';
      case 'closed': return 'bg-slate-100 text-slate-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  const getPriorityColor = (priority: string) => {
    switch (priority) {
      case 'urgent': return 'bg-red-100 text-red-800';
      case 'high': return 'bg-orange-100 text-orange-800';
      case 'medium': return 'bg-yellow-100 text-yellow-800';
      case 'low': return 'bg-green-100 text-green-800';
      default: return 'bg-slate-100 text-slate-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.push('/admin/support')}
            >
              <ArrowLeft className="h-4 w-4 mr-2" />
              Back to Support
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Ticket #{safeString(ticket.ticketNumber)}
              </h1>
              <p className="text-slate-600">{safeString(ticket.subject)}</p>
            </div>
          </div>
          <div className="flex items-center gap-2">
            <Badge className={getPriorityColor(ticket.priority || 'medium')}>
              {ticket.priority || 'medium'}
            </Badge>
            <Badge className={getStatusColor(ticket.status || 'open')}>
              {(ticket.status || 'open').replace('_', ' ')}
            </Badge>
          </div>
        </div>

        {/* Ticket Details */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Ticket Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
              <div>
                <p className="text-sm font-medium text-slate-600">Category</p>
                <p className="text-slate-900">{safeString(ticket.category)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Created</p>
                <p className="text-slate-900">{safeDate(ticket.createdAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Last Updated</p>
                <p className="text-slate-900">{safeDate(ticket.updatedAt)}</p>
              </div>
              <div>
                <p className="text-sm font-medium text-slate-600">Assigned To</p>
                <p className="text-slate-900">
                  {ticket.assignedTo ? 'Admin' : 'Unassigned'}
                </p>
              </div>
            </div>
            
            <div>
              <p className="text-sm font-medium text-slate-600 mb-2">Description</p>
              <div className="bg-slate-50 rounded-lg p-4">
                <p className="text-slate-900 whitespace-pre-wrap">
                  {safeString(ticket.description)}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Messages/Responses */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <MessageSquare className="h-5 w-5" />
              Conversation
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            {ticket.responses && ticket.responses.length > 0 ? (
              <div className="space-y-4">
                {ticket.responses.map((response: any, index: number) => (
                  <div
                    key={index}
                    className={`p-4 rounded-lg ${
                      response.isInternal 
                        ? 'bg-blue-50 border-l-4 border-blue-400' 
                        : 'bg-slate-50 border-l-4 border-slate-400'
                    }`}
                  >
                    <div className="flex items-center justify-between mb-2">
                      <div className="flex items-center gap-2">
                        <User className="h-4 w-4" />
                        <span className="font-medium">
                          {response.isInternal ? 'Admin' : 'User'}
                        </span>
                      </div>
                      <span className="text-sm text-slate-500">
                        {safeDate(response.createdAt)}
                      </span>
                    </div>
                    <p className="text-slate-900 whitespace-pre-wrap">
                      {safeString(response.message)}
                    </p>
                  </div>
                ))}
              </div>
            ) : (
              <p className="text-slate-500 text-center py-8">No messages yet</p>
            )}

            {/* Reply Section */}
            {isReplying ? (
              <div className="border-t pt-4">
                <div className="space-y-4">
                  <Textarea
                    placeholder="Type your reply..."
                    value={newMessage}
                    onChange={(e) => setNewMessage(e.target.value)}
                    rows={4}
                  />
                  <div className="flex items-center justify-between">
                    <Button
                      variant="outline"
                      onClick={() => {
                        setIsReplying(false);
                        setNewMessage('');
                      }}
                    >
                      Cancel
                    </Button>
                    <Button
                      onClick={handleSendMessage}
                      disabled={addingMessage || !newMessage.trim()}
                    >
                      <Send className="h-4 w-4 mr-2" />
                      {addingMessage ? 'Sending...' : 'Send Reply'}
                    </Button>
                  </div>
                </div>
              </div>
            ) : (
              <div className="border-t pt-4">
                <Button onClick={() => setIsReplying(true)}>
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Reply to Ticket
                </Button>
              </div>
            )}
          </CardContent>
        </Card>

        {/* Actions */}
        <Card>
          <CardHeader>
            <CardTitle>Actions</CardTitle>
          </CardHeader>
          <CardContent>
            <div className="flex flex-wrap gap-2">
              {ticket.status !== 'in_progress' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('in_progress')}
                >
                  <Clock className="h-4 w-4 mr-2" />
                  Mark In Progress
                </Button>
              )}
              {ticket.status !== 'resolved' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('resolved')}
                >
                  Mark Resolved
                </Button>
              )}
              {ticket.status !== 'closed' && (
                <Button
                  variant="outline"
                  onClick={() => handleStatusUpdate('closed')}
                >
                  Close Ticket
                </Button>
              )}
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
