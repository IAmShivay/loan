import { getAuthSession } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { ScrollArea } from '@/components/ui/scroll-area';
import { Separator } from '@/components/ui/separator';
import { 
  Search, 
  Send, 
  Phone, 
  Video, 
  MoreVertical, 
  Paperclip,
  Smile,
  MessageCircle,
  Clock,
  CheckCheck
} from 'lucide-react';

export default async function DSAChatPage() {
  const session = await getAuthSession();
  
  if (!session?.user || session.user.role !== 'dsa') {
    redirect('/login');
  }

  // TODO: Replace with actual API calls
  const conversations = [
    {
      id: '1',
      applicantName: 'John Doe',
      applicationId: 'LA202412001',
      lastMessage: 'Thank you for the quick response. I will upload the documents today.',
      timestamp: '2024-12-11T15:30:00Z',
      unreadCount: 0,
      status: 'online',
      avatar: null
    },
    {
      id: '2',
      applicantName: 'Alice Johnson',
      applicationId: 'LA202412002',
      lastMessage: 'When can I expect the loan approval?',
      timestamp: '2024-12-11T14:20:00Z',
      unreadCount: 2,
      status: 'offline',
      avatar: null
    },
    {
      id: '3',
      applicantName: 'Bob Smith',
      applicationId: 'LA202412003',
      lastMessage: 'I have uploaded all the required documents.',
      timestamp: '2024-12-11T10:15:00Z',
      unreadCount: 0,
      status: 'away',
      avatar: null
    }
  ];

  const currentChat = conversations[0];
  
  const messages = [
    {
      id: '1',
      senderId: currentChat.id,
      senderName: currentChat.applicantName,
      message: 'Hi, I have a question about my loan application.',
      timestamp: '2024-12-11T14:00:00Z',
      isOwn: false
    },
    {
      id: '2',
      senderId: session.user.id,
      senderName: session.user.name,
      message: 'Hello John! I\'m here to help. What would you like to know?',
      timestamp: '2024-12-11T14:02:00Z',
      isOwn: true
    },
    {
      id: '3',
      senderId: currentChat.id,
      senderName: currentChat.applicantName,
      message: 'I noticed that my application status shows "document pending". Which documents are still required?',
      timestamp: '2024-12-11T14:05:00Z',
      isOwn: false
    },
    {
      id: '4',
      senderId: session.user.id,
      senderName: session.user.name,
      message: 'Let me check your application details. You need to upload your bank statements for the last 6 months and salary slips for the last 3 months.',
      timestamp: '2024-12-11T14:07:00Z',
      isOwn: true
    },
    {
      id: '5',
      senderId: currentChat.id,
      senderName: currentChat.applicantName,
      message: 'Thank you for the quick response. I will upload the documents today.',
      timestamp: '2024-12-11T15:30:00Z',
      isOwn: false
    }
  ];

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getStatusColor = (status: string) => {
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
              />
            </div>
          </div>
          
          <ScrollArea className="flex-1">
            <div className="p-2">
              {conversations.map((conversation) => (
                <div
                  key={conversation.id}
                  className={`p-3 rounded-lg cursor-pointer transition-colors hover:bg-slate-50 ${
                    conversation.id === currentChat.id ? 'bg-blue-50 border border-blue-200' : ''
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
                      <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(conversation.status)}`}></div>
                    </div>
                    <div className="flex-1 min-w-0">
                      <div className="flex items-center justify-between">
                        <h3 className="font-medium text-slate-900 truncate">{conversation.applicantName}</h3>
                        <span className="text-xs text-slate-500">
                          {formatTime(conversation.timestamp)}
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
                      <p className="text-xs text-slate-500 mt-1">{conversation.applicationId}</p>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          </ScrollArea>
        </div>

        {/* Chat Area */}
        <div className="flex-1 flex flex-col">
          {/* Chat Header */}
          <div className="p-4 border-b border-slate-200 bg-white">
            <div className="flex items-center justify-between">
              <div className="flex items-center gap-3">
                <div className="relative">
                  <Avatar className="h-10 w-10">
                    <AvatarImage src={currentChat.avatar || undefined} />
                    <AvatarFallback className="bg-blue-600 text-white">
                      {getInitials(currentChat.applicantName)}
                    </AvatarFallback>
                  </Avatar>
                  <div className={`absolute -bottom-0.5 -right-0.5 w-3 h-3 rounded-full border-2 border-white ${getStatusColor(currentChat.status)}`}></div>
                </div>
                <div>
                  <h3 className="font-semibold text-slate-900">{currentChat.applicantName}</h3>
                  <p className="text-sm text-slate-500">{currentChat.applicationId} • {currentChat.status}</p>
                </div>
              </div>
              <div className="flex items-center gap-2">
                <Button variant="ghost" size="sm">
                  <Phone className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <Video className="h-4 w-4" />
                </Button>
                <Button variant="ghost" size="sm">
                  <MoreVertical className="h-4 w-4" />
                </Button>
              </div>
            </div>
          </div>

          {/* Messages */}
          <ScrollArea className="flex-1 p-4">
            <div className="space-y-4">
              {messages.map((message, index) => {
                const showDate = index === 0 || formatDate(message.timestamp) !== formatDate(messages[index - 1].timestamp);
                
                return (
                  <div key={message.id}>
                    {showDate && (
                      <div className="flex items-center justify-center my-4">
                        <div className="bg-slate-100 text-slate-600 text-xs px-3 py-1 rounded-full">
                          {formatDate(message.timestamp)}
                        </div>
                      </div>
                    )}
                    <div className={`flex ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                      <div className={`max-w-xs lg:max-w-md ${message.isOwn ? 'order-2' : 'order-1'}`}>
                        {!message.isOwn && (
                          <div className="flex items-center gap-2 mb-1">
                            <Avatar className="h-6 w-6">
                              <AvatarFallback className="bg-slate-200 text-slate-600 text-xs">
                                {getInitials(message.senderName)}
                              </AvatarFallback>
                            </Avatar>
                            <span className="text-xs text-slate-500">{message.senderName}</span>
                          </div>
                        )}
                        <div
                          className={`px-4 py-2 rounded-lg ${
                            message.isOwn
                              ? 'bg-blue-600 text-white'
                              : 'bg-slate-100 text-slate-900'
                          }`}
                        >
                          <p className="text-sm">{message.message}</p>
                        </div>
                        <div className={`flex items-center gap-1 mt-1 ${message.isOwn ? 'justify-end' : 'justify-start'}`}>
                          <span className="text-xs text-slate-500">{formatTime(message.timestamp)}</span>
                          {message.isOwn && (
                            <CheckCheck className="h-3 w-3 text-blue-600" />
                          )}
                        </div>
                      </div>
                    </div>
                  </div>
                );
              })}
            </div>
          </ScrollArea>

          {/* Message Input */}
          <div className="p-4 border-t border-slate-200 bg-white">
            <div className="flex items-center gap-2">
              <Button variant="ghost" size="sm">
                <Paperclip className="h-4 w-4" />
              </Button>
              <div className="flex-1 relative">
                <Input
                  placeholder="Type a message..."
                  className="pr-10"
                />
                <Button variant="ghost" size="sm" className="absolute right-1 top-1/2 transform -translate-y-1/2">
                  <Smile className="h-4 w-4" />
                </Button>
              </div>
              <Button className="bg-blue-600 hover:bg-blue-700">
                <Send className="h-4 w-4" />
              </Button>
            </div>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
