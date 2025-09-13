import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, isAdmin } from '@/lib/auth/utils';
import { connectDB, User } from '@/lib/db';
import { z } from 'zod';

const updateStatusSchema = z.object({
  isActive: z.boolean(),
});

// PUT /api/admin/users/[id]/status - Update user status (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getAuthSession();
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const { isActive } = updateStatusSchema.parse(body);

    await connectDB();

    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Prevent admin from deactivating themselves
    if (user._id.toString() === session.user.id) {
      return NextResponse.json(
        { success: false, error: 'Cannot change your own status' },
        { status: 400 }
      );
    }

    user.isActive = isActive;
    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      message: `User ${isActive ? 'activated' : 'deactivated'} successfully`,
      data: userResponse,
    });

  } catch (error) {
    console.error('Update user status error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        {
          success: false,
          error: 'Validation failed',
          details: error.issues.map((err) => ({
            field: err.path.join('.'),
            message: err.message,
          }))
        },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
