import { NextRequest, NextResponse } from 'next/server';
import { getAuthSession } from '@/lib/auth/utils';
import connectDB from '@/lib/db/connection';
import LoanApplication from '@/lib/db/models/LoanApplication';

export async function GET(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    await connectDB();

    const { searchParams } = new URL(request.url);
    const limit = parseInt(searchParams.get('limit') || '10');
    const unreadOnly = searchParams.get('unread') === 'true';

    let notifications: Array<Record<string, unknown>> = [];

    if (session.user.role === 'admin') {
      // Admin notifications - system-wide alerts
      const [
        newApplications,
        highPriorityApplications,
        pendingApprovals,
        systemAlerts
      ] = await Promise.all([
        // New applications in last 24 hours
        LoanApplication.find({
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).populate('userId', 'firstName lastName').limit(5),
        
        // High priority applications
        LoanApplication.find({
          priority: 'high',
          status: { $in: ['pending', 'under_review'] }
        }).populate('userId', 'firstName lastName').limit(3),
        
        // Applications pending approval
        LoanApplication.find({
          status: 'pending_approval',
          updatedAt: { $lte: new Date(Date.now() - 48 * 60 * 60 * 1000) }
        }).populate('userId', 'firstName lastName').limit(3),
        
        // System alerts (mock data for now)
        []
      ]);

      // Convert to notification format
      newApplications.forEach(app => {
        notifications.push({
          id: `new_app_${app._id}`,
          type: 'new_application',
          title: 'New Application Received',
          message: `${app.userId.firstName} ${app.userId.lastName} submitted a new loan application`,
          timestamp: app.createdAt.toISOString(),
          read: false,
          icon: 'FileText',
          iconColor: 'text-blue-600',
          data: { applicationId: app._id }
        });
      });

      highPriorityApplications.forEach(app => {
        notifications.push({
          id: `high_priority_${app._id}`,
          type: 'high_priority',
          title: 'High Priority Application',
          message: `Application ${app.applicationId} requires immediate attention`,
          timestamp: app.createdAt.toISOString(),
          read: false,
          icon: 'AlertTriangle',
          iconColor: 'text-red-600',
          data: { applicationId: app._id }
        });
      });

      pendingApprovals.forEach(app => {
        notifications.push({
          id: `pending_approval_${app._id}`,
          type: 'pending_approval',
          title: 'Approval Pending',
          message: `Application ${app.applicationId} has been pending approval for 2+ days`,
          timestamp: app.updatedAt.toISOString(),
          read: false,
          icon: 'Clock',
          iconColor: 'text-yellow-600',
          data: { applicationId: app._id }
        });
      });

    } else if (session.user.role === 'dsa') {
      // DSA notifications - assigned applications and updates
      const [
        newAssignments,
        documentUpdates,
        approvalUpdates,
        deadlineReminders
      ] = await Promise.all([
        // New applications assigned to this DSA
        LoanApplication.find({
          assignedDSAs: session.user.id,
          createdAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).populate('userId', 'firstName lastName').limit(5),

        // Applications with new document uploads
        LoanApplication.find({
          assignedDSAs: session.user.id,
          updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).populate('userId', 'firstName lastName').limit(3),

        // Applications with status updates
        LoanApplication.find({
          assignedDSAs: session.user.id,
          status: { $in: ['approved', 'rejected'] },
          updatedAt: { $gte: new Date(Date.now() - 24 * 60 * 60 * 1000) }
        }).populate('userId', 'firstName lastName').limit(3),

        // Applications approaching deadline
        LoanApplication.find({
          assignedDSAs: session.user.id,
          status: { $in: ['pending', 'under_review'] },
          createdAt: { $lte: new Date(Date.now() - 10 * 24 * 60 * 60 * 1000) }
        }).populate('userId', 'firstName lastName').limit(3)
      ]);

      newAssignments.forEach(app => {
        notifications.push({
          id: `new_assignment_${app._id}`,
          type: 'new_assignment',
          title: 'New Application Assigned',
          message: `You have been assigned application ${app.applicationId} from ${app.userId.firstName} ${app.userId.lastName}`,
          timestamp: app.createdAt.toISOString(),
          read: false,
          icon: 'UserPlus',
          iconColor: 'text-blue-600',
          data: { applicationId: app._id }
        });
      });

      documentUpdates.forEach(app => {
        notifications.push({
          id: `doc_update_${app._id}`,
          type: 'document_update',
          title: 'Documents Updated',
          message: `${app.userId.firstName} ${app.userId.lastName} uploaded new documents for application ${app.applicationId}`,
          timestamp: app.updatedAt.toISOString(),
          read: false,
          icon: 'Upload',
          iconColor: 'text-green-600',
          data: { applicationId: app._id }
        });
      });

      approvalUpdates.forEach(app => {
        const isApproved = app.status === 'approved';
        notifications.push({
          id: `approval_update_${app._id}`,
          type: 'approval_update',
          title: `Application ${isApproved ? 'Approved' : 'Rejected'}`,
          message: `Application ${app.applicationId} has been ${app.status}`,
          timestamp: app.updatedAt.toISOString(),
          read: false,
          icon: isApproved ? 'CheckCircle' : 'XCircle',
          iconColor: isApproved ? 'text-green-600' : 'text-red-600',
          data: { applicationId: app._id }
        });
      });

      deadlineReminders.forEach(app => {
        notifications.push({
          id: `deadline_${app._id}`,
          type: 'deadline_reminder',
          title: 'Review Deadline Approaching',
          message: `Application ${app.applicationId} has been pending review for over 10 days`,
          timestamp: new Date().toISOString(),
          read: false,
          icon: 'Clock',
          iconColor: 'text-orange-600',
          data: { applicationId: app._id }
        });
      });

    } else if (session.user.role === 'user') {
      // User notifications - their application updates
      const [
        statusUpdates,
        documentRequests,
        approvalNotifications,
        dsaMessages
      ] = await Promise.all([
        // Applications with status updates
        LoanApplication.find({
          userId: session.user.id,
          updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).populate('assignedDSAs', 'firstName lastName').limit(5),
        
        // Applications requiring documents
        LoanApplication.find({
          userId: session.user.id,
          status: 'documents_required'
        }).limit(3),
        
        // Recent approvals/rejections
        LoanApplication.find({
          userId: session.user.id,
          status: { $in: ['approved', 'rejected'] },
          updatedAt: { $gte: new Date(Date.now() - 7 * 24 * 60 * 60 * 1000) }
        }).limit(3),
        
        // Mock DSA messages (would come from a messages collection)
        []
      ]);

      statusUpdates.forEach(app => {
        notifications.push({
          id: `status_update_${app._id}`,
          type: 'status_update',
          title: 'Application Status Updated',
          message: `Your application ${app.applicationId} status has been updated to ${app.status.replace('_', ' ')}`,
          timestamp: app.updatedAt.toISOString(),
          read: false,
          icon: 'RefreshCw',
          iconColor: 'text-blue-600',
          data: { applicationId: app._id }
        });
      });

      documentRequests.forEach(app => {
        notifications.push({
          id: `doc_request_${app._id}`,
          type: 'document_request',
          title: 'Documents Required',
          message: `Please upload the required documents for application ${app.applicationId}`,
          timestamp: app.updatedAt.toISOString(),
          read: false,
          icon: 'FileText',
          iconColor: 'text-orange-600',
          data: { applicationId: app._id }
        });
      });

      approvalNotifications.forEach(app => {
        const isApproved = app.status === 'approved';
        notifications.push({
          id: `approval_${app._id}`,
          type: 'approval_notification',
          title: `Application ${isApproved ? 'Approved' : 'Rejected'}`,
          message: `Your loan application ${app.applicationId} has been ${app.status}`,
          timestamp: app.updatedAt.toISOString(),
          read: false,
          icon: isApproved ? 'CheckCircle' : 'XCircle',
          iconColor: isApproved ? 'text-green-600' : 'text-red-600',
          data: { applicationId: app._id }
        });
      });
    }

    // Sort by timestamp (newest first) and limit
    notifications.sort((a, b) => new Date(b.timestamp as string).getTime() - new Date(a.timestamp as string).getTime());
    
    if (unreadOnly) {
      notifications = notifications.filter(n => !n.read);
    }
    
    notifications = notifications.slice(0, limit);

    // Add formatted timestamp
    notifications.forEach(notification => {
      const date = new Date(notification.timestamp as string);
      const now = new Date();
      const diffInHours = (now.getTime() - date.getTime()) / (1000 * 60 * 60);
      
      if (diffInHours < 1) {
        notification.timeAgo = 'Just now';
      } else if (diffInHours < 24) {
        notification.timeAgo = `${Math.floor(diffInHours)}h ago`;
      } else {
        const diffInDays = Math.floor(diffInHours / 24);
        notification.timeAgo = `${diffInDays}d ago`;
      }
    });

    const unreadCount = notifications.filter(n => !n.read).length;

    return NextResponse.json({
      notifications,
      unreadCount,
      total: notifications.length
    });

  } catch (error) {
    console.error('Error fetching notifications:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}

export async function PUT(request: NextRequest) {
  try {
    const session = await getAuthSession();
    if (!session?.user) {
      return NextResponse.json({ error: 'Unauthorized' }, { status: 401 });
    }

    const body = await request.json();
    const { notificationId, markAllAsRead } = body;

    // TODO: Implement notification read status in database
    // For now, return success
    return NextResponse.json({ message: 'Notification marked as read' });

  } catch (error) {
    console.error('Error updating notification:', error);
    return NextResponse.json(
      { error: 'Internal server error' },
      { status: 500 }
    );
  }
}
