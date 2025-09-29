# CLAUDE.md

This file provides guidance to Claude Code (claude.ai/code) when working with code in this repository.

## Development Commands

- **Development server**: `npm run dev` (uses Turbopack)
- **Build**: `npm run build`
- **Production server**: `npm start`
- **Linting**: `npm run lint` (check) or `npm run lint:fix` (fix)
- **Type checking**: `npm run type-check`
- **Database seeding**: `npm run seed`
- **Generate Postman collection**: `npm run postman`

## Project Architecture

This is a Next.js 15 loan management system with multi-role authentication (admin, DSA, user) and multi-bank support.

### Core Architecture

**Authentication & Authorization**:
- NextAuth.js with credentials provider (`src/lib/auth/config.ts`)
- Role-based routing via middleware (`src/middleware.ts`)
- Protected routes: `/admin`, `/dsa`, `/user` with role-specific access
- DSA verification requirement for DSA role access

**Database**:
- MongoDB with Mongoose ODM
- Connection management with caching (`src/lib/db/connection.ts`)
- Models: User, LoanApplication, ChatMessage, SupportTicket, DSAActivity, SystemLog

**State Management**:
- Redux Toolkit with RTK Query for API calls (`src/store/`)
- Session management via NextAuth

**File Structure**:
- App Router with route groups: `(auth)` for login/register
- Role-based dashboards: `/admin`, `/dsa`, `/user`
- API routes under `/api` with role-specific endpoints
- Shared components in `/components` with UI components from Radix UI

### Key Business Logic

**Multi-DSA Assignment System**:
- Applications can be assigned to multiple DSAs simultaneously
- DSA reviews are tracked per application with approval thresholds
- Primary DSA field maintained for backward compatibility

**Document Management**:
- File uploads via Cloudinary integration
- Document status tracking (pending/approved/rejected)
- Support for multiple document types per application

**Role Permissions**:
- **Admin**: Full system access, user management, DSA assignments
- **DSA**: Review assigned applications, chat with users
- **User**: Create applications, upload documents, track status

### Environment Requirements

Required environment variables:
- `MONGODB_URI`: MongoDB connection string
- `NEXTAUTH_SECRET`: Authentication secret
- `CLOUDINARY_*`: File upload configuration

### Development Notes

- Uses TypeScript with strict type checking
- Tailwind CSS with shadcn/ui components
- Winston logging for system events
- Socket.io for real-time chat functionality
- Email service integration with Nodemailer
- Payment gateway integration (HDFC)

When working with this codebase:
1. Always run type checking before committing changes
2. Follow the existing role-based routing patterns
3. Use the established database models and connection patterns
4. Maintain the multi-DSA assignment logic when modifying application workflows