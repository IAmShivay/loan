import mongoose, { Schema, Document } from 'mongoose';

export interface IChatMessage extends Document {
  loanApplicationId: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  receiverId: mongoose.Types.ObjectId;
  message: string;
  messageType: 'text' | 'file';
  fileUrl?: string;
  fileName?: string;
  isRead: boolean;
  readAt?: Date;
  createdAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  loanApplicationId: {
    type: Schema.Types.ObjectId,
    ref: 'LoanApplication',
    required: true,
  },
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  receiverId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  message: {
    type: String,
    required: true,
    maxlength: [1000, 'Message cannot exceed 1000 characters'],
  },
  messageType: {
    type: String,
    enum: ['text', 'file'],
    default: 'text',
  },
  fileUrl: {
    type: String,
    required: function(this: IChatMessage) {
      return this.messageType === 'file';
    },
  },
  fileName: {
    type: String,
    required: function(this: IChatMessage) {
      return this.messageType === 'file';
    },
  },
  isRead: {
    type: Boolean,
    default: false,
  },
  readAt: {
    type: Date,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ChatMessageSchema.index({ loanApplicationId: 1, createdAt: -1 });
ChatMessageSchema.index({ senderId: 1 });
ChatMessageSchema.index({ receiverId: 1 });
ChatMessageSchema.index({ isRead: 1 });

// Pre-save middleware to set readAt when isRead is true
ChatMessageSchema.pre('save', function(next) {
  if (this.isModified('isRead') && this.isRead && !this.readAt) {
    this.readAt = new Date();
  }
  next();
});

export default mongoose.models.ChatMessage || mongoose.model<IChatMessage>('ChatMessage', ChatMessageSchema);
