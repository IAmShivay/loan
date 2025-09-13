import mongoose, { Document, Schema } from 'mongoose';

export interface IFileUpload extends Document {
  originalName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: mongoose.Types.ObjectId;
  uploadedAt: Date;
  documentType?: string;
  applicationId?: mongoose.Types.ObjectId;
  cloudinaryPublicId: string;
  isDeleted: boolean;
  deletedAt?: Date;
  mimeType?: string;
  status?: string;
  createdAt: Date;
  updatedAt: Date;
  softDelete(): Promise<void>;
}

export interface IFileUploadModel extends mongoose.Model<IFileUpload> {
  findActive(query?: any): Promise<IFileUpload[]>;
  findByApplication(applicationId: string): Promise<IFileUpload[]>;
  findByUser(userId: string): Promise<IFileUpload[]>;
}

const FileUploadSchema = new Schema<IFileUpload>({
  originalName: {
    type: String,
    required: true,
    trim: true,
  },
  fileName: {
    type: String,
    required: true,
    trim: true,
  },
  fileUrl: {
    type: String,
    required: true,
    trim: true,
  },
  fileType: {
    type: String,
    required: true,
    trim: true,
  },
  fileSize: {
    type: Number,
    required: true,
    min: 0,
  },
  uploadedBy: {
    type: Schema.Types.ObjectId,
    ref: 'User',
    required: true,
    index: true,
  },
  uploadedAt: {
    type: Date,
    default: Date.now,
    index: true,
  },
  documentType: {
    type: String,
    enum: [
      'profile_picture',
      'aadhar_card',
      'pan_card',
      'income_certificate',
      'bank_statement',
      'admission_letter',
      'fee_structure',
      'chat_files',
      'other'
    ],
    index: true,
  },
  applicationId: {
    type: Schema.Types.ObjectId,
    ref: 'LoanApplication',
    index: true,
  },
  cloudinaryPublicId: {
    type: String,
    required: true,
    unique: true,
  },
  isDeleted: {
    type: Boolean,
    default: false,
    index: true,
  },
  deletedAt: {
    type: Date,
  },
  mimeType: {
    type: String,
    trim: true,
  },
  status: {
    type: String,
    enum: ['uploaded', 'processing', 'approved', 'rejected'],
    default: 'uploaded',
  },
}, {
  timestamps: true,
});

// Indexes for better query performance
// Individual fields already have indexes, only add compound indexes that provide additional value
FileUploadSchema.index({ uploadedBy: 1, documentType: 1 });
FileUploadSchema.index({ applicationId: 1, documentType: 1 });
// uploadedAt and isDeleted already have individual indexes

// Virtual for file size in human readable format
FileUploadSchema.virtual('fileSizeFormatted').get(function() {
  const bytes = this.fileSize;
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
});

// Method to soft delete file
FileUploadSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Static method to find active files
FileUploadSchema.statics.findActive = function(query = {}) {
  return this.find({ ...query, isDeleted: false });
};

// Static method to find files by application
FileUploadSchema.statics.findByApplication = function(applicationId: string) {
  return this.find({ applicationId, isDeleted: false });
};

// Static method to find files by user
FileUploadSchema.statics.findByUser = function(userId: string) {
  return this.find({ uploadedBy: userId, isDeleted: false });
};

// Static method to find files by document type
FileUploadSchema.statics.findByDocumentType = function(documentType: string) {
  return this.find({ documentType, isDeleted: false });
};

// Instance method for soft delete
FileUploadSchema.methods.softDelete = function() {
  this.isDeleted = true;
  this.deletedAt = new Date();
  return this.save();
};

// Pre-save middleware to update timestamps
FileUploadSchema.pre('save', function(next) {
  if (this.isModified('isDeleted') && this.isDeleted && !this.deletedAt) {
    this.deletedAt = new Date();
  }
  next();
});

// Ensure virtual fields are serialized
FileUploadSchema.set('toJSON', {
  virtuals: true,
  transform: function(doc, ret) {
    delete (ret as any).__v;
    return ret;
  }
});

const FileUpload = (mongoose.models.FileUpload || mongoose.model<IFileUpload, IFileUploadModel>('FileUpload', FileUploadSchema)) as IFileUploadModel;

export default FileUpload;
