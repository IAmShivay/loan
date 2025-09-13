# 🏦 Loan Management System

A comprehensive NextJS-based loan management system for education loans with multi-role architecture.

## 🚀 Features

### 🔐 Authentication & Authorization
- **Multi-role system**: Admin, DSA (Direct Selling Agent), User
- **Secure authentication** with NextAuth.js and JWT
- **Email verification** and password reset functionality
- **Role-based access control** with middleware protection

### 💼 User Dashboard
- **Loan application management** with step-by-step process
- **Document upload** with Cloudinary integration
- **Real-time chat** with assigned DSAs
- **Payment processing** with service charge handling
- **Application tracking** with status updates
- **Profile management** with comprehensive user data

### 👥 DSA Dashboard
- **Application review system** with approve/reject functionality
- **Multi-DSA approval workflow** - multiple DSAs can independently review
- **Commission tracking** with detailed analytics
- **Real-time chat** with applicants
- **Performance metrics** and success rate tracking

### 🛠️ Admin Dashboard
- **User management** with verification controls
- **DSA management** and assignment
- **Application oversight** with comprehensive reporting
- **System analytics** and performance metrics
- **Support ticket management**

### 💬 Real-time Communication
- **Chat system** with file sharing capabilities
- **Real-time updates** with 3-second polling
- **File upload in chat** with Cloudinary integration
- **Message history** and read status tracking

### 📧 Email System
- **SMTP integration** with nodemailer
- **Automated notifications** for all major events
- **Template-based emails** for consistency
- **Welcome emails**, password reset, status updates

### 💳 Payment Integration
- **Service charge processing** (₹99 application fee)
- **Double payment prevention** with proper validation
- **Payment status tracking** and verification
- **Indian currency formatting** throughout the system

### 📊 Advanced Features
- **Redux Toolkit Query** for efficient API management
- **Professional skeleton loading** instead of spinners
- **Comprehensive fallback system** to prevent NaN/undefined values
- **Responsive design** with shadcn/ui components
- **TypeScript strict mode** for type safety

## 🏗️ Technical Architecture

### Frontend
- **Next.js 15** with App Router
- **TypeScript** for type safety
- **Tailwind CSS** for styling
- **shadcn/ui** for UI components
- **Redux Toolkit Query** for state management
- **NextAuth.js** for authentication

### Backend
- **Next.js API Routes** for serverless functions
- **MongoDB** with Mongoose ODM
- **Cloudinary** for file storage
- **Nodemailer** for email services
- **Zod** for validation

### Database Models
- **User**: Complete user profiles with education/financial info
- **LoanApplication**: Comprehensive application data
- **FileUpload**: Document management with Cloudinary
- **Chat**: Real-time messaging system
- **Notification**: System notifications
- **SupportTicket**: Customer support system

## 🚦 Getting Started

### Prerequisites
- Node.js 18+ 
- MongoDB database
- Cloudinary account
- SMTP email service

### Installation

1. **Clone the repository**
```bash
git clone <repository-url>
cd loan-management-system
```

2. **Install dependencies**
```bash
npm install
```

3. **Environment Setup**
Create `.env.local` file:
```env
# Database
MONGODB_URI=your_mongodb_connection_string

# NextAuth
NEXTAUTH_SECRET=your_nextauth_secret
NEXTAUTH_URL=http://localhost:3000

# Cloudinary
CLOUDINARY_CLOUD_NAME=your_cloud_name
CLOUDINARY_API_KEY=your_api_key
CLOUDINARY_API_SECRET=your_api_secret

# Email (SMTP)
SMTP_HOST=your_smtp_host
SMTP_PORT=587
SMTP_USER=your_email
SMTP_PASS=your_password
SMTP_FROM=your_from_email
```

4. **Run the development server**
```bash
npm run dev
```

5. **Build for production**
```bash
npm run build
npm start
```

## 📱 User Roles & Workflows

### 👤 User Workflow
1. **Registration** → Email verification
2. **Profile completion** → Personal, education, financial info
3. **Loan application** → Step-by-step form with document upload
4. **Payment** → ₹99 service charge
5. **DSA assignment** → System assigns multiple DSAs
6. **Review process** → DSAs independently review
7. **DSA selection** → User chooses preferred DSA
8. **Communication** → Real-time chat with selected DSA
9. **Final approval** → Loan processing completion

### 🏢 DSA Workflow
1. **Registration** → Admin verification required
2. **Application assignment** → Receive applications to review
3. **Document review** → Approve/reject with comments
4. **User communication** → Chat with applicants
5. **Commission tracking** → Monitor earnings and performance

