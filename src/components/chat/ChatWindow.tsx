'use client';

import React, { useState, useRef, useEffect, useCallback, useMemo } from 'react';
import { useSession } from 'next-auth/react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { ScrollArea } from '@/components/ui/scroll-area';
import {
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
  useUploadFileMutation
} from '@/store/api/apiSlice';
import { Send, Paperclip, Image, File, Download, Eye, X, MessageCircle, CheckCheck } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';
import { useSocket } from '@/hooks/useSocket';

interface ChatWindowProps {
  chatId: string;
  applicationId: string;
  participants: Array<{
    userId: string;
    name: string;
    role: string;
  }>;
  onClose?: () => void;
}

export default function ChatWindow({ 
  chatId, 
  applicationId, 
  participants, 
  onClose 
}: ChatWindowProps) {
  const { data: session } = useSession();
  const [message, setMessage] = useState('');
  const [selectedFile, setSelectedFile] = useState<File | null>(null);
  const [isUploading, setIsUploading] = useState(false);
  const [realTimeMessages, setRealTimeMessages] = useState<any[]>([]);
  const [typingUsers, setTypingUsers] = useState<string[]>([]);
  const [isOnline, setIsOnline] = useState(navigator.onLine);
  const [failedMessages, setFailedMessages] = useState<Set<string>>(new Set());
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);
  const typingTimeoutRef = useRef<NodeJS.Timeout | null>(null);

  const {
    data: messagesData,
    isLoading: isLoadingMessages,
    error: messagesError,
    refetch: refetchMessages
  } = useGetChatMessagesQuery(chatId, {
    skip: !chatId,
  });

  const [sendMessageMutation, { isLoading: isSending }] = useSendMessageMutation();
  const [markAsRead] = useMarkMessagesAsReadMutation();
  const [uploadFile] = useUploadFileMutation();

  // Combine database messages with real-time messages, avoiding duplicates
  const allMessages = useMemo(() => {
    const dbMessages = messagesData?.messages || [];
    const dbMessageIds = new Set(dbMessages.map(msg => msg._id));
    const uniqueRealTimeMessages = realTimeMessages.filter(msg => !dbMessageIds.has(msg._id));
    return [...dbMessages, ...uniqueRealTimeMessages].sort((a, b) =>
      new Date(a.timestamp).getTime() - new Date(b.timestamp).getTime()
    );
  }, [messagesData?.messages, realTimeMessages]);

  // WebSocket connection
  const handleNewMessage = useCallback((newMessage: any) => {
    console.log('Received new message via WebSocket:', newMessage);
    setRealTimeMessages(prev => [...prev, newMessage]);

    // Auto-scroll to bottom
    setTimeout(() => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
    }, 100);
  }, []);

  const handleUserTyping = useCallback((data: { userName: string }) => {
    setTypingUsers(prev => [...prev.filter(user => user !== data.userName), data.userName]);

    // Clear typing after 3 seconds
    setTimeout(() => {
      setTypingUsers(prev => prev.filter(user => user !== data.userName));
    }, 3000);
  }, []);

  const handleUserStoppedTyping = useCallback((data: { userName: string }) => {
    setTypingUsers(prev => prev.filter(user => user !== data.userName));
  }, []);

  const { isConnected, sendMessage: sendSocketMessage, startTyping, stopTyping } = useSocket({
    chatId,
    onNewMessage: handleNewMessage,
    onUserTyping: handleUserTyping,
    onUserStoppedTyping: handleUserStoppedTyping,
  });

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    const scrollToBottom = () => {
      messagesEndRef.current?.scrollIntoView({ behavior: 'smooth', block: 'end' });
    };

    // Use requestAnimationFrame for smoother scrolling
    requestAnimationFrame(scrollToBottom);
  }, [allMessages]);

  // Monitor online status
  useEffect(() => {
    const handleOnline = () => {
      setIsOnline(true);
      toast.success('Connection restored');
    };
    const handleOffline = () => {
      setIsOnline(false);
      toast.error('You are offline');
    };

    window.addEventListener('online', handleOnline);
    window.addEventListener('offline', handleOffline);

    return () => {
      window.removeEventListener('online', handleOnline);
      window.removeEventListener('offline', handleOffline);
    };
  }, []);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (chatId && session?.user) {
      markAsRead(chatId);
    }
  }, [chatId, session?.user, markAsRead]);

  // Handle typing indicators
  const handleTyping = () => {
    if (session?.user && isConnected) {
      const userName = session.user.name || `${session.user.firstName} ${session.user.lastName}`;
      startTyping(userName);

      // Clear existing timeout
      if (typingTimeoutRef.current) {
        clearTimeout(typingTimeoutRef.current);
      }

      // Stop typing after 1 second of no input
      typingTimeoutRef.current = setTimeout(() => {
        stopTyping(userName);
      }, 1000);
    }
  };

  const handleSendMessage = async () => {
    if (!message.trim() && !selectedFile) return;

    try {
      let fileUrl = '';
      let fileName = '';
      let messageType: 'text' | 'file' | 'image' = 'text';

      // Upload file if selected
      if (selectedFile) {
        setIsUploading(true);
        const formData = new FormData();
        formData.append('file', selectedFile);
        formData.append('documentType', 'chat_files');
        formData.append('applicationId', applicationId);

        const uploadResult = await uploadFile(formData).unwrap();
        fileUrl = uploadResult.file.fileUrl;
        fileName = uploadResult.file.originalName;

        // Determine message type based on file type
        if (selectedFile.type.startsWith('image/')) {
          messageType = 'image';
        } else {
          messageType = 'file';
        }

        setIsUploading(false);
        setSelectedFile(null);
      }

      // Send message to database
      const result = await sendMessageMutation({
        chatId,
        message: message.trim() || `Shared ${messageType === 'image' ? 'an image' : 'a file'}: ${fileName}`,
        messageType,
        fileUrl,
        fileName,
      }).unwrap();

      // Send message via WebSocket for real-time updates
      if (isConnected && session?.user) {
        const userName = session.user.name || `${session.user.firstName} ${session.user.lastName}`;
        sendSocketMessage(
          result.message,
          session.user.id,
          userName,
          session.user.role
        );
      }

      setMessage('');

      // Stop typing indicator
      if (session?.user && isConnected) {
        const userName = session.user.name || `${session.user.firstName} ${session.user.lastName}`;
        stopTyping(userName);
      }

      // Force scroll to bottom after sending
      setTimeout(() => {
        messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
      }, 100);

    } catch (error: any) {
      setIsUploading(false);
      console.error('Failed to send message:', error);

      // Add to failed messages for retry
      const tempId = `temp-${Date.now()}`;
      setFailedMessages(prev => new Set([...prev, tempId]));

      toast.error(error?.data?.error || 'Failed to send message. Tap to retry.');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 10MB)
      if (file.size > 10 * 1024 * 1024) {
        toast.error('File size must be less than 10MB');
        return;
      }

      // Validate file type
      const allowedTypes = [
        'image/jpeg', 'image/png', 'image/gif', 'image/webp',
        'application/pdf', 'application/msword', 'text/plain',
        'application/vnd.openxmlformats-officedocument.wordprocessingml.document',
        'application/vnd.ms-excel',
        'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet',
        'application/vnd.ms-powerpoint',
        'application/vnd.openxmlformats-officedocument.presentationml.presentation'
      ];

      if (!allowedTypes.includes(file.type)) {
        toast.error('File type not supported');
        return;
      }
      setSelectedFile(file);
    }
  };

  const handleKeyPress = (e: React.KeyboardEvent) => {
    if (e.key === 'Enter' && !e.shiftKey) {
      e.preventDefault();
      handleSendMessage();
    }
  };

  const getMessageTime = (timestamp: string) => {
    return formatDistanceToNow(new Date(timestamp), { addSuffix: true });
  };

  const getInitials = (name: string) => {
    return name.split(' ').map(n => n[0]).join('').toUpperCase();
  };

  const getRoleColor = (role: string) => {
    switch (role) {
      case 'admin': return 'bg-red-100 text-red-800';
      case 'dsa': return 'bg-blue-100 text-blue-800';
      case 'user': return 'bg-green-100 text-green-800';
      default: return 'bg-gray-100 text-gray-800';
    }
  };

  const renderMessage = useCallback((msg: any) => {
    const isOwnMessage = msg.senderId === session?.user?.id;

    return (
      <div
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-3`}
      >
        <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-[85%] sm:max-w-[70%]`}>
          <Avatar className="h-7 w-7 flex-shrink-0">
            <AvatarFallback className="text-xs">
              {getInitials(msg.senderName)}
            </AvatarFallback>
          </Avatar>
          
          <div className={`${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
            <div className="flex items-center space-x-2 mb-0.5">
              <span className="text-sm font-medium">{msg.senderName}</span>
              <Badge variant="secondary" className={`text-xs ${getRoleColor(msg.senderRole)}`}>
                {msg.senderRole.toUpperCase()}
              </Badge>
              <span className="text-xs text-gray-500">{getMessageTime(msg.timestamp)}</span>
              {isOwnMessage && (
                <div className="flex items-center ml-1">
                  {msg.read ? (
                    <CheckCheck className="h-3 w-3 text-blue-500" />
                  ) : (
                    <CheckCheck className="h-3 w-3 text-gray-400" />
                  )}
                </div>
              )}
            </div>
            
            <div className={`rounded-2xl p-3 shadow-sm max-w-sm ${
              isOwnMessage
                ? 'bg-gradient-to-br from-blue-500 to-blue-600 text-white'
                : 'bg-white text-gray-900 border border-gray-200'
            }`}>
              {msg.messageType === 'text' && (
                <p className="text-sm whitespace-pre-wrap leading-relaxed">{msg.message}</p>
              )}
              
              {msg.messageType === 'image' && (
                <div className="space-y-3">
                  <div className="relative group">
                    <img
                      src={msg.fileUrl}
                      alt={msg.fileName}
                      className="max-w-full h-auto rounded-xl cursor-pointer transition-transform hover:scale-105 shadow-lg"
                      onClick={() => window.open(msg.fileUrl, '_blank')}
                    />
                    <div className="absolute inset-0 bg-black/0 group-hover:bg-black/10 transition-colors duration-200 rounded-xl flex items-center justify-center">
                      <Eye className="h-6 w-6 text-white opacity-0 group-hover:opacity-100 transition-opacity duration-200" />
                    </div>
                  </div>
                  {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                </div>
              )}
              
              {msg.messageType === 'file' && (
                <div className="space-y-3">
                  <div className={`flex items-center space-x-3 p-3 rounded-xl border-2 border-dashed transition-colors ${
                    isOwnMessage
                      ? 'bg-white/10 border-white/30'
                      : 'bg-blue-50 border-blue-200 hover:bg-blue-100'
                  }`}>
                    <div className={`p-2 rounded-lg ${
                      isOwnMessage ? 'bg-white/20' : 'bg-blue-100'
                    }`}>
                      <File className={`h-4 w-4 ${
                        isOwnMessage ? 'text-white' : 'text-blue-600'
                      }`} />
                    </div>
                    <div className="flex-1 min-w-0">
                      <p className={`text-sm font-medium truncate ${
                        isOwnMessage ? 'text-white' : 'text-gray-900'
                      }`}>{msg.fileName}</p>
                    </div>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-8 w-8 p-0 transition-colors ${
                          isOwnMessage
                            ? 'hover:bg-white/20 text-white'
                            : 'hover:bg-blue-200 text-blue-600'
                        }`}
                        onClick={() => window.open(msg.fileUrl, '_blank')}
                      >
                        <Eye className="h-4 w-4" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className={`h-8 w-8 p-0 transition-colors ${
                          isOwnMessage
                            ? 'hover:bg-white/20 text-white'
                            : 'hover:bg-blue-200 text-blue-600'
                        }`}
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = msg.fileUrl;
                          link.download = msg.fileName;
                          link.click();
                        }}
                      >
                        <Download className="h-4 w-4" />
                      </Button>
                    </div>
                  </div>
                  {msg.message && <p className="text-sm leading-relaxed">{msg.message}</p>}
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  }, [session?.user?.id]);

  return (
    <Card className="h-full flex flex-col shadow-xl border-0 bg-white overflow-hidden">
      <CardHeader className="pb-3 pt-3 bg-gradient-to-br from-blue-600 via-blue-700 to-indigo-800 text-white flex-shrink-0">
        <div className="flex items-center justify-between">
          <div className="flex items-center space-x-4">
            <div className="flex items-center space-x-3">
              <div className="p-2 bg-white/10 rounded-lg backdrop-blur-sm">
                <MessageCircle className="h-5 w-5" />
              </div>
              <div>
                <CardTitle className="text-lg font-semibold">
                  Application #{(() => {
                    if (typeof applicationId === 'string') {
                      return applicationId.slice(-6);
                    }
                    if (applicationId && typeof applicationId === 'object' && (applicationId as any)._id) {
                      return (applicationId as any)._id.slice(-6);
                    }
                    if (applicationId && (applicationId as any).toString && (applicationId as any).toString() !== '[object Object]') {
                      return (applicationId as any).toString().slice(-6);
                    }
                    return 'N/A';
                  })()}
                </CardTitle>
                <div className="flex items-center space-x-2 mt-1">
                  <div className={`w-2 h-2 rounded-full ${
                    !isOnline ? 'bg-gray-400' :
                    isConnected ? 'bg-green-400 animate-pulse' : 'bg-yellow-400 animate-pulse'
                  }`}></div>
                  <span className="text-xs opacity-90 font-medium">
                    {!isOnline ? 'Offline' : isConnected ? 'Connected' : 'Connecting...'}
                  </span>
                </div>
              </div>
            </div>
          </div>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose} className="hover:bg-white/10 text-white transition-colors duration-200">
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2 mt-2">
          {participants.map((participant, index) => (
            <Badge
              key={typeof participant.userId === 'string' ? participant.userId : `participant-${index}`}
              variant="secondary"
              className="bg-white/15 text-white border-white/20 text-xs font-medium px-3 py-1 backdrop-blur-sm"
            >
              {participant.name} • {participant.role.toUpperCase()}
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-3">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">Loading messages...</div>
            </div>
          ) : messagesError ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-red-500">
                Error loading messages. Please try again.
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs mt-2">
                    Error: {JSON.stringify(messagesError)}
                  </div>
                )}
              </div>
            </div>
          ) : allMessages.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">
                No messages yet. Start the conversation!
                {process.env.NODE_ENV === 'development' && (
                  <div className="text-xs mt-2 text-gray-400">
                    Chat ID: {chatId}<br/>
                    Application ID: {applicationId}
                  </div>
                )}
              </div>
            </div>
          ) : (
            <div>
              {allMessages.map((msg, index) => (
                <React.Fragment key={msg._id || `temp-${index}`}>
                  {renderMessage(msg)}
                </React.Fragment>
              ))}

              {/* Typing indicators */}
              {typingUsers.length > 0 && (
                <div className="flex items-center space-x-3 p-2 mb-2">
                  <div className="flex items-center space-x-2">
                    <Avatar className="h-8 w-8">
                      <AvatarFallback className="bg-gray-200 text-gray-600 text-xs">
                        {getInitials(typingUsers[0])}
                      </AvatarFallback>
                    </Avatar>
                    <div className="bg-gray-100 rounded-2xl px-4 py-3 shadow-sm">
                      <div className="flex items-center space-x-1">
                        <div className="flex space-x-1">
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce"></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.1s' }}></div>
                          <div className="w-2 h-2 bg-gray-400 rounded-full animate-bounce" style={{ animationDelay: '0.2s' }}></div>
                        </div>
                        <span className="text-xs text-gray-500 ml-2">
                          {typingUsers.join(', ')} {typingUsers.length === 1 ? 'is' : 'are'} typing...
                        </span>
                      </div>
                    </div>
                  </div>
                </div>
              )}

              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <Separator />
        
        {/* File Preview */}
        {selectedFile && (
          <div className="p-3 bg-gradient-to-r from-blue-50 to-indigo-50 border-t border-blue-200 flex-shrink-0">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-3">
                <div className="p-2 bg-blue-100 rounded-lg">
                  {selectedFile.type.startsWith('image/') ? (
                    <Image className="h-4 w-4 text-blue-600" />
                  ) : (
                    <File className="h-4 w-4 text-blue-600" />
                  )}
                </div>
                <div>
                  <span className="text-sm font-medium text-gray-900">{selectedFile.name}</span>
                  <p className="text-xs text-gray-500">
                    {(selectedFile.size / 1024 / 1024).toFixed(2)} MB
                  </p>
                </div>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
                className="hover:bg-blue-100 text-gray-600 transition-colors"
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Message Input */}
        <div className="p-3 border-t bg-gray-50/50 flex-shrink-0" style={{ paddingBottom: 'max(12px, env(safe-area-inset-bottom))' }}>
          <div className="flex items-end space-x-2 sm:space-x-3">
            <div className="flex-1">
              <Input
                value={message}
                onChange={(e) => {
                  setMessage(e.target.value);
                  handleTyping();
                }}
                onKeyPress={handleKeyPress}
                placeholder={
                  !isOnline ? "You are offline" :
                  !isConnected ? "Connecting..." :
                  "Type your message..."
                }
                disabled={isSending || isUploading || !isConnected || !isOnline}
                className="resize-none border-gray-300 focus:border-blue-500 focus:ring-blue-500 rounded-xl py-2 px-3 text-sm min-h-[40px] w-full"
              />
            </div>

            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx,.txt,.xlsx,.ppt,.pptx"
              onChange={handleFileSelect}
              className="hidden"
            />

            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || isUploading || !isOnline}
              className="h-9 w-9 sm:h-10 sm:w-10 p-0 border-gray-300 hover:bg-gray-100 hover:border-gray-400 transition-colors rounded-xl flex-shrink-0"
            >
              <Paperclip className="h-4 w-4 text-gray-600" />
            </Button>

            <Button
              onClick={handleSendMessage}
              disabled={(!message.trim() && !selectedFile) || isSending || isUploading || !isConnected || !isOnline}
              size="sm"
              className="h-9 w-9 sm:h-10 sm:w-10 p-0 bg-blue-600 hover:bg-blue-700 transition-colors rounded-xl flex-shrink-0"
            >
              {isUploading ? (
                <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent" />
              ) : (
                <Send className="h-4 w-4" />
              )}
            </Button>
          </div>
        </div>
      </CardContent>
    </Card>
  );
}
