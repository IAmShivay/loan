import { NextApiRequest, NextApiResponse } from 'next';
import { Server as NetServer } from 'http';
import { Server as SocketIOServer } from 'socket.io';

interface SocketServer extends NetServer {
  io?: SocketIOServer;
}

interface SocketApiResponse extends NextApiResponse {
  socket: {
    server: SocketServer;
  } & NextApiResponse['socket'];
}

export default function handler(req: NextApiRequest, res: SocketApiResponse) {
  if (!res.socket.server.io) {
    console.log('Setting up Socket.IO server...');

    const io = new SocketIOServer(res.socket.server, {
      path: '/api/socket',
      cors: {
        origin: '*',
        methods: ['GET', 'POST'],
      },
    });

    // Chat functionality
    io.on('connection', (socket) => {
      console.log('User connected:', socket.id);

      // Join a specific chat room
      socket.on('join-chat', (chatId: string) => {
        socket.join(chatId);
        console.log(`User ${socket.id} joined chat room ${chatId}`);
        socket.emit('joined-chat', chatId);
      });

      // Leave a chat room
      socket.on('leave-chat', (chatId: string) => {
        socket.leave(chatId);
        console.log(`User ${socket.id} left chat room ${chatId}`);
      });

      // Handle new message
      socket.on('send-message', (data: {
        chatId: string;
        message: any;
        senderId: string;
        senderName: string;
        senderRole: string;
      }) => {
        console.log('Broadcasting message to chat:', data.chatId);

        // Broadcast to all users in the chat room
        io.to(data.chatId).emit('new-message', {
          ...data.message,
          timestamp: new Date().toISOString(),
        });
      });

      // Handle typing indicators
      socket.on('typing-start', (data: { chatId: string; userName: string }) => {
        socket.to(data.chatId).emit('user-typing', {
          userName: data.userName,
          timestamp: new Date().toISOString(),
        });
      });

      socket.on('typing-stop', (data: { chatId: string; userName: string }) => {
        socket.to(data.chatId).emit('user-stopped-typing', {
          userName: data.userName,
        });
      });

      // Handle disconnection
      socket.on('disconnect', () => {
        console.log('User disconnected:', socket.id);
      });
    });

    res.socket.server.io = io;
  } else {
    console.log('Socket.IO server already running');
  }

  res.end();
}

export const config = {
  api: {
    bodyParser: false,
  },
};