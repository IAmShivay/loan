// import { ObjectId } from 'mongoose';

// User Types
export interface User {
  _id: string;
  email: string;
  firstName: string;
  lastName: string;
  phone: string;
  role: 'admin' | 'dsa' | 'user';
  bankName?: string;
  dsaId?: string;
  isActive: boolean;
  isVerified: boolean;
  verifiedBy?: string;
  verifiedAt?: Date;
  profilePicture?: string;
  lastLogin?: Date;
  createdAt: Date;
  updatedAt: Date;

  // DSA-specific fields
  deadlineCompliance?: number; // Percentage of deadlines met
  missedDeadlines?: number; // Number of missed deadlines today
  statistics?: {
    totalApplications?: number;
    approvedApplications?: number;
    rejectedApplications?: number;
    successRate?: number;
    totalLoanAmount?: number;
    averageProcessingTime?: number;
  };
  rating?: number;
  branchCode?: string;
}

// Loan Application Types
export interface PersonalDetails {
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

export interface LoanDetails {
  amount: number;
  purpose: string;
  tenure: number;
  interestRate?: number;
}

export interface Document {
  type: string;
  fileName: string;
  filePath: string;
  uploadedAt: Date;
  status: 'pending' | 'approved' | 'rejected';
  comments?: string;
}

export interface StatusHistory {
  status: string;
  updatedBy: string;
  updatedAt: Date;
  comments?: string;
}

export interface DSAReview {
  dsaId: string;
  dsaName?: string;
  dsaEmail?: string;
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

export interface LoanApplication {
  _id: string;
  applicationId?: string; // For frontend compatibility
  userId: string;
  dsaId?: string; // Primary DSA (backward compatibility)
  assignedDSAs: string[]; // Multiple DSAs can review
  applicationNumber: string;
  personalDetails?: PersonalDetails;
  loanDetails?: LoanDetails;

  // Frontend API compatibility fields
  personalInfo?: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    aadharNumber?: string;
    panNumber?: string;
    address?: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  educationInfo?: {
    instituteName: string;
    course: string;
    duration: string;
    admissionDate: string;
    feeStructure: number;
  };
  loanInfo?: {
    amount: number;
    purpose: string;
    tenure?: number;
  };
  financialInfo?: {
    annualIncome: number;
    employmentType: string;
    employerName: string;
    workExperience: string;
  };

  documents: Document[];
  status: 'pending' | 'under_review' | 'approved' | 'rejected' | 'partially_approved' | 'pending_review';
  priority?: string;
  dsaReviews: DSAReview[];
  assignedAt?: Date;
  reviewDeadline?: Date;
  statusHistory: StatusHistory[];
  finalApprovalThreshold: number;
  paymentStatus?: string;
  serviceChargesPaid?: boolean;
  createdAt: Date;
  updatedAt: Date;
}

// Chat Types
export interface ChatMessage {
  _id: string;
  loanApplicationId: string;
  senderId: string;
  receiverId: string;
  message: string;
  messageType: 'text' | 'file';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

// Support Ticket Types
export interface TicketResponse {
  userId: string;
  message: string;
  isInternal: boolean;
  createdAt: Date;
}

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  userId: string;
  assignedTo?: string;
  subject: string;
  description: string;
  category: 'technical' | 'loan_inquiry' | 'document' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachments: string[];
  responses: TicketResponse[];
  createdAt: Date;
  updatedAt: Date;
}

// DSA Activity Types
export interface DSAActivity {
  _id: string;
  dsaId: string;
  activityType: 'login' | 'application_review' | 'application_approve' | 'application_reject';
  applicationId?: string;
  details: Record<string, unknown>;
  timestamp: Date;
}

// System Log Types
export interface SystemLog {
  _id: string;
  level: string;
  message: string;
  userId?: string;
  action?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

// API Response Types
export interface ApiResponse<T = unknown> {
  success: boolean;
  data?: T;
  message?: string;
  error?: string;
}

// Form Types
export interface LoginForm {
  email: string;
  password: string;
}

export interface RegisterForm {
  email: string;
  password: string;
  confirmPassword: string;
  firstName: string;
  lastName: string;
  phone: string;
  role?: 'user' | 'dsa';
  bankName?: string;
}

// Dashboard Stats Types
export interface DashboardStats {
  totalUsers: number;
  totalApplications: number;
  pendingApplications: number;
  approvedApplications: number;
  rejectedApplications: number;
  activeDSAs: number;
  totalTickets: number;
  openTickets: number;
}

// Bank Types
export type BankName = 'SBI' | 'HDFC' | 'ICICI' | 'AXIS' | 'KOTAK';

export const BANKS: { value: BankName; label: string }[] = [
  { value: 'SBI', label: 'State Bank of India' },
  { value: 'HDFC', label: 'HDFC Bank' },
  { value: 'ICICI', label: 'ICICI Bank' },
  { value: 'AXIS', label: 'Axis Bank' },
  { value: 'KOTAK', label: 'Kotak Mahindra Bank' },
];
