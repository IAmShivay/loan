/**
 * Utility functions for providing fallback values and safe data handling
 */

/**
 * Safe number with fallback
 */
export function safeNumber(value: any, fallback: number = 0): number {
  if (typeof value === 'number' && !isNaN(value) && isFinite(value)) {
    return value;
  }
  return fallback;
}

/**
 * Safe string with fallback
 */
export function safeString(value: any, fallback: string = ''): string {
  if (typeof value === 'string' && value.trim() !== '') {
    return value;
  }
  return fallback;
}

/**
 * Safe array with fallback
 */
export function safeArray<T>(value: any, fallback: T[] = []): T[] {
  if (Array.isArray(value)) {
    return value;
  }
  return fallback;
}

/**
 * Safe percentage calculation
 */
export function safePercentage(numerator: any, denominator: any, fallback: number = 0): number {
  const num = safeNumber(numerator);
  const den = safeNumber(denominator);
  
  if (den === 0) return fallback;
  
  const result = (num / den) * 100;
  return safeNumber(result, fallback);
}

/**
 * Safe division
 */
export function safeDivision(numerator: any, denominator: any, fallback: number = 0): number {
  const num = safeNumber(numerator);
  const den = safeNumber(denominator);
  
  if (den === 0) return fallback;
  
  const result = num / den;
  return safeNumber(result, fallback);
}

/**
 * Safe statistics object with all fallbacks
 */
export function safeStatistics(stats: any) {
  return {
    // Admin stats
    totalUsers: safeNumber(stats?.totalUsers, 0),
    totalApplications: safeNumber(stats?.totalApplications, 0),
    pendingApplications: safeNumber(stats?.pendingApplications, 0),
    approvedApplications: safeNumber(stats?.approvedApplications, 0),
    rejectedApplications: safeNumber(stats?.rejectedApplications, 0),
    activeDSAs: safeNumber(stats?.activeDSAs, 0),
    totalTickets: safeNumber(stats?.totalTickets, 0),
    openTickets: safeNumber(stats?.openTickets, 0),
    totalLoanAmount: safeNumber(stats?.totalLoanAmount, 0),
    averageLoanAmount: safeNumber(stats?.averageLoanAmount, 0),
    completionRate: safeNumber(stats?.completionRate, 0),
    
    // DSA stats
    assignedApplications: safeNumber(stats?.assignedApplications, 0),
    pendingReview: safeNumber(stats?.pendingReview, 0),
    averageProcessingTime: safeString(stats?.averageProcessingTime, '0 days'),
    successRate: safeNumber(stats?.successRate, 0),
    totalCommission: safeNumber(stats?.totalCommission, 0),
    thisMonthCommission: safeNumber(stats?.thisMonthCommission, 0),
    
    // User stats
    approvedAmount: safeNumber(stats?.approvedAmount, 0),
  };
}

/**
 * Safe application object with fallbacks
 */
