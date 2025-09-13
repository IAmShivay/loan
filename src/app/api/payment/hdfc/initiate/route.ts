import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/connection';
import Payment from '@/lib/db/models/Payment';
import LoanApplication from '@/lib/db/models/LoanApplication';
import { hdfcPaymentGateway } from '@/lib/payment/hdfc';
import { logInfo, logError } from '@/lib/logger';
import { v4 as uuidv4 } from 'uuid';

export async function POST(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const body = await request.json();
    const { applicationId, amount, currency = 'INR' } = body;

    if (!applicationId || !amount) {
      return NextResponse.json({
        error: 'Application ID and amount are required'
      }, { status: 400 });
    }

    // Validate that this is for service charge only (₹99)
    const serviceChargeAmount = 99;
    if (parseFloat(amount) !== serviceChargeAmount) {
      return NextResponse.json({
        error: `Invalid amount. Service charge must be exactly ₹${serviceChargeAmount}`
      }, { status: 400 });
    }

    // Verify application exists and belongs to user
    const application = await LoanApplication.findById(applicationId);
    if (!application) {
      return NextResponse.json({ 
        error: 'Application not found' 
      }, { status: 404 });
    }

    if (application.userId.toString() !== session.user.id) {
      return NextResponse.json({
        error: 'Unauthorized access to application'
      }, { status: 403 });
    }

    // Check if service charges are already paid
    if (application.serviceChargesPaid) {
      return NextResponse.json({
        error: 'Service charges have already been paid for this application'
      }, { status: 409 });
    }

    // Check if payment already exists for this application
    const existingPayment = await Payment.findOne({
      applicationId,
      status: { $in: ['initiated', 'pending', 'processing', 'completed'] }
    });

    if (existingPayment) {
      return NextResponse.json({ 
        error: 'Payment already exists for this application',
        paymentId: existingPayment.paymentId
      }, { status: 409 });
    }

    // Generate unique payment ID and transaction reference
    const paymentId = `PAY_${Date.now()}_${uuidv4().substring(0, 8)}`;
    const transactionRef = `TXN_${Date.now()}_${Math.random().toString(36).substring(2, 8)}`;

    // Create payment record for service charge collection only
    const payment = new Payment({
      paymentId,
      transactionRef,
      applicationId,
      userId: session.user.id,
      amount: serviceChargeAmount, // Fixed service charge amount
      currency,
      paymentMethod: 'card', // Default, will be updated based on actual payment method
      status: 'initiated',
      gatewayResponse: {},
      metadata: {
        userAgent: request.headers.get('user-agent') || '',
        ipAddress: request.headers.get('x-forwarded-for') ||
                   request.headers.get('x-real-ip') ||
                   'unknown',
        initiatedAt: new Date(),
        attempts: 1,
        lastAttemptAt: new Date(),
        paymentType: 'service_charge', // Explicitly mark as service charge payment
        description: 'Loan Application Service Charge',
      },
    });

    await payment.save();

    // Get user details for payment
    const userDetails = {
      name: `${session.user.firstName || ''} ${session.user.lastName || ''}`.trim() || session.user.email,
      email: session.user.email,
      phone: session.user.phone || '9999999999', // Default phone if not available
    };

    // Prepare HDFC payment request for service charge collection
    const paymentRequest = {
      orderId: paymentId,
      amount: serviceChargeAmount, // Fixed service charge amount
      currency,
      customerName: userDetails.name,
      customerEmail: userDetails.email,
      customerPhone: userDetails.phone,
      billingAddress: application.personalDetails?.address?.street || 'Not provided',
      billingCity: application.personalDetails?.address?.city || 'Not provided',
      billingState: application.personalDetails?.address?.state || 'Not provided',
      billingZip: application.personalDetails?.address?.zipCode || '000000',
      billingCountry: 'India',
      merchantParam1: applicationId.toString(),
      merchantParam2: session.user.id,
      merchantParam3: 'service_charge',
      merchantParam4: application.applicationNumber || '',
      merchantParam5: '',
    };

    // Create HDFC payment request
    const hdfcRequest = hdfcPaymentGateway.createPaymentRequest(paymentRequest);

    // Update payment status to pending
    payment.status = 'pending';
    payment.gatewayResponse = {
      hdfcRequest: {
        accessCode: hdfcRequest.accessCode,
        merchantId: hdfcRequest.merchantId,
        redirectUrl: hdfcRequest.redirectUrl,
        cancelUrl: hdfcRequest.cancelUrl,
      }
    };
    await payment.save();

    logInfo('HDFC Payment initiated', {
      paymentId,
      applicationId,
      userId: session.user.id,
      amount: parseFloat(amount),
      currency
    });

    return NextResponse.json({
      success: true,
      paymentId,
      transactionRef,
      gatewayData: {
        encRequest: hdfcRequest.encRequest,
        accessCode: hdfcRequest.accessCode,
        merchantId: hdfcRequest.merchantId,
        redirectUrl: hdfcRequest.redirectUrl,
        cancelUrl: hdfcRequest.cancelUrl,
        gatewayUrl: process.env.HDFC_GATEWAY_URL || 'https://secure.ccavenue.com/transaction/transaction.do?command=initiateTransaction',
      },
      message: 'Payment initiated successfully'
    });

  } catch (error) {
    const session = await getServerSession(authOptions);
    logError('HDFC Payment initiation failed', error, {
      userId: session?.user?.id,
      applicationId: 'unknown'
    });
    
    return NextResponse.json({
      error: 'Failed to initiate payment',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    }, { status: 500 });
  }
}

// GET endpoint to retrieve payment status
export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const paymentId = searchParams.get('paymentId');
    const applicationId = searchParams.get('applicationId');

    if (!paymentId && !applicationId) {
      return NextResponse.json({ 
        error: 'Payment ID or Application ID is required' 
      }, { status: 400 });
    }

    let payment;
    if (paymentId) {
      payment = await Payment.findOne({ paymentId });
    } else {
      payment = await Payment.findOne({ 
        applicationId,
        userId: session.user.id 
      }).sort({ createdAt: -1 });
    }

    if (!payment) {
      return NextResponse.json({ 
        error: 'Payment not found' 
      }, { status: 404 });
    }

    // Verify user has access to this payment
    if (payment.userId.toString() !== session.user.id) {
      return NextResponse.json({ 
        error: 'Unauthorized access to payment' 
      }, { status: 403 });
    }

    return NextResponse.json({
      paymentId: payment.paymentId,
      transactionRef: payment.transactionRef,
      applicationId: payment.applicationId,
      amount: payment.amount,
      currency: payment.currency,
      status: payment.status,
      paymentMethod: payment.paymentMethod,
      gatewayTransactionId: payment.gatewayTransactionId,
      failureReason: payment.failureReason,
      completedAt: payment.completedAt,
      createdAt: payment.createdAt,
      updatedAt: payment.updatedAt,
    });

  } catch (error) {
    const session = await getServerSession(authOptions);
    logError('Payment status retrieval failed', error, {
      userId: session?.user?.id
    });
    
    return NextResponse.json({
      error: 'Failed to retrieve payment status',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    }, { status: 500 });
  }
}
