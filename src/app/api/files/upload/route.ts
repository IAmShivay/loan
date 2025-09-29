import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import { uploadToMinio } from '@/lib/minio';
import FileUpload from '@/lib/db/models/FileUpload';
import { logApiRequest, logApiResponse, logError, logFileOperation, logInfo } from '@/lib/logger';

// Document configuration for validation
const DOCUMENT_CONFIGS = {
  maxSize: 10 * 1024 * 1024, // 10MB
  allowedTypes: [
    'application/pdf',
    'image/jpeg',
    'image/jpg',
    'image/png',
    'image/webp',
    'application/msword',
    'application/vnd.openxmlformats-officedocument.wordprocessingml.document'
  ]
};

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const url = request.url;
  const method = request.method;

  try {
    logApiRequest(method, url);

    const session = await getServerSession(authOptions);
    if (!session?.user) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 401, duration);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Log Content-Type for debugging
    const contentType = request.headers.get('content-type');
    logInfo('File upload request received', { contentType, userId: session.user.id });

    let formData: FormData;
    let file: File;
    let documentType: string;
    let applicationId: string;

    try {
      // Parse form data with error handling
      formData = await request.formData();
      file = formData.get('file') as File;
      documentType = formData.get('documentType') as string;
      applicationId = formData.get('applicationId') as string;

      logInfo('FormData parsed successfully', {
        hasFile: !!file,
        fileName: file?.name,
        fileSize: file?.size,
        documentType,
        applicationId,
        userId: session.user.id
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logError('Failed to parse FormData', error, { contentType, userId: session.user.id });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({
        error: 'Invalid form data. Please ensure you are sending multipart/form-data'
      }, { status: 400 });
    }

    if (!file) {
      const duration = Date.now() - startTime;
      logError('No file provided in upload request', null, { userId: session.user.id });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({ error: 'No file provided' }, { status: 400 });
    }

    if (!documentType) {
      const duration = Date.now() - startTime;
      logError('Document type not provided in upload request', null, { userId: session.user.id });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({ error: 'Document type is required' }, { status: 400 });
    }

    // Validate file size
    if (file.size > DOCUMENT_CONFIGS.maxSize) {
      const duration = Date.now() - startTime;
      logError('File size exceeds limit', null, {
        fileSize: file.size,
        maxSize: DOCUMENT_CONFIGS.maxSize,
        fileName: file.name,
        userId: session.user.id
      });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({
        error: `File size exceeds limit of ${DOCUMENT_CONFIGS.maxSize / (1024 * 1024)}MB`
      }, { status: 400 });
    }

    // Validate file type
    if (!DOCUMENT_CONFIGS.allowedTypes.includes(file.type)) {
      const duration = Date.now() - startTime;
      logError('Invalid file type', null, {
        fileName: file.name,
        fileType: file.type,
        allowedTypes: DOCUMENT_CONFIGS.allowedTypes,
        userId: session.user.id
      });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({
        error: `Invalid file type. Allowed types: ${DOCUMENT_CONFIGS.allowedTypes.join(', ')}`
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to MinIO
    const uploadResult = await uploadToMinio({
      fileName: file.name,
      fileBuffer: buffer,
      contentType: file.type,
      metadata: {
        documentType,
        applicationId: applicationId || '',
        uploadedBy: session.user.id,
        originalName: file.name
      }
    });

    logFileOperation('upload', file.name, true, file.size, {
      documentType,
      applicationId,
      minioFileName: uploadResult.fileName,
      userId: session.user.id
    });

    // Save file record to database
    const fileRecord = new FileUpload({
      originalName: file.name,
      fileName: uploadResult.fileName,
      fileUrl: uploadResult.fileUrl,
      fileType: file.type,
      fileSize: file.size,
      mimeType: file.type,
      uploadedBy: session.user.id,
      documentType,
      applicationId: applicationId || undefined,
    });

    await fileRecord.save();

    const duration = Date.now() - startTime;
    logApiResponse(method, url, 200, duration, session.user.id, {
      fileName: file.name,
      fileSize: file.size,
      documentType
    });

    return NextResponse.json({
      success: true,
      file: {
        _id: fileRecord._id,
        originalName: fileRecord.originalName,
        fileName: fileRecord.fileName,
        fileUrl: fileRecord.fileUrl,
        fileType: fileRecord.fileType,
        fileSize: fileRecord.fileSize,
        uploadedBy: fileRecord.uploadedBy,
        uploadedAt: fileRecord.uploadedAt,
        documentType: fileRecord.documentType,
        applicationId: fileRecord.applicationId,
      }
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logError('File upload failed', error, { url, method });
    logFileOperation('upload', 'unknown', false, 0, { error: error instanceof Error ? error.message : 'Unknown error' });
    logApiResponse(method, url, 500, duration);

    return NextResponse.json(
      { error: 'Failed to upload file' },
      { status: 500 }
    );
  }
}

export async function GET(request: NextRequest) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const applicationId = searchParams.get('applicationId');
    const documentType = searchParams.get('documentType');
    const userId = searchParams.get('userId');

    // Build query
    const query: Record<string, string> = {};
    
    if (applicationId) {
      query.applicationId = applicationId;
    }
    
    if (documentType) {
      query.documentType = documentType;
    }
    
    if (userId) {
      query.uploadedBy = userId;
    } else if (session.user.role === 'user') {
      // Users can only see their own files
      query.uploadedBy = session.user.id;
    }

    const files = await FileUpload.find(query)
      .sort({ uploadedAt: -1 })
      .populate('uploadedBy', 'firstName lastName email')
      .lean();

    return NextResponse.json({
      success: true,
      files
    });

  } catch (error) {
    console.error('Get files error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch files' },
      { status: 500 }
    );
  }
}
