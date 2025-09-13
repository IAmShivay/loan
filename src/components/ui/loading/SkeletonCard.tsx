import { Card, CardContent, CardHeader } from '@/components/ui/card';
import { Skeleton } from '@/components/ui/skeleton';

interface SkeletonCardProps {
  showIcon?: boolean;
  showTrend?: boolean;
  className?: string;
}

export function SkeletonCard({ showIcon = true, showTrend = false, className }: SkeletonCardProps) {
  return (
    <Card className={`bg-white border border-slate-200 ${className}`}>
      <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
        <Skeleton className="h-4 w-24" />
        {showIcon && (
          <div className="p-1.5 sm:p-2 bg-slate-50 rounded-lg">
            <Skeleton className="h-4 w-4 sm:h-5 sm:w-5" />
          </div>
        )}
      </CardHeader>
      <CardContent>
        <div className="space-y-2">
          <Skeleton className="h-8 w-16" />
          <Skeleton className="h-3 w-32" />
          {showTrend && (
            <div className="flex items-center space-x-1">
              <Skeleton className="h-3 w-3" />
              <Skeleton className="h-3 w-12" />
            </div>
          )}
        </div>
      </CardContent>
    </Card>
  );
}

interface SkeletonStatsGridProps {
  count: number;
  showTrend?: boolean;
  className?: string;
}

export function SkeletonStatsGrid({ count, showTrend = false, className }: SkeletonStatsGridProps) {
  return (
    <div className={`grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-4 gap-4 lg:gap-6 ${className}`}>
      {Array.from({ length: count }).map((_, i) => (
        <SkeletonCard key={i} showTrend={showTrend} />
      ))}
    </div>
  );
}

interface SkeletonTableProps {
  rows?: number;
  columns?: number;
  className?: string;
}

export function SkeletonTable({ rows = 5, columns = 4, className }: SkeletonTableProps) {
  return (
    <Card className={`bg-white border border-slate-200 ${className}`}>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {/* Table Header */}
          <div className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
            {Array.from({ length: columns }).map((_, i) => (
              <Skeleton key={i} className="h-4 w-20" />
            ))}
          </div>
          
          {/* Table Rows */}
          {Array.from({ length: rows }).map((_, rowIndex) => (
            <div key={rowIndex} className="grid gap-4" style={{ gridTemplateColumns: `repeat(${columns}, 1fr)` }}>
              {Array.from({ length: columns }).map((_, colIndex) => (
                <Skeleton key={colIndex} className="h-4 w-full" />
              ))}
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SkeletonListProps {
  items?: number;
  showAvatar?: boolean;
  className?: string;
}

export function SkeletonList({ items = 5, showAvatar = false, className }: SkeletonListProps) {
  return (
    <Card className={`bg-white border border-slate-200 ${className}`}>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <div className="space-y-4">
          {Array.from({ length: items }).map((_, i) => (
            <div key={i} className="flex items-center space-x-4 p-4 border rounded-lg">
              {showAvatar && <Skeleton className="h-10 w-10 rounded-full" />}
              <div className="flex-1 space-y-2">
                <Skeleton className="h-4 w-32" />
                <Skeleton className="h-3 w-48" />
              </div>
              <Skeleton className="h-8 w-20" />
            </div>
          ))}
        </div>
      </CardContent>
    </Card>
  );
}

interface SkeletonChartProps {
  height?: number;
  className?: string;
}

export function SkeletonChart({ height = 300, className }: SkeletonChartProps) {
  return (
    <Card className={`bg-white border border-slate-200 ${className}`}>
      <CardHeader>
        <Skeleton className="h-6 w-32" />
        <Skeleton className="h-4 w-48" />
      </CardHeader>
      <CardContent>
        <Skeleton className="w-full" style={{ height: `${height}px` }} />
      </CardContent>
    </Card>
  );
}
