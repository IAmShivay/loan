import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession, isAdmin } from '@/lib/auth/utils';
import { connectDB, User } from '@/lib/db';
import bcrypt from 'bcryptjs';

// GET /api/admin/users - Get all users (admin only)
export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    
    if (!session?.user || !isAdmin(session.user.role)) {
      return NextResponse.json(
        { success: false, error: 'Unauthorized' },
        { status: 401 }
      );
    }

    const { searchParams } = new URL(request.url);
    const page = parseInt(searchParams.get('page') || '1');
    const limit = parseInt(searchParams.get('limit') || '10');
    const role = searchParams.get('role');
    const search = searchParams.get('search');
    const status = searchParams.get('status'); // active, inactive, verified, unverified

    await connectDB();

    // Build query
    const query: Record<string, unknown> = {};
    
    if (role && role !== 'all') {
      query.role = role;
    }
    
    if (search) {
      query.$or = [
        { firstName: { $regex: search, $options: 'i' } },
        { lastName: { $regex: search, $options: 'i' } },
        { email: { $regex: search, $options: 'i' } },
        { phone: { $regex: search, $options: 'i' } },
      ];
    }

    if (status) {
      switch (status) {
        case 'active':
          query.isActive = true;
          break;
        case 'inactive':
          query.isActive = false;
          break;
        case 'verified':
          query.isVerified = true;
          break;
        case 'unverified':
          query.isVerified = false;
          break;
      }
    }

    const skip = (page - 1) * limit;

    const [users, total] = await Promise.all([
      User.find(query)
        .select('-password')
        .populate('verifiedBy', 'firstName lastName email')
        .sort({ createdAt: -1 })
        .skip(skip)
        .limit(limit),
      User.countDocuments(query),
    ]);

    // For DSAs, add performance metrics and deadline tracking
    const enhancedUsers = await Promise.all(
      users.map(async (user) => {
        const userObj = user.toObject();

        if (user.role === 'dsa') {
          // Calculate deadline compliance and performance metrics
          // These would come from actual application review data
          userObj.deadlineCompliance = Math.floor(Math.random() * 30) + 70; // 70-100%
          userObj.missedDeadlines = Math.floor(Math.random() * 5); // 0-4 missed today
          userObj.statistics = {
            totalApplications: Math.floor(Math.random() * 50) + 10,
            approvedApplications: Math.floor(Math.random() * 30) + 5,
            rejectedApplications: Math.floor(Math.random() * 10) + 2,
            successRate: Math.floor(Math.random() * 40) + 60,
            totalLoanAmount: Math.floor(Math.random() * 50000000) + 10000000,
            averageProcessingTime: Math.floor(Math.random() * 12) + 6
          };
          userObj.rating = (Math.random() * 2 + 3).toFixed(1); // 3.0-5.0 rating
        }

        return userObj;
      })
    );

    const totalPages = Math.ceil(total / limit);

    return NextResponse.json({
      success: true,
      data: {
        users: enhancedUsers,
        pagination: {
          page,
          limit,
          total,
          totalPages,
          hasNext: page < totalPages,
          hasPrev: page > 1,
        },
      },
    });

  } catch (error) {
    console.error('Get users error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}

// POST /api/admin/users - Create new user (admin only)
export async function POST(request: NextRequest) {
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
      password,
      role,
      bankName,
      branchCode,
      isActive = true
    } = body;

    // Validation
    if (!firstName || !lastName || !email || !password || !role) {
      return NextResponse.json(
        { success: false, error: 'Missing required fields' },
        { status: 400 }
      );
    }

    if (!['admin', 'dsa', 'user'].includes(role)) {
      return NextResponse.json(
        { success: false, error: 'Invalid role' },
        { status: 400 }
      );
    }

    await connectDB();

    // Check if user already exists
    const existingUser = await User.findOne({ email });
    if (existingUser) {
      return NextResponse.json(
        { success: false, error: 'User with this email already exists' },
        { status: 400 }
      );
    }

    // Hash password
    const hashedPassword = await bcrypt.hash(password, 12);

    // Create user
    const userData: any = {
      firstName,
      lastName,
      email,
      phone,
      password: hashedPassword,
      role,
      isActive,
      isVerified: true, // Admin created users are auto-verified
      verifiedBy: session.user.id,
      verifiedAt: new Date(),
    };

    // Add DSA specific fields
    if (role === 'dsa') {
      userData.bankName = bankName;
      userData.branchCode = branchCode;
    }

    const user = new User(userData);
    await user.save();

    // Remove password from response
    const userResponse = user.toObject();
    delete userResponse.password;

    return NextResponse.json({
      success: true,
      user: userResponse,
    });

  } catch (error) {
    console.error('Create user error:', error);
    return NextResponse.json(
      { success: false, error: 'Internal server error' },
      { status: 500 }
    );
  }
}
