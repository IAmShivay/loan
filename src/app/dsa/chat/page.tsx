'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  Search,
  Send,
  MoreVertical,
  Paperclip,
  Smile,
  MessageCircle,
  Users,
  FileText
} from 'lucide-react';
import { useGetApplicationsQuery } from '@/store/api/apiSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { safeString, safeDate, safeTimeAgo } from '@/lib/utils/fallbacks';

export default function DSAChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);

  // Redirect if not authenticated or not DSA
  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session?.user || session.user.role !== 'dsa') {
    router.push('/login');
    return null;
  }

  // Get applications assigned to this DSA that have user communication
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    error: applicationsError
  } = useGetApplicationsQuery({
    status: 'under_review,partially_approved,approved', // Applications where user can chat
    limit: 50
  });

  if (applicationsLoading) {
    return <LoadingSpinner />;
  }

  // Transform applications into conversations
  const conversations = (applicationsData?.applications || [])
    .filter((app: any) => {
      // Only show applications where user has selected this DSA for communication
      return app.dsaId === session.user.id ||
             (app.dsaReviews && app.dsaReviews.some((review: any) =>
               review.dsaId === session.user.id && review.status === 'approved'
             ));
    })
    .map((app: any) => ({
      id: app._id,
      applicantName: safeString(`${app.userId?.firstName || ''} ${app.userId?.lastName || ''}`.trim(), 'Unknown User'),
      applicationId: safeString(app.applicationNumber, 'N/A'),
      applicationStatus: safeString(app.status, 'pending'),
      lastMessage: 'Click to start conversation', // TODO: Get from chat API
      timestamp: safeDate(app.updatedAt),
      unreadCount: 0, // TODO: Get from chat API
      status: 'offline', // TODO: Get user online status
      avatar: app.userId?.profilePicture || null,
      loanAmount: app.loanDetails?.amount || 0
    }));

  // Filter conversations based on search
  const filteredConversations = conversations.filter((conv: any) =>
    conv.applicantName.toLowerCase().includes(searchTerm.toLowerCase()) ||
    conv.applicationId.toLowerCase().includes(searchTerm.toLowerCase())
  );

  const selectedConv = selectedConversation
    ? filteredConversations.find(conv => conv.id === selectedConversation)
    : filteredConversations[0];

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved': return 'bg-green-100 text-green-800';
      case 'under_review': return 'bg-blue-100 text-blue-800';
      case 'partially_approved': return 'bg-yellow-100 text-yellow-800';
      case 'rejected': return 'bg-red-100 text-red-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getOnlineStatusColor = (status: string) => {
    switch (status) {
      case 'online':
        return 'bg-green-500';
      case 'away':
        return 'bg-yellow-500';
      case 'offline':
        return 'bg-gray-400';
      default:
        return 'bg-gray-400';
    }
  };

  const formatTime = (timestamp: string) => {
    return new Date(timestamp).toLocaleTimeString('en-US', {
      hour: '2-digit',
      minute: '2-digit'
    });
  };

  const formatDate = (timestamp: string) => {
    const date = new Date(timestamp);
    const today = new Date();
    const yesterday = new Date(today);
    yesterday.setDate(yesterday.getDate() - 1);

    if (date.toDateString() === today.toDateString()) {
      return 'Today';
    } else if (date.toDateString() === yesterday.toDateString()) {
      return 'Yesterday';
    } else {
      return date.toLocaleDateString();
    }
  };

  return (
    <DashboardLayout>
      <div className="h-[calc(100vh-8rem)] flex bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Conversations List */}
        <div className="w-80 border-r border-slate-200 flex flex-col">
          <div className="p-4 border-b border-slate-200">
            <h2 className="text-lg font-semibold text-slate-900 mb-3">Messages</h2>
            <div className="relative">
              <Search className="absolute left-3 top-1/2 transform -translate-y-1/2 h-4 w-4 text-slate-400" />
              <Input
                placeholder="Search conversations..."
                className="pl-10"
                value={searchTerm}
                onChange={(e) => setSearchTerm(e.target.value)}
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {filteredConversations.length === 0 ? (
                <div className="p-8 text-center text-slate-500">
                  <MessageCircle className="h-12 w-12 mx-auto mb-4 text-slate-300" />
                  <p className="text-sm">No conversations found</p>
                  <p className="text-xs mt-1">Applications with approved reviews will appear here</p>
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => setSelectedConversation(conversation.id)}
                    className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 ${
                      conversation.id === selectedConversation ? 'bg-blue-50 border border-blue-200' : ''
                    }`}
                  >
                    <div className="flex items-center gap-3">
                      <div className="relative">
                        <Avatar className="h-10 w-10">
                          <AvatarImage src={conversation.avatar || undefined} />
                          <AvatarFallback className="bg-blue-600 text-white text-sm">
                            {getInitials(conversation.applicantName)}
                          </AvatarFallback>
                        </Avatar>
                        <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getOnlineStatusColor(conversation.status)}`}></div>
                      </div>
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <h3 className="font-medium text-slate-900 truncate">{conversation.applicantName}</h3>
                          <span className="text-xs text-slate-500">
                            {safeTimeAgo(conversation.timestamp)}
                          </span>
                        </div>
                        <div className="flex items-center justify-between">
                          <p className="text-sm text-slate-600 truncate">{conversation.lastMessage}</p>
                          {conversation.unreadCount > 0 && (
                            <Badge className="bg-blue-600 text-white text-xs h-5 w-5 rounded-full flex items-center justify-center p-0">
                              {conversation.unreadCount}
                            </Badge>
                          )}
                        </div>
                        <div className="flex items-center justify-between mt-1">
                          <p className="text-xs text-slate-500">{conversation.applicationId}</p>
                          <Badge className={`text-xs ${getStatusColor(conversation.applicationStatus)}`}>
                            {conversation.applicationStatus.replace('_', ' ')}
                          </Badge>
                        </div>
                      </div>
                    </div>
                  </div>
                ))
              )}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {selectedConv ? (
            <>
              {/* Chat Header */}
              <div className="p-4 border-b border-slate-200 bg-white">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-3">
                    <div className="relative">
                      <Avatar className="h-10 w-10">
                        <AvatarImage src={selectedConv.avatar || undefined} />
                        <AvatarFallback className="bg-blue-600 text-white">
                          {getInitials(selectedConv.applicantName)}
                        </AvatarFallback>
                      </Avatar>
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getOnlineStatusColor(selectedConv.status)}`}></div>
                    </div>
                    <div>
                      <h3 className="font-semibold text-slate-900">{selectedConv.applicantName}</h3>
                      <p className="text-sm text-slate-500">
                        {selectedConv.applicationId} •
                        <Badge className={`ml-2 text-xs ${getStatusColor(selectedConv.applicationStatus)}`}>
                          {selectedConv.applicationStatus.replace('_', ' ')}
                        </Badge>
                      </p>
                    </div>
                  </div>
                  <div className="flex items-center gap-2">
                    <Button variant="ghost" size="sm" title="View Application">
                      <FileText className="h-4 w-4" />
                    </Button>
                    <Button variant="ghost" size="sm" title="More Options">
                      <MoreVertical className="h-4 w-4" />
                    </Button>
                  </div>
                </div>
              </div>

              {/* Messages */}
              <ScrollArea className="flex-1 p-4">
                <div className="flex items-center justify-center h-full">
                  <div className="text-center text-slate-500">
                    <MessageCircle className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                    <h3 className="text-lg font-medium mb-2">Start a conversation</h3>
                    <p className="text-sm">Chat functionality will be available soon</p>
                    <p className="text-xs mt-2">Application: {selectedConv.applicationId}</p>
                    <p className="text-xs">Loan Amount: ₹{selectedConv.loanAmount?.toLocaleString('en-IN') || 'N/A'}</p>
                  </div>
                </div>
              </ScrollArea>

              {/* Message Input */}
              <div className="p-4 border-t border-slate-200 bg-white">
                <div className="flex items-center gap-2">
                  <Button variant="ghost" size="sm" disabled>
                    <Paperclip className="h-4 w-4" />
                  </Button>
                  <div className="flex-1 relative">
                    <Input
                      placeholder="Chat functionality coming soon..."
                      className="pr-10"
                      disabled
                    />
                    <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2" disabled>
                      <Smile className="h-4 w-4" />
                    </Button>
                  </div>
                  <Button className="bg-blue-600 hover:bg-blue-700" disabled>
                    <Send className="h-4 w-4" />
                  </Button>
                </div>
              </div>
            </>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">Choose an application from the list to start chatting</p>
                <p className="text-xs mt-2">Only approved applications are available for chat</p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
