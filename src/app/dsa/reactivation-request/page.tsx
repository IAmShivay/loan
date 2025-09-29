'use client';

import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { AlertCircle, CheckCircle, Clock, XCircle } from 'lucide-react';
import { useSubmitDSAReactivationRequestMutation, useGetDSAReactivationRequestQuery } from '@/store/api/apiSlice';
import LoadingSpinner from '@/components/common/LoadingSpinner';
import { toast } from 'sonner';

export default function DSAReactivationRequestPage() {
  const { data: session, status } = useSession();
  const router = useRouter();
  const [reason, setReason] = useState('');
  const [clarification, setClarification] = useState('');
  const [isSubmitting, setIsSubmitting] = useState(false);

  const {
    data: reactivationData,
    isLoading: isLoadingRequest,
    refetch: refetchRequest
  } = useGetDSAReactivationRequestQuery(undefined, {
    skip: !session?.user || session.user.role !== 'dsa'
  });

  const [submitRequest] = useSubmitDSAReactivationRequestMutation();

  useEffect(() => {
    if (status === 'loading') return;

    if (!session?.user || session.user.role !== 'dsa') {
      router.push('/login');
      return;
    }

    // If account is active, redirect to dashboard
    if (session.user.isActive) {
      router.push('/dsa');
      return;
    }
  }, [session, status, router]);

  const handleSubmit = async (e: React.FormEvent) => {
    e.preventDefault();

    if (reason.length < 10) {
      toast.error('Reason must be at least 10 characters');
      return;
    }

    if (clarification.length < 20) {
      toast.error('Clarification must be at least 20 characters');
      return;
    }

    setIsSubmitting(true);

    try {
      const result = await submitRequest({
        reason: reason.trim(),
        clarification: clarification.trim()
      }).unwrap();

      toast.success(result.message);
      setReason('');
      setClarification('');
      refetchRequest();
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to submit reactivation request');
    } finally {
      setIsSubmitting(false);
    }
  };

  if (status === 'loading' || isLoadingRequest) {
    return <LoadingSpinner />;
  }

  if (!session?.user || session.user.role !== 'dsa') {
    return null;
  }

  const existingRequest = reactivationData?.reactivationRequest;
  const getStatusIcon = (status: string) => {
    switch (status) {
      case 'pending':
        return <Clock className="h-5 w-5 text-yellow-500" />;
      case 'approved':
        return <CheckCircle className="h-5 w-5 text-green-500" />;
      case 'rejected':
        return <XCircle className="h-5 w-5 text-red-500" />;
      default:
        return <AlertCircle className="h-5 w-5 text-gray-500" />;
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8 max-w-4xl mx-auto">
        {/* Header */}
        <div>
          <h1 className="text-2xl font-bold text-slate-900">Account Reactivation Request</h1>
          <p className="text-slate-600">Your account has been frozen. Submit a reactivation request with proper clarification.</p>
        </div>

        {/* Account Status Alert */}
        <Card className="bg-red-50 border-red-200">
          <CardContent className="p-4">
            <div className="flex items-center gap-3">
              <AlertCircle className="h-5 w-5 text-red-500" />
              <div>
                <h3 className="font-medium text-red-900">Account Frozen</h3>
                <p className="text-sm text-red-700">
                  Your DSA account has been frozen due to missed deadlines or policy violations.
                  Please submit a reactivation request below.
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Existing Request Status */}
        {existingRequest && (
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle className="flex items-center gap-2">
                {getStatusIcon(existingRequest.status)}
                Reactivation Request Status
              </CardTitle>
            </CardHeader>
            <CardContent className="space-y-4">
              <div className="flex items-center gap-2">
                <Badge className={getStatusColor(existingRequest.status)}>
                  {existingRequest.status.charAt(0).toUpperCase() + existingRequest.status.slice(1)}
                </Badge>
                <span className="text-sm text-slate-500">
                  Submitted on {new Date(existingRequest.requestedAt).toLocaleDateString()}
                </span>
              </div>

              <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Reason</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                    {existingRequest.reason}
                  </p>
                </div>
                <div>
                  <h4 className="font-medium text-slate-900 mb-2">Clarification</h4>
                  <p className="text-sm text-slate-600 bg-slate-50 p-3 rounded">
                    {existingRequest.clarification}
                  </p>
                </div>
              </div>

              {existingRequest.status === 'rejected' && existingRequest.adminNotes && (
                <div>
                  <h4 className="font-medium text-red-900 mb-2">Admin Notes</h4>
                  <p className="text-sm text-red-700 bg-red-50 p-3 rounded">
                    {existingRequest.adminNotes}
                  </p>
                </div>
              )}

              {existingRequest.status === 'approved' && (
                <div className="bg-green-50 p-4 rounded">
                  <p className="text-green-800">
                    Your reactivation request has been approved! Your account should be active shortly.
                  </p>
                </div>
              )}
            </CardContent>
          </Card>
        )}

        {/* Reactivation Request Form */}
        {(!existingRequest || existingRequest.status === 'rejected') && (
          <Card className="bg-white border border-slate-200">
            <CardHeader>
              <CardTitle>
                {existingRequest?.status === 'rejected' ? 'Submit New Reactivation Request' : 'Submit Reactivation Request'}
              </CardTitle>
              <CardDescription>
                Provide a detailed explanation of the issue and how you plan to address it going forward.
              </CardDescription>
            </CardHeader>
            <CardContent>
              <form onSubmit={handleSubmit} className="space-y-6">
                <div>
                  <label htmlFor="reason" className="block text-sm font-medium text-slate-700 mb-2">
                    Reason for Account Freeze <span className="text-red-500">*</span>
                  </label>
                  <Input
                    id="reason"
                    type="text"
                    value={reason}
                    onChange={(e) => setReason(e.target.value)}
                    placeholder="Brief reason for account freeze (min 10 characters)"
                    required
                    minLength={10}
                    maxLength={500}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {reason.length}/500 characters (minimum 10)
                  </p>
                </div>

                <div>
                  <label htmlFor="clarification" className="block text-sm font-medium text-slate-700 mb-2">
                    Detailed Clarification <span className="text-red-500">*</span>
                  </label>
                  <Textarea
                    id="clarification"
                    value={clarification}
                    onChange={(e) => setClarification(e.target.value)}
                    placeholder="Provide detailed clarification about the issues and your plan to address them going forward (min 20 characters)"
                    required
                    minLength={20}
                    maxLength={1000}
                    rows={6}
                    disabled={isSubmitting}
                  />
                  <p className="text-xs text-slate-500 mt-1">
                    {clarification.length}/1000 characters (minimum 20)
                  </p>
                </div>

                <div className="bg-blue-50 p-4 rounded">
                  <h4 className="font-medium text-blue-900 mb-2">Guidelines for Reactivation Request</h4>
                  <ul className="text-sm text-blue-800 space-y-1">
                    <li>• Be honest and detailed in your explanation</li>
                    <li>• Acknowledge any mistakes or issues that led to the freeze</li>
                    <li>• Provide a clear plan for improvement</li>
                    <li>• Admin will review your request within 2-3 business days</li>
                  </ul>
                </div>

                <Button
                  type="submit"
                  className="w-full bg-blue-600 hover:bg-blue-700"
                  disabled={isSubmitting || reason.length < 10 || clarification.length < 20}
                >
                  {isSubmitting ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Submitting Request...
                    </>
                  ) : (
                    'Submit Reactivation Request'
                  )}
                </Button>
              </form>
            </CardContent>
          </Card>
        )}

        {/* Contact Support */}
        <Card className="bg-slate-50 border border-slate-200">
          <CardContent className="p-4">
            <h4 className="font-medium text-slate-900 mb-2">Need Help?</h4>
            <p className="text-sm text-slate-600">
              If you have questions about the reactivation process, please contact our support team at{' '}
              <a href="mailto:support@example.com" className="text-blue-600 hover:underline">
                support@example.com
              </a>
            </p>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}