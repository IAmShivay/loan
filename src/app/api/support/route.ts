import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import SupportTicket from '@/lib/db/models/SupportTicket';
import User from '@/lib/db/models/User';
import { z } from 'zod';

const createTicketSchema = z.object({
  subject: z.string().min(1).max(200),
  description: z.string().min(1).max(2000),
  category: z.enum(['technical', 'loan_inquiry', 'document', 'general']),
  priority: z.enum(['low', 'medium', 'high', 'urgent']).optional(),
});

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const { searchParams } = new URL(request.url);
    const status = searchParams.get('status');
    const category = searchParams.get('category');
    const priority = searchParams.get('priority');
    const limit = parseInt(searchParams.get('limit') || '10');
    const page = parseInt(searchParams.get('page') || '1');
    const assignedTo = searchParams.get('assignedTo');

    await connectDB();

    let query: any = { isDeleted: false };

    // Role-based filtering
    if (session.user.role === 'user') {
      query.userId = session.user.id;
    } else if (session.user.role === 'dsa') {
      query.assignedTo = session.user.id;
    }
    // Admin can see all tickets

    // Apply filters
    if (status) query.status = status;
    if (category) query.category = category;
    if (priority) query.priority = priority;
    if (assignedTo && session.user.role === 'admin') query.assignedTo = assignedTo;

    const skip = (page - 1) * limit;

    const [tickets, total] = await Promise.all([
      SupportTicket.find(query)
        .populate('userId', 'firstName lastName email role')
        .populate('assignedTo', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit)
        .lean(),
      SupportTicket.countDocuments(query)
    ]);

    return NextResponse.json({
      success: true,
      tickets,
      total,
      page,
      totalPages: Math.ceil(total / limit)
    });

  } catch (error) {
    console.error('Error fetching support tickets:', error);
    return NextResponse.json(
      { error: 'Failed to fetch support tickets' },
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

    const body = await request.json();
    const validatedData = createTicketSchema.parse(body);

    await connectDB();

    // Create the support ticket
    const ticket = new SupportTicket({
      ...validatedData,
      userId: session.user.id,
      responses: [{
        userId: session.user.id,
        message: validatedData.description,
        isInternal: false,
        createdAt: new Date()
      }]
    });

    await ticket.save();

    // Populate the created ticket
    const populatedTicket = await SupportTicket.findById(ticket._id)
      .populate('userId', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      data: populatedTicket,
      message: 'Support ticket created successfully'
    }, { status: 201 });

  } catch (error) {
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Validation failed', details: error.issues },
        { status: 400 }
      );
    }

    console.error('Error creating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to create support ticket' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { ticketId, status, assignedTo, resolution, message } = body;

    if (!ticketId) {
      return NextResponse.json({ error: 'Ticket ID is required' }, { status: 400 });
    }

    await connectDB();

    const ticket = await SupportTicket.findById(ticketId);
    if (!ticket) {
      return NextResponse.json({ error: 'Ticket not found' }, { status: 404 });
    }

    // Check permissions
    const canUpdate = session.user.role === 'admin' || 
                     (session.user.role === 'dsa' && ticket.assignedTo?.toString() === session.user.id) ||
                     (session.user.role === 'user' && ticket.userId.toString() === session.user.id);

    if (!canUpdate) {
      return NextResponse.json({ error: 'Insufficient permissions' }, { status: 403 });
    }

    // Update ticket fields
    if (status && session.user.role !== 'user') {
      ticket.status = status;
      if (status === 'resolved' || status === 'closed') {
        ticket.resolvedAt = new Date();
        ticket.resolvedBy = session.user.id;
      }
    }

    if (assignedTo && session.user.role === 'admin') {
      ticket.assignedTo = assignedTo;
    }

    if (resolution && (session.user.role === 'admin' || session.user.role === 'dsa')) {
      ticket.resolution = resolution;
    }

    // Add message if provided
    if (message) {
      ticket.messages.push({
        senderId: session.user.id,
        senderRole: session.user.role,
        message,
        createdAt: new Date()
      });
    }

    await ticket.save();

    // Return updated ticket
    const updatedTicket = await SupportTicket.findById(ticket._id)
      .populate('userId', 'firstName lastName email role')
      .populate('assignedTo', 'firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      data: updatedTicket,
      message: 'Support ticket updated successfully'
    });

  } catch (error) {
    console.error('Error updating support ticket:', error);
    return NextResponse.json(
      { error: 'Failed to update support ticket' },
      { status: 500 }
    );
  }
}
