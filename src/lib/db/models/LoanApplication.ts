import mongoose, { Schema, Document } from 'mongoose';

export interface IPersonalDetails {
  fullName: string;
  dateOfBirth: Date;
  gender: string;
  maritalStatus: string;
  address: {
    street: string;
    city: string;
    state: string;
    zipCode: string;
    country: string;
  };
  employment: {
    type: string;
    companyName: string;
    designation: string;
    workExperience: number;
  };
  income: number;
}

export interface ILoanDetails {
  amount: number;
  purpose: string;
  tenure: number;
  interestRate?: number;
}

export interface IDocument {
  type: string;
  fileName: string;
  filePath: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
}

export interface IStatusHistory {
  status: string;
  updatedBy: mongoose.Types.ObjectId;
  updatedAt: Date;
  comments?: string;
}

export interface IDSAReview {
  dsaId: mongoose.Types.ObjectId;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
  reviewedAt?: Date;
  documentsReviewed: string[];
  riskAssessment?: {
    creditScore?: number;
    riskLevel: 'low' | 'medium' | 'high';
    recommendations: string[];
  };
}

export interface ILoanApplication extends Document {
  userId: mongoose.Types.ObjectId;
  dsaId?: mongoose.Types.ObjectId; // Primary DSA (for backward compatibility)
  assignedDSAs: mongoose.Types.ObjectId[]; // Multiple DSAs can review
  applicationNumber: string;
  personalDetails: IPersonalDetails;
  loanDetails: ILoanDetails;
  documents: IDocument[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'partially_approved';
  dsaReviews: IDSAReview[];
  assignedAt?: Date;
  reviewDeadline?: Date;
  statusHistory: IStatusHistory[];
  finalApprovalThreshold: number; // Number of approvals needed

  // Payment Information
  paymentStatus: 'pending' | 'completed' | 'failed' | 'refunded';
  paymentId?: string;
  serviceChargesPaid: boolean;
  paidAt?: Date;

  createdAt: Date;
  updatedAt: Date;
  generateApplicationNumber(): string;
  getApprovalStatus(): { approved: number; rejected: number; pending: number };
  canUserSelectDSA(): boolean;
}

const PersonalDetailsSchema = new Schema({
  fullName: { type: String, required: true },
  dateOfBirth: { type: Date, required: true },
  gender: { type: String, enum: ['Male', 'Female', 'Other'], required: true },
  maritalStatus: { type: String, enum: ['Single', 'Married', 'Divorced', 'Widowed'], required: true },
  address: {
    street: { type: String, required: true },
    city: { type: String, required: true },
    state: { type: String, required: true },
    zipCode: { type: String, required: true },
    country: { type: String, default: 'India' },
  },
  employment: {
    type: { type: String, enum: ['Salaried', 'Self-Employed', 'Business'], required: true },
    companyName: { type: String, required: true },
    designation: { type: String, required: true },
    workExperience: { type: Number, required: true, min: 0 },
  },
  income: { type: Number, required: true, min: 0 },
});

const LoanDetailsSchema = new Schema({
  amount: { type: Number, required: true, min: 10000 },
  purpose: { type: String, required: true },
  tenure: { type: Number, required: true, min: 6, max: 360 }, // in months
  interestRate: { type: Number, min: 0, max: 50 },
});

const DocumentSchema = new Schema({
  type: { 
    type: String, 
    required: true,
    enum: ['Aadhar', 'PAN', 'Salary Slip', 'Bank Statement', 'ITR', 'Other']
  },
  fileName: { type: String, required: true },
  filePath: { type: String, required: true },
  uploadedAt: { type: Date, default: Date.now },
  status: { type: String, enum: ['pending', 'approved', 'rejected'], default: 'pending' },
  comments: { type: String },
});

const StatusHistorySchema = new Schema({
  status: { type: String, required: true },
  updatedBy: { type: Schema.Types.ObjectId, ref: 'User', required: true },
  updatedAt: { type: Date, default: Date.now },
  comments: { type: String },
});

const DSAReviewSchema = new Schema({
  dsaId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true
  },
  status: {
    type: String,
    enum: ['pending', 'approved', 'rejected'],
    default: 'pending'
  },
  comments: { type: String },
  reviewedAt: { type: Date },
  documentsReviewed: [{ type: String }],
  riskAssessment: {
    creditScore: { type: Number, min: 300, max: 900 },
    riskLevel: {
      type: String,
      enum: ['low', 'medium', 'high'],
      default: 'medium'
    },
    recommendations: [{ type: String }]
  }
});

