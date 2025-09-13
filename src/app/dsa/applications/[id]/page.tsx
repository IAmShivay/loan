'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, CheckCircle, XCircle, MessageSquare, FileText, User, Calendar, MapPin } from 'lucide-react';
import { useGetApplicationByIdQuery, useGetApplicationDocumentsQuery, useUpdateApplicationStatusMutation } from '@/store/api/apiSlice';
import { SkeletonCard } from '@/components/ui/loading/SkeletonCard';
import { safeString, safeDate, safeNumber, safeApplication } from '@/lib/utils/fallbacks';
import { toast } from 'sonner';

interface DSAApplicationDetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DSAApplicationDetailPage({ params }: DSAApplicationDetailPageProps) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  // RTK Query hooks
  const {
    data: applicationData,
    isLoading: applicationLoading,
    error: applicationError,
    refetch: refetchApplication
  } = useGetApplicationByIdQuery(id, {
    skip: !session?.user || session.user.role !== 'dsa'
  });

  const {
    data: documentsData,
    isLoading: documentsLoading
  } = useGetApplicationDocumentsQuery(id, {
    skip: !session?.user || session.user.role !== 'dsa'
  });

  const [updateApplicationStatus] = useUpdateApplicationStatusMutation();

  if (status === 'loading' || applicationLoading) {
    return (
      <DashboardLayout>
        <div className="space-y-6 lg:space-y-8">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  if (!session?.user || session.user.role !== 'dsa') {
    router.push('/auth/signin');
    return null;
  }

  if (applicationError || !applicationData?.application) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">Application Not Found</h2>
            <p className="text-slate-600 mb-4">The requested application could not be found.</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const app = safeApplication(applicationData.application);
  const documents = documentsData?.documents || [];

  const handleStatusUpdate = async (newStatus: string, comments?: string) => {
    try {
      await updateApplicationStatus({
        applicationId: id,
        status: newStatus,
        comments
      }).unwrap();
      
      toast.success(`Application ${newStatus} successfully`);
      refetchApplication();
    } catch (error) {
      toast.error(`Failed to ${newStatus} application`);
      console.error('Status update error:', error);
    }
  };

  const getStatusColor = (status: string) => {
    switch (status) {
      case 'approved':
        return 'bg-green-100 text-green-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'under_review':
        return 'bg-blue-100 text-blue-800';
      default:
        return 'bg-slate-100 text-slate-800';
    }
  };

  const canApproveReject = app.status === 'pending' || app.status === 'under_review';

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex items-center justify-between">
          <div className="flex items-center gap-4">
            <Button
              variant="ghost"
              size="sm"
              onClick={() => router.back()}
              className="flex items-center gap-2"
            >
              <ArrowLeft className="h-4 w-4" />
              Back
            </Button>
            <div>
              <h1 className="text-2xl font-bold text-slate-900">
                Application #{safeString(app.applicationNumber)}
              </h1>
              <p className="text-slate-600">Review Application</p>
            </div>
          </div>
          <Badge className={getStatusColor(app.status)}>
            {safeString(app.status).replace('_', ' ')}
          </Badge>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - Application Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Full Name</p>
                    <p className="text-slate-900">{safeString(app.personalDetails.fullName)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Date of Birth</p>
                    <p className="text-slate-900">{safeDate(app.personalDetails.dateOfBirth)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Gender</p>
                    <p className="text-slate-900">{safeString(app.personalDetails.gender)}</p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Marital Status</p>
                    <p className="text-slate-900">{safeString(app.personalDetails.maritalStatus)}</p>
                  </div>
                </div>
                
                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-medium text-slate-900 mb-3">Employment Information</h4>
                  <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                    <div>
                      <p className="text-sm font-medium text-slate-600">Employment Type</p>
                      <p className="text-slate-900">{safeString(app.personalDetails.employment?.type)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Company</p>
                      <p className="text-slate-900">{safeString(app.personalDetails.employment?.companyName)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Designation</p>
                      <p className="text-slate-900">{safeString(app.personalDetails.employment?.designation)}</p>
                    </div>
                    <div>
                      <p className="text-sm font-medium text-slate-600">Work Experience</p>
                      <p className="text-slate-900">{safeNumber(app.personalDetails.employment?.workExperience)} years</p>
                    </div>
                  </div>
                </div>

                <div className="pt-4 border-t border-slate-100">
                  <h4 className="font-medium text-slate-900 mb-3">Address</h4>
                  <div className="flex items-start gap-2">
                    <MapPin className="h-4 w-4 text-slate-400 mt-1" />
                    <div>
                      <p className="text-slate-900">
                        {safeString(app.personalDetails.address?.street)}<br />
                        {safeString(app.personalDetails.address?.city)}, {safeString(app.personalDetails.address?.state)} {safeString(app.personalDetails.address?.zipCode)}
                      </p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan Information */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Loan Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div>
                    <p className="text-sm font-medium text-slate-600">Loan Amount</p>
                    <p className="text-2xl font-bold text-slate-900">
                      ₹{safeNumber(app.loanInfo.amount).toLocaleString('en-IN')}
                    </p>
                  </div>
                  <div>
                    <p className="text-sm font-medium text-slate-600">Purpose</p>
                    <p className="text-slate-900">{safeString(app.loanInfo.purpose)}</p>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Documents */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5" />
                  Documents ({documents.length})
                </CardTitle>
              </CardHeader>
              <CardContent>
                {documentsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : documents.length > 0 ? (
                  <div className="space-y-3">
                    {documents.map((doc: any) => (
                      <div key={doc._id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                        <div className="flex items-center gap-3">
                          <FileText className="h-5 w-5 text-slate-400" />
                          <div>
                            <p className="font-medium text-slate-900">{safeString(doc.fileName)}</p>
                            <p className="text-sm text-slate-600">
                              {safeString(doc.documentType)} • {safeDate(doc.uploadedAt)}
                            </p>
                          </div>
                        </div>
                        <Button
                          variant="ghost"
                          size="sm"
                          onClick={() => window.open(doc.fileUrl, '_blank')}
                        >
                          View
                        </Button>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-center py-8">No documents uploaded</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Actions */}
          <div className="space-y-6">
            {/* Application Status */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle>Application Status</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <span className="text-sm text-slate-600">Current Status</span>
                  <Badge className={getStatusColor(app.status)}>
                    {safeString(app.status).replace('_', ' ')}
                  </Badge>
                </div>
                <div className="pt-4 border-t border-slate-100">
                  <div className="flex items-center gap-2 mb-2">
                    <Calendar className="h-4 w-4 text-slate-400" />
                    <span className="text-sm text-slate-600">Submitted</span>
                  </div>
                  <p className="text-slate-900">{safeDate(app.createdAt)}</p>
                </div>
              </CardContent>
            </Card>

            {/* DSA Actions */}
            {canApproveReject && (
              <Card className="bg-white border border-slate-200">
                <CardHeader>
                  <CardTitle>DSA Actions</CardTitle>
                </CardHeader>
                <CardContent className="space-y-3">
                  <Button
                    className="w-full bg-green-600 hover:bg-green-700"
                    onClick={() => handleStatusUpdate('approved', 'Approved by DSA')}
                  >
                    <CheckCircle className="h-4 w-4 mr-2" />
                    Approve Application
                  </Button>
                  <Button
                    variant="destructive"
                    className="w-full"
                    onClick={() => handleStatusUpdate('rejected', 'Rejected by DSA')}
                  >
                    <XCircle className="h-4 w-4 mr-2" />
                    Reject Application
                  </Button>
                </CardContent>
              </Card>
            )}

            {/* Communication */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle>Communication</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/dsa/chat?applicationId=${id}`)}
                >
                  <MessageSquare className="h-4 w-4 mr-2" />
                  Chat with Applicant
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
