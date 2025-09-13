import mongoose, { Schema, Document } from 'mongoose';

export interface ITicketResponse {
  userId: mongoose.Types.ObjectId;
  message: string;
  isInternal: boolean;
  attachments?: string[];
  createdAt: Date;
}

export interface ISupportTicket extends Document {
  ticketNumber: string;
  userId: mongoose.Types.ObjectId;
  assignedTo?: mongoose.Types.ObjectId;
  subject: string;
  description: string;
  category: 'technical' | 'loan_inquiry' | 'document' | 'general';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  attachments: string[];
  responses: ITicketResponse[];
  isDeleted: boolean;
  createdAt: Date;
  updatedAt: Date;
  generateTicketNumber(): string;
}

const TicketResponseSchema = new Schema({
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: [2000, 'Response message cannot exceed 2000 characters'],
  },
  isInternal: {
    type: Boolean,
    default: false,
  },
  attachments: [{
    type: String,
  }],
  createdAt: {
    type: Date,
    default: Date.now,
  },
});

const SupportTicketSchema = new Schema<ISupportTicket>({
  ticketNumber: {
    type: String,
    unique: true,
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  assignedTo: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  subject: {
    type: String,
    required: [true, 'Subject is required'],
    maxlength: [200, 'Subject cannot exceed 200 characters'],
  },
  description: {
    type: String,
    required: [true, 'Description is required'],
    maxlength: [2000, 'Description cannot exceed 2000 characters'],
  },
  category: {
    type: String,
    enum: ['technical', 'loan_inquiry', 'document', 'general'],
    required: true,
  },
  priority: {
    type: String,
    enum: ['low', 'medium', 'high', 'urgent'],
    default: 'medium',
  },
  status: {
    type: String,
    enum: ['open', 'in_progress', 'resolved', 'closed'],
    default: 'open',
  },
  attachments: [{
    type: String,
  }],
  responses: [TicketResponseSchema],
  isDeleted: {
    type: Boolean,
    default: false,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
SupportTicketSchema.index({ userId: 1 });
SupportTicketSchema.index({ assignedTo: 1 });
SupportTicketSchema.index({ status: 1 });
// ticketNumber already has unique index, no need for explicit index
SupportTicketSchema.index({ priority: 1 });
SupportTicketSchema.index({ category: 1 });
SupportTicketSchema.index({ createdAt: -1 });

// Pre-save middleware to generate ticket number
SupportTicketSchema.pre('save', function(next) {
  if (!this.ticketNumber) {
    this.ticketNumber = this.generateTicketNumber();
  }
  next();
});

// Method to generate ticket number
SupportTicketSchema.methods.generateTicketNumber = function(): string {
  const year = new Date().getFullYear();
  const month = String(new Date().getMonth() + 1).padStart(2, '0');
  const day = String(new Date().getDate()).padStart(2, '0');
  const timestamp = Date.now().toString().slice(-4);
  return `TK${year}${month}${day}${timestamp}`;
};

export default mongoose.models.SupportTicket || mongoose.model<ISupportTicket>('SupportTicket', SupportTicketSchema);
