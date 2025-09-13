import { NextRequest, NextResponse } from 'next/server';
import { connectDB, User } from '@/lib/db';
import { validatePassword } from '@/lib/auth/utils';
import { z } from 'zod';
import { logApiRequest, logApiResponse, logError, logAuthOperation, logDbOperation } from '@/lib/logger';

const registerSchema = z.object({
  email: z.string().email('Invalid email format'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  role: z.enum(['user', 'dsa']).optional().default('user'),
  bankName: z.enum(['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK']).optional(),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
}).refine((data) => {
  if (data.role === 'dsa') {
    return !!data.bankName;
  }
  return true;
}, {
  message: "Bank name is required for DSA registration",
  path: ["bankName"],
});

export async function POST(request: NextRequest) {
  try {
    const body = await request.json();
    
    // Validate input
    const validatedData = registerSchema.parse(body);
    
    // Additional password validation
    const passwordValidation = validatePassword(validatedData.password);
    if (!passwordValidation.isValid) {
      return NextResponse.json(
        { 
          success: false, 
          error: 'Password validation failed',
          details: passwordValidation.errors 
        },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email: validatedData.email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 409 }
      );
    }

    // Check if phone number already exists
    const existingPhone = await User.findOne({ phone: validatedData.phone });
    if (existingPhone) {
      return NextResponse.json(
        { success: false, error: 'User with this phone number already exists' },
        { status: 409 }
      );
    }

    // Create new user
    const userData = {
      email: validatedData.email,
      password: validatedData.password,
      firstName: validatedData.firstName,
      lastName: validatedData.lastName,
      phone: validatedData.phone,
      role: validatedData.role,
      ...(validatedData.role === 'dsa' && { bankName: validatedData.bankName }),
    };

    const user = new User(userData);
    await user.save();

    // Remove password from response
    const userResponse = user.toJSON();
    delete userResponse.password;

    return NextResponse.json(
      {
        success: true,
        message: validatedData.role === 'dsa' 
          ? 'DSA registration successful. Please wait for admin verification.'
          : 'Registration successful. You can now login.',
        data: userResponse,
      },
      { status: 201 }
    );

  } catch (error) {
    console.error('Registration error:', error);
    
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
