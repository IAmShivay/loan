import mongoose, { Schema, Document } from 'mongoose';

export interface IDSAActivity extends Document {
  dsaId: mongoose.Types.ObjectId;
  activityType: 'login' | 'application_review' | 'application_approve' | 'application_reject';
  applicationId?: mongoose.Types.ObjectId;
  details: Record<string, unknown>;
  timestamp: Date;
}

const DSAActivitySchema = new Schema<IDSAActivity>({
  dsaId: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
  },
  activityType: {
    type: String,
    enum: ['login', 'application_review', 'application_approve', 'application_reject'],
    required: true,
  },
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: 'LoanApplication',
  },
  details: {
    type: Schema.Types.Mixed,
    default: {},
  },
  timestamp: {
    type: Date,
    default: Date.now,
  },
}, {
  timestamps: false, // We're using custom timestamp field
});

// Indexes for better query performance
DSAActivitySchema.index({ dsaId: 1, timestamp: -1 });
DSAActivitySchema.index({ activityType: 1 });
DSAActivitySchema.index({ applicationId: 1 });

export default mongoose.models.DSAActivity || mongoose.model<IDSAActivity>('DSAActivity', DSAActivitySchema);
