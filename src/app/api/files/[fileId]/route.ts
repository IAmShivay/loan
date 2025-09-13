import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import { deleteFromCloudinary } from '@/lib/cloudinary';
import FileUpload from '@/lib/db/models/FileUpload';

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ fileId: string }> }
) {
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { fileId } = await params;

    // Find the file
    const file = await FileUpload.findById(fileId);
    if (!file) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has permission to delete this file
    if (session.user.role === 'user' && file.uploadedBy.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Delete from Cloudinary
    try {
      await deleteFromCloudinary(file.cloudinaryPublicId);
    } catch (cloudinaryError) {
      console.error('Cloudinary deletion error:', cloudinaryError);
      // Continue with database deletion even if Cloudinary fails
    }

    // Soft delete from database
    await file.softDelete();

    return NextResponse.json({
      success: true,
      message: 'File deleted successfully'
    });

  } catch (error) {
    console.error('File deletion error:', error);
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
  try {
    const session = await getServerSession(authOptions);
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { fileId } = await params;

    // Find the file
    const file = await FileUpload.findById(fileId)
      .populate('uploadedBy', 'firstName lastName email')
      .lean();

    if (!file || (file as any).isDeleted) {
      return NextResponse.json({ error: 'File not found' }, { status: 404 });
    }

    // Check if user has permission to view this file
    if (session.user.role === 'user' && (file as any).uploadedBy._id.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    return NextResponse.json({
      success: true,
      file
    });

  } catch (error) {
    console.error('Get file error:', error);
    return NextResponse.json(
      { error: 'Failed to fetch file' },
      { status: 500 }
    );
  }
}
