import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, isAdmin } from '@/lib/auth/utils';
import { connectDB, User } from '@/lib/db';
import { z } from 'zod';

const verifyUserSchema = z.object({
  isVerified: z.boolean(),
  isActive: z.boolean().optional(),
});

// PUT /api/admin/users/[id]/verify - Verify/unverify user (admin only)
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
    const { isVerified, isActive } = verifyUserSchema.parse(body);

    await connectDB();

    const user = await User.findById(id);
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update verification status
    user.isVerified = isVerified;
    if (isActive !== undefined) {
      user.isActive = isActive;
    }
    
    if (isVerified) {
      user.verifiedBy = session.user.id;
      user.verifiedAt = new Date();
    } else {
      user.verifiedBy = undefined;
      user.verifiedAt = undefined;
    }

    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      message: `User ${isVerified ? 'verified' : 'unverified'} successfully`,
      data: userResponse,
    });

  } catch (error) {
    console.error('Verify user error:', error);
    
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
