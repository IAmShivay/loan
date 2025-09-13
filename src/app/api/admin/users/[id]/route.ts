import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, isAdmin } from '@/lib/auth/utils';
import { connectDB, User } from '@/lib/db';

// GET /api/admin/users/[id] - Get user by ID (admin only)
export async function GET(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getAuthSession();
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(id).select('-password');
    
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Calculate statistics for DSA users
    let statistics = null;
    if (user.role === 'dsa') {
      // Import LoanApplication model
      const { default: LoanApplication } = await import('@/lib/db/models/LoanApplication');
      
      const [totalApplications, approvedApplications, totalLoanAmount] = await Promise.all([
        LoanApplication.countDocuments({ assignedDSAs: user._id }),
        LoanApplication.countDocuments({ 
          assignedDSAs: user._id, 
          status: 'approved' 
        }),
        LoanApplication.aggregate([
          { $match: { assignedDSAs: user._id, status: 'approved' } },
          { $group: { _id: null, total: { $sum: '$loanInfo.amount' } } }
        ])
      ]);

      const successRate = totalApplications > 0 
        ? Math.round((approvedApplications / totalApplications) * 100) 
        : 0;

      statistics = {
        totalApplications,
        approvedApplications,
        successRate,
        totalLoanAmount: totalLoanAmount[0]?.total || 0
      };
    }

    const userResponse = {
      ...user.toObject(),
      statistics
    };

    return NextResponse.json({
      success: true,
      user: userResponse,
    });

  } catch (error) {
    console.error('Get user by ID error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// PUT /api/admin/users/[id] - Update user (admin only)
export async function PUT(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getAuthSession();
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const body = await request.json();
    const {
      firstName,
      lastName,
      email,
      phone,
      bankName,
      branchCode,
      isActive
    } = body;

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Update user fields
    if (firstName !== undefined) user.firstName = firstName;
    if (lastName !== undefined) user.lastName = lastName;
    if (email !== undefined) user.email = email;
    if (phone !== undefined) user.phone = phone;
    if (bankName !== undefined) user.bankName = bankName;
    if (branchCode !== undefined) user.branchCode = branchCode;
    if (isActive !== undefined) user.isActive = isActive;

    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      user: userResponse,
    });

  } catch (error) {
    console.error('Update user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// DELETE /api/admin/users/[id] - Delete user (admin only)
export async function DELETE(
  request: NextRequest,
  { params }: { params: Promise<{ id: string }> }
) {
  const { id } = await params;
  try {
    const session = await getAuthSession();
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    await connectDB();

    const user = await User.findById(id);
    if (!user) {
      return NextResponse.json(
        { success: false, error: 'User not found' },
        { status: 404 }
      );
    }

    // Soft delete by setting isActive to false
    user.isActive = false;
    await user.save();

    return NextResponse.json({
      success: true,
      message: 'User deactivated successfully',
    });

  } catch (error) {
    console.error('Delete user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
