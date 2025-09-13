import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import { uploadToCloudinary, DOCUMENT_CONFIGS } from '@/lib/cloudinary';
import FileUpload from '@/lib/db/models/FileUpload';
import { logApiRequest, logApiResponse, logError, logFileOperation, logInfo } from '@/lib/logger';

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

    // Get document configuration
    const config = DOCUMENT_CONFIGS[documentType as keyof typeof DOCUMENT_CONFIGS];
    if (!config) {
      const duration = Date.now() - startTime;
      logError('Invalid document type provided', null, { documentType, userId: session.user.id });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({ error: 'Invalid document type' }, { status: 400 });
    }

    // Validate file size
    if (file.size > config.max_file_size) {
      const duration = Date.now() - startTime;
      logError('File size exceeds limit', null, {
        fileSize: file.size,
        maxSize: config.max_file_size,
        fileName: file.name,
        userId: session.user.id
      });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({
        error: `File size exceeds limit of ${config.max_file_size / (1024 * 1024)}MB`
      }, { status: 400 });
    }

    // Validate file format
    const fileExtension = file.name.split('.').pop()?.toLowerCase();
    if (!fileExtension || !config.allowed_formats.includes(fileExtension)) {
      const duration = Date.now() - startTime;
      logError('Invalid file format', null, {
        fileName: file.name,
        fileExtension,
        allowedFormats: config.allowed_formats,
        userId: session.user.id
      });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({
        error: `Invalid file format. Allowed formats: ${config.allowed_formats.join(', ')}`
      }, { status: 400 });
    }

    // Convert file to buffer
    const bytes = await file.arrayBuffer();
    const buffer = Buffer.from(bytes);

    // Upload to Cloudinary
    const uploadResult = await uploadToCloudinary(buffer, {
      folder: config.folder,
      allowed_formats: config.allowed_formats,
      max_file_size: config.max_file_size,
      transformation: ((config as Record<string, unknown>).transformation as unknown[]) || [],
    });

    logFileOperation('upload', file.name, true, file.size, {
      documentType,
      applicationId,
      cloudinaryPublicId: uploadResult.public_id,
      userId: session.user.id
    });

    // Save file record to database
    const fileRecord = new FileUpload({
      originalName: file.name,
      fileName: uploadResult.public_id,
      fileUrl: uploadResult.secure_url,
      fileType: uploadResult.format,
      fileSize: uploadResult.bytes,
      uploadedBy: session.user.id,
      documentType,
      applicationId: applicationId || undefined,
      cloudinaryPublicId: uploadResult.public_id,
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
