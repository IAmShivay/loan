import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import FileUpload from '@/lib/db/models/FileUpload';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // First, verify the application exists and user has access
    const application = await LoanApplication.findById(applicationId).lean();
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Check access permissions
    const hasAccess =
      session.user.role === 'admin' ||
      (session.user.role === 'user' && (application as any).userId.toString() === session.user.id) ||
      (session.user.role === 'dsa' && (application as any).assignedDSAs?.some((dsa: any) => dsa.toString() === session.user.id));

    if (!hasAccess) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Get all documents for this application
    const documents = await FileUpload.findByApplication(applicationId);

    // Format documents for response
    const formattedDocuments = documents.map((doc: any) => ({
      _id: doc._id,
      documentType: doc.documentType,
      fileName: doc.fileName,
      fileUrl: doc.fileUrl,
      fileSize: doc.fileSize,
      mimeType: doc.mimeType,
      uploadedAt: doc.createdAt,
      uploadedBy: doc.uploadedBy,
      status: doc.status || 'uploaded'
    }));

    return NextResponse.json({ 
      documents: formattedDocuments,
      total: formattedDocuments.length
    });
  } catch (error) {
    console.error('Get application documents error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function POST(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Verify the application exists and user has access
    const application = await LoanApplication.findById(applicationId).lean();
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Only the application owner can upload documents
    if (session.user.role !== 'admin' && (application as any).userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const { documentType, fileName, fileUrl, fileSize, mimeType } = await request.json();

    // Validate required fields
    if (!documentType || !fileName || !fileUrl) {
      return NextResponse.json(
        { error: 'Missing required fields: documentType, fileName, fileUrl' },
        { status: 400 }
      );
    }

    // Create new document record
    const document = new FileUpload({
      applicationId,
      documentType,
      fileName,
      fileUrl,
      fileSize: fileSize || 0,
      mimeType: mimeType || 'application/octet-stream',
      uploadedBy: session.user.id,
      status: 'uploaded'
    });

    await document.save();

    // Update application's documents array
    await LoanApplication.findByIdAndUpdate(
      applicationId,
      {
        $addToSet: {
          documents: {
            documentType,
            fileName,
            fileUrl,
            uploadedAt: new Date()
          }
        },
        updatedAt: new Date()
      }
    );

    return NextResponse.json({
      document: {
        _id: document._id,
        documentType: document.documentType,
        fileName: document.fileName,
        fileUrl: document.fileUrl,
        fileSize: document.fileSize,
        mimeType: document.mimeType,
        uploadedAt: document.createdAt,
        uploadedBy: document.uploadedBy,
        status: document.status
      }
    }, { status: 201 });
  } catch (error) {
    console.error('Upload application document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  try {
    const { id: applicationId } = await params;
    const session = await getServerSession(authOptions);
    const { searchParams } = new URL(request.url);
    const documentId = searchParams.get('documentId');

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    if (!documentId) {
      return NextResponse.json({ error: 'Document ID is required' }, { status: 400 });
    }

    await connectDB();

    // Verify the application exists and user has access
    const application = await LoanApplication.findById(applicationId).lean();
    if (!application) {
      return NextResponse.json({ error: 'Application not found' }, { status: 404 });
    }

    // Only the application owner or admin can delete documents
    if (session.user.role !== 'admin' && (application as any).userId.toString() !== session.user.id) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    // Find and soft delete the document
    const document = await FileUpload.findById(documentId);
    if (!document || !document.applicationId || document.applicationId.toString() !== applicationId) {
      return NextResponse.json({ error: 'Document not found' }, { status: 404 });
    }

    // Soft delete the document
    document.isDeleted = true;
    document.deletedAt = new Date();
    await document.save();

    // Remove from application's documents array
    await LoanApplication.findByIdAndUpdate(
      applicationId,
      {
        $pull: {
          documents: { fileName: document.fileName }
        },
        updatedAt: new Date()
      }
    );

    return NextResponse.json({ success: true });
  } catch (error) {
    console.error('Delete application document error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
