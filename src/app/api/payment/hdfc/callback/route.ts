import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import Payment from '@/lib/db/models/Payment';
import LoanApplication from '@/lib/db/models/LoanApplication';
import { hdfcPaymentGateway } from '@/lib/payment/hdfc';
import { logInfo, logError } from '@/lib/logger';
import { sendEmail } from '@/lib/email';

export async function POST(request: NextRequest) {
  try {
    await connectDB();

    const formData = await request.formData();
    const encResponse = formData.get('encResp') as string;

    if (!encResponse) {
      logError('HDFC Callback: Missing encrypted response', new Error('encResp parameter missing'));
      return NextResponse.redirect(new URL('/payment/error?reason=invalid_response', request.url));
    }

    // Parse the payment response
    const paymentResponse = hdfcPaymentGateway.parsePaymentResponse(encResponse);

    logInfo('HDFC Payment callback received', {
      orderId: paymentResponse.orderId,
      trackingId: paymentResponse.trackingId,
      orderStatus: paymentResponse.orderStatus,
      amount: paymentResponse.amount
    });

    // Find the payment record
    const payment = await Payment.findOne({ paymentId: paymentResponse.orderId });
    if (!payment) {
      logError('HDFC Callback: Payment not found', new Error('Payment record not found'), {
        orderId: paymentResponse.orderId
      });
      return NextResponse.redirect(new URL('/payment/error?reason=payment_not_found', request.url));
    }

    // Update payment record with response data
    payment.gatewayTransactionId = paymentResponse.trackingId;
    payment.gatewayResponse = {
      ...payment.gatewayResponse,
      hdfcResponse: paymentResponse
    };

    // Update payment status based on response
    switch (paymentResponse.orderStatus) {
      case 'Success':
        payment.status = 'completed';
        payment.completedAt = new Date();
        payment.paymentMethod = paymentResponse.paymentMode?.toLowerCase() || 'card';
        break;
      case 'Failure':
        payment.status = 'failed';
        payment.failureReason = paymentResponse.failureMessage || paymentResponse.statusMessage;
        break;
      case 'Aborted':
        payment.status = 'cancelled';
        payment.failureReason = 'Payment aborted by user';
        break;
      case 'Invalid':
        payment.status = 'failed';
        payment.failureReason = 'Invalid payment response';
        break;
      default:
        payment.status = 'failed';
        payment.failureReason = `Unknown status: ${paymentResponse.orderStatus}`;
    }

    await payment.save();

    // Update application payment status if payment is successful
    if (payment.status === 'completed') {
      const application = await LoanApplication.findById(payment.applicationId);
      if (application) {
        application.paymentStatus = 'completed';
        application.serviceChargesPaid = true;
        
        // Add status history entry
        application.statusHistory.push({
          status: 'payment_completed',
          updatedBy: payment.userId,
          updatedAt: new Date(),
          comments: `Service charges of ₹${payment.amount} paid successfully via ${payment.paymentMethod}`,
        });

        await application.save();

        // Send payment confirmation email
        try {
          await sendEmail({
            to: paymentResponse.billingEmail,
            subject: 'Payment Confirmation - Loan Application Service Charges',
            template: 'payment-confirmation',
            data: {
              customerName: paymentResponse.billingName,
              applicationNumber: application.applicationNumber,
              amount: payment.amount,
              currency: payment.currency,
              paymentId: payment.paymentId,
              transactionId: payment.gatewayTransactionId,
              paymentMethod: payment.paymentMethod,
              completedAt: payment.completedAt,
            }
          });
        } catch (emailError) {
          logError('Payment confirmation email failed', emailError, {
            paymentId: payment.paymentId,
            email: paymentResponse.billingEmail
          });
        }

        logInfo('Payment completed successfully', {
          paymentId: payment.paymentId,
          applicationId: payment.applicationId,
          amount: payment.amount,
          transactionId: payment.gatewayTransactionId
        });

        // Redirect to success page
        return NextResponse.redirect(new URL(`/payment/success?paymentId=${payment.paymentId}`, request.url));
      }
    }

    // Log failed payment
    if (payment.status === 'failed' || payment.status === 'cancelled') {
      logError('Payment failed or cancelled', new Error(payment.failureReason || 'Unknown error'), {
        paymentId: payment.paymentId,
        status: payment.status,
        orderStatus: paymentResponse.orderStatus
      });

      // Redirect to failure page
      return NextResponse.redirect(new URL(`/payment/failed?paymentId=${payment.paymentId}&reason=${encodeURIComponent(payment.failureReason || 'Payment failed')}`, request.url));
    }

    // Default redirect for any other status
    return NextResponse.redirect(new URL(`/payment/status?paymentId=${payment.paymentId}`, request.url));

  } catch (error) {
    logError('HDFC Payment callback processing failed', error);
    return NextResponse.redirect(new URL('/payment/error?reason=processing_error', request.url));
  }
}

