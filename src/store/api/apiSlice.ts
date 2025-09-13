import { createApi, fetchBaseQuery } from '@reduxjs/toolkit/query/react';

// Types
export interface Statistics {
  // Admin stats
  totalUsers?: number;
  totalApplications?: number;
  pendingApplications?: number;
  approvedApplications?: number;
  rejectedApplications?: number;
  activeDSAs?: number;
  totalTickets?: number;
  openTickets?: number;
  totalLoanAmount?: number;
  averageLoanAmount?: number;
  completionRate?: number;
  
  // DSA stats
  assignedApplications?: number;
  pendingReview?: number;
  averageProcessingTime?: string;
  successRate?: number;
  totalCommission?: number;
  thisMonthCommission?: number;
  
  // User stats
  approvedAmount?: number;
}

export interface Application {
  _id: string;
  applicationId: string;
  userId: string;
  personalInfo: {
    firstName: string;
    lastName: string;
    email: string;
    phone: string;
    dateOfBirth: string;
    aadharNumber: string;
    panNumber: string;
    address: {
      street: string;
      city: string;
      state: string;
      pincode: string;
    };
  };
  educationInfo: {
    instituteName: string;
    course: string;
    duration: string;
    admissionDate: string;
    feeStructure: number;
  };
  loanInfo: {
    amount: number;
    purpose: string;
    tenure?: number;
  };
  financialInfo: {
    annualIncome: number;
    employmentType: string;
    employerName: string;
    workExperience: string;
  };
  coApplicant?: {
    name: string;
    relation: string;
    annualIncome: number;
  };
  documents?: Array<{
    type: string;
    fileName: string;
    filePath: string;
    status: string;
  }>;
  status: string;
  priority: string;
  paymentStatus: string;
  serviceChargesPaid: boolean;
  createdAt: string;
  updatedAt: string;
}

export interface SupportTicket {
  _id: string;
  ticketNumber: string;
  subject: string;
  description: string;
  category: 'technical' | 'general' | 'billing' | 'process' | 'other';
  priority: 'low' | 'medium' | 'high' | 'urgent';
  status: 'open' | 'in_progress' | 'resolved' | 'closed';
  userId: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
    role: string;
  };
  assignedTo?: {
    _id: string;
    firstName: string;
    lastName: string;
    email: string;
  };
  responses: Array<{
    userId: {
      _id: string;
      firstName: string;
      lastName: string;
      email: string;
      role: string;
    };
    message: string;
    isInternal: boolean;
    attachments?: string[];
    createdAt: string;
  }>;
  tags: string[];
  resolution?: string;
  resolvedAt?: string;
  resolvedBy?: string;
  createdAt: string;
  updatedAt: string;
}

export interface Notification {
  _id: string;
  userId: string;
  title: string;
  message: string;
  type: 'info' | 'success' | 'warning' | 'error';
  read: boolean;
  createdAt: string;
}

export interface User {
  _id: string;
  firstName: string;
  lastName: string;
  email: string;
  phone?: string;
  role: 'admin' | 'dsa' | 'user';
  bankName?: string;
  dsaId?: string;
  branchCode?: string;
  isActive: boolean;
  isVerified: boolean;
  profilePicture?: string;
  rating?: number;
  statistics?: {
    totalApplications?: number;
    approvedApplications?: number;
    successRate?: number;
    totalLoanAmount?: number;
  };
  createdAt: string;
}

export interface FileUpload {
  _id: string;
  originalName: string;
  fileName: string;
  fileUrl: string;
  fileType: string;
  fileSize: number;
  uploadedBy: string;
  uploadedAt: string;
  documentType?: string;
  applicationId?: string;
}

export interface ChatMessage {
  _id: string;
  chatId: string;
  senderId: string;
  senderName: string;
  senderRole: string;
  message: string;
  messageType: 'text' | 'file' | 'image';
  fileUrl?: string;
  fileName?: string;
  timestamp: string;
  read: boolean;
}

