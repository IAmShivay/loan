import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import { z } from 'zod';
import connectDB from '@/lib/db/connection';
import { Payment } from '@/lib/db/models/Payment';
import LoanApplication from '@/lib/db/models/LoanApplication';

const verifyPaymentSchema = z.object({
  paymentId: z.string().min(1, 'Payment ID is required'),
  transactionRef: z.string().min(1, 'Transaction reference is required'),
  gatewayTransactionId: z.string().optional(),
  checksum: z.string().optional()
});

export async function POST(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user || session.user.role !== 'user') {
      return NextResponse.json(
        { error: 'Unauthorized. Only users can verify payments.' },
        { status: 401 }
      );
    }

    await connectDB();
    
    const body = await request.json();
    const validatedData = verifyPaymentSchema.parse(body);

    // Find payment record
    const payment = await Payment.findOne({
      paymentId: validatedData.paymentId,
      transactionRef: validatedData.transactionRef,
      userId: session.user.id
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found or unauthorized' },
        { status: 404 }
      );
    }

    // Check if payment is already processed
    if (payment.status === 'completed') {
      return NextResponse.json({
        success: true,
        payment: {
          paymentId: payment.paymentId,
          transactionRef: payment.transactionRef,
          status: payment.status,
          amount: payment.amount,
          completedAt: payment.completedAt
        }
      });
    }

    if (payment.status === 'failed' || payment.status === 'cancelled') {
      return NextResponse.json(
        { error: 'Payment has already failed or been cancelled' },
        { status: 400 }
      );
    }

    // Check payment expiry
    const expiresAt = new Date(payment.gatewayResponse.expiresAt);
    if (new Date() > expiresAt) {
      payment.status = 'expired';
      payment.failureReason = 'Payment expired';
      await payment.save();
      
      return NextResponse.json(
        { error: 'Payment has expired' },
        { status: 400 }
      );
    }

    // Simulate payment gateway verification (in production, call actual gateway API)
    const isPaymentSuccessful = await simulatePaymentVerification(validatedData);

    if (isPaymentSuccessful) {
      // Update payment status
      payment.status = 'completed';
      payment.completedAt = new Date();
      payment.gatewayTransactionId = validatedData.gatewayTransactionId || `GW_${Date.now()}`;
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        verifiedAt: new Date(),
        gatewayStatus: 'SUCCESS',
        gatewayMessage: 'Payment completed successfully'
      };
      
      await payment.save();

      // Update application status to indicate payment completed
      await LoanApplication.findByIdAndUpdate(
        payment.applicationId,
        { 
          paymentStatus: 'completed',
          paymentId: payment.paymentId,
          serviceChargesPaid: true,
          paidAt: new Date()
        }
      );

      return NextResponse.json({
        success: true,
        payment: {
          paymentId: payment.paymentId,
          transactionRef: payment.transactionRef,
          status: payment.status,
          amount: payment.amount,
          completedAt: payment.completedAt,
          gatewayTransactionId: payment.gatewayTransactionId
        }
      });

    } else {
      // Payment failed
      payment.status = 'failed';
      payment.failureReason = 'Payment verification failed';
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        verifiedAt: new Date(),
        gatewayStatus: 'FAILED',
        gatewayMessage: 'Payment verification failed'
      };
      
      await payment.save();

      return NextResponse.json(
        { error: 'Payment verification failed' },
        { status: 400 }
      );
    }

  } catch (error) {
    console.error('Payment verification error:', error);
    
    if (error instanceof z.ZodError) {
      return NextResponse.json(
        { error: 'Invalid request data', details: error.issues },
        { status: 400 }
      );
    }

    return NextResponse.json(
      { error: 'Failed to verify payment' },
      { status: 500 }
    );
  }
}

// Simulate payment gateway verification (replace with actual gateway API call)
async function simulatePaymentVerification(data: any): Promise<boolean> {
  // Simulate network delay
  await new Promise(resolve => setTimeout(resolve, 1000));
  
  // Simulate 95% success rate for demo purposes
  return Math.random() > 0.05;
}

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user || session.user.role !== 'user') {
      return NextResponse.json(
        { error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');

    if (!paymentId) {
      return NextResponse.json(
        { error: 'Payment ID is required' },
        { status: 400 }
      );
    }

    await connectDB();

    const payment = await Payment.findOne({
      paymentId,
      userId: session.user.id
    });

    if (!payment) {
      return NextResponse.json(
        { error: 'Payment not found' },
        { status: 404 }
      );
    }

    return NextResponse.json({
      success: true,
      payment: {
        paymentId: payment.paymentId,
        transactionRef: payment.transactionRef,
        status: payment.status,
        amount: payment.amount,
        currency: payment.currency,
        paymentMethod: payment.paymentMethod,
        createdAt: payment.createdAt,
        completedAt: payment.completedAt,
        failureReason: payment.failureReason
      }
    });

  } catch (error) {
    console.error('Payment status check error:', error);
    return NextResponse.json(
      { error: 'Failed to check payment status' },
      { status: 500 }
    );
  }
}