// Handle GET requests (for testing or direct access)
export async function GET(request: NextRequest) {
  const { searchParams } = new URL(request.url);
  const encResponse = searchParams.get('encResp');

  if (!encResponse) {
    return NextResponse.json({ error: 'Missing encrypted response' }, { status: 400 });
  }

  try {
    await connectDB();

    // Parse the payment response
    const paymentResponse = hdfcPaymentGateway.parsePaymentResponse(encResponse);

    // Find the payment record
    const payment = await Payment.findOne({ paymentId: paymentResponse.orderId });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    return NextResponse.json({
      success: true,
      paymentId: payment.paymentId,
      status: payment.status,
      amount: payment.amount,
      transactionId: payment.gatewayTransactionId,
      orderStatus: paymentResponse.orderStatus,
      message: 'Payment status retrieved successfully'
    });

  } catch (error) {
    logError('HDFC Payment callback GET processing failed', error);
    return NextResponse.json({
      error: 'Failed to process payment callback',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    }, { status: 500 });
  }
}

// Handle webhook notifications (if HDFC supports them)
export async function PUT(request: NextRequest) {
  try {
    await connectDB();

    const body = await request.json();
    const { orderId, trackingId, status, signature } = body;

    if (!orderId || !trackingId) {
      return NextResponse.json({ error: 'Missing required parameters' }, { status: 400 });
    }

    // Verify signature if provided
    // Note: Implement signature verification based on HDFC webhook documentation

    // Find the payment record
    const payment = await Payment.findOne({ paymentId: orderId });
    if (!payment) {
      return NextResponse.json({ error: 'Payment not found' }, { status: 404 });
    }

    // Verify payment status with HDFC
    try {
      const verificationResponse = await hdfcPaymentGateway.verifyPaymentStatus(orderId, trackingId);
      
      // Update payment record based on verification
      payment.gatewayResponse = {
        ...payment.gatewayResponse,
        webhookData: body,
        verificationResponse
      };

      // Update status based on verification
      if (verificationResponse.orderStatus === 'Success' && payment.status !== 'completed') {
        payment.status = 'completed';
        payment.completedAt = new Date();
        
        // Update application status
        const application = await LoanApplication.findById(payment.applicationId);
        if (application && !application.serviceChargesPaid) {
          application.paymentStatus = 'completed';
          application.serviceChargesPaid = true;
          await application.save();
        }
      }

      await payment.save();

      logInfo('HDFC Payment webhook processed', {
        paymentId: orderId,
        trackingId,
        status: verificationResponse.orderStatus
      });

      return NextResponse.json({ success: true, message: 'Webhook processed successfully' });

    } catch (verificationError) {
      logError('HDFC Payment verification failed', verificationError, { orderId, trackingId });
      return NextResponse.json({ error: 'Payment verification failed' }, { status: 500 });
    }

  } catch (error) {
    logError('HDFC Payment webhook processing failed', error);
    return NextResponse.json({
      error: 'Failed to process webhook',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    }, { status: 500 });
  }
}
