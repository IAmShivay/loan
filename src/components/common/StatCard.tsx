'use client';

import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { cn } from '@/lib/utils';
import {
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  HelpCircle,
  Calculator,
  MessageSquare,
  Plus,
  Eye,
  AlertTriangle,
  DollarSign,
  Target
} from 'lucide-react';

const iconMap = {
  Users,
  FileText,
  Clock,
  CheckCircle,
  XCircle,
  TrendingUp,
  HelpCircle,
  Calculator,
  MessageSquare,
  Plus,
  Eye,
  AlertTriangle,
  DollarSign,
  Target,
};

type IconName = keyof typeof iconMap;

interface StatCardProps {
  title: string;
  value: string | number;
  description?: string;
  icon?: IconName;
  trend?: {
    value: number;
    isPositive: boolean;
  };
  className?: string;
}

export default function StatCard({
  title,
  value,
  description,
  icon,
  trend,
  className
}: StatCardProps) {
  const Icon = icon ? iconMap[icon] : null;

  return (
    <Card className={cn(
      "bg-white border border-slate-200 hover:shadow-md transition-all duration-200 hover:border-slate-300",
      className
    )}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2 p-4 sm:p-6">
        <CardTitle className="text-xs sm:text-sm font-medium text-slate-600 uppercase tracking-wide">
          {title}
        </CardTitle>
        {Icon && (
          <div className="p-1.5 sm:p-2 bg-blue-50 rounded-lg">
            <Icon className="h-4 w-4 sm:h-5 sm:w-5 text-blue-600" />
          </div>
        )}
      </CardHeader>
      <CardContent className="space-y-2 sm:space-y-3 p-4 sm:p-6 pt-0">
        <div className="text-xl sm:text-2xl font-bold text-slate-900">{value}</div>
        {(description || trend) && (
          <div className="flex items-center justify-between text-xs sm:text-sm">
            {description && (
              <span className="text-slate-500 truncate">{description}</span>
            )}
            {trend && (
              <span className={cn(
                "flex items-center font-medium px-2 py-1 rounded-full text-xs flex-shrink-0 ml-2",
                trend.isPositive
                  ? "text-green-700 bg-green-50"
                  : "text-red-700 bg-red-50"
              )}>
                {trend.isPositive ? "↗" : "↘"} {trend.isPositive ? "+" : ""}{trend.value}%
              </span>
            )}
          </div>
        )}
      </CardContent>
    </Card>
  );
}
