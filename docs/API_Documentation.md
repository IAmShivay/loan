# 🔌 API Documentation

## Base URL
```
http://localhost:3000 (Development)
https://yourdomain.com (Production)
```

## Authentication
Most endpoints require authentication using JWT tokens. Include the token in the Authorization header:
```
Authorization: Bearer <your_jwt_token>
```

## Response Format
All API responses follow this structure:
```json
{
  "success": true,
  "data": { ... },
  "message": "Success message",
  "error": null
}
```

Error responses:
```json
{
  "success": false,
  "data": null,
  "message": "Error message",
  "error": "Detailed error information"
}
```

---

## 🔐 Authentication Endpoints

### Register User
**POST** `/api/auth/register`

Register a new user account.

**Request Body:**
```json
{
  "firstName": "John",
  "lastName": "Doe",
  "email": "john.doe@example.com",
  "password": "password123",
  "phone": "+91-9876543210",
  "role": "user" // "user", "dsa", "admin"
}
```

**Response:**
```json
{
  "success": true,
  "message": "User registered successfully. Please check your email for verification.",
  "data": {
    "userId": "user_id",
    "email": "john.doe@example.com"
  }
}
```

### Login (NextAuth)
**POST** `/api/auth/signin`

Authenticate user and get session.

**Request Body:**
```json
{
  "email": "john.doe@example.com",
  "password": "password123"
}
```

### Forgot Password
**POST** `/api/auth/forgot-password`

Request password reset email.

**Request Body:**
```json
{
  "email": "john.doe@example.com"
}
```

### Reset Password
**POST** `/api/auth/reset-password`

Reset password using token from email.

**Request Body:**
```json
{
  "token": "reset_token_from_email",
  "password": "newpassword123"
}
```

---

## 📋 Application Endpoints

### Get Applications
**GET** `/api/applications`

Retrieve applications with filtering and pagination.

**Query Parameters:**
- `status` (optional): Filter by status (pending, approved, rejected)
- `limit` (optional): Number of results per page (default: 10)
- `page` (optional): Page number (default: 1)
- `search` (optional): Search term for applicant name/email
- `userId` (optional): Filter by specific user ID
- `sortBy` (optional): Sort field (createdAt, amount, status)

**Response:**
```json
{
  "success": true,
  "data": {
    "applications": [
      {
        "_id": "app_id",
        "applicationId": "APP-2024-001",
        "status": "pending",
        "personalInfo": {
          "firstName": "John",
          "lastName": "Doe",
          "email": "john@example.com"
        },
        "loanInfo": {
          "amount": 400000,
          "purpose": "Education loan"
        },
        "createdAt": "2024-01-01T00:00:00.000Z"
      }
    ],
    "total": 25,
    "page": 1,
    "totalPages": 3
  }
}
```

### Create Application
**POST** `/api/applications`

Create a new loan application.

**Request Body:**
```json
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "email": "john.doe@example.com",
    "phone": "+91-9876543210",
    "dateOfBirth": "1995-01-01"
  },
  "addressInfo": {
    "address": "123 Main Street",
    "city": "Mumbai",
    "state": "Maharashtra",
    "pincode": "400001"
  },
  "educationInfo": {
    "instituteName": "IIT Mumbai",
    "course": "Computer Science",
    "duration": "4 years",
    "feeStructure": 500000,
    "admissionDate": "2023-07-01"
  },
  "loanInfo": {
    "amount": 400000,
    "purpose": "Education loan for engineering"
  },
  "financialInfo": {
    "annualIncome": 800000,
    "employmentType": "Salaried",
    "employerName": "Tech Corp"
  }
}
```

### Get Application by ID
**GET** `/api/applications/{applicationId}`

Get detailed information about a specific application.

### Assign DSAs to Application
**POST** `/api/applications/{applicationId}/assign-dsas`

Assign multiple DSAs to review an application (Admin only).

**Request Body:**
```json
{
  "dsaIds": ["dsa_id_1", "dsa_id_2", "dsa_id_3"]
}
```

### Submit DSA Review
**POST** `/api/applications/{applicationId}/reviews`

Submit DSA review for an application (DSA only).

**Request Body:**
```json
{
  "decision": "approved", // "approved", "rejected"
  "comments": "Application looks good. All documents are in order.",
  "recommendedAmount": 350000
}
```

### Select DSA
**POST** `/api/applications/{applicationId}/select-dsa`

User selects preferred DSA from approved reviews.

**Request Body:**
```json
{
  "dsaId": "selected_dsa_id"
}
```

---

## 📁 File Management Endpoints

### Upload File
**POST** `/api/files/upload`

Upload file to Cloudinary.

**Request Body (multipart/form-data):**
- `file`: File to upload
- `documentType`: Type of document (aadhar_card, pan_card, etc.)
- `applicationId` (optional): Associated application ID

**Response:**
```json
{
  "success": true,
  "data": {
    "fileId": "file_id",
    "fileName": "document.pdf",
    "fileUrl": "https://res.cloudinary.com/...",
    "fileSize": 1024000,
    "documentType": "aadhar_card"
  }
}
```