export function safeApplication(app: any) {
  return {
    _id: safeString(app?._id, ''),
    applicationNumber: safeString(app?.applicationNumber, 'N/A'),
    status: safeString(app?.status, 'pending'),
    priority: safeString(app?.priority, 'medium'),
    paymentStatus: safeString(app?.paymentStatus, 'pending'),
    serviceChargesPaid: Boolean(app?.serviceChargesPaid),
    // Personal Details (from LoanApplication model)
    personalDetails: {
      fullName: safeString(app?.personalDetails?.fullName, 'N/A'),
      dateOfBirth: safeDate(app?.personalDetails?.dateOfBirth, new Date().toISOString()),
      gender: safeString(app?.personalDetails?.gender, 'N/A'),
      maritalStatus: safeString(app?.personalDetails?.maritalStatus, 'N/A'),
      address: {
        street: safeString(app?.personalDetails?.address?.street, 'N/A'),
        city: safeString(app?.personalDetails?.address?.city, 'N/A'),
        state: safeString(app?.personalDetails?.address?.state, 'N/A'),
        zipCode: safeString(app?.personalDetails?.address?.zipCode, 'N/A'),
        country: safeString(app?.personalDetails?.address?.country, 'India'),
      },
      employment: {
        type: safeString(app?.personalDetails?.employment?.type, 'N/A'),
        companyName: safeString(app?.personalDetails?.employment?.companyName, 'N/A'),
        designation: safeString(app?.personalDetails?.employment?.designation, 'N/A'),
        workExperience: safeNumber(app?.personalDetails?.employment?.workExperience, 0),
      },
      income: safeNumber(app?.personalDetails?.income, 0),
    },
    // Loan Details (from LoanApplication model)
    loanDetails: {
      amount: safeNumber(app?.loanDetails?.amount, 0),
      purpose: safeString(app?.loanDetails?.purpose, 'N/A'),
      tenure: safeNumber(app?.loanDetails?.tenure, 0),
      interestRate: safeNumber(app?.loanDetails?.interestRate, 0),
    },
    // Legacy support for old structure (for backward compatibility)
    personalInfo: {
      firstName: safeString(app?.personalDetails?.fullName?.split(' ')[0], 'N/A'),
      lastName: safeString(app?.personalDetails?.fullName?.split(' ').slice(1).join(' '), ''),
      email: safeString(app?.userId?.email, 'N/A'), // Email comes from user reference
      phone: safeString(app?.userId?.phone, 'N/A'), // Phone comes from user reference
      dateOfBirth: safeDate(app?.personalDetails?.dateOfBirth, new Date().toISOString()),
    },
    addressInfo: {
      address: safeString(app?.personalDetails?.address?.street, 'N/A'),
      city: safeString(app?.personalDetails?.address?.city, 'N/A'),
      state: safeString(app?.personalDetails?.address?.state, 'N/A'),
      pincode: safeString(app?.personalDetails?.address?.zipCode, 'N/A'),
    },
    educationInfo: {
      instituteName: safeString(app?.educationInfo?.instituteName || app?.personalDetails?.education?.instituteName, 'N/A'),
      course: safeString(app?.educationInfo?.course || app?.personalDetails?.education?.course, 'N/A'),
      duration: safeString(app?.educationInfo?.duration || app?.personalDetails?.education?.duration, 'N/A'),
      feeStructure: safeNumber(app?.educationInfo?.feeStructure || app?.personalDetails?.education?.feeStructure, 0),
      admissionDate: safeDate(app?.educationInfo?.admissionDate || app?.personalDetails?.education?.admissionDate, new Date().toISOString()),
    },
    loanInfo: {
      amount: safeNumber(app?.loanDetails?.amount, 0),
      purpose: safeString(app?.loanDetails?.purpose, 'N/A'),
    },
    financialInfo: {
      annualIncome: safeNumber(app?.personalDetails?.income, 0),
      employmentType: safeString(app?.personalDetails?.employment?.type, 'N/A'),
      employerName: safeString(app?.personalDetails?.employment?.companyName, 'N/A'),
    },
    assignedDSAs: safeArray(app?.assignedDSAs, []),
    documents: safeArray(app?.documents, []),
    createdAt: safeDate(app?.createdAt, new Date().toISOString()),
    updatedAt: safeDate(app?.updatedAt, new Date().toISOString()),
  };
}

/**
 * Safe user object with fallbacks
 */
export function safeUser(user: any) {
  return {
    _id: safeString(user?._id, ''),
    firstName: safeString(user?.firstName, 'User'),
    lastName: safeString(user?.lastName, ''),
    email: safeString(user?.email, 'N/A'),
    role: safeString(user?.role, 'user'),
    isVerified: Boolean(user?.isVerified),
    bankName: safeString(user?.bankName, 'N/A'),
    dsaId: safeString(user?.dsaId, 'N/A'),
    createdAt: safeString(user?.createdAt, new Date().toISOString()),
  };
}

/**
 * Safe notification object with fallbacks
 */
export function safeNotification(notification: any) {
  return {
    _id: safeString(notification?._id, ''),
    title: safeString(notification?.title, 'Notification'),
    message: safeString(notification?.message, 'No message'),
    type: safeString(notification?.type, 'info') as 'info' | 'success' | 'warning' | 'error',
    read: Boolean(notification?.read),
    createdAt: safeString(notification?.createdAt, new Date().toISOString()),
  };
}

/**
 * Format safe date
 */
export function safeDate(date: any, fallback: string = 'N/A'): string {
  if (!date) return fallback;
  
  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return fallback;
    
    return dateObj.toLocaleDateString('en-IN', {
      year: 'numeric',
      month: 'short',
      day: 'numeric'
    });
  } catch {
    return fallback;
  }
}

/**
 * Format safe time ago
 */
export function safeTimeAgo(date: any, fallback: string = 'N/A'): string {
  if (!date) return fallback;

  try {
    const dateObj = new Date(date);
    if (isNaN(dateObj.getTime())) return fallback;

    const now = new Date();
    const diffInMs = now.getTime() - dateObj.getTime();
    const diffInDays = Math.floor(diffInMs / (1000 * 60 * 60 * 24));

    if (diffInDays === 0) return 'Today';
    if (diffInDays === 1) return 'Yesterday';
    if (diffInDays < 7) return `${diffInDays} days ago`;
    if (diffInDays < 30) return `${Math.floor(diffInDays / 7)} weeks ago`;
    if (diffInDays < 365) return `${Math.floor(diffInDays / 30)} months ago`;

    return `${Math.floor(diffInDays / 365)} years ago`;
  } catch {
    return fallback;
  }
}

/**
 * Format currency in Indian Rupees
 */
export function formatCurrency(amount: any, fallback: string = '₹0'): string {
  const safeAmount = safeNumber(amount, 0);

  try {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      minimumFractionDigits: 0,
      maximumFractionDigits: 0,
    }).format(safeAmount);
  } catch {
    return fallback;
  }
}
