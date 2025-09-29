'use client';

import { useSession } from 'next-auth/react';
import { useRouter, useSearchParams } from 'next/navigation';
import { useState, useEffect, Suspense } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { 
  MessageSquare, 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip,
  Smile,
  Clock,
  CheckCheck,
  User,
  Users,
  CheckCircle,
  XCircle,
  AlertCircle,
  Plus
} from 'lucide-react';
import { useGetChatsQuery, useGetApplicationsQuery, useCreateChatMutation } from '@/store/api/apiSlice';
import { SkeletonCard } from '@/components/ui/loading/SkeletonCard';
import ChatWindow from '@/components/chat/ChatWindow';
import { toast } from 'sonner';

function ChatPageContent() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const searchParams = useSearchParams();
  const applicationId = searchParams.get('applicationId');

  // All hooks must be called before any conditional returns
  const [selectedChat, setSelectedChat] = useState<string | null>(null);
  const [selectedApplication, setSelectedApplication] = useState<string | null>(applicationId);

  // Fetch user's chats - use conditional query based on session
  const {
    data: chatsData,
    isLoading: isLoadingChats,
    error: chatsError,
    refetch: refetchChats
  } = useGetChatsQuery({ userId: session?.user?.id || '' }, {
    skip: !session?.user?.id
  });

  // Fetch user's applications (for creating new chats)
  const {
    data: applicationsData,
    isLoading: isLoadingApplications
  } = useGetApplicationsQuery({
    userId: session?.user?.id || '',
    status: 'partially_approved' // Only show applications that can have chats
  }, {
    skip: !session?.user?.id
  });

  const [createChat] = useCreateChatMutation();

  // Auto-select chat if applicationId is provided - MUST be before conditional returns
  useEffect(() => {
    if (applicationId && chatsData?.chats && chatsData.chats.length > 0) {
      const chat = chatsData.chats.find(c => c.applicationId === applicationId);
      if (chat) {
        setSelectedChat(chat._id);
      }
    }
  }, [applicationId, chatsData?.chats]);

  // Redirect if not authenticated
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session?.user || session.user.role !== 'user') {
    router.push('/login');
    return null;
  }

  const chats = chatsData?.chats || [];
  const applications = applicationsData?.applications || [];

  const handleCreateChat = async (appId: string, dsaIds: string[]) => {
    try {
      const result = await createChat({
        applicationId: appId,
        participants: [session.user.id, ...dsaIds]
      }).unwrap();
      
      setSelectedChat(result.chat._id);
      refetchChats();
      toast.success('Chat created successfully');
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to create chat');
    }
  };

  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'approved':
        return <CheckCircle className="h-3 w-3 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-3 w-3 text-red-500" />;
      case 'under_review':
        return <Clock className="h-3 w-3 text-yellow-500" />;
      case 'partially_approved':
        return <AlertCircle className="h-3 w-3 text-blue-500" />;
      default:
        return <MessageSquare className="h-3 w-3 text-gray-400" />;
    }
  };

  const formatTime = (timestamp: string) => {
    const date = new Date(timestamp);
    const now = new Date();
    const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
    
    if (diffInHours < 24) {
      return date.toLocaleTimeString([], { hour: '2-digit', minute: '2-digit' });
    } else if (diffInHours < 168) { // 7 days
      return date.toLocaleDateString([], { weekday: 'short' });
    } else {
      return date.toLocaleDateString([], { month: 'short', day: 'numeric' });
    }
  };

  const selectedChatData = chats.find(chat => chat._id === selectedChat);

  if (chatsError) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Chats</h3>
            <p className="text-gray-600 mb-4">Failed to load your chats. Please try again.</p>
            <Button onClick={() => refetchChats()}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="h-[calc(80vh-2rem)] flex bg-white border border-gray-200 rounded-lg overflow-hidden">
        {/* Chat List Sidebar */}
        <div className={`${selectedChat ? 'hidden lg:flex' : 'flex'} w-full lg:w-80 border-r bg-white flex-col`}>
          {/* Header */}
          <div className="p-3 border-b flex-shrink-0">
            <div className="flex items-center justify-between mb-2">
              <h1 className="text-xl font-semibold text-gray-900">Messages</h1>
              {selectedChat && (
                <Button
                  variant="ghost"
                  size="sm"
                  className="lg:hidden"
                  onClick={() => setSelectedChat(null)}
                >
                  Back
                </Button>
              )}
            </div>
            <p className="text-sm text-gray-600">Chat with your assigned DSAs</p>
          </div>

          {/* Chat List */}
          <ScrollArea className="flex-1">
            {isLoadingChats ? (
              <div className="p-4 space-y-3">
                {[...Array(5)].map((_, i) => (
                  <SkeletonCard key={i} />
                ))}
              </div>
            ) : chats.length === 0 ? (
              <div className="p-4 text-center">
                <MessageSquare className="h-12 w-12 text-gray-400 mx-auto mb-4" />
                <h3 className="text-sm font-semibold text-gray-900 mb-2">No Chats Yet</h3>
                <p className="text-xs text-gray-600 mb-4">
                  Start chatting with DSAs for your approved applications
                </p>
                
                {/* Show available applications for chat */}
                {!isLoadingApplications && applications.length > 0 && (
                  <div className="space-y-2">
                    <p className="text-xs font-medium text-gray-700">Available Applications:</p>
                    {applications.slice(0, 3).map((app: any) => (
                      <div key={app._id} className="text-left p-2 border rounded-lg">
                        <div className="flex items-center justify-between">
                          <div>
                            <p className="text-xs font-medium">#{app.applicationId}</p>
                            <p className="text-xs text-gray-600">{app.educationInfo.course}</p>
                          </div>
                          <Button 
                            size="sm" 
                            variant="outline"
                            onClick={() => {
                              if (app.assignedDSAs && app.assignedDSAs.length > 0) {
                                handleCreateChat(app._id, app.assignedDSAs.map((dsa: any) => dsa.userId));
                              }
                            }}
                          >
                            <Plus className="h-3 w-3" />
                          </Button>
                        </div>
                      </div>
                    ))}
                  </div>
                )}
              </div>
            ) : (
              <div className="divide-y">
                {chats.map((chat) => (
                  <div
                    key={chat._id}
                    className={`p-4 cursor-pointer hover:bg-gray-50 transition-colors ${
                      selectedChat === chat._id ? 'bg-blue-50 border-r-2 border-blue-500' : ''
                    }`}
                    onClick={() => setSelectedChat(chat._id)}
                  >
                    <div className="flex items-start space-x-3">
                      <div className="flex-shrink-0">
                        <div className="relative">
                          <Avatar className="h-10 w-10">
                            <AvatarFallback>
                              {chat.participants.length > 2 ? (
                                <Users className="h-5 w-5" />
                              ) : (
                                <User className="h-5 w-5" />
                              )}
                            </AvatarFallback>
                          </Avatar>
                          {chat.unreadCount > 0 && (
                            <div className="absolute -top-1 -right-1 bg-red-500 text-white text-xs rounded-full h-5 w-5 flex items-center justify-center">
                              {chat.unreadCount > 9 ? '9+' : chat.unreadCount}
                            </div>
                          )}
                        </div>
                      </div>
                      
                      <div className="flex-1 min-w-0">
                        <div className="flex items-center justify-between">
                          <p className="text-sm font-medium text-gray-900 truncate">
                            Application #{(() => {
                              if (typeof chat.applicationId === 'string') {
                                return chat.applicationId.slice(-6);
                              }
                              if (chat.applicationId && typeof chat.applicationId === 'object' && chat.applicationId._id) {
                                return chat.applicationId._id.slice(-6);
                              }
                              if (chat.applicationId && chat.applicationId.toString && chat.applicationId.toString() !== '[object Object]') {
                                return chat.applicationId.toString().slice(-6);
                              }
                              return 'N/A';
                            })()}
                          </p>
                          {chat.lastMessage && (
                            <p className="text-xs text-gray-500">
                              {formatTime(chat.lastMessage.timestamp)}
                            </p>
                          )}
                        </div>
                        
                        <div className="flex items-center space-x-1 mt-1">
                          {chat.participants
                            .filter(p => p.userId !== session.user.id)
                            .slice(0, 2)
                            .map((participant, index) => (
                              <Badge key={index} variant="outline" className="text-xs">
                                {participant.name}
                              </Badge>
                            ))}
                        </div>
                        
                        {chat.lastMessage && (
                          <p className="text-sm text-gray-600 truncate mt-1">
                            {chat.lastMessage.senderName}: {chat.lastMessage.message}
                          </p>
                        )}
                      </div>
                    </div>
                  </div>
                ))}
              </div>
            )}
          </ScrollArea>
        </div>

        {/* Chat Window */}
        <div className={`${selectedChat ? 'flex' : 'hidden lg:flex'} flex-1 flex-col`}>
          {selectedChat && selectedChatData ? (
            <ChatWindow
              chatId={selectedChat}
              applicationId={selectedChatData.applicationId}
              participants={selectedChatData.participants}
              onClose={() => setSelectedChat(null)}
            />
          ) : (
            <div className="flex-1 flex items-center justify-center bg-gray-50">
              <div className="text-center">
                <MessageSquare className="h-16 w-16 text-gray-400 mx-auto mb-4" />
                <h3 className="text-lg font-semibold text-gray-900 mb-2">Select a Chat</h3>
                <p className="text-gray-600 max-w-sm">
                  Choose a conversation from the sidebar to start messaging with your DSAs
                </p>
              </div>
            </div>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}

export default function UserChatPage() {
  return (
    <Suspense fallback={<div>Loading...</div>}>
      <ChatPageContent />
    </Suspense>
  );
}