### Get File Details
**GET** `/api/files/{fileId}`

Get file information and metadata.

### Delete File
**DELETE** `/api/files/{fileId}`

Soft delete a file.

### Get Application Documents
**GET** `/api/applications/{applicationId}/documents`

Get all documents associated with an application.

---

## 💬 Chat System Endpoints

### Get User Chats
**GET** `/api/chat`

Get all chats for the authenticated user.

### Create New Chat
**POST** `/api/chat`

Start a new chat conversation.

**Request Body:**
```json
{
  "participantId": "dsa_user_id",
  "applicationId": "application_id",
  "message": "Hello, I have questions about my application."
}
```

### Get Chat Messages
**GET** `/api/chat/{chatId}/messages`

Get messages from a specific chat.

**Query Parameters:**
- `limit` (optional): Number of messages (default: 50)
- `page` (optional): Page number (default: 1)

### Send Message
**POST** `/api/chat/{chatId}/messages`

Send a message in a chat.

**Request Body:**
```json
{
  "message": "Thank you for your response.",
  "fileUrl": "https://res.cloudinary.com/document.pdf", // optional
  "fileName": "document.pdf" // optional
}
```

### Mark Messages as Read
**PUT** `/api/chat/{chatId}/read`

Mark all messages in a chat as read.

---

## 💳 Payment System Endpoints

### Initiate Payment
**POST** `/api/payments/initiate`

Start payment process for service charges.

**Request Body:**
```json
{
  "applicationId": "application_id",
  "amount": 99,
  "currency": "INR",
  "paymentMethod": "card"
}
```

### Verify Payment
**POST** `/api/payments/verify`

Verify payment completion.

**Request Body:**
```json
{
  "paymentId": "payment_id_from_gateway",
  "applicationId": "application_id"
}
```

---

## 👤 User Management Endpoints

### Get User Profile
**GET** `/api/users/profile`

Get current user's profile information.

### Update User Profile
**PUT** `/api/users/profile`

Update current user's profile.

**Request Body:**
```json
{
  "personalInfo": {
    "firstName": "John",
    "lastName": "Doe",
    "phone": "+91-9876543210",
    "address": "Updated address"
  },
  "educationInfo": {
    "currentInstitution": "University Name",
    "course": "Course Name"
  },
  "financialInfo": {
    "annualIncome": 900000,
    "employmentType": "Salaried"
  }
}
```

### Get Specific User Profile
**GET** `/api/users/{userId}/profile`

Get specific user's profile (Admin/DSA access).

### Update Specific User Profile
**PUT** `/api/users/{userId}/profile`

Update specific user's profile (Admin access).

---

## 🛠️ Admin Endpoints

### Get All Users
**GET** `/api/admin/users`

Get all users with filtering (Admin only).

**Query Parameters:**
- `role` (optional): Filter by role
- `status` (optional): Filter by status
- `limit` (optional): Results per page
- `page` (optional): Page number

### Update User Status
**PUT** `/api/admin/users/{userId}/status`

Update user account status (Admin only).

**Request Body:**
```json
{
  "status": "suspended", // "active", "suspended", "banned"
  "reason": "Reason for status change"
}
```

### Verify User
**PUT** `/api/admin/users/{userId}/verify`

Verify user account (Admin only).

**Request Body:**
```json
{
  "verified": true,
  "verificationNotes": "All documents verified"
}
```

---

## 📊 Statistics & Notifications

### Get System Statistics
**GET** `/api/statistics`

Get system analytics and statistics.

**Query Parameters:**
- `role` (optional): Get role-specific statistics

### Get User Notifications
**GET** `/api/notifications`

Get user notifications.

**Query Parameters:**
- `limit` (optional): Number of notifications
- `unread` (optional): Filter unread notifications

### Mark Notification as Read
**PUT** `/api/notifications`

Mark notification as read.

**Request Body:**
```json
{
  "notificationId": "notification_id"
}
```

---

## 📧 Email System

### Send Email
**POST** `/api/email/send`

Send templated email (Internal use).

**Request Body:**
```json
{
  "to": "user@example.com",
  "template": "welcome", // "welcome", "reset_password", "application_status"
  "data": {
    "firstName": "John",
    "applicationId": "APP-2024-001"
  }
}
```

---

## Error Codes

| Code | Description |
|------|-------------|
| 400 | Bad Request - Invalid input data |
| 401 | Unauthorized - Authentication required |
| 403 | Forbidden - Insufficient permissions |
| 404 | Not Found - Resource doesn't exist |
| 409 | Conflict - Resource already exists |
| 422 | Unprocessable Entity - Validation failed |
| 500 | Internal Server Error - Server error |

---

## Rate Limiting

API endpoints are rate-limited to prevent abuse:
- Authentication endpoints: 5 requests per minute
- File upload endpoints: 10 requests per minute
- General endpoints: 100 requests per minute

---

## Webhooks

The system supports webhooks for real-time notifications:
- Application status changes
- Payment confirmations
- Chat message notifications
- Document upload confirmations

Configure webhook URLs in the admin panel.
