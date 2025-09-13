import { NextRequest, NextResponse } from 'next/server';
import { getServerSession } from 'next-auth';
import { authOptions } from '@/lib/auth/config';
import { connectDB } from '@/lib/db/connection';
import User from '@/lib/db/models/User';

export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only access their own profile, admins can access any profile
    if (session.user.id !== userId && session.user.role !== 'admin') {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    await connectDB();

    const user = await User.findById(userId).select('-password').lean();
    if (!user) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const userData = user as any;

    // Structure the profile data
    const profile = {
      personalInfo: {
        firstName: userData.firstName || '',
        lastName: userData.lastName || '',
        email: userData.email || '',
        phone: userData.phone || '',
        dateOfBirth: userData.dateOfBirth || '',
        profilePicture: userData.profilePicture || null,
        address: userData.address || '',
        aadharNumber: userData.aadharNumber || '',
        panNumber: userData.panNumber || ''
      },
      educationInfo: {
        currentInstitution: userData.currentInstitution || '',
        course: userData.course || '',
        duration: userData.duration || '',
        feeStructure: userData.feeStructure || 0,
        admissionDate: userData.admissionDate || ''
      },
      financialInfo: {
        annualIncome: userData.annualIncome || 0,
        employmentType: userData.employmentType || '',
        employerName: userData.employerName || '',
        workExperience: userData.workExperience || ''
      },
      documents: userData.documents || [],
      createdAt: userData.createdAt,
      updatedAt: userData.updatedAt
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Get user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ userId: string }> }
) {
  try {
    const { userId } = await params;
    const session = await getServerSession(authOptions);

    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    // Users can only update their own profile
    if (session.user.id !== userId) {
      return NextResponse.json({ error: 'Forbidden' }, { status: 403 });
    }

    const profileData = await request.json();
    await connectDB();

    // Flatten the profile data for database update
    const updateData: any = {};
    
    if (profileData.personalInfo) {
      Object.assign(updateData, profileData.personalInfo);
    }
    
    if (profileData.educationInfo) {
      Object.assign(updateData, profileData.educationInfo);
    }
    
    if (profileData.financialInfo) {
      Object.assign(updateData, profileData.financialInfo);
    }

    // Remove sensitive fields that shouldn't be updated via this endpoint
    delete updateData.password;
    delete updateData.role;
    delete updateData.isVerified;
    delete updateData.createdAt;

    const updatedUser = await User.findByIdAndUpdate(
      userId,
      {
        ...updateData,
        updatedAt: new Date()
      },
      { new: true, runValidators: true }
    ).select('-password').lean();

    if (!updatedUser) {
      return NextResponse.json({ error: 'User not found' }, { status: 404 });
    }

    const updatedUserData = updatedUser as any;

    // Structure the response
    const profile = {
      personalInfo: {
        firstName: updatedUserData.firstName || '',
        lastName: updatedUserData.lastName || '',
        email: updatedUserData.email || '',
        phone: updatedUserData.phone || '',
        dateOfBirth: updatedUserData.dateOfBirth || '',
        profilePicture: updatedUserData.profilePicture || null,
        address: updatedUserData.address || '',
        aadharNumber: updatedUserData.aadharNumber || '',
        panNumber: updatedUserData.panNumber || ''
      },
      educationInfo: {
        currentInstitution: updatedUserData.currentInstitution || '',
        course: updatedUserData.course || '',
        duration: updatedUserData.duration || '',
        feeStructure: updatedUserData.feeStructure || 0,
        admissionDate: updatedUserData.admissionDate || ''
      },
      financialInfo: {
        annualIncome: updatedUserData.annualIncome || 0,
        employmentType: updatedUserData.employmentType || '',
        employerName: updatedUserData.employerName || '',
        workExperience: updatedUserData.workExperience || ''
      },
      documents: updatedUserData.documents || [],
      createdAt: updatedUserData.createdAt,
      updatedAt: updatedUserData.updatedAt
    };

    return NextResponse.json({ profile });
  } catch (error) {
    console.error('Update user profile error:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