### 👨‍💼 Admin Workflow
1. **User management** → Verify users and DSAs
2. **System oversight** → Monitor all applications
3. **DSA assignment** → Assign DSAs to applications
4. **Analytics** → View system performance metrics
5. **Support** → Handle customer support tickets

## 🔧 API Documentation

### Authentication Endpoints
- `POST /api/auth/register` - User registration
- `POST /api/auth/login` - User login (NextAuth)
- `POST /api/auth/forgot-password` - Password reset request
- `POST /api/auth/reset-password` - Password reset confirmation

### Application Endpoints
- `GET /api/applications` - Get applications (with filters)
- `POST /api/applications` - Create new application
- `GET /api/applications/[id]` - Get specific application
- `PUT /api/applications/[id]` - Update application
- `POST /api/applications/[id]/assign-dsas` - Assign DSAs
- `POST /api/applications/[id]/reviews` - Submit DSA review
- `POST /api/applications/[id]/select-dsa` - User selects DSA

### File Management
- `POST /api/files/upload` - Upload files to Cloudinary
- `GET /api/files/[fileId]` - Get file details
- `DELETE /api/files/[fileId]` - Delete file
- `GET /api/applications/[id]/documents` - Get application documents

### Chat System
- `GET /api/chat` - Get user chats
- `POST /api/chat` - Create new chat
- `GET /api/chat/[chatId]/messages` - Get chat messages
- `POST /api/chat/[chatId]/messages` - Send message
- `PUT /api/chat/[chatId]/read` - Mark messages as read

### Payment System
- `POST /api/payments/initiate` - Initiate payment
- `POST /api/payments/verify` - Verify payment status

### User Management
- `GET /api/users/profile` - Get user profile
- `PUT /api/users/profile` - Update user profile
- `GET /api/users/[userId]/profile` - Get specific user profile
- `PUT /api/users/[userId]/profile` - Update specific user profile

### Admin Endpoints
- `GET /api/admin/users` - Get all users
- `PUT /api/admin/users/[id]/status` - Update user status
- `PUT /api/admin/users/[id]/verify` - Verify user

### Statistics & Analytics
- `GET /api/statistics` - Get system statistics
- `GET /api/notifications` - Get user notifications

## 🎨 UI Components

### Reusable Components
- **DashboardLayout** - Main layout with navigation
- **FileUpload** - Cloudinary file upload with progress
- **SkeletonLoader** - Professional loading states
- **CurrencyDisplay** - Indian currency formatting
- **StatusBadge** - Application status indicators
- **ChatInterface** - Real-time messaging UI

### Form Components
- **ApplicationForm** - Multi-step loan application
- **ProfileForm** - User profile management
- **DocumentUpload** - Document management interface

## 🔒 Security Features

- **JWT-based authentication** with secure token handling
- **Role-based access control** with middleware protection
- **Input validation** with Zod schemas
- **File upload security** with type and size restrictions
- **CSRF protection** with NextAuth.js
- **Environment variable protection** for sensitive data

## 📊 Performance Optimizations

- **RTK Query caching** for efficient API calls
- **Image optimization** with Next.js Image component
- **Code splitting** with dynamic imports
- **Database indexing** for faster queries
- **Skeleton loading** for better UX
- **Fallback values** to prevent UI breaks

## 🐛 Troubleshooting

### Common Issues

1. **Build Errors**
   - Ensure all environment variables are set
   - Check TypeScript errors with `npx tsc --noEmit`
   - Clear `.next` folder and rebuild

2. **Database Connection**
   - Verify MongoDB URI format
   - Check network connectivity
   - Ensure database user has proper permissions

3. **File Upload Issues**
   - Verify Cloudinary credentials
   - Check file size limits
   - Ensure proper CORS settings

4. **Email Not Sending**
   - Verify SMTP credentials
   - Check firewall settings
   - Test with different email providers

## 📞 Support

For technical support or questions:
- Create an issue in the repository
- Check the troubleshooting section
- Review the API documentation
- Contact the development team

## 🚀 Deployment

### Vercel Deployment
1. Connect repository to Vercel
2. Set environment variables
3. Deploy with automatic builds

### Manual Deployment
1. Build the application: `npm run build`
2. Start production server: `npm start`
3. Configure reverse proxy (nginx/Apache)
4. Set up SSL certificates

---

**Built with ❤️ using Next.js, TypeScript, and modern web technologies**
