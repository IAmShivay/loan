'use client';

import { Badge } from '@/components/ui/badge';
import { cn } from '@/lib/utils';

interface StatusBadgeProps {
  status: string;
  className?: string;
}

export default function StatusBadge({ status, className }: StatusBadgeProps) {
  const getStatusConfig = (status: string) => {
    const normalizedStatus = status.toLowerCase();
    
    switch (normalizedStatus) {
      case 'pending':
        return { variant: 'secondary' as const, label: 'Pending' };
      case 'under_review':
        return { variant: 'default' as const, label: 'Under Review' };
      case 'approved':
        return { variant: 'default' as const, label: 'Approved', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
      case 'rejected':
        return { variant: 'destructive' as const, label: 'Rejected' };
      case 'open':
        return { variant: 'default' as const, label: 'Open' };
      case 'in_progress':
        return { variant: 'default' as const, label: 'In Progress', className: 'bg-blue-100 text-blue-800 hover:bg-blue-100' };
      case 'resolved':
        return { variant: 'default' as const, label: 'Resolved', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
      case 'closed':
        return { variant: 'outline' as const, label: 'Closed' };
      case 'active':
        return { variant: 'default' as const, label: 'Active', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
      case 'inactive':
        return { variant: 'secondary' as const, label: 'Inactive' };
      case 'verified':
        return { variant: 'default' as const, label: 'Verified', className: 'bg-green-100 text-green-800 hover:bg-green-100' };
      case 'unverified':
        return { variant: 'destructive' as const, label: 'Unverified' };
      case 'low':
        return { variant: 'outline' as const, label: 'Low' };
      case 'medium':
        return { variant: 'secondary' as const, label: 'Medium' };
      case 'high':
        return { variant: 'default' as const, label: 'High', className: 'bg-orange-100 text-orange-800 hover:bg-orange-100' };
      case 'urgent':
        return { variant: 'destructive' as const, label: 'Urgent' };
      default:
        return { variant: 'outline' as const, label: status };
    }
  };

  const config = getStatusConfig(status);

  return (
    <Badge 
      variant={config.variant} 
      className={cn(config.className, className)}
    >
      {config.label}
    </Badge>
  );
}
