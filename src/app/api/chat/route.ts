import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import Chat from '@/lib/db/models/Chat';
import User from '@/lib/db/models/User';
import LoanApplication from '@/lib/db/models/LoanApplication';

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const userId = searchParams.get('userId') || session.user.id;

    // Build query based on user role
    let query: any = {
      'participants.userId': userId
    };

    // If user role is 'user', they can only see their own chats
    if (session.user.role === 'user') {
      query = {
        'participants.userId': session.user.id
      };
    }

    const chats = await Chat.find(query)
      .populate('applicationId', 'personalInfo.firstName personalInfo.lastName loanInfo.amount status')
      .populate('participants.userId', 'firstName lastName email role')
      .populate('lastMessage')
      .sort({ updatedAt: -1 })
      .lean();

    // Calculate unread count for current user
    const chatsWithUnreadCount = chats.map(chat => ({
      ...chat,
      unreadCount: chat.messages?.filter((msg: any) => 
        msg.senderId.toString() !== session.user.id && !msg.read
      ).length || 0
    }));

    return NextResponse.json({
      success: true,
      chats: chatsWithUnreadCount
    });

  } catch (error) {
    console.error('Get chats error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch chats' },
      { status: 500 }
    );
  }
}

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { applicationId, participants } = await request.json();

    if (!applicationId || !participants || !Array.isArray(participants)) {
      return NextResponse.json({ 
        error: 'Application ID and participants are required' 
      }, { status: 400 });
    }

    // Verify application exists
    const application = await LoanApplication.findById(applicationId);
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check if chat already exists for this application and participants
    const existingChat = await Chat.findOne({
      applicationId,
      'participants.userId': { $all: participants }
    });

    if (existingChat) {
      return NextResponse.json({
        success: true,
        chat: existingChat,
        message: 'Chat already exists'
      });
    }

    // Get participant details
    const participantDetails = await User.find({
      _id: { $in: participants }
    }).select('firstName lastName email role');

    const participantsWithDetails = participantDetails.map(user => ({
      userId: user._id,
      name: `${user.firstName} ${user.lastName}`,
      role: user.role
    }));

    // Create new chat
    const newChat = new Chat({
      applicationId,
      participants: participantsWithDetails,
      messages: [],
      createdBy: session.user.id
    });

    await newChat.save();

    // Populate the response
    const populatedChat = await Chat.findById(newChat._id)
      .populate('applicationId', 'personalInfo.firstName personalInfo.lastName loanInfo.amount status')
      .populate('participants.userId', 'firstName lastName email role')
      .lean();

    return NextResponse.json({
      success: true,
      chat: populatedChat
    });

  } catch (error) {
    console.error('Create chat error:', error);
    return NextResponse.json(
      { error: 'Failed to create chat' },
      { status: 500 }
    );
  }
}