const LoanApplicationSchema = new Schema<ILoanApplication>({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  dsaId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  assignedDSAs: [{
    type: Schema.Types.ObjectId,
    ref: 'User',
  }],
  applicationNumber: {
    type: String,
    unique: true,
  },
  personalDetails: {
    type: PersonalDetailsSchema,
    required: true,
  },
  loanDetails: {
    type: LoanDetailsSchema,
    required: true,
  },
  documents: [DocumentSchema],
  status: {
    type: String,
    enum: ['pending', 'under_review', 'approved', 'rejected', 'partially_approved'],
    default: 'pending',
  },
  dsaReviews: [DSAReviewSchema],
  assignedAt: {
    type: Date,
  },
  reviewDeadline: {
    type: Date,
  },
  statusHistory: [StatusHistorySchema],
  finalApprovalThreshold: {
    type: Number,
    default: 2, // Require 2 DSA approvals by default
    min: 1,
    max: 5
  },

  // Payment Information
  paymentStatus: {
    type: String,
    enum: ['pending', 'completed', 'failed', 'refunded'],
    default: 'pending'
  },
  paymentId: {
    type: String,
    sparse: true
  },
  serviceChargesPaid: {
    type: Boolean,
    default: false
  },
  paidAt: {
    type: Date
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
LoanApplicationSchema.index({ userId: 1 });
LoanApplicationSchema.index({ dsaId: 1 });
LoanApplicationSchema.index({ status: 1 });
// applicationNumber already has unique index, no need for explicit index
LoanApplicationSchema.index({ reviewDeadline: 1 });
LoanApplicationSchema.index({ paymentStatus: 1 });
LoanApplicationSchema.index({ paymentId: 1 });
LoanApplicationSchema.index({ createdAt: -1 });

// Pre-save middleware to generate application number
LoanApplicationSchema.pre('save', function(next) {
  if (!this.applicationNumber) {
    this.applicationNumber = this.generateApplicationNumber();
  }
  next();
});

// Method to generate application number
LoanApplicationSchema.methods.generateApplicationNumber = function(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 4).toUpperCase();
  return `LA${year}${month}${timestamp}${random}`;
};

// Method to get approval status
LoanApplicationSchema.methods.getApprovalStatus = function() {
  const approved = this.dsaReviews.filter((review: IDSAReview) => review.status === 'approved').length;
  const rejected = this.dsaReviews.filter((review: IDSAReview) => review.status === 'rejected').length;
  const pending = this.dsaReviews.filter((review: IDSAReview) => review.status === 'pending').length;

  return { approved, rejected, pending };
};

// Method to check if user can select DSA for chat
LoanApplicationSchema.methods.canUserSelectDSA = function() {
  // User can select DSA if at least one DSA has approved or if application is under review
  const { approved } = this.getApprovalStatus();
  return approved > 0 || this.status === 'under_review';
};

// Pre-save middleware to add status history and update overall status
LoanApplicationSchema.pre('save', function(next) {
  if (this.isModified('status')) {
    this.statusHistory.push({
      status: this.status,
      updatedBy: this.dsaId || this.userId,
      updatedAt: new Date(),
    });
  }

  // Auto-update overall status based on DSA reviews
  if (this.isModified('dsaReviews')) {
    const { approved, rejected, pending } = this.getApprovalStatus();
    const totalReviews = this.dsaReviews.length;

    if (approved >= this.finalApprovalThreshold) {
      this.status = 'approved';
    } else if (rejected > 0 && (rejected + approved) === totalReviews) {
      // All DSAs have reviewed and at least one rejected
      this.status = 'rejected';
    } else if (approved > 0 && pending > 0) {
      this.status = 'partially_approved';
    } else if (totalReviews > 0 && pending === totalReviews) {
      this.status = 'under_review';
    }
  }

  next();
});

export default mongoose.models.LoanApplication || mongoose.model<ILoanApplication>('LoanApplication', LoanApplicationSchema);
