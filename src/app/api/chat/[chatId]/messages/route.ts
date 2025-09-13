import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import Chat from '@/lib/db/models/Chat';
import User from '@/lib/db/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { chatId } = await params;
    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '50');

    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (p: any) => p.userId.toString() === session.user.id
    );

    if (!isParticipant && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get messages with pagination
    const messagesData = chat.getMessages(page, limit);

    return NextResponse.json({
      success: true,
      ...messagesData
    });

  } catch (error) {
    console.error('Get messages error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch messages' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ chatId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { chatId } = await params;
    const { message, messageType = 'text', fileUrl, fileName } = await request.json();

    if (!message || message.trim().length === 0) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    // Find the chat
    const chat = await Chat.findById(chatId);
    if (!chat) {
      return NextResponse.json({ error: 'Chat not found' }, { status: 404 });
    }

    // Check if user is a participant
    const isParticipant = chat.participants.some(
      (p: any) => p.userId.toString() === session.user.id
    );

    if (!isParticipant) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get user details
    const user = await User.findById(session.user.id).select('firstName lastName role');
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    // Add message to chat
    const messageData = {
      senderId: session.user.id,
      senderName: `${user.firstName} ${user.lastName}`,
      senderRole: user.role,
      message: message.trim(),
      messageType,
      fileUrl,
      fileName,
    };

    await chat.addMessage(messageData);

    // Get the newly added message
    const newMessage = chat.messages[chat.messages.length - 1];

    return NextResponse.json({
      success: true,
      message: newMessage
    });

  } catch (error) {
    console.error('Send message error:', error);
    return NextResponse.json(
      { error: 'Failed to send message' },
      { status: 500 }
    );
  }
}
