import { NextRequest, NextResponse } from 'next/server';
import { logError } from '@/lib/logger';

/**
 * Middleware to handle file upload Content-Type validation
 * This fixes the Next.js 15 Content-Type validation issue
 */
export function validateFileUploadContentType(request: NextRequest): NextResponse | null {
  const contentType = request.headers.get('content-type');
  
  // Check if it's a file upload request
  if (request.url.includes('/api/files/upload') && request.method === 'POST') {
    // Allow multipart/form-data or if no content-type is set (browser will set it)
    if (contentType && !contentType.includes('multipart/form-data')) {
      logError('Invalid Content-Type for file upload', null, { 
        contentType, 
        url: request.url,
        method: request.method 
      });
      
      return NextResponse.json(
        { 
          error: 'Invalid Content-Type. File uploads require multipart/form-data',
          received: contentType 
        },
        { status: 400 }
      );
    }
  }
  
  return null; // Continue with the request
}

/**
 * Helper function to create proper FormData for file uploads
 */
export function createFileUploadFormData(file: File, documentType: string, applicationId?: string): FormData {
  const formData = new FormData();
  formData.append('file', file);
  formData.append('documentType', documentType);
  
  if (applicationId) {
    formData.append('applicationId', applicationId);
  }
  
  return formData;
}

/**
 * Helper function to validate file before upload
 */
export function validateFileForUpload(file: File, allowedTypes: string[], maxSize: number): { valid: boolean; error?: string } {
  // Check file size
  if (file.size > maxSize) {
    return {
      valid: false,
      error: `File size (${(file.size / (1024 * 1024)).toFixed(2)}MB) exceeds maximum allowed size (${(maxSize / (1024 * 1024)).toFixed(2)}MB)`
    };
  }
  
  // Check file type
  const fileExtension = file.name.split('.').pop()?.toLowerCase();
  if (!fileExtension || !allowedTypes.includes(fileExtension)) {
    return {
      valid: false,
      error: `File type '${fileExtension}' is not allowed. Allowed types: ${allowedTypes.join(', ')}`
    };
  }
  
  // Check if file is empty
  if (file.size === 0) {
    return {
      valid: false,
      error: 'File is empty'
    };
  }
  
  return { valid: true };
}

/**
 * Helper function to get file type from MIME type
 */
export function getFileTypeFromMime(mimeType: string): string {
  const mimeToType: Record<string, string> = {
    'image/jpeg': 'jpg',
    'image/jpg': 'jpg',
    'image/png': 'png',
    'image/gif': 'gif',
    'application/pdf': 'pdf',
    'application/msword': 'doc',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document': 'docx',
    'application/vnd.ms-excel': 'xls',
    'application/vnd.openxmlformats-officedocument.spreadsheetml.sheet': 'xlsx',
    'text/plain': 'txt',
    'text/csv': 'csv'
  };
  
  return mimeToType[mimeType] || 'unknown';
}

/**
 * Helper function to format file size
 */
export function formatFileSize(bytes: number): string {
  if (bytes === 0) return '0 Bytes';
  
  const k = 1024;
  const sizes = ['Bytes', 'KB', 'MB', 'GB'];
  const i = Math.floor(Math.log(bytes) / Math.log(k));
  
  return parseFloat((bytes / Math.pow(k, i)).toFixed(2)) + ' ' + sizes[i];
}

/**
 * Helper function to generate unique filename
 */
export function generateUniqueFileName(originalName: string, userId: string): string {
  const timestamp = Date.now();
  const random = Math.random().toString(36).substring(2, 8);
  const extension = originalName.split('.').pop();
  const nameWithoutExt = originalName.replace(/\.[^/.]+$/, '');
  
  return `${nameWithoutExt}_${userId}_${timestamp}_${random}.${extension}`;
}

/**
 * Helper function to sanitize filename
 */
export function sanitizeFileName(fileName: string): string {
  // Remove or replace invalid characters
  return fileName
    .replace(/[^a-zA-Z0-9._-]/g, '_') // Replace invalid chars with underscore
    .replace(/_{2,}/g, '_') // Replace multiple underscores with single
    .replace(/^_+|_+$/g, '') // Remove leading/trailing underscores
    .toLowerCase();
}
