import { useEffect, useState } from 'react';
import { io, Socket } from 'socket.io-client';

interface UseSocketProps {
  chatId?: string;
  onNewMessage?: (message: any) => void;
  onUserTyping?: (data: { userName: string }) => void;
  onUserStoppedTyping?: (data: { userName: string }) => void;
}

export const useSocket = ({ chatId, onNewMessage, onUserTyping, onUserStoppedTyping }: UseSocketProps) => {
  const [socket, setSocket] = useState<Socket | null>(null);
  const [isConnected, setIsConnected] = useState(false);

  useEffect(() => {
    // Initialize socket connection
    const newSocket = io(process.env.NODE_ENV === 'production' ? '' : 'http://localhost:3000', {
      path: '/api/socket',
    });

    newSocket.on('connect', () => {
      console.log('Connected to Socket.IO server');
      setIsConnected(true);
    });

    newSocket.on('disconnect', () => {
      console.log('Disconnected from Socket.IO server');
      setIsConnected(false);
    });

    // Join chat room if chatId is provided
    if (chatId) {
      newSocket.emit('join-chat', chatId);

      newSocket.on('joined-chat', (joinedChatId: string) => {
        console.log('Successfully joined chat:', joinedChatId);
      });
    }

    // Listen for new messages
    if (onNewMessage) {
      newSocket.on('new-message', onNewMessage);
    }

    // Listen for typing indicators
    if (onUserTyping) {
      newSocket.on('user-typing', onUserTyping);
    }

    if (onUserStoppedTyping) {
      newSocket.on('user-stopped-typing', onUserStoppedTyping);
    }

    setSocket(newSocket);

    // Cleanup
    return () => {
      if (chatId) {
        newSocket.emit('leave-chat', chatId);
      }
      newSocket.disconnect();
    };
  }, [chatId]);

  const sendMessage = (message: any, senderId: string, senderName: string, senderRole: string) => {
    if (socket && chatId) {
      socket.emit('send-message', {
        chatId,
        message,
        senderId,
        senderName,
        senderRole,
      });
    }
  };

  const startTyping = (userName: string) => {
    if (socket && chatId) {
      socket.emit('typing-start', { chatId, userName });
    }
  };

  const stopTyping = (userName: string) => {
    if (socket && chatId) {
      socket.emit('typing-stop', { chatId, userName });
    }
  };

  return {
    socket,
    isConnected,
    sendMessage,
    startTyping,
    stopTyping,
  };
};