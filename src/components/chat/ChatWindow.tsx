'use client';

import { useState, useRef, useEffect } from 'react';
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
import { Send, Paperclip, Image, File, Download, Eye, X } from 'lucide-react';
import { toast } from 'sonner';
import { formatDistanceToNow } from 'date-fns';

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
  const messagesEndRef = useRef<HTMLDivElement>(null);
  const fileInputRef = useRef<HTMLInputElement>(null);

  const { 
    data: messagesData, 
    isLoading: isLoadingMessages,
    refetch: refetchMessages 
  } = useGetChatMessagesQuery(chatId, {
    pollingInterval: 3000, // Poll every 3 seconds for real-time updates
  });

  const [sendMessageMutation, { isLoading: isSending }] = useSendMessageMutation();
  const [markAsRead] = useMarkMessagesAsReadMutation();
  const [uploadFile] = useUploadFileMutation();

  const messages = messagesData?.messages || [];

  // Auto-scroll to bottom when new messages arrive
  useEffect(() => {
    messagesEndRef.current?.scrollIntoView({ behavior: 'smooth' });
  }, [messages]);

  // Mark messages as read when chat opens
  useEffect(() => {
    if (chatId && session?.user) {
      markAsRead(chatId);
    }
  }, [chatId, session?.user, markAsRead]);

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

      // Send message
      await sendMessageMutation({
        chatId,
        message: message.trim() || `Shared ${messageType === 'image' ? 'an image' : 'a file'}: ${fileName}`,
        messageType,
        fileUrl,
        fileName,
      }).unwrap();

      setMessage('');
      refetchMessages();
      
    } catch (error: any) {
      setIsUploading(false);
      toast.error(error?.data?.error || 'Failed to send message');
    }
  };

  const handleFileSelect = (event: React.ChangeEvent<HTMLInputElement>) => {
    const file = event.target.files?.[0];
    if (file) {
      // Check file size (max 15MB)
      if (file.size > 15 * 1024 * 1024) {
        toast.error('File size must be less than 15MB');
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

  const renderMessage = (msg: any) => {
    const isOwnMessage = msg.senderId === session?.user?.id;
    
    return (
      <div
        key={msg._id}
        className={`flex ${isOwnMessage ? 'justify-end' : 'justify-start'} mb-4`}
      >
        <div className={`flex ${isOwnMessage ? 'flex-row-reverse' : 'flex-row'} items-start space-x-2 max-w-[70%]`}>
          <Avatar className="h-8 w-8">
            <AvatarFallback className="text-xs">
              {getInitials(msg.senderName)}
            </AvatarFallback>
          </Avatar>
          
          <div className={`${isOwnMessage ? 'mr-2' : 'ml-2'}`}>
            <div className="flex items-center space-x-2 mb-1">
              <span className="text-sm font-medium">{msg.senderName}</span>
              <Badge variant="secondary" className={`text-xs ${getRoleColor(msg.senderRole)}`}>
                {msg.senderRole.toUpperCase()}
              </Badge>
              <span className="text-xs text-gray-500">{getMessageTime(msg.timestamp)}</span>
            </div>
            
            <div className={`rounded-lg p-3 ${
              isOwnMessage 
                ? 'bg-blue-500 text-white' 
                : 'bg-gray-100 text-gray-900'
            }`}>
              {msg.messageType === 'text' && (
                <p className="text-sm whitespace-pre-wrap">{msg.message}</p>
              )}
              
              {msg.messageType === 'image' && (
                <div className="space-y-2">
                  <img 
                    src={msg.fileUrl} 
                    alt={msg.fileName}
                    className="max-w-full h-auto rounded cursor-pointer"
                    onClick={() => window.open(msg.fileUrl, '_blank')}
                  />
                  <p className="text-sm">{msg.message}</p>
                </div>
              )}
              
              {msg.messageType === 'file' && (
                <div className="space-y-2">
                  <div className="flex items-center space-x-2 p-2 bg-white/10 rounded">
                    <File className="h-4 w-4" />
                    <span className="text-sm flex-1">{msg.fileName}</span>
                    <div className="flex space-x-1">
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => window.open(msg.fileUrl, '_blank')}
                      >
                        <Eye className="h-3 w-3" />
                      </Button>
                      <Button
                        size="sm"
                        variant="ghost"
                        className="h-6 w-6 p-0"
                        onClick={() => {
                          const link = document.createElement('a');
                          link.href = msg.fileUrl;
                          link.download = msg.fileName;
                          link.click();
                        }}
                      >
                        <Download className="h-3 w-3" />
                      </Button>
                    </div>
                  </div>
                  <p className="text-sm">{msg.message}</p>
                </div>
              )}
            </div>
          </div>
        </div>
      </div>
    );
  };

  return (
    <Card className="h-[600px] flex flex-col">
      <CardHeader className="pb-3">
        <div className="flex items-center justify-between">
          <CardTitle className="text-lg">Chat - Application #{applicationId.slice(-6)}</CardTitle>
          {onClose && (
            <Button variant="ghost" size="sm" onClick={onClose}>
              <X className="h-4 w-4" />
            </Button>
          )}
        </div>
        <div className="flex flex-wrap gap-2">
          {participants.map((participant) => (
            <Badge 
              key={participant.userId} 
              variant="outline" 
              className={getRoleColor(participant.role)}
            >
              {participant.name} ({participant.role})
            </Badge>
          ))}
        </div>
      </CardHeader>
      
      <Separator />
      
      <CardContent className="flex-1 flex flex-col p-0">
        {/* Messages Area */}
        <ScrollArea className="flex-1 p-4">
          {isLoadingMessages ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">Loading messages...</div>
            </div>
          ) : messages.length === 0 ? (
            <div className="flex items-center justify-center h-32">
              <div className="text-sm text-gray-500">No messages yet. Start the conversation!</div>
            </div>
          ) : (
            <div>
              {messages.map(renderMessage)}
              <div ref={messagesEndRef} />
            </div>
          )}
        </ScrollArea>
        
        <Separator />
        
        {/* File Preview */}
        {selectedFile && (
          <div className="p-3 bg-gray-50 border-t">
            <div className="flex items-center justify-between">
              <div className="flex items-center space-x-2">
                {selectedFile.type.startsWith('image/') ? (
                  <Image className="h-4 w-4" />
                ) : (
                  <File className="h-4 w-4" />
                )}
                <span className="text-sm">{selectedFile.name}</span>
                <span className="text-xs text-gray-500">
                  ({(selectedFile.size / 1024 / 1024).toFixed(2)} MB)
                </span>
              </div>
              <Button
                variant="ghost"
                size="sm"
                onClick={() => setSelectedFile(null)}
              >
                <X className="h-4 w-4" />
              </Button>
            </div>
          </div>
        )}
        
        {/* Message Input */}
        <div className="p-4 border-t">
          <div className="flex items-end space-x-2">
            <div className="flex-1">
              <Input
                value={message}
                onChange={(e) => setMessage(e.target.value)}
                onKeyPress={handleKeyPress}
                placeholder="Type your message..."
                disabled={isSending || isUploading}
                className="resize-none"
              />
            </div>
            
            <input
              ref={fileInputRef}
              type="file"
              accept="image/*,.pdf,.doc,.docx"
              onChange={handleFileSelect}
              className="hidden"
            />
            
            <Button
              variant="outline"
              size="sm"
              onClick={() => fileInputRef.current?.click()}
              disabled={isSending || isUploading}
            >
              <Paperclip className="h-4 w-4" />
            </Button>
            
            <Button
              onClick={handleSendMessage}
              disabled={(!message.trim() && !selectedFile) || isSending || isUploading}
              size="sm"
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
