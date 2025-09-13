import { NextRequest, NextResponse } from 'next/server';
import { connectDB, User } from '@/lib/db';
import { generateJWT } from '@/lib/auth/utils';
import { z } from 'zod';

const forgotPasswordSchema = z.object({
  email: z.string().email('Invalid email format'),
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    const { email } = forgotPasswordSchema.parse(body);

    await connectDB();

    // Find user by email
    const user = await User.findOne({ email });
    if (!user) {
      // Don't reveal if email exists or not for security
      return NextResponse.json(
        {
          success: true,
          message: 'If an account with this email exists, you will receive a password reset link.',
        },
        { status: 200 }
      );
    }

    // Generate reset token (valid for 1 hour)
    const resetToken = generateJWT({
      userId: user._id,
      email: user.email,
      type: 'password_reset',
    });

    // In a real application, you would send an email here
    // For now, we'll just return the token (remove this in production)
    console.log('Password reset token for', email, ':', resetToken);

    // TODO: Send email with reset link
    // const resetLink = `${process.env.NEXTAUTH_URL}/reset-password?token=${resetToken}`;
    // await sendPasswordResetEmail(user.email, resetLink);

    return NextResponse.json(
      {
        success: true,
        message: 'If an account with this email exists, you will receive a password reset link.',
        // Remove this in production
        resetToken: process.env.NODE_ENV === 'development' ? resetToken : undefined,
      },
      { status: 200 }
    );

  } catch (error) {
    console.error('Forgot password error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Invalid email format',
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
