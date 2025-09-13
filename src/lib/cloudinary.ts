import { v2 as cloudinary } from 'cloudinary';

// Configure Cloudinary
cloudinary.config({
  cloud_name: 'dyiso4ohk',
  api_key: '629196268468662',
  api_secret: 'DWtBLCiYmHRthGaioqZ-4y8Lsew',
  secure: true,
});

export interface CloudinaryUploadResult {
  public_id: string;
  secure_url: string;
  original_filename: string;
  format: string;
  resource_type: string;
  bytes: number;
  created_at: string;
}

export interface UploadOptions {
  folder?: string;
  resource_type?: 'image' | 'video' | 'raw' | 'auto';
  allowed_formats?: string[];
  max_file_size?: number;
  transformation?: any[];
}

/**
 * Upload file to Cloudinary
 */
export async function uploadToCloudinary(
  file: Buffer | string,
  options: UploadOptions = {}
): Promise<CloudinaryUploadResult> {
  const {
    folder = 'loan-documents',
    resource_type = 'auto',
    allowed_formats = ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    max_file_size = 10 * 1024 * 1024, // 10MB
    transformation = []
  } = options;

  try {
    // Convert buffer to base64 data URL if it's a buffer
    let fileToUpload: string;

    if (Buffer.isBuffer(file)) {
      // For auto resource type, let Cloudinary detect the file type
      fileToUpload = `data:application/octet-stream;base64,${file.toString('base64')}`;
    } else {
      fileToUpload = file;
    }

    const result = await cloudinary.uploader.upload(fileToUpload, {
      folder,
      resource_type,
      allowed_formats,
      max_bytes: max_file_size,
      transformation,
      use_filename: true,
      unique_filename: true,
    });

    return {
      public_id: result.public_id,
      secure_url: result.secure_url,
      original_filename: result.original_filename || 'unknown',
      format: result.format,
      resource_type: result.resource_type,
      bytes: result.bytes,
      created_at: result.created_at,
    };
  } catch (error) {
    console.error('Cloudinary upload error:', error);
    throw new Error('Failed to upload file to Cloudinary');
  }
}

/**
 * Delete file from Cloudinary
 */
export async function deleteFromCloudinary(publicId: string): Promise<boolean> {
  try {
    const result = await cloudinary.uploader.destroy(publicId);
    return result.result === 'ok';
  } catch (error) {
    console.error('Cloudinary delete error:', error);
    return false;
  }
}

/**
 * Get optimized URL for image
 */
export function getOptimizedImageUrl(
  publicId: string,
  options: {
    width?: number;
    height?: number;
    quality?: string;
    format?: string;
  } = {}
): string {
  const { width, height, quality = 'auto', format = 'auto' } = options;
  
  return cloudinary.url(publicId, {
    width,
    height,
    quality,
    format,
    fetch_format: 'auto',
    crop: 'fill',
    gravity: 'auto',
  });
}

/**
 * Generate signed upload URL for client-side uploads
 */
export function generateSignedUploadUrl(options: {
  folder?: string;
  allowed_formats?: string[];
  max_file_size?: number;
}): { url: string; signature: string; timestamp: number; api_key: string } {
  const timestamp = Math.round(new Date().getTime() / 1000);
  const params = {
    timestamp,
    folder: options.folder || 'loan-documents',
    allowed_formats: options.allowed_formats?.join(',') || 'jpg,jpeg,png,pdf,doc,docx',
    max_bytes: options.max_file_size || 10 * 1024 * 1024,
  };

  const signature = cloudinary.utils.api_sign_request(params, process.env.CLOUDINARY_API_SECRET!);

  return {
    url: `https://api.cloudinary.com/v1_1/${process.env.CLOUDINARY_CLOUD_NAME}/upload`,
    signature,
    timestamp,
    api_key: process.env.CLOUDINARY_API_KEY!,
  };
}

/**
 * Document type configurations
 */
export const DOCUMENT_CONFIGS = {
  profile_picture: {
    folder: 'loan-app/profiles',
    allowed_formats: ['jpg', 'jpeg', 'png'],
    max_file_size: 5 * 1024 * 1024, // 5MB
    transformation: [
      { width: 400, height: 400, crop: 'fill', gravity: 'face' },
      { quality: 'auto', format: 'auto' }
    ]
  },
  aadhar_card: {
    folder: 'loan-app/documents/aadhar',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    max_file_size: 10 * 1024 * 1024, // 10MB
  },
  pan_card: {
    folder: 'loan-app/documents/pan',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    max_file_size: 10 * 1024 * 1024,
  },
  income_certificate: {
    folder: 'loan-app/documents/income',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    max_file_size: 10 * 1024 * 1024,
  },
  bank_statement: {
    folder: 'loan-app/documents/bank',
    allowed_formats: ['pdf'],
    max_file_size: 20 * 1024 * 1024, // 20MB
  },
  admission_letter: {
    folder: 'loan-app/documents/admission',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    max_file_size: 10 * 1024 * 1024,
  },
  fee_structure: {
    folder: 'loan-app/documents/fees',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf'],
    max_file_size: 10 * 1024 * 1024,
  },
  chat_files: {
    folder: 'loan-app/chat',
    allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
    max_file_size: 15 * 1024 * 1024, // 15MB
  }
};

export default cloudinary;
