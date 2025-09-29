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
import { useGetApplicationsQuery, useCreateChatMutation, useGetChatsQuery } from '@/store/api/apiSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { safeString, safeDate, safeTimeAgo } from '@/lib/utils/fallbacks';
import ChatWindow from '@/components/chat/ChatWindow';
import { toast } from 'sonner';

export default function DSAChatPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [searchTerm, setSearchTerm] = useState('');
  const [selectedConversation, setSelectedConversation] = useState<string | null>(null);
  const [activeChatId, setActiveChatId] = useState<string | null>(null);
  const [showChatWindow, setShowChatWindow] = useState(false);

  // Get all applications for DSA to see in chat
  const {
    data: applicationsData,
    isLoading: applicationsLoading,
    error: applicationsError
  } = useGetApplicationsQuery({
    limit: 50
    // Removed status filter to show all applications initially
  }, {
    skip: !session?.user || session.user.role !== 'dsa'
  });

  // Debug logging in development only
  if (process.env.NODE_ENV === 'development') {
    console.log('DSA Chat Debug:', {
      applicationsCount: applicationsData?.applications?.length || 0,
      applicationsLoading,
      hasError: !!applicationsError,
      sessionRole: session?.user?.role
    });
  }

  const [createChat] = useCreateChatMutation();

  // Get existing chats for this DSA
  const {
    data: chatsData,
    refetch: refetchChats
  } = useGetChatsQuery({}, {
    skip: !session?.user || session.user.role !== 'dsa'
  });

  // Redirect if not authenticated or not DSA
  if (status === 'loading') {
    return <LoadingSpinner />;
  }

  if (!session?.user || session.user.role !== 'dsa') {
    router.push('/login');
    return null;
  }

  const handleStartChat = async (conversation: any) => {
    try {
      // Validate required data
      if (!conversation.userId) {
        toast.error('Unable to start chat - user information missing');
        return;
      }

      // Check if chat already exists
      const existingChat = chatsData?.chats?.find((chat: any) =>
        chat.applicationId === conversation.id
      );

      if (existingChat) {
        setActiveChatId(existingChat._id);
        setShowChatWindow(true);
        setSelectedConversation(conversation.id);
        return;
      }

      // Create new chat
      const result = await createChat({
        applicationId: conversation.id,
        participants: [session.user.id, conversation.userId]
      }).unwrap();

      setActiveChatId(result.chat._id);
      setShowChatWindow(true);
      setSelectedConversation(conversation.id);
      refetchChats();

      toast.success('Chat started successfully');
    } catch (error: any) {
      console.error('Failed to start chat:', error);
      toast.error(error?.data?.error || 'Failed to start chat');
    }
  };

  if (applicationsLoading) {
    return <LoadingSpinner />;
  }

  // Transform applications into conversations
  const conversations = (applicationsData?.applications || [])
    .filter((app: any) => {
      // Show all applications since DSAs can work on any application
      // Only filter out applications that don't have user information
      return app.userId && (app.userId._id || app.userId);
    })
    .map((app: any) => {
      const userId = app.userId?._id || app.userId;

      return {
        id: app._id,
        applicantName: safeString(`${app.userId?.firstName || ''} ${app.userId?.lastName || ''}`.trim(), 'Unknown User'),
        applicationId: safeString(app.applicationNumber, 'N/A'),
        applicationStatus: safeString(app.status, 'pending'),
        lastMessage: 'Start conversation with applicant',
        timestamp: safeDate(app.updatedAt),
        unreadCount: 0,
        status: 'offline',
        avatar: app.userId?.profilePicture || null,
        loanAmount: app.loanDetails?.amount || 0,
        userId: userId // Add user ID for chat creation
      };
    });

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
      <div className="h-[calc(80vh-2rem)] flex bg-white border border-slate-200 rounded-lg overflow-hidden">
        {/* Conversations List */}
        <div className={`${showChatWindow ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 border-r border-slate-200 flex-col`}>
          <div className="p-3 border-b border-slate-200 flex-shrink-0">
            <div className="flex items-center justify-between mb-3">
              <h2 className="text-lg font-semibold text-slate-900">Messages</h2>
              {showChatWindow && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => {
                    setShowChatWindow(false);
                    setActiveChatId(null);
                    setSelectedConversation(null);
                  }}
                >
                  Back
                </Button>
              )}
            </div>
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
                  {process.env.NODE_ENV === 'development' && (
                    <div className="mt-4 text-xs text-gray-400">
                      <p>Debug: Total applications: {applicationsData?.applications?.length || 0}</p>
                      <p>Debug: Session user ID: {session.user.id}</p>
                    </div>
                  )}
                </div>
              ) : (
                filteredConversations.map((conversation) => (
                  <div
                    key={conversation.id}
                    onClick={() => {
                      setSelectedConversation(conversation.id);
                      handleStartChat(conversation);
                    }}
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
        <div className={`${showChatWindow ? 'flex' : 'hidden lg:flex'} flex-1 flex-col`}>
          {showChatWindow && activeChatId && selectedConv ? (
            <div className="h-full w-full">
              <ChatWindow
                chatId={activeChatId}
                applicationId={selectedConv.id}
                participants={[
                  {
                    userId: session.user.id,
                    name: session.user.name || `${session.user.firstName} ${session.user.lastName}`,
                    role: 'dsa'
                  },
                  {
                    userId: selectedConv.userId,
                    name: selectedConv.applicantName,
                    role: 'user'
                  }
                ]}
                onClose={() => {
                  setShowChatWindow(false);
                  setActiveChatId(null);
                  setSelectedConversation(null);
                }}
              />
            </div>
          ) : (
            <div className="flex-1 flex items-center justify-center">
              <div className="text-center text-slate-500">
                <Users className="h-16 w-16 mx-auto mb-4 text-slate-300" />
                <h3 className="text-lg font-medium mb-2">Select a conversation</h3>
                <p className="text-sm">Choose an application from the list to start chatting</p>
                <p className="text-xs mt-2">Click on any application to begin communication with the applicant</p>

                {/* Debug info */}
                {process.env.NODE_ENV === 'development' && (
                  <div className="mt-4 text-xs text-gray-400">
                    <p>Debug: showChatWindow={showChatWindow ? 'true' : 'false'}</p>
                    <p>Debug: activeChatId={activeChatId || 'null'}</p>
                    <p>Debug: selectedConv={selectedConv ? 'exists' : 'null'}</p>
                    <p>Debug: conversationsCount={filteredConversations.length}</p>
                  </div>
                )}
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
