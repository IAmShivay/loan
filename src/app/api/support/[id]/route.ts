import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import SupportTicket from '@/lib/db/models/SupportTicket';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const ticket = await SupportTicket.findById(id)
      .populate('userId', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email')
      .populate('responses.userId', 'firstName lastName email role')
      .lean() as any;

    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    const canView = session.user.role === 'admin' ||
                   (session.user.role === 'dsa' && ticket.assignedTo?._id?.toString() === session.user.id) ||
                   (session.user.role === 'user' && ticket.userId?._id?.toString() === session.user.id);

    if (!canView) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      data: ticket
    });

  } catch (error) {
    console.error('Error fetching support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support ticket' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    console.log('Support Ticket POST - Session:', session?.user ? { id: session.user.id, role: session.user.role, email: session.user.email } : 'No session');

    if (!session?.user) {
      console.log('Support Ticket POST - No session found, returning 401');
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { message, attachments } = body;

    if (!message) {
      return NextResponse.json({ error: 'Message is required' }, { status: 400 });
    }

    await connectDB();

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    const canReply = session.user.role === 'admin' ||
                    (session.user.role === 'dsa' && ticket.assignedTo?.toString() === session.user.id) ||
                    (session.user.role === 'user' && ticket.userId.toString() === session.user.id);

    console.log('Support Ticket POST - Permission check:', {
      userRole: session.user.role,
      userId: session.user.id,
      ticketUserId: ticket.userId.toString(),
      ticketAssignedTo: ticket.assignedTo?.toString(),
      canReply
    });

    if (!canReply) {
      console.log('Support Ticket POST - Permission denied, returning 403');
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Add message to ticket
    const newResponse = {
      userId: session.user.id,
      message,
      isInternal: session.user.role === 'admin', // Admin messages are internal
      attachments: attachments || [],
      createdAt: new Date()
    };

    ticket.responses.push(newResponse);

    // Update ticket status if it was closed and user is replying
    if (ticket.status === 'closed' && session.user.role === 'user') {
      ticket.status = 'open';
    } else if (ticket.status === 'open' && session.user.role !== 'user') {
      ticket.status = 'in_progress';
    }

    await ticket.save();

    // Return updated ticket
    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate('userId', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email')
      .populate('responses.userId', 'firstName lastName email role')
      .lean();

    return NextResponse.json({
      success: true,
      data: updatedTicket,
      message: 'Message added successfully'
    });

  } catch (error) {
    console.error('Error adding message to support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to add message' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id } = await params;
    const session = await getServerSession(authOptions);
    
    if (!session?.user || session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const ticket = await SupportTicket.findById(id);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Soft delete
    ticket.isDeleted = true;
    ticket.deletedAt = new Date();
    await ticket.save();

    return NextResponse.json({
      success: true,
      message: 'Support ticket deleted successfully'
    });

  } catch (error) {
    console.error('Error deleting support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to delete support ticket' },
      { status: 500 }
    );
  }
}
