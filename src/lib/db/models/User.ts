import mongoose, { Schema, Document } from 'mongoose';
import bcrypt from 'bcryptjs';

export interface IUser extends Document {
  email: string;
  password: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'dsa' | 'user';
  bankName?: string;
  dsaId?: string;
  isActive: boolean;
  isVerified: boolean;
  verifiedBy?: mongoose.Types.ObjectId;
  verifiedAt?: Date;
  profilePicture?: string;
  lastLogin?: Date;

  // Personal Information
  dateOfBirth?: Date;
  address?: string;
  aadharNumber?: string;
  panNumber?: string;

  // Education Information
  currentInstitution?: string;
  course?: string;
  duration?: string;
  feeStructure?: number;
  admissionDate?: Date;

  // Financial Information
  annualIncome?: number;
  employmentType?: string;
  employerName?: string;
  workExperience?: string;

  // Documents
  documents?: Array<{
    type: 'Aadhar' | 'PAN' | 'Income Certificate' | 'Bank Statement' | 'Education Certificate' | 'Other';
    fileName: string;
    filePath: string;
    uploadedAt: Date;
  }>;

  createdAt: Date;
  updatedAt: Date;
  comparePassword(candidatePassword: string): Promise<boolean>;
  generateDSAId(): string;
}

const UserSchema = new Schema<IUser>({
  email: {
    type: String,
    required: [true, 'Email is required'],
    lowercase: true,
    trim: true,
    match: [/^\w+([.-]?\w+)*@\w+([.-]?\w+)*(\.\w{2,3})+$/, 'Please enter a valid email'],
  },
  password: {
    type: String,
    required: [true, 'Password is required'],
    minlength: [8, 'Password must be at least 8 characters long'],
  },
  firstName: {
    type: String,
    required: [true, 'First name is required'],
    trim: true,
    maxlength: [50, 'First name cannot exceed 50 characters'],
  },
  lastName: {
    type: String,
    required: [true, 'Last name is required'],
    trim: true,
    maxlength: [50, 'Last name cannot exceed 50 characters'],
  },
  phone: {
    type: String,
    required: [true, 'Phone number is required'],
    match: [/^[0-9]{10}$/, 'Please enter a valid 10-digit phone number'],
  },
  role: {
    type: String,
    enum: ['admin', 'dsa', 'user'],
    default: 'user',
  },
  bankName: {
    type: String,
    enum: ['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK'],
    required: function(this: IUser) {
      return this.role === 'dsa';
    },
  },
  dsaId: {
    type: String,
    sparse: true, // Allows multiple null values
  },
  isActive: {
    type: Boolean,
    default: true,
  },
  isVerified: {
    type: Boolean,
    default: function(this: IUser) {
      return this.role !== 'dsa'; // DSAs need manual verification
    },
  },
  verifiedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  verifiedAt: {
    type: Date,
  },
  profilePicture: {
    type: String,
  },
  lastLogin: {
    type: Date,
  },

  // Personal Information
  dateOfBirth: {
    type: Date,
  },
  address: {
    type: String,
  },
  aadharNumber: {
    type: String,
  },
  panNumber: {
    type: String,
  },

  // Education Information
  currentInstitution: {
    type: String,
  },
  course: {
    type: String,
  },
  duration: {
    type: String,
  },
  feeStructure: {
    type: Number,
    default: 0,
  },
  admissionDate: {
    type: Date,
  },

  // Financial Information
  annualIncome: {
    type: Number,
    default: 0,
  },
  employmentType: {
    type: String,
  },
  employerName: {
    type: String,
  },
  workExperience: {
    type: String,
  },

  // Documents
  documents: [{
    type: {
      type: String,
      enum: ['Aadhar', 'PAN', 'Income Certificate', 'Bank Statement', 'Education Certificate', 'Other']
    },
    fileName: String,
    filePath: String,
    uploadedAt: {
      type: Date,
      default: Date.now
    }
  }],
}, {
  timestamps: true,
});

// Indexes for better query performance
UserSchema.index({ email: 1 });
UserSchema.index({ dsaId: 1 });
UserSchema.index({ role: 1 });
UserSchema.index({ bankName: 1 });
UserSchema.index({ isActive: 1, isVerified: 1 });

// Pre-save middleware to hash password
UserSchema.pre('save', async function(next) {
  if (!this.isModified('password')) return next();
  
  try {
    const salt = await bcrypt.genSalt(12);
    this.password = await bcrypt.hash(this.password, salt);
    next();
  } catch (error) {
    next(error as Error);
  }
});

// Pre-save middleware to generate DSA ID
UserSchema.pre('save', function(next) {
  if (this.role === 'dsa' && !this.dsaId) {
    this.dsaId = this.generateDSAId();
  }
  next();
});

// Method to compare password
UserSchema.methods.comparePassword = async function(candidatePassword: string): Promise<boolean> {
  return bcrypt.compare(candidatePassword, this.password);
};

// Method to generate DSA ID
UserSchema.methods.generateDSAId = function(): string {
  const bankCode = this.bankName?.substring(0, 3).toUpperCase() || 'DSA';
  const timestamp = Date.now().toString().slice(-6);
  const random = Math.random().toString(36).substring(2, 5).toUpperCase();
  return `${bankCode}${timestamp}${random}`;
};

// Virtual for full name
UserSchema.virtual('fullName').get(function() {
  return `${this.firstName} ${this.lastName}`;
});

// Ensure virtual fields are serialized
UserSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    const obj = ret.toObject ? ret.toObject() : ret;
    delete obj.password;
    return obj;
  },
});

export default mongoose.models.User || mongoose.model<IUser>('User', UserSchema);