export interface Chat {
  _id: string;
  applicationId: string;
  participants: Array<{
    userId: string;
    name: string;
    role: string;
  }>;
  lastMessage?: ChatMessage;
  unreadCount: number;
  createdAt: string;
  updatedAt: string;
}

// API Slice
export const apiSlice = createApi({
  reducerPath: 'api',
  baseQuery: fetchBaseQuery({
    baseUrl: '/api',
    prepareHeaders: (headers) => {
      // Only set Content-Type to application/json if it's not already set
      // This allows FormData requests to set their own Content-Type with boundary
      if (!headers.has('content-type')) {
        headers.set('Content-Type', 'application/json');
      }
      return headers;
    },
  }),
  tagTypes: [
    'Statistics',
    'Applications',
    'Application',
    'Notifications',
    'Notification',
    'Users',
    'User',
    'Files',
    'File',
    'Chat',
    'Messages',
    'Message',
    'SupportTickets',
    'SupportTicket',
    'Analytics',
    'Settings',
    'Payments'
  ],
  endpoints: (builder) => ({
    // Statistics endpoints
    getStatistics: builder.query<{ statistics: Statistics }, string>({
      query: (role) => `statistics?role=${role}`,
      providesTags: ['Statistics'],
    }),
    
    // Applications endpoints
    getApplications: builder.query<{ applications: Application[]; total: number }, {
      status?: string;
      limit?: number;
      page?: number;
      userId?: string;
      search?: string;
      sortBy?: string;
    }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
        return `applications?${searchParams.toString()}`;
      },
      providesTags: (result) =>
        result
          ? [
              ...result.applications.map(({ _id }) => ({ type: 'Application' as const, id: _id })),
              { type: 'Applications', id: 'LIST' },
            ]
          : [{ type: 'Applications', id: 'LIST' }],
    }),
    
    getApplicationById: builder.query<{ application: Application }, string>({
      query: (id) => `applications/${id}`,
      providesTags: (result, error, id) => [{ type: 'Application', id }],
    }),
    
    createApplication: builder.mutation<{ applicationId: string }, Partial<Application>>({
      query: (application) => ({
        url: 'applications',
        method: 'POST',
        body: application,
      }),
      invalidatesTags: [
        { type: 'Applications', id: 'LIST' },
        'Statistics'
      ],
    }),

    createApplicationWithFiles: builder.mutation<{ applicationId: string }, FormData>({
      queryFn: async (formData, { signal }) => {
        try {
          // Use native fetch to ensure proper multipart/form-data handling
          const response = await fetch('/api/applications/with-files', {
            method: 'POST',
            body: formData,
            signal,
            // Don't set Content-Type header - let browser set it with boundary
          });

          if (!response.ok) {
            const errorData = await response.json().catch(() => ({ error: 'Unknown error' }));
            return { error: { status: response.status, data: errorData } };
          }

          const data = await response.json();
          return { data };
        } catch (error) {
          return { error: { status: 'FETCH_ERROR', error: String(error) } };
        }
      },
      invalidatesTags: [
        { type: 'Applications', id: 'LIST' },
        { type: 'Files', id: 'LIST' },
        'Statistics'
      ],
    }),

    updateApplicationStatus: builder.mutation<{ application: Application }, { applicationId: string; status: string; comments?: string }>({
      query: ({ applicationId, status, comments }) => ({
        url: `applications/${applicationId}/status`,
        method: 'PUT',
        body: { status, comments },
      }),
      invalidatesTags: (result, error, { applicationId }) => [
        { type: 'Applications', id: applicationId },
        'Applications',
      ],
    }),
    
    // Notifications endpoints
    getNotifications: builder.query<{ notifications: Notification[]; unreadCount: number }, void>({
      query: () => 'notifications',
      providesTags: ['Notifications'],
    }),

    // Payment endpoints
    initiatePayment: builder.mutation<{
      success: boolean;
      paymentId: string;
      transactionRef: string;
      gatewayData: {
        encRequest: string;
        accessCode: string;
        merchantId: string;
        redirectUrl: string;
        cancelUrl: string;
        gatewayUrl: string;
      };
      message: string;
    }, { applicationId: string; amount: number; currency?: string }>({
      query: (data) => ({
        url: 'payment/hdfc/initiate',
        method: 'POST',
        body: data,
      }),
      invalidatesTags: ['Payments'],
    }),

    getPaymentStatus: builder.query<{
      paymentId: string;
      transactionRef: string;
      applicationId: string;
      amount: number;
      currency: string;
      status: string;
      paymentMethod: string;
      gatewayTransactionId?: string;
      failureReason?: string;
      completedAt?: string;
      createdAt: string;
      updatedAt: string;
    }, { paymentId?: string; applicationId?: string }>({
      query: (params) => ({
        url: 'payment/hdfc/initiate',
        params,
      }),
      providesTags: (result, error, { paymentId, applicationId }) => [
        { type: 'Payments', id: paymentId || applicationId },
      ],
    }),

    // Admin payment endpoints
    getAdminPayments: builder.query<{
      payments: Array<{
        _id: string;
        paymentId: string;
        transactionRef: string;
        applicationId: string;
        applicationNumber: string;
        customerName: string;
        customerEmail: string;
        customerPhone: string;
        amount: number;
        currency: string;
        paymentMethod: string;
        status: string;
        gatewayTransactionId?: string;
        failureReason?: string;
        completedAt?: string;
        createdAt: string;
        updatedAt: string;
        metadata: any;
      }>;
      pagination: {
        currentPage: number;
        totalPages: number;
        totalCount: number;
        hasNextPage: boolean;
        hasPrevPage: boolean;
      };
      statistics: {
        totalPayments: number;
        completedPayments: number;
        failedPayments: number;
        pendingPayments: number;
        totalRevenue: number;
        todayRevenue: number;
        monthlyRevenue: number;
        successRate: string;
        paymentMethodStats: Array<{
          _id: string;
          count: number;
          totalAmount: number;
        }>;
        dailyRevenue: Array<{
          date: string;
          revenue: number;
          count: number;
        }>;
      };
    }, {
      page?: number;
      limit?: number;
      status?: string;
      paymentMethod?: string;
      dateFrom?: string;
      dateTo?: string;
      search?: string;
    }>({
      query: (params = {}) => ({
        url: 'admin/payments',
        params,
      }),
      providesTags: ['Payments'],
    }),

    exportPayments: builder.mutation<any, {
      format?: string;
      filters?: any;
    }>({
      query: (data) => ({
        url: 'admin/payments',
        method: 'POST',
        body: data,
      }),
    }),
    
    markNotificationAsRead: builder.mutation<void, string>({
      query: (id) => ({
        url: `notifications/${id}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Notifications'],
    }),
    
    // Users endpoints (Admin only)
    getUsers: builder.query<{ users: User[]; total: number }, { 
      role?: string; 
      limit?: number; 
      page?: number;
    }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
        return `admin/users?${searchParams.toString()}`;
      },
      providesTags: ['Users'],
    }),

    getUserById: builder.query<{ user: User }, string>({
      query: (id) => `admin/users/${id}`,
      providesTags: (result, error, id) => [{ type: 'Users', id }],
    }),

    updateUserStatus: builder.mutation<void, { id: string; status: string }>({
      query: ({ id, status }) => ({
        url: `admin/users/${id}/status`,
        method: 'PATCH',
        body: { status },
      }),
      invalidatesTags: ['Users', 'Statistics'],
    }),

    verifyPayment: builder.mutation<{ success: boolean }, {
      paymentId: string;
      transactionId: string;
      status: string;
    }>({
      query: (verification) => ({
        url: 'payments/verify',
        method: 'POST',
        body: verification,
      }),
      invalidatesTags: ['Applications', 'Statistics'],
    }),

    // File upload endpoints
    uploadFile: builder.mutation<{ file: FileUpload }, FormData>({
      query: (formData) => ({
        url: 'files/upload',
        method: 'POST',
        body: formData,
        // Explicitly don't set Content-Type - let browser handle it for FormData
        prepareHeaders: (headers: Headers) => {
          // Remove any Content-Type header to let browser set it automatically
          headers.delete('content-type');
          return headers;
        },
      }),
      invalidatesTags: (result, error, formData) => {
        const applicationId = formData.get('applicationId') as string;
        return [
          { type: 'Files' as const, id: 'LIST' },
          ...(applicationId ? [{ type: 'Application' as const, id: applicationId }] : []),
        ];
      },
    }),

    getFiles: builder.query<{ files: FileUpload[] }, {
      applicationId?: string;
      documentType?: string;
      userId?: string;
    }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
        return `files?${searchParams.toString()}`;
      },
      providesTags: ['Files'],
    }),

    deleteFile: builder.mutation<{ success: boolean }, string>({
      query: (fileId) => ({
        url: `files/${fileId}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['Files'],
    }),

    // Chat endpoints
    getChats: builder.query<{ chats: Chat[] }, { userId?: string }>({
      query: (params) => {
        const searchParams = new URLSearchParams();
        Object.entries(params).forEach(([key, value]) => {
          if (value !== undefined) {
            searchParams.append(key, value.toString());
          }
        });
        return `chat?${searchParams.toString()}`;
      },
      providesTags: ['Chat'],
    }),

    getChatMessages: builder.query<{ messages: ChatMessage[] }, string>({
      query: (chatId) => `chat/${chatId}/messages`,
      providesTags: ['Messages'],
    }),

    sendMessage: builder.mutation<{ message: ChatMessage }, {
      chatId: string;
      message: string;
      messageType?: 'text' | 'file' | 'image';
      fileUrl?: string;
      fileName?: string;
    }>({
      query: ({ chatId, ...messageData }) => ({
        url: `chat/${chatId}/messages`,
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: ['Messages', 'Chat'],
    }),

    markMessagesAsRead: builder.mutation<{ success: boolean }, string>({
      query: (chatId) => ({
        url: `chat/${chatId}/read`,
        method: 'PATCH',
      }),
      invalidatesTags: ['Messages', 'Chat'],
    }),

    createChat: builder.mutation<{ chat: Chat }, {
      applicationId: string;
      participants: string[];
    }>({
      query: (chatData) => ({
        url: 'chat',
        method: 'POST',
        body: chatData,
      }),
      invalidatesTags: ['Chat'],
    }),

    // Email endpoints
    sendEmail: builder.mutation<{
      success: boolean;
      results: unknown[];
      summary: { total: number; successful: number; failed: number; };
    }, {
      templateName: string;
      templateData: unknown;
      recipients: string | string[];
      options?: unknown;
    }>({
      query: (emailData) => ({
        url: 'email/send',
        method: 'POST',
        body: emailData,
      }),
    }),

    getEmailTemplates: builder.query<{
      templates: Array<{ name: string; displayName: string; description: string; }>;
    }, void>({
      query: () => 'email/send',
    }),

    // User Profile endpoints
    getUserProfile: builder.query<{ profile: unknown }, string>({
      query: (userId) => `users/${userId}/profile`,
      providesTags: ['Users'],
    }),

    updateUserProfile: builder.mutation<{ profile: unknown }, { userId: string; profileData: unknown }>({
      query: ({ userId, profileData }) => ({
        url: `users/${userId}/profile`,
        method: 'PUT',
        body: profileData,
      }),
      invalidatesTags: ['Users'],
    }),

    // Application documents endpoint
    getApplicationDocuments: builder.query<{ documents: unknown[] }, string>({
      query: (applicationId) => `applications/${applicationId}/documents`,
      providesTags: ['Files'],
    }),

    // Support ticket endpoints
    getSupportTickets: builder.query<{ tickets: SupportTicket[]; total: number; page: number; totalPages: number }, {
      status?: string;
      category?: string;
      priority?: string;
      limit?: number;
      page?: number;
      assignedTo?: string;
    }>({
      query: (params) => ({
        url: '/support',
        params,
      }),
      providesTags: ['SupportTicket'],
    }),

    getSupportTicket: builder.query<SupportTicket, string>({
      query: (id) => `/support/${id}`,
      transformResponse: (response: { success: boolean; data: SupportTicket }) => response.data,
      providesTags: (result, error, id) => [{ type: 'SupportTicket', id }],
    }),

    createSupportTicket: builder.mutation<SupportTicket, {
      subject: string;
      description: string;
      category: 'technical' | 'loan_inquiry' | 'document' | 'general';
      priority?: 'low' | 'medium' | 'high' | 'urgent';
    }>({
      query: (ticketData) => ({
        url: '/support',
        method: 'POST',
        body: ticketData,
      }),
      invalidatesTags: ['SupportTicket'],
    }),

    updateSupportTicket: builder.mutation<SupportTicket, {
      ticketId: string;
      status?: string;
      assignedTo?: string;
      resolution?: string;
      message?: string;
    }>({
      query: (updateData) => ({
        url: '/support',
        method: 'PUT',
        body: updateData,
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: 'SupportTicket', id: ticketId },
        'SupportTicket',
      ],
    }),

    addSupportTicketMessage: builder.mutation<SupportTicket, {
      ticketId: string;
      message: string;
      attachments?: Array<{
        fileName: string;
        fileUrl: string;
        fileType: string;
      }>;
    }>({
      query: ({ ticketId, ...messageData }) => ({
        url: `/support/${ticketId}`,
        method: 'POST',
        body: messageData,
      }),
      invalidatesTags: (result, error, { ticketId }) => [
        { type: 'SupportTicket', id: ticketId },
        'SupportTicket',
      ],
    }),

    deleteSupportTicket: builder.mutation<{ success: boolean; message: string }, string>({
      query: (id) => ({
        url: `/support/${id}`,
        method: 'DELETE',
      }),
      invalidatesTags: ['SupportTicket'],
    }),

    // Admin analytics endpoints
    getAnalytics: builder.query<{ analytics: {
      overview: {
        totalApplications: number;
        totalUsers: number;
        totalLoanAmount: number;
        approvalRate: number;
        avgLoanAmount: number;
      };
      trends: {
        applicationTrends: any[];
        statusDistribution: any[];
        loanAmountDistribution: any[];
      };
      performance: {
        dsaPerformance: any[];
        recentApplications: any[];
      };
      timeRange: string;
      generatedAt: string;
    } }, { timeRange?: string }>({
      query: (params) => ({
        url: 'admin/analytics',
        params,
      }),
      providesTags: ['Analytics'],
    }),

    exportAnalytics: builder.mutation<{ exportUrl: string }, { filters?: unknown }>({
      query: (data) => ({
        url: 'admin/analytics',
        method: 'POST',
        body: { action: 'export', ...data },
      }),
    }),

    refreshAnalytics: builder.mutation<{ message: string }, void>({
      query: () => ({
        url: 'admin/analytics',
        method: 'POST',
        body: { action: 'refresh' },
      }),
      invalidatesTags: ['Analytics'],
    }),

    // Admin settings endpoints
    getSettings: builder.query<{ settings: {
      general: {
        siteName: string;
        siteDescription: string;
        supportEmail: string;
        maxFileSize: number;
        allowedFileTypes: string[];
        maintenanceMode: boolean;
      };
      email: {
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPassword: string;
        fromEmail: string;
        fromName: string;
        emailEnabled: boolean;
      };
      notifications: {
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        adminAlerts: boolean;
      };
      security: {
        passwordMinLength: number;
        sessionTimeout: number;
        maxLoginAttempts: number;
        twoFactorAuth: boolean;
        ipWhitelist: string[];
      };
      loan: {
        minLoanAmount: number;
        maxLoanAmount: number;
        defaultInterestRate: number;
        processingFee: number;
        autoApprovalLimit: number;
      };
    } }, void>({
      query: () => ({
        url: 'admin/settings',
      }),
      providesTags: ['Settings'],
    }),

    updateSettings: builder.mutation<{ settings: {
      general: {
        siteName: string;
        siteDescription: string;
        supportEmail: string;
        maxFileSize: number;
        allowedFileTypes: string[];
        maintenanceMode: boolean;
      };
      email: {
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPassword: string;
        fromEmail: string;
        fromName: string;
        emailEnabled: boolean;
      };
      notifications: {
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        adminAlerts: boolean;
      };
      security: {
        passwordMinLength: number;
        sessionTimeout: number;
        maxLoginAttempts: number;
        twoFactorAuth: boolean;
        ipWhitelist: string[];
      };
      loan: {
        minLoanAmount: number;
        maxLoanAmount: number;
        defaultInterestRate: number;
        processingFee: number;
        autoApprovalLimit: number;
      };
    } }, unknown>({
      query: (settings) => ({
        url: 'admin/settings',
        method: 'PUT',
        body: settings,
      }),
      invalidatesTags: ['Settings'],
    }),

    resetSettings: builder.mutation<{ settings: {
      general: {
        siteName: string;
        siteDescription: string;
        supportEmail: string;
        maxFileSize: number;
        allowedFileTypes: string[];
        maintenanceMode: boolean;
      };
      email: {
        smtpHost: string;
        smtpPort: number;
        smtpUser: string;
        smtpPassword: string;
        fromEmail: string;
        fromName: string;
        emailEnabled: boolean;
      };
      notifications: {
        emailNotifications: boolean;
        smsNotifications: boolean;
        pushNotifications: boolean;
        adminAlerts: boolean;
      };
      security: {
        passwordMinLength: number;
        sessionTimeout: number;
        maxLoginAttempts: number;
        twoFactorAuth: boolean;
        ipWhitelist: string[];
      };
      loan: {
        minLoanAmount: number;
        maxLoanAmount: number;
        defaultInterestRate: number;
        processingFee: number;
        autoApprovalLimit: number;
      };
    } }, void>({
      query: () => ({
        url: 'admin/settings',
        method: 'POST',
        body: { action: 'reset' },
      }),
      invalidatesTags: ['Settings'],
    }),

    backupSettings: builder.mutation<{ backupId: string }, void>({
      query: () => ({
        url: 'admin/settings',
        method: 'POST',
        body: { action: 'backup' },
      }),
    }),
  }),
});

// Export hooks
export const {
  useGetStatisticsQuery,
  useGetApplicationsQuery,
  useGetApplicationByIdQuery,
  useCreateApplicationMutation,
  useCreateApplicationWithFilesMutation,
  useUpdateApplicationStatusMutation,
  useGetNotificationsQuery,
  useMarkNotificationAsReadMutation,
  useGetUsersQuery,
  useGetUserByIdQuery,
  useUpdateUserStatusMutation,
  useInitiatePaymentMutation,
  useGetPaymentStatusQuery,
  useGetAdminPaymentsQuery,
  useExportPaymentsMutation,
  useVerifyPaymentMutation,
  useUploadFileMutation,
  useGetFilesQuery,
  useDeleteFileMutation,
  useGetChatsQuery,
  useGetChatMessagesQuery,
  useSendMessageMutation,
  useMarkMessagesAsReadMutation,
  useCreateChatMutation,
  useSendEmailMutation,
  useGetEmailTemplatesQuery,
  useGetUserProfileQuery,
  useUpdateUserProfileMutation,
  useGetApplicationDocumentsQuery,
  useGetSupportTicketsQuery,
  useGetSupportTicketQuery,
  useCreateSupportTicketMutation,
  useUpdateSupportTicketMutation,
  useAddSupportTicketMessageMutation,
  useDeleteSupportTicketMutation,
  useGetAnalyticsQuery,
  useExportAnalyticsMutation,
  useRefreshAnalyticsMutation,
  useGetSettingsQuery,
  useUpdateSettingsMutation,
  useResetSettingsMutation,
  useBackupSettingsMutation,
} = apiSlice;
