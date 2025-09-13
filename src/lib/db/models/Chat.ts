import mongoose, { Document, Schema } from 'mongoose';

export interface IChatMessage {
  _id: mongoose.Types.ObjectId;
  senderId: mongoose.Types.ObjectId;
  senderName: string;
  senderRole: string;
  message: string;
  messageType: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  timestamp: Date;
  read: boolean;
  readBy: Array<{
    userId: mongoose.Types.ObjectId;
    readAt: Date;
  }>;
}

export interface IChat extends Document {
  applicationId: mongoose.Types.ObjectId;
  participants: Array<{
    userId: mongoose.Types.ObjectId;
    name: string;
    role: string;
    joinedAt: Date;
    leftAt?: Date;
  }>;
  messages: IChatMessage[];
  lastMessage?: IChatMessage;
  isActive: boolean;
  createdBy: mongoose.Types.ObjectId;
  createdAt: Date;
  updatedAt: Date;
}

const ChatMessageSchema = new Schema<IChatMessage>({
  senderId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  senderName: {
    type: String,
    required: true,
    trim: true,
  },
  senderRole: {
    type: String,
    required: true,
    enum: ['admin', 'dsa', 'user'],
  },
  message: {
    type: String,
    required: true,
    trim: true,
    maxlength: 2000,
  },
  messageType: {
    type: String,
    enum: ['text', 'file', 'image'],
    default: 'text',
  },
  fileUrl: {
    type: String,
    trim: true,
  },
  fileName: {
    type: String,
    trim: true,
  },
  timestamp: {
    type: Date,
    default: Date.now,
    index: true,
  },
  read: {
    type: Boolean,
    default: false,
    index: true,
  },
  readBy: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    readAt: {
      type: Date,
      default: Date.now,
    }
  }],
}, {
  _id: true,
  timestamps: false,
});

const ChatSchema = new Schema<IChat>({
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: 'LoanApplication',
    required: true,
    index: true,
  },
  participants: [{
    userId: {
      type: Schema.Types.ObjectId,
      ref: 'User',
      required: true,
    },
    name: {
      type: String,
      required: true,
      trim: true,
    },
    role: {
      type: String,
      required: true,
      enum: ['admin', 'dsa', 'user'],
    },
    joinedAt: {
      type: Date,
      default: Date.now,
    },
    leftAt: {
      type: Date,
    }
  }],
  messages: [ChatMessageSchema],
  lastMessage: ChatMessageSchema,
  isActive: {
    type: Boolean,
    default: true,
    index: true,
  },
  createdBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
ChatSchema.index({ applicationId: 1, isActive: 1 });
ChatSchema.index({ 'participants.userId': 1, isActive: 1 });
ChatSchema.index({ updatedAt: -1 });
ChatSchema.index({ 'messages.timestamp': -1 });
ChatSchema.index({ 'messages.read': 1, 'messages.senderId': 1 });

// Virtual for unread message count
ChatSchema.virtual('unreadCount').get(function() {
  return this.messages.filter((msg: IChatMessage) => !msg.read).length;
});

// Method to add a message
ChatSchema.methods.addMessage = function(messageData: Partial<IChatMessage>) {
  const message = {
    _id: new mongoose.Types.ObjectId(),
    senderId: messageData.senderId,
    senderName: messageData.senderName,
    senderRole: messageData.senderRole,
    message: messageData.message,
    messageType: messageData.messageType || 'text',
    fileUrl: messageData.fileUrl,
    fileName: messageData.fileName,
    timestamp: new Date(),
    read: false,
    readBy: [],
  };

  this.messages.push(message);
  this.lastMessage = message;
  this.updatedAt = new Date();
  
  return this.save();
};

// Method to mark messages as read
ChatSchema.methods.markMessagesAsRead = function(userId: string) {
  let hasUnreadMessages = false;
  
  this.messages.forEach((message: IChatMessage) => {
    if (message.senderId.toString() !== userId && !message.read) {
      message.read = true;
      message.readBy.push({
        userId: new mongoose.Types.ObjectId(userId),
        readAt: new Date(),
      });
      hasUnreadMessages = true;
    }
  });

  if (hasUnreadMessages) {
    this.updatedAt = new Date();
    return this.save();
  }
  
  return Promise.resolve(this);
};

// Method to get messages with pagination
ChatSchema.methods.getMessages = function(page = 1, limit = 50) {
  const startIndex = (page - 1) * limit;
  const endIndex = startIndex + limit;
  
  return {
    messages: this.messages
      .sort((a: IChatMessage, b: IChatMessage) => b.timestamp.getTime() - a.timestamp.getTime())
      .slice(startIndex, endIndex),
    totalMessages: this.messages.length,
    currentPage: page,
    totalPages: Math.ceil(this.messages.length / limit),
    hasNextPage: endIndex < this.messages.length,
    hasPrevPage: page > 1,
  };
};

// Static method to find chats by user
ChatSchema.statics.findByUser = function(userId: string) {
  return this.find({
    'participants.userId': userId,
    isActive: true
  }).populate('applicationId', 'personalInfo.firstName personalInfo.lastName loanInfo.amount status')
    .populate('participants.userId', 'firstName lastName email role')
    .sort({ updatedAt: -1 });
};

// Static method to find chat by application and participants
ChatSchema.statics.findByApplicationAndParticipants = function(applicationId: string, participantIds: string[]) {
  return this.findOne({
    applicationId,
    'participants.userId': { $all: participantIds },
    isActive: true
  });
};

// Pre-save middleware to update lastMessage
ChatSchema.pre('save', function(next) {
  if (this.messages && this.messages.length > 0) {
    // Sort messages by timestamp and get the latest one
    const sortedMessages = this.messages.sort((a, b) => 
      b.timestamp.getTime() - a.timestamp.getTime()
    );
    this.lastMessage = sortedMessages[0];
  }
  next();
});

// Ensure virtual fields are serialized
ChatSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete (ret as any).__v;
    return ret;
  }
});

const Chat = mongoose.models.Chat || mongoose.model<IChat>('Chat', ChatSchema);

export default Chat;
