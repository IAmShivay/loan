import { NextRequest, NextResponse } from 'next/server';
import { getServerSession, Session } from 'next-auth';
import { authOptions } from '@/lib/auth';
import { connectDB } from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';
import FileUpload from '@/lib/db/models/FileUpload';
import { logInfo, logError, logApiResponse } from '@/lib/logger';
import { uploadToCloudinary } from '@/lib/cloudinary';

export async function POST(request: NextRequest) {
  const startTime = Date.now();
  const method = 'POST';
  const url = '/api/applications/with-files';
  let session: Session | null = null;

  try {
    // Check authentication
    session = await getServerSession(authOptions);
    if (!session?.user) {
      const duration = Date.now() - startTime;
      logApiResponse(method, url, 401, duration);
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    // Log request details for debugging
    const contentType = request.headers.get('content-type');
    const contentLength = request.headers.get('content-length');

    logInfo('Application with files creation request received', {
      userId: session.user.id,
      contentType,
      contentLength,
      method: request.method
    });

    // Check if request has multipart/form-data content type
    if (!contentType || !contentType.includes('multipart/form-data')) {
      const duration = Date.now() - startTime;
      logError('Invalid content type', new Error(`Expected multipart/form-data, got: ${contentType}`), {
        userId: session.user.id,
        contentType
      });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({
        error: `Invalid content type. Expected multipart/form-data, got: ${contentType || 'none'}`
      }, { status: 400 });
    }

    let formData: FormData;
    try {
      formData = await request.formData();
      logInfo('FormData parsed successfully', {
        userId: session.user.id,
        formDataKeys: Array.from(formData.keys())
      });
    } catch (error) {
      const duration = Date.now() - startTime;
      logError('Failed to parse FormData', error, {
        userId: session.user.id,
        contentType,
        contentLength
      });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({
        error: 'Failed to parse form data. Please ensure you are sending valid multipart/form-data'
      }, { status: 400 });
    }

    // Extract application data from FormData
    const applicationDataStr = formData.get('applicationData') as string;
    if (!applicationDataStr) {
      const duration = Date.now() - startTime;
      logError('Missing application data', new Error('applicationData field is required'), { userId: session.user.id });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({ error: 'Application data is required' }, { status: 400 });
    }

    let applicationData;
    try {
      applicationData = JSON.parse(applicationDataStr);
    } catch (error) {
      const duration = Date.now() - startTime;
      logError('Invalid application data JSON', error, { userId: session.user.id });
      logApiResponse(method, url, 400, duration, session.user.id);
      return NextResponse.json({ error: 'Invalid application data format' }, { status: 400 });
    }

    // Helper function to parse work experience
    const parseWorkExperience = (experience: string): number => {
      if (!experience) return 0;
      // Handle formats like "1-3-years", "2 years", "fresher", etc.
      const match = experience.match(/(\d+)/);
      return match ? parseInt(match[1]) : 0;
    };

    // Helper function to map employment type
    const mapEmploymentType = (type: string): string => {
      const typeMap: Record<string, string> = {
        'student': 'Salaried',
        'employed': 'Salaried',
        'salaried': 'Salaried',
        'self-employed': 'Self-Employed',
        'business': 'Business',
        'freelancer': 'Self-Employed',
      };
      return typeMap[type?.toLowerCase()] || 'Salaried';
    };

    // Map the application data to match the LoanApplication model schema
    const mappedApplicationData = {
      userId: session.user.id,
      personalDetails: {
        fullName: `${applicationData.personalInfo.firstName} ${applicationData.personalInfo.lastName}`,
        dateOfBirth: new Date(applicationData.personalInfo.dateOfBirth),
        gender: 'Male', // Default, should be collected in form
        maritalStatus: 'Single', // Default, should be collected in form
        address: {
          street: applicationData.personalInfo.address.street,
          city: applicationData.personalInfo.address.city,
          state: applicationData.personalInfo.address.state,
          zipCode: applicationData.personalInfo.address.pincode,
          country: 'India',
        },
        employment: {
          type: mapEmploymentType(applicationData.financialInfo.employmentType),
          companyName: applicationData.financialInfo.employerName || 'Student',
          designation: 'Student', // Default
          workExperience: parseWorkExperience(applicationData.financialInfo.workExperience),
        },
        contact: {
          phone: applicationData.personalInfo.phone,
          email: applicationData.personalInfo.email,
          alternatePhone: '', // Optional
        },
        identification: {
          aadharNumber: applicationData.personalInfo.aadharNumber,
          panNumber: applicationData.personalInfo.panNumber,
        },
        income: applicationData.financialInfo.annualIncome || 100000, // Required field
      },
      loanDetails: {
        amount: applicationData.loanInfo.amount,
        purpose: applicationData.loanInfo.purpose,
        tenure: 12, // 12 months minimum (changed from 5 to meet min requirement of 6)
        interestRate: 12, // Default rate
        emi: Math.round((applicationData.loanInfo.amount * 0.12 * Math.pow(1.12, 1)) / (Math.pow(1.12, 1) - 1) / 12), // Simple EMI calculation
        processingFee: 99,
        educationDetails: {
          instituteName: applicationData.educationInfo.instituteName,
          course: applicationData.educationInfo.course,
          duration: applicationData.educationInfo.duration,
          admissionDate: new Date(applicationData.educationInfo.admissionDate),
          feeStructure: applicationData.educationInfo.feeStructure,
        },
      },
      documents: [], // Will be populated after file uploads
      status: 'pending',
      dsaReviews: [],
      assignedDSAs: [],
      statusHistory: [{
        status: 'pending',
        updatedBy: session.user.id, // Fixed: was 'changedBy', should be 'updatedBy'
        updatedAt: new Date(), // Fixed: was 'changedAt', should be 'updatedAt'
        comments: 'Application submitted',
      }],
      finalApprovalThreshold: 1, // At least 1 DSA approval needed
      paymentStatus: 'pending',
      serviceChargesPaid: false,
      applicationNumber: '', // Will be generated by the model
    };

    // Create the loan application
    const loanApplication = new LoanApplication(mappedApplicationData);

    const savedApplication = await loanApplication.save();
    logInfo('Loan application created', { applicationId: savedApplication._id, userId: session.user.id });

    // Handle file uploads
    const uploadedFiles: Array<typeof FileUpload.prototype> = [];
    const fileFields = ['aadharCard', 'panCard', 'incomeProof', 'educationCertificate', 'feeReceipt', 'bankStatement'];

    for (const fieldName of fileFields) {
      const files = formData.getAll(fieldName) as File[];
      
      for (const file of files) {
        if (file && file.size > 0) {
          try {
            logInfo('Uploading file', { fileName: file.name, fileSize: file.size, documentType: fieldName });

            // Convert File to Buffer
            const bytes = await file.arrayBuffer();
            const buffer = Buffer.from(bytes);

            // Upload to Cloudinary
            const uploadResult = await uploadToCloudinary(buffer, {
              folder: 'loan-documents',
              resource_type: 'auto',
              allowed_formats: ['jpg', 'jpeg', 'png', 'pdf', 'doc', 'docx'],
              max_file_size: 10000000, // 10MB
            });

            // Save file record to database
            const fileUpload = new FileUpload({
              originalName: file.name,
              fileName: uploadResult.public_id,
              fileUrl: uploadResult.secure_url,
              fileSize: file.size,
              mimeType: file.type,
              documentType: fieldName,
              applicationId: savedApplication._id,
              userId: session.user.id,
              uploadedAt: new Date(),
            });

            const savedFile = await fileUpload.save();
            uploadedFiles.push(savedFile);

            logInfo('File uploaded successfully', { 
              fileId: savedFile._id, 
              fileName: file.name, 
              cloudinaryUrl: uploadResult.secure_url 
            });

          } catch (uploadError) {
            logError('File upload failed', uploadError, { 
              fileName: file.name, 
              documentType: fieldName,
              applicationId: savedApplication._id 
            });
            // Continue with other files even if one fails
          }
        }
      }
    }

    // Update application with uploaded file references
    if (uploadedFiles.length > 0) {
      savedApplication.documents = uploadedFiles.map(file => file._id);
      await savedApplication.save();
    }

    const duration = Date.now() - startTime;
    logInfo('Application with files created successfully', { 
      applicationId: savedApplication._id, 
      filesUploaded: uploadedFiles.length,
      userId: session.user.id 
    });
    logApiResponse(method, url, 201, duration, session.user.id);

    return NextResponse.json({
      applicationId: savedApplication._id,
      message: 'Application submitted successfully',
      filesUploaded: uploadedFiles.length,
    }, { status: 201 });

  } catch (error) {
    const duration = Date.now() - startTime;
    const userId = session?.user?.id;
    logError('Application with files creation failed', error, { userId });
    logApiResponse(method, url, 500, duration, userId);
    
    return NextResponse.json({
      error: 'Failed to create application',
      details: process.env.NODE_ENV === 'development' ? (error as Error).message : undefined,
    }, { status: 500 });
  }
}
