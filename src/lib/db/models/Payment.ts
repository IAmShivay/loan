import mongoose from 'mongoose';

export interface IPayment extends mongoose.Document {
  paymentId: string;
  transactionRef: string;
  applicationId: mongoose.Types.ObjectId;
  userId: mongoose.Types.ObjectId;
  amount: number;
  currency: string;
  paymentMethod: 'card' | 'upi' | 'netbanking' | 'wallet';
  status: 'initiated' | 'pending' | 'processing' | 'completed' | 'failed' | 'cancelled' | 'expired' | 'refunded';
  gatewayTransactionId?: string;
  gatewayResponse: any;
  failureReason?: string;
  refundId?: string;
  refundAmount?: number;
  refundedAt?: Date;
  completedAt?: Date;
  metadata: {
    userAgent?: string;
    ipAddress?: string;
    initiatedAt: Date;
    attempts?: number;
    lastAttemptAt?: Date;
  };
  createdAt: Date;
  updatedAt: Date;
}

const PaymentSchema = new mongoose.Schema<IPayment>({
  paymentId: {
    type: String,
    required: true,
    unique: true
    // unique: true already creates an index, no need for explicit index: true
  },
  transactionRef: {
    type: String,
    required: true,
    unique: true
    // unique: true already creates an index, no need for explicit index: true
  },
  applicationId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'LoanApplication',
    required: true,
    index: true
  },
  userId: {
    type: mongoose.Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true
  },
  amount: {
    type: Number,
    required: true,
    min: 0
  },
  currency: {
    type: String,
    required: true,
    default: 'INR',
    enum: ['INR', 'USD', 'EUR']
  },
  paymentMethod: {
    type: String,
    required: true,
    enum: ['card', 'upi', 'netbanking', 'wallet']
  },
  status: {
    type: String,
    required: true,
    enum: ['initiated', 'pending', 'processing', 'completed', 'failed', 'cancelled', 'expired', 'refunded'],
    default: 'initiated',
    index: true
  },
  gatewayTransactionId: {
    type: String,
    sparse: true,
    index: true
  },
  gatewayResponse: {
    type: mongoose.Schema.Types.Mixed,
    default: {}
  },
  failureReason: {
    type: String
  },
  refundId: {
    type: String,
    sparse: true
  },
  refundAmount: {
    type: Number,
    min: 0
  },
  refundedAt: {
    type: Date
  },
  completedAt: {
    type: Date,
    index: true
  },
  metadata: {
    userAgent: String,
    ipAddress: String,
    initiatedAt: {
      type: Date,
      required: true,
      default: Date.now
    },
    attempts: {
      type: Number,
      default: 0
    },
    lastAttemptAt: Date,
    paymentType: {
      type: String,
      enum: ['service_charge'],
      default: 'service_charge'
    },
    description: {
      type: String,
      default: 'Loan Application Service Charge'
    }
  }
}, {
  timestamps: true,
  collection: 'payments'
});

// Compound indexes for efficient queries
PaymentSchema.index({ userId: 1, status: 1 });
PaymentSchema.index({ applicationId: 1, status: 1 });
PaymentSchema.index({ createdAt: -1 });
PaymentSchema.index({ status: 1, createdAt: -1 });

// Instance methods
PaymentSchema.methods.isExpired = function(): boolean {
  if (!this.gatewayResponse?.expiresAt) return false;
  return new Date() > new Date(this.gatewayResponse.expiresAt);
};

PaymentSchema.methods.canRetry = function(): boolean {
  return ['failed', 'expired'].includes(this.status) && 
         (this.metadata.attempts || 0) < 3;
};

PaymentSchema.methods.incrementAttempt = function() {
  this.metadata.attempts = (this.metadata.attempts || 0) + 1;
  this.metadata.lastAttemptAt = new Date();
  return this.save();
};

// Static methods
PaymentSchema.statics.findByApplication = function(applicationId: string) {
  return this.find({ applicationId }).sort({ createdAt: -1 });
};

PaymentSchema.statics.findSuccessfulPayment = function(applicationId: string) {
  return this.findOne({ 
    applicationId, 
    status: 'completed' 
  });
};

PaymentSchema.statics.findPendingPayments = function(userId?: string) {
  const query: any = { 
    status: { $in: ['initiated', 'pending', 'processing'] }
  };
  
  if (userId) {
    query.userId = userId;
  }
  
  return this.find(query).sort({ createdAt: -1 });
};

// Pre-save middleware
PaymentSchema.pre('save', function(next) {
  // Auto-expire old pending payments
  if (this.status === 'pending' && this.gatewayResponse?.expiresAt) {
    const expiresAt = new Date(this.gatewayResponse.expiresAt);
    if (new Date() > expiresAt) {
      this.status = 'expired';
      this.failureReason = 'Payment expired';
    }
  }
  
  next();
});

// Ensure model is only compiled once
export const Payment = mongoose.models.Payment || mongoose.model<IPayment>('Payment', PaymentSchema);
export default Payment;
