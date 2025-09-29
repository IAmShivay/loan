import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import { deleteFromMinio, getDownloadUrl } from '@/lib/minio';
import FileUpload from '@/lib/db/models/FileUpload';
import { logApiRequest, logApiResponse, logError, logFileOperation } from '@/lib/logger';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
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

    const { fileId } = await params;

    // Find the file
    const file = await FileUpload.findById(fileId);
    if (!file) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 404, duration, session.user.id);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has permission to delete this file
    if (session.user.role === 'user' && file.uploadedBy.toString() !== session.user.id) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 403, duration, session.user.id);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from MinIO
    try {
      await deleteFromMinio(file.fileName);
      logFileOperation('delete', file.fileName, true, file.fileSize, {
        fileId: file._id,
        userId: session.user.id
      });
    } catch (minioError) {
      logError('MinIO deletion error', minioError, { fileName: file.fileName, fileId: file._id });
      // Continue with database deletion even if MinIO fails
    }

    // Delete from database
    await file.deleteOne();

    const duration = Date.now() - startTime;
    logApiResponse(method, url, 200, duration, session.user.id);

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logError('File deletion failed', error, { url, method });
    logApiResponse(method, url, 500, duration);
    return NextResponse.json(
      { error: 'Failed to delete file' },
      { status: 500 }
    );
  }
}

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
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

    const { fileId } = await params;
    const searchParams = new URL(request.url).searchParams;
    const download = searchParams.get('download') === 'true';

    // Find the file
    const file = await FileUpload.findById(fileId)
      .populate('uploadedBy', 'firstName lastName email')
      .lean();

    if (!file) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 404, duration, session.user.id);
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has permission to view this file
    if (session.user.role === 'user' && (file as any).uploadedBy._id.toString() !== session.user.id) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 403, duration, session.user.id);
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // If download is requested, generate pre-signed URL for MinIO
    if (download) {
      try {
        const downloadUrl = await getDownloadUrl(file.fileName);

        const duration = Date.now() - startTime;
        logApiResponse(method, url, 200, duration, session.user.id);

        return NextResponse.json({
          success: true,
          downloadUrl,
          fileName: file.originalName,
          fileType: file.fileType
        });
      } catch (error) {
        logError('Failed to generate download URL', error, { fileName: file.fileName, fileId });
        const duration = Date.now() - startTime;
        logApiResponse(method, url, 500, duration, session.user.id);
        return NextResponse.json(
          { error: 'Failed to generate download URL' },
          { status: 500 }
        );
      }
    }

    const duration = Date.now() - startTime;
    logApiResponse(method, url, 200, duration, session.user.id);

    return NextResponse.json({
      success: true,
      file
    });

  } catch (error) {
    const duration = Date.now() - startTime;
    logError('Get file failed', error, { url, method });
    logApiResponse(method, url, 500, duration);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}
