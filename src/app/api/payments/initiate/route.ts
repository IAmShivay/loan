import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import { z } from 'zod';
import connectDB from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import { Payment } from '@/lib/db/models/Payment';

const initiatePaymentSchema = z.object({
  applicationId: z.string().min(1, 'Application ID is required'),
  amount: z.number().min(99).max(99), // Fixed service charge
  currency: z.string().default('INR'),
  paymentMethod: z.enum(['card', 'upi', 'netbanking', 'wallet']),
  returnUrl: z.string().url().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user || session.user.role !== 'user') {
      return NextResponse.json(
        { error: 'Unauthorized. Only users can initiate payments.' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const validatedData = initiatePaymentSchema.parse(body);

    // Check if application exists and belongs to user
    const application = await LoanApplication.findById(validatedData.applicationId);
    if (!application) {
      return NextResponse.json(
        { error: 'Application not found' },
        { status: 404 }
      );
    }

    if (application.userId.toString() !== session.user.id) {
      return NextResponse.json(
        { error: 'Unauthorized. Application does not belong to user.' },
        { status: 403 }
      );
    }

    // Check if payment already exists and is successful
    const existingPayment = await Payment.findOne({
      applicationId: validatedData.applicationId,
      status: { $in: ['completed', 'processing'] }
    });

    if (existingPayment) {
      return NextResponse.json(
        { error: 'Payment already completed or in progress for this application' },
        { status: 400 }
      );
    }

    // Generate unique payment ID and transaction reference
    const paymentId = `PAY_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;
    const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`;

    // Create payment record
    const payment = new Payment({
      paymentId,
      transactionRef,
      applicationId: validatedData.applicationId,
      userId: session.user.id,
      amount: validatedData.amount,
      currency: validatedData.currency,
      paymentMethod: validatedData.paymentMethod,
      status: 'initiated',
      gatewayResponse: {},
      metadata: {
        userAgent: request.headers.get('user-agent'),
        ipAddress: request.headers.get('x-forwarded-for') || request.headers.get('x-real-ip'),
        initiatedAt: new Date()
      }
    });

    await payment.save();

    // Static payment gateway response (simulate real gateway)
    const gatewayResponse = {
      paymentId,
      transactionRef,
      amount: validatedData.amount,
      currency: validatedData.currency,
      status: 'initiated',
      paymentUrl: `${process.env.NEXTAUTH_URL}/payment/process/${paymentId}`,
      expiresAt: new Date(Date.now() + 15 * 60 * 1000), // 15 minutes
      gatewayOrderId: `ORDER_${Date.now()}`,
      checksum: generateChecksum(paymentId, validatedData.amount, transactionRef)
    };

    // Update payment with gateway response
    payment.gatewayResponse = gatewayResponse;
    payment.status = 'pending';
    await payment.save();

    return NextResponse.json({
      success: true,
      payment: {
        paymentId,
        transactionRef,
        amount: validatedData.amount,
        currency: validatedData.currency,
        status: 'pending',
        paymentUrl: gatewayResponse.paymentUrl,
        expiresAt: gatewayResponse.expiresAt
      }
    });

  } catch (error) {
    console.error('Payment initiation error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to initiate payment' },
      { status: 500 }
    );
  }
}

// Simple checksum generation (in production, use proper HMAC)
function generateChecksum(paymentId: string, amount: number, transactionRef: string): string {
  const data = `${paymentId}|${amount}|${transactionRef}|${process.env.PAYMENT_SECRET_KEY || 'default-secret'}`;
  return Buffer.from(data).toString('base64');
}
