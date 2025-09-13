'use client';



import { useSession } from 'next-auth/react';
import { useRouter } from 'next/navigation';
import { useState, useEffect } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Badge } from '@/components/ui/badge';
import { Avatar, AvatarFallback, AvatarImage } from '@/components/ui/avatar';
import { Separator } from '@/components/ui/separator';
import { 
  User, 
  Mail, 
  Phone, 
  MapPin, 
  Calendar, 
  Edit, 
  Save,
  Camera,
  Shield,
  FileText,
  CreditCard,
  GraduationCap,
  Building,
  AlertCircle,
  CheckCircle
} from 'lucide-react';
import { useGetUserProfileQuery, useUpdateUserProfileMutation } from '@/store/api/apiSlice';
import { SkeletonCard } from '@/components/ui/loading/SkeletonCard';
import FileUpload from '@/components/common/FileUpload';
import { toast } from 'sonner';
import { formatFullCurrency } from '@/lib/utils/currency';

export default function UserProfilePage() {
  // All hooks must be called before any conditional returns
  const { data: session, status } = useSession();
  const router = useRouter();
  const [isEditing, setIsEditing] = useState(false);
  const [formData, setFormData] = useState<any>({});

  // Fetch user profile using RTK Query
  const {
    data: profileData,
    isLoading,
    error,
    refetch
  } = useGetUserProfileQuery(session?.user?.id || '', {
    skip: !session?.user || session.user.role !== 'user'
  });

  // Conditional returns after all hooks
  if (status === 'loading') {
    return <div>Loading...</div>;
  }

  if (!session?.user || session.user.role !== 'user') {
    router.push('/login');
    return null;
  }

  const [updateProfile, { isLoading: isUpdating }] = useUpdateUserProfileMutation();

  const userProfile = profileData?.profile;

  // Initialize form data when profile loads
  useEffect(() => {
    if (userProfile && Object.keys(formData).length === 0) {
      setFormData(userProfile);
    }
  }, [userProfile, formData]);

  const handleInputChange = (section: string, field: string, value: any) => {
    setFormData((prev: any) => ({
      ...prev,
      [section]: {
        ...prev[section],
        [field]: value
      }
    }));
  };

  const handleSave = async () => {
    try {
      await updateProfile({
        userId: session.user.id,
        profileData: formData
      }).unwrap();
      
      setIsEditing(false);
      toast.success('Profile updated successfully');
      refetch();
    } catch (error: any) {
      toast.error(error?.data?.error || 'Failed to update profile');
    }
  };

  const handleCancel = () => {
    setFormData(userProfile);
    setIsEditing(false);
  };

  const handleProfilePictureUpload = (files: any[]) => {
    if (files.length > 0) {
      const file = files[0];
      handleInputChange('personalInfo', 'profilePicture', file.fileUrl);
      toast.success('Profile picture updated');
    }
  };

  if (error) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <AlertCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Error Loading Profile</h3>
            <p className="text-gray-600 mb-4">Failed to load your profile. Please try again.</p>
            <Button onClick={() => refetch()}>Retry</Button>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  if (isLoading) {
    return (
      <DashboardLayout>
        <div className="p-6 space-y-6">
          <SkeletonCard />
          <SkeletonCard />
          <SkeletonCard />
        </div>
      </DashboardLayout>
    );
  }

  if (!userProfile) {
    return (
      <DashboardLayout>
        <div className="p-6">
          <div className="text-center py-12">
            <User className="h-12 w-12 text-gray-400 mx-auto mb-4" />
            <h3 className="text-lg font-semibold text-gray-900 mb-2">Profile Not Found</h3>
            <p className="text-gray-600">Your profile information is not available.</p>
          </div>
        </div>
      </DashboardLayout>
    );
  }

  return (
    <DashboardLayout>
      <div className="p-6 space-y-6">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-gray-900">My Profile</h1>
            <p className="text-gray-600">Manage your personal information and preferences</p>
          </div>
          <div className="flex items-center gap-2">
            {isEditing ? (
              <>
                <Button variant="outline" onClick={handleCancel} disabled={isUpdating}>
                  Cancel
                </Button>
                <Button onClick={handleSave} disabled={isUpdating}>
                  {isUpdating ? (
                    <>
                      <div className="h-4 w-4 animate-spin rounded-full border-2 border-white border-t-transparent mr-2" />
                      Saving...
                    </>
                  ) : (
                    <>
                      <Save className="h-4 w-4 mr-2" />
                      Save Changes
                    </>
                  )}
                </Button>
              </>
            ) : (
              <Button onClick={() => setIsEditing(true)}>
                <Edit className="h-4 w-4 mr-2" />
                Edit Profile
              </Button>
            )}
          </div>
        </div>

        {/* Profile Picture & Basic Info */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <User className="h-5 w-5" />
              Personal Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-6">
            {/* Profile Picture */}
            <div className="flex items-center space-x-6">
              <div className="relative">
                <Avatar className="h-24 w-24">
                  <AvatarImage src={formData.personalInfo?.profilePicture} />
                  <AvatarFallback className="text-lg">
                    {formData.personalInfo?.firstName?.[0]}{formData.personalInfo?.lastName?.[0]}
                  </AvatarFallback>
                </Avatar>
                {isEditing && (
                  <div className="absolute inset-0 bg-black bg-opacity-50 rounded-full flex items-center justify-center">
                    <Camera className="h-6 w-6 text-white" />
                  </div>
                )}
              </div>
              <div className="flex-1">
                <h3 className="text-lg font-semibold text-gray-900">
                  {formData.personalInfo?.firstName} {formData.personalInfo?.lastName}
                </h3>
                <p className="text-gray-600">{formData.personalInfo?.email}</p>
                <Badge variant="outline" className="mt-2">
                  <Shield className="h-3 w-3 mr-1" />
                  Verified User
                </Badge>
              </div>
              {isEditing && (
                <div className="w-64">
                  <FileUpload
                    documentType="profile_picture"
                    maxFiles={1}
                    onFilesChange={handleProfilePictureUpload}
                  />
                </div>
              )}
            </div>

            <Separator />

            {/* Personal Details */}
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name</Label>
                {isEditing ? (
                  <Input
                    id="firstName"
                    value={formData.personalInfo?.firstName || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'firstName', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-gray-900">{formData.personalInfo?.firstName || 'Not provided'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name</Label>
                {isEditing ? (
                  <Input
                    id="lastName"
                    value={formData.personalInfo?.lastName || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'lastName', e.target.value)}
                  />
                ) : (
                  <p className="text-sm text-gray-900">{formData.personalInfo?.lastName || 'Not provided'}</p>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="email">Email Address</Label>
                <div className="flex items-center gap-2">
                  <Mail className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900">{formData.personalInfo?.email}</p>
                  <CheckCircle className="h-4 w-4 text-green-500" />
                </div>
              </div>

              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number</Label>
                {isEditing ? (
                  <Input
                    id="phone"
                    value={formData.personalInfo?.phone || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'phone', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Phone className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900">{formData.personalInfo?.phone || 'Not provided'}</p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth</Label>
                {isEditing ? (
                  <Input
                    id="dateOfBirth"
                    type="date"
                    value={formData.personalInfo?.dateOfBirth || ''}
                    onChange={(e) => handleInputChange('personalInfo', 'dateOfBirth', e.target.value)}
                  />
                ) : (
                  <div className="flex items-center gap-2">
                    <Calendar className="h-4 w-4 text-gray-400" />
                    <p className="text-sm text-gray-900">
                      {formData.personalInfo?.dateOfBirth 
                        ? new Date(formData.personalInfo.dateOfBirth).toLocaleDateString()
                        : 'Not provided'
                      }
                    </p>
                  </div>
                )}
              </div>

              <div className="space-y-2">
                <Label htmlFor="aadharNumber">Aadhar Number</Label>
                <div className="flex items-center gap-2">
                  <CreditCard className="h-4 w-4 text-gray-400" />
                  <p className="text-sm text-gray-900">
                    {formData.personalInfo?.aadharNumber 
                      ? `****-****-${formData.personalInfo.aadharNumber.slice(-4)}`
                      : 'Not provided'
                    }
                  </p>
                </div>
              </div>
            </div>

            {/* Address */}
            <div className="space-y-2">
              <Label htmlFor="address">Address</Label>
              {isEditing ? (
                <Textarea
                  id="address"
                  value={formData.personalInfo?.address || ''}
                  onChange={(e) => handleInputChange('personalInfo', 'address', e.target.value)}
                  rows={3}
                />
              ) : (
                <div className="flex items-start gap-2">
                  <MapPin className="h-4 w-4 text-gray-400 mt-0.5" />
                  <p className="text-sm text-gray-900">{formData.personalInfo?.address || 'Not provided'}</p>
                </div>
              )}
            </div>
          </CardContent>
        </Card>

        {/* Education Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <GraduationCap className="h-5 w-5" />
              Education Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Current Institution</Label>
                <p className="text-sm text-gray-900">
                  {formData.educationInfo?.currentInstitution || 'Not provided'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Course</Label>
                <p className="text-sm text-gray-900">
                  {formData.educationInfo?.course || 'Not provided'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Duration</Label>
                <p className="text-sm text-gray-900">
                  {formData.educationInfo?.duration || 'Not provided'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Fee Structure</Label>
                <p className="text-sm text-gray-900">
                  {formData.educationInfo?.feeStructure 
                    ? formatFullCurrency(formData.educationInfo.feeStructure)
                    : 'Not provided'
                  }
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Financial Information */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Building className="h-5 w-5" />
              Financial Information
            </CardTitle>
          </CardHeader>
          <CardContent className="space-y-4">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label>Annual Income</Label>
                <p className="text-sm text-gray-900">
                  {formData.financialInfo?.annualIncome 
                    ? formatFullCurrency(formData.financialInfo.annualIncome)
                    : 'Not provided'
                  }
                </p>
              </div>
              <div className="space-y-2">
                <Label>Employment Type</Label>
                <p className="text-sm text-gray-900">
                  {formData.financialInfo?.employmentType || 'Not provided'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Employer Name</Label>
                <p className="text-sm text-gray-900">
                  {formData.financialInfo?.employerName || 'Not provided'}
                </p>
              </div>
              <div className="space-y-2">
                <Label>Work Experience</Label>
                <p className="text-sm text-gray-900">
                  {formData.financialInfo?.workExperience || 'Not provided'}
                </p>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Account Status */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center gap-2">
              <Shield className="h-5 w-5" />
              Account Status
            </CardTitle>
          </CardHeader>
          <CardContent>
            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Email Verified</p>
                <p className="text-xs text-gray-600">Your email is verified</p>
              </div>
              <div className="text-center">
                <CheckCircle className="h-8 w-8 text-green-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Phone Verified</p>
                <p className="text-xs text-gray-600">Your phone is verified</p>
              </div>
              <div className="text-center">
                <FileText className="h-8 w-8 text-blue-500 mx-auto mb-2" />
                <p className="text-sm font-medium text-gray-900">Documents</p>
                <p className="text-xs text-gray-600">
                  {formData.documents?.length || 0} documents uploaded
                </p>
              </div>
            </div>
          </CardContent>
        </Card>
      </div>
    </DashboardLayout>
  );
}
