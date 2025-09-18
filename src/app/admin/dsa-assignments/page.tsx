'use client';

import { useState } from 'react';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { useToast } from '@/hooks/use-toast';
import { Users, FileText, Clock, AlertTriangle, RefreshCw } from 'lucide-react';

interface AssignmentStats {
  activeDSAs: number;
  unassignedApplications: number;
  underReview: number;
  overdue: number;
}

export default function DSAAssignmentsPage() {
  const [stats, setStats] = useState<AssignmentStats | null>(null);
  const [loading, setLoading] = useState(false);
  const [assigning, setAssigning] = useState(false);
  const { toast } = useToast();

  const fetchStatus = async () => {
    setLoading(true);
    try {
      const response = await fetch('/api/admin/test-assign-dsas');
      const data = await response.json();
      
      if (response.ok) {
        setStats(data.statistics);
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to fetch status',
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to fetch assignment status',
        variant: 'destructive'
      });
    } finally {
      setLoading(false);
    }
  };

  const assignDSAs = async () => {
    setAssigning(true);
    try {
      const response = await fetch('/api/admin/test-assign-dsas', {
        method: 'POST'
      });
      const data = await response.json();
      
      if (response.ok) {
        toast({
          title: 'Success',
          description: data.message,
          variant: 'default'
        });
        await fetchStatus();
      } else {
        toast({
          title: 'Error',
          description: data.error || 'Failed to assign DSAs',
          variant: 'destructive'
        });
      }
    } catch {
      toast({
        title: 'Error',
        description: 'Failed to assign DSAs',
        variant: 'destructive'
      });
    } finally {
      setAssigning(false);
    }
  };

  return (
    <div className="container mx-auto p-6 space-y-6">
      <div className="flex justify-between items-center">
        <div>
          <h1 className="text-3xl font-bold">DSA Assignment Management</h1>
          <p className="text-muted-foreground">
            Manage DSA assignments for loan applications
          </p>
        </div>
        <div className="flex gap-2">
          <Button onClick={fetchStatus} disabled={loading} variant="outline">
            <RefreshCw className={`h-4 w-4 mr-2 ${loading ? 'animate-spin' : ''}`} />
            Refresh
          </Button>
          <Button onClick={assignDSAs} disabled={assigning}>
            {assigning ? (
              <RefreshCw className="h-4 w-4 mr-2 animate-spin" />
            ) : (
              <Users className="h-4 w-4 mr-2" />
            )}
            Assign DSAs
          </Button>
        </div>
      </div>

      {stats && (
        <div className="grid grid-cols-1 md:grid-cols-4 gap-4">
          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Active DSAs</CardTitle>
              <Users className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.activeDSAs}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Unassigned</CardTitle>
              <FileText className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.unassignedApplications}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Under Review</CardTitle>
              <Clock className="h-4 w-4 text-muted-foreground" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold">{stats.underReview}</div>
            </CardContent>
          </Card>

          <Card>
            <CardHeader className="flex flex-row items-center justify-between space-y-0 pb-2">
              <CardTitle className="text-sm font-medium">Overdue</CardTitle>
              <AlertTriangle className="h-4 w-4 text-destructive" />
            </CardHeader>
            <CardContent>
              <div className="text-2xl font-bold text-destructive">{stats.overdue}</div>
            </CardContent>
          </Card>
        </div>
      )}

      <Card>
        <CardHeader>
          <CardTitle>How to Test DSA Assignment</CardTitle>
        </CardHeader>
        <CardContent className="space-y-3">
          <div className="flex items-start gap-3">
            <Badge variant="outline">1</Badge>
            <div>
              <p className="font-medium">Create DSA users</p>
              <p className="text-sm text-muted-foreground">
                Go to User Management and create users with role &quot;DSA&quot;, then verify them
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline">2</Badge>
            <div>
              <p className="font-medium">Create loan applications</p>
              <p className="text-sm text-muted-foreground">
                Submit some loan applications that will be in &quot;pending&quot; status
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline">3</Badge>
            <div>
              <p className="font-medium">Click &quot;Assign DSAs&quot;</p>
              <p className="text-sm text-muted-foreground">
                This will randomly assign 2-3 DSAs to each pending application
              </p>
            </div>
          </div>
          
          <div className="flex items-start gap-3">
            <Badge variant="outline">4</Badge>
            <div>
              <p className="font-medium">DSAs can review applications</p>
              <p className="text-sm text-muted-foreground">
                DSAs will see assigned applications in their dashboard
              </p>
            </div>
          </div>
        </CardContent>
      </Card>
    </div>
  );
}
