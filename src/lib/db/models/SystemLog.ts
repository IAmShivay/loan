import mongoose, { Schema, Document } from 'mongoose';

export interface ISystemLog extends Document {
  level: string;
  message: string;
  userId?: mongoose.Types.ObjectId;
  action?: string;
  ip?: string;
  userAgent?: string;
  timestamp: Date;
}

const SystemLogSchema = new Schema<ISystemLog>({
  level: {
    type: String,
    required: true,
    enum: ['error', 'warn', 'info', 'debug'],
  },
  message: {
    type: String,
    required: true,
    maxlength: [1000, 'Log message cannot exceed 1000 characters'],
  },
  userId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
  },
  action: {
    type: String,
    maxlength: [100, 'Action cannot exceed 100 characters'],
  },
  ip: {
    type: String,
    match: [/^(?:[0-9]{1,3}\.){3}[0-9]{1,3}$/, 'Please enter a valid IP address'],
  },
  userAgent: {
    type: String,
    maxlength: [500, 'User agent cannot exceed 500 characters'],
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false, // We're using custom timestamp field
});

// Indexes for better query performance
SystemLogSchema.index({ level: 1, timestamp: -1 });
SystemLogSchema.index({ userId: 1, timestamp: -1 });
// timestamp already covered by compound indexes above

// TTL index to automatically delete logs older than 90 days
SystemLogSchema.index({ timestamp: 1 }, { expireAfterSeconds: 7776000 }); // 90 days

export default mongoose.models.SystemLog || mongoose.model<ISystemLog>('SystemLog', SystemLogSchema);
