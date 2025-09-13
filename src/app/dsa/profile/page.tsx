import { getAuthSession } from '@/lib/auth/utils';
import { redirect } from 'next/navigation';
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
  Building, 
  Calendar, 
  Edit, 
  Save,
  Camera,
  Shield,
  Award,
  TrendingUp,
  DollarSign,
  FileText,
  Star
} from 'lucide-react';

export default async function DSAProfilePage() {
  const session = await getAuthSession();
  
  if (!session?.user || session.user.role !== 'dsa') {
    redirect('/login');
  }

  // TODO: Replace with actual API call
  const dsaProfile = {
    personalInfo: {
      firstName: 'Jane',
      lastName: 'Smith',
      email: 'jane.smith@sbi.co.in',
      phone: '+91 9876543210',
      dateOfBirth: '1985-03-15',
      profilePicture: null,
      address: '123 Business District, Mumbai, Maharashtra - 400001'
    },
    professionalInfo: {
      dsaId: 'SBI238001EMB',
      bankName: 'State Bank of India',
      branchCode: 'SBI001',
      branchName: 'Mumbai Central',
      joiningDate: '2020-01-15',
      designation: 'Senior DSA',
      experience: '4 years',
      specialization: ['Education Loans', 'Personal Loans', 'Home Loans'],
      certifications: ['IIBF Certified', 'AMFI Registered', 'Insurance Licensed']
    },
    performance: {
      totalApplications: 245,
      approvedApplications: 198,
      successRate: 80.8,
      totalLoanAmount: 125000000,
      monthlyTarget: 15,
      monthlyAchieved: 12,
      rating: 4.7,
      reviews: 156
    },
    bankingDetails: {
      accountNumber: '1234567890',
      ifscCode: 'SBIN0001234',
      accountHolderName: 'Jane Smith',
      bankName: 'State Bank of India',
      branchName: 'Mumbai Central'
    },
    documents: {
      panCard: { status: 'verified', uploadedAt: '2020-01-10' },
      aadharCard: { status: 'verified', uploadedAt: '2020-01-10' },
      bankPassbook: { status: 'verified', uploadedAt: '2020-01-10' },
      dsaCertificate: { status: 'verified', uploadedAt: '2020-01-15' },
      educationCertificate: { status: 'verified', uploadedAt: '2020-01-10' }
    }
  };

  const getInitials = (firstName: string, lastName: string) => {
    return `${firstName.charAt(0)}${lastName.charAt(0)}`.toUpperCase();
  };

  const getDocumentStatusColor = (status: string) => {
    switch (status) {
      case 'verified':
        return 'bg-green-100 text-green-800';
      case 'pending':
        return 'bg-yellow-100 text-yellow-800';
      case 'rejected':
        return 'bg-red-100 text-red-800';
      default:
        return 'bg-gray-100 text-gray-800';
    }
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">My Profile</h1>
            <p className="text-slate-600">Manage your personal and professional information</p>
          </div>
          <Button className="bg-blue-600 hover:bg-blue-700">
            <Edit className="h-4 w-4 mr-2" />
            Edit Profile
          </Button>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-3 gap-6 lg:gap-8">
          {/* Profile Overview */}
          <div className="lg:col-span-1 space-y-6">
            {/* Profile Card */}
            <Card className="bg-white border border-slate-200">
              <CardContent className="p-6 text-center">
                <div className="relative inline-block mb-4">
                  <Avatar className="h-24 w-24 mx-auto">
                    <AvatarImage src={dsaProfile.personalInfo.profilePicture || undefined} />
                    <AvatarFallback className="bg-blue-600 text-white text-xl">
                      {getInitials(dsaProfile.personalInfo.firstName, dsaProfile.personalInfo.lastName)}
                    </AvatarFallback>
                  </Avatar>
                  <Button
                    
                    className="absolute -bottom-2 -right-2 h-8 w-8 rounded-full p-0 bg-blue-600 hover:bg-blue-700"
                  >
                    <Camera className="h-4 w-4" />
                  </Button>
                </div>
                <h3 className="text-xl font-semibold text-slate-900 mb-1">
                  {dsaProfile.personalInfo.firstName} {dsaProfile.personalInfo.lastName}
                </h3>
                <p className="text-slate-600 mb-2">{dsaProfile.professionalInfo.designation}</p>
                <Badge className="bg-blue-100 text-blue-800 mb-4">
                  {dsaProfile.professionalInfo.dsaId}
                </Badge>
                <div className="flex items-center justify-center gap-1 mb-4">
                  <div className="flex">
                    {[...Array(5)].map((_, i) => (
                      <Star
                        key={i}
                        className={`h-4 w-4 ${
                          i < Math.floor(dsaProfile.performance.rating)
                            ? 'text-yellow-400 fill-current'
                            : 'text-gray-300'
                        }`}
                      />
                    ))}
                  </div>
                  <span className="text-sm text-slate-600 ml-1">
                    {dsaProfile.performance.rating} ({dsaProfile.performance.reviews} reviews)
                  </span>
                </div>
                <div className="text-sm text-slate-600">
                  <div className="flex items-center justify-center gap-1 mb-1">
                    <Building className="h-4 w-4" />
                    {dsaProfile.professionalInfo.bankName}
                  </div>
                  <div className="flex items-center justify-center gap-1">
                    <Calendar className="h-4 w-4" />
                    Joined {new Date(dsaProfile.professionalInfo.joiningDate).toLocaleDateString()}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Performance Stats */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Performance Overview
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-2 gap-4">
                  <div className="text-center p-3 bg-blue-50 rounded-lg">
                    <div className="text-2xl font-bold text-blue-600">{dsaProfile.performance.totalApplications}</div>
                    <div className="text-sm text-slate-600">Total Applications</div>
                  </div>
                  <div className="text-center p-3 bg-green-50 rounded-lg">
                    <div className="text-2xl font-bold text-green-600">{dsaProfile.performance.successRate}%</div>
                    <div className="text-sm text-slate-600">Success Rate</div>
                  </div>
                </div>
                <div className="text-center p-3 bg-purple-50 rounded-lg">
                  <div className="text-xl font-bold text-purple-600">
                    ₹{(dsaProfile.performance.totalLoanAmount / 10000000).toFixed(1)}Cr
                  </div>
                  <div className="text-sm text-slate-600">Total Loan Amount</div>
                </div>
                <div className="flex justify-between items-center p-3 bg-orange-50 rounded-lg">
                  <div>
                    <div className="text-lg font-bold text-orange-600">
                      {dsaProfile.performance.monthlyAchieved}/{dsaProfile.performance.monthlyTarget}
                    </div>
                    <div className="text-sm text-slate-600">Monthly Target</div>
                  </div>
                  <div className="text-right">
                    <div className="text-sm font-medium text-orange-600">
                      {Math.round((dsaProfile.performance.monthlyAchieved / dsaProfile.performance.monthlyTarget) * 100)}%
                    </div>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Profile Details */}
          <div className="lg:col-span-2 space-y-6">
            {/* Personal Information */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <User className="h-5 w-5 text-blue-600" />
                  Personal Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="firstName">First Name</Label>
                    <Input id="firstName" value={dsaProfile.personalInfo.firstName} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="lastName">Last Name</Label>
                    <Input id="lastName" value={dsaProfile.personalInfo.lastName} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="email">Email Address</Label>
                    <Input id="email" value={dsaProfile.personalInfo.email} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="phone">Phone Number</Label>
                    <Input id="phone" value={dsaProfile.personalInfo.phone} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="dateOfBirth">Date of Birth</Label>
                    <Input 
                      id="dateOfBirth" 
                      value={new Date(dsaProfile.personalInfo.dateOfBirth).toLocaleDateString()} 
                      readOnly 
                    />
                  </div>
                </div>
                <div>
                  <Label htmlFor="address">Address</Label>
                  <Textarea id="address" value={dsaProfile.personalInfo.address} readOnly rows={2} />
                </div>
              </CardContent>
            </Card>

            {/* Professional Information */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Building className="h-5 w-5 text-blue-600" />
                  Professional Information
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="dsaId">DSA ID</Label>
                    <Input id="dsaId" value={dsaProfile.professionalInfo.dsaId} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="bankName">Bank Name</Label>
                    <Input id="bankName" value={dsaProfile.professionalInfo.bankName} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="branchName">Branch Name</Label>
                    <Input id="branchName" value={dsaProfile.professionalInfo.branchName} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="designation">Designation</Label>
                    <Input id="designation" value={dsaProfile.professionalInfo.designation} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="experience">Experience</Label>
                    <Input id="experience" value={dsaProfile.professionalInfo.experience} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="joiningDate">Joining Date</Label>
                    <Input 
                      id="joiningDate" 
                      value={new Date(dsaProfile.professionalInfo.joiningDate).toLocaleDateString()} 
                      readOnly 
                    />
                  </div>
                </div>
                <div>
                  <Label>Specialization</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dsaProfile.professionalInfo.specialization.map((spec, index) => (
                      <Badge key={index} variant="outline">
                        {spec}
                      </Badge>
                    ))}
                  </div>
                </div>
                <div>
                  <Label>Certifications</Label>
                  <div className="flex flex-wrap gap-2 mt-2">
                    {dsaProfile.professionalInfo.certifications.map((cert, index) => (
                      <Badge key={index} className="bg-green-100 text-green-800">
                        <Award className="h-3 w-3 mr-1" />
                        {cert}
                      </Badge>
                    ))}
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Banking Details */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <DollarSign className="h-5 w-5 text-blue-600" />
                  Banking Details
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  <div>
                    <Label htmlFor="accountNumber">Account Number</Label>
                    <Input 
                      id="accountNumber" 
                      value={`****${dsaProfile.bankingDetails.accountNumber.slice(-4)}`} 
                      readOnly 
                    />
                  </div>
                  <div>
                    <Label htmlFor="ifscCode">IFSC Code</Label>
                    <Input id="ifscCode" value={dsaProfile.bankingDetails.ifscCode} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="accountHolderName">Account Holder Name</Label>
                    <Input id="accountHolderName" value={dsaProfile.bankingDetails.accountHolderName} readOnly />
                  </div>
                  <div>
                    <Label htmlFor="bankBranch">Bank & Branch</Label>
                    <Input 
                      id="bankBranch" 
                      value={`${dsaProfile.bankingDetails.bankName} - ${dsaProfile.bankingDetails.branchName}`} 
                      readOnly 
                    />
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Document Status */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <FileText className="h-5 w-5 text-blue-600" />
                  Document Verification Status
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
                  {Object.entries(dsaProfile.documents).map(([key, doc]) => (
                    <div key={key} className="flex items-center justify-between p-3 border border-slate-200 rounded-lg">
                      <div className="flex items-center gap-3">
                        <Shield className="h-4 w-4 text-slate-400" />
                        <div>
                          <div className="font-medium text-slate-900 capitalize">
                            {key.replace(/([A-Z])/g, ' $1').trim()}
                          </div>
                          <div className="text-xs text-slate-500">
                            Uploaded {new Date(doc.uploadedAt).toLocaleDateString()}
                          </div>
                        </div>
                      </div>
                      <Badge className={getDocumentStatusColor(doc.status)} >
                        {doc.status}
                      </Badge>
                    </div>
                  ))}
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
