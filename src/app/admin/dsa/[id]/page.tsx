'use client';

import { use } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Badge } from '@/components/ui/badge';
import { ArrowLeft, Edit, Mail, Phone, MapPin, Building, Calendar, Star, TrendingUp, Users, FileText } from 'lucide-react';
import { useGetUserByIdQuery, useGetApplicationsQuery } from '@/store/api/apiSlice';
import { SkeletonCard } from '@/components/ui/loading/SkeletonCard';
import { safeString, safeDate, safeNumber } from '@/lib/utils/fallbacks';

interface DSADetailPageProps {
  params: Promise<{ id: string }>;
}

export default function DSADetailPage({ params }: DSADetailPageProps) {
  const { id } = use(params);
  const { data: session, status } = useSession();
  const router = useRouter();

  // RTK Query hooks
  const {
    data: dsaData,
    isLoading: dsaLoading,
    error: dsaError
  } = useGetUserByIdQuery(id, {
    skip: !session?.user || session.user.role !== 'admin'
  });

  const {
    data: applicationsData,
    isLoading: applicationsLoading
  } = useGetApplicationsQuery({
    limit: 10,
    page: 1
  }, {
    skip: !session?.user || session.user.role !== 'admin'
  });

  if (status === 'loading' || dsaLoading) {
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

  if (!session?.user || session.user.role !== 'admin') {
    router.push('/auth/signin');
    return null;
  }

  if (dsaError || !dsaData?.user) {
    return (
      <DashboardLayout>
        <div className="flex items-center justify-center min-h-[400px]">
          <div className="text-center">
            <h2 className="text-xl font-semibold text-slate-900 mb-2">DSA Not Found</h2>
            <p className="text-slate-600 mb-4">The requested DSA could not be found.</p>
            <Button onClick={() => router.back()}>
              <ArrowLeft className="h-4 w-4 mr-2" />
              Go Back
            </Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  const dsa = dsaData.user;
  const applications = applicationsData?.applications || [];

  const getStatusColor = (isActive: boolean) => {
    return isActive ? 'bg-green-100 text-green-800' : 'bg-red-100 text-red-800';
  };

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
                {safeString(dsa.firstName)} {safeString(dsa.lastName)}
              </h1>
              <p className="text-slate-600">DSA Profile Details</p>
            </div>
          </div>
          <Button
            onClick={() => router.push(`/admin/dsa/${id}/edit`)}
            className="bg-blue-600 hover:bg-blue-700"
          >
            <Edit className="h-4 w-4 mr-2" />
            Edit DSA
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Left Column - DSA Information */}
          <div className="lg:col-span-2 space-y-6">
            {/* Basic Information */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center justify-between">
                  Basic Information
                  <Badge className={getStatusColor(dsa.isActive)}>
                    {dsa.isActive ? 'Active' : 'Inactive'}
                  </Badge>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
                  <div className="flex items-center gap-3">
                    <Mail className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Email</p>
                      <p className="text-slate-900">{safeString(dsa.email)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Phone className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Phone</p>
                      <p className="text-slate-900">{safeString(dsa.phone, 'Not provided')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Building className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Bank</p>
                      <p className="text-slate-900">{safeString(dsa.bankName, 'Not specified')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <MapPin className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Branch Code</p>
                      <p className="text-slate-900">{safeString(dsa.branchCode, 'Not specified')}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Calendar className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Joined</p>
                      <p className="text-slate-900">{safeDate(dsa.createdAt)}</p>
                    </div>
                  </div>
                  <div className="flex items-center gap-3">
                    <Star className="h-5 w-5 text-slate-400" />
                    <div>
                      <p className="text-sm font-medium text-slate-600">Rating</p>
                      <p className="text-slate-900">{safeNumber(dsa.rating, 0).toFixed(1)} / 5.0</p>
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Recent Applications */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle>Recent Applications</CardTitle>
              </CardHeader>
              <CardContent>
                {applicationsLoading ? (
                  <div className="space-y-3">
                    {[1, 2, 3].map(i => (
                      <div key={i} className="animate-pulse">
                        <div className="h-4 bg-slate-200 rounded w-3/4 mb-2"></div>
                        <div className="h-3 bg-slate-200 rounded w-1/2"></div>
                      </div>
                    ))}
                  </div>
                ) : applications.length > 0 ? (
                  <div className="space-y-4">
                    {applications.slice(0, 5).map((app: any) => (
                      <div key={app._id} className="flex items-center justify-between p-3 border border-slate-100 rounded-lg">
                        <div>
                          <p className="font-medium text-slate-900">
                            Application #{safeString(app.applicationNumber)}
                          </p>
                          <p className="text-sm text-slate-600">
                            {safeString(app.personalDetails?.fullName)} • {safeDate(app.createdAt)}
                          </p>
                        </div>
                        <Badge className={`${
                          app.status === 'approved' ? 'bg-green-100 text-green-800' :
                          app.status === 'rejected' ? 'bg-red-100 text-red-800' :
                          'bg-yellow-100 text-yellow-800'
                        }`}>
                          {safeString(app.status).replace('_', ' ')}
                        </Badge>
                      </div>
                    ))}
                  </div>
                ) : (
                  <p className="text-slate-600 text-center py-8">No applications assigned yet</p>
                )}
              </CardContent>
            </Card>
          </div>

          {/* Right Column - Statistics */}
          <div className="space-y-6">
            {/* Performance Stats */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle>Performance</CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <FileText className="h-4 w-4 text-blue-600" />
                    <span className="text-sm text-slate-600">Total Applications</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {safeNumber(dsa.statistics?.totalApplications, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <TrendingUp className="h-4 w-4 text-green-600" />
                    <span className="text-sm text-slate-600">Approved</span>
                  </div>
                  <span className="font-semibold text-green-600">
                    {safeNumber(dsa.statistics?.approvedApplications, 0)}
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Star className="h-4 w-4 text-yellow-600" />
                    <span className="text-sm text-slate-600">Success Rate</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    {safeNumber(dsa.statistics?.successRate, 0)}%
                  </span>
                </div>
                <div className="flex items-center justify-between">
                  <div className="flex items-center gap-2">
                    <Users className="h-4 w-4 text-purple-600" />
                    <span className="text-sm text-slate-600">Total Loan Amount</span>
                  </div>
                  <span className="font-semibold text-slate-900">
                    ₹{((safeNumber(dsa.statistics?.totalLoanAmount, 0)) / 100000).toFixed(1)}L
                  </span>
                </div>
              </CardContent>
            </Card>

            {/* Quick Actions */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle>Quick Actions</CardTitle>
              </CardHeader>
              <CardContent className="space-y-3">
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/applications?assignedDSA=${id}`)}
                >
                  <FileText className="h-4 w-4 mr-2" />
                  View All Applications
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => router.push(`/admin/dsa/${id}/edit`)}
                >
                  <Edit className="h-4 w-4 mr-2" />
                  Edit Profile
                </Button>
                <Button
                  variant="outline"
                  className="w-full justify-start"
                  onClick={() => window.open(`mailto:${dsa.email}`, '_blank')}
                >
                  <Mail className="h-4 w-4 mr-2" />
                  Send Email
                </Button>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
