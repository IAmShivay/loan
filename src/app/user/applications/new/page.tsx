'use client';



import React, { useState } from 'react';
import { useRouter } from 'next/navigation';
import { useSession } from 'next-auth/react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Textarea } from '@/components/ui/textarea';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Checkbox } from '@/components/ui/checkbox';
import { Progress } from '@/components/ui/progress';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { ArrowLeft, ArrowRight, Save, Send, Upload, FileText, AlertCircle, CheckCircle, CreditCard, Shield, Clock, User, GraduationCap, DollarSign, Users } from 'lucide-react';
import { toast } from 'sonner';
import { formatFullCurrency, formatLoanAmount } from '@/lib/utils/currency';

import { useCreateApplicationWithFilesMutation } from '@/store/api/apiSlice';

interface FormData {
  // Personal Information
  firstName: string;
  lastName: string;
  email: string;
  phone: string;
  dateOfBirth: string;
  aadharNumber: string;
  panNumber: string;
  
  // Address Information
  address: string;
  city: string;
  state: string;
  pincode: string;
  
  // Education Information
  institution: string;
  course: string;
  duration: string;
  admissionDate: string;
  feeStructure: number;
  
  // Loan Information
  loanAmount: number;
  purpose: string;
  
  // Financial Information
  annualIncome: number;
  employmentType: string;
  employerName: string;
  workExperience: string;
  
  // Co-applicant Information (optional)
  hasCoApplicant: boolean;
  coApplicantName: string;
  coApplicantRelation: string;
  coApplicantIncome: number;
  
  // Terms and conditions
  agreeToTerms: boolean;
  agreeToProcessing: boolean;
}

const initialFormData: FormData = {
  firstName: '',
  lastName: '',
  email: '',
  phone: '',
  dateOfBirth: '',
  aadharNumber: '',
  panNumber: '',
  address: '',
  city: '',
  state: '',
  pincode: '',
  institution: '',
  course: '',
  duration: '',
  admissionDate: '',
  feeStructure: 0,
  loanAmount: 0,
  purpose: '',
  annualIncome: 0,
  employmentType: '',
  employerName: '',
  workExperience: '',
  hasCoApplicant: false,
  coApplicantName: '',
  coApplicantRelation: '',
  coApplicantIncome: 0,
  agreeToTerms: false,
  agreeToProcessing: false,
};

const steps = [
  { id: 1, title: 'Personal Info', icon: User, description: 'Basic personal details' },
  { id: 2, title: 'Education', icon: GraduationCap, description: 'Educational information' },
  { id: 3, title: 'Financial', icon: DollarSign, description: 'Financial details' },
  { id: 4, title: 'Documents', icon: FileText, description: 'Upload documents' },
  { id: 5, title: 'Review', icon: CheckCircle, description: 'Review and submit' },
];

export default function NewLoanApplication() {
  const { data: session } = useSession();
  const router = useRouter();
  const [currentStep, setCurrentStep] = useState(1);
  const [formData, setFormData] = useState<FormData>(initialFormData);
  const [errors, setErrors] = useState<Record<string, string>>({});
  const [uploadedFiles, setUploadedFiles] = useState<Record<string, File[]>>({});
  
  const [createApplicationWithFiles, { isLoading: isSubmitting }] = useCreateApplicationWithFilesMutation();

  // Redirect if not authenticated
  if (!session) {
    router.push('/login');
    return null;
  }

  const updateFormData = (field: keyof FormData, value: any) => {
    setFormData(prev => ({ ...prev, [field]: value }));
    // Clear error when user starts typing
    if (errors[field]) {
      setErrors(prev => ({ ...prev, [field]: '' }));
    }
  };

  const validateStep = (step: number): boolean => {
    const newErrors: Record<string, string> = {};

    switch (step) {
      case 1: // Personal Info
        if (!formData.firstName.trim()) newErrors.firstName = 'First name is required';
        if (!formData.lastName.trim()) newErrors.lastName = 'Last name is required';
        if (!formData.email.trim()) newErrors.email = 'Email is required';
        if (!formData.phone.trim()) newErrors.phone = 'Phone is required';
        if (!formData.dateOfBirth) newErrors.dateOfBirth = 'Date of birth is required';
        if (!formData.aadharNumber.trim()) newErrors.aadharNumber = 'Aadhar number is required';
        if (!formData.panNumber.trim()) newErrors.panNumber = 'PAN number is required';
        if (!formData.address.trim()) newErrors.address = 'Address is required';
        if (!formData.city.trim()) newErrors.city = 'City is required';
        if (!formData.state.trim()) newErrors.state = 'State is required';
        if (!formData.pincode.trim()) newErrors.pincode = 'Pincode is required';
        break;

      case 2: // Education
        if (!formData.institution.trim()) newErrors.institution = 'Institution is required';
        if (!formData.course.trim()) newErrors.course = 'Course is required';
        if (!formData.duration.trim()) newErrors.duration = 'Duration is required';
        if (!formData.admissionDate) newErrors.admissionDate = 'Admission date is required';
        if (!formData.feeStructure || formData.feeStructure < 1000) newErrors.feeStructure = 'Fee structure must be at least ₹1,000';
        break;

      case 3: // Financial
        if (!formData.loanAmount || formData.loanAmount < 50000) newErrors.loanAmount = 'Loan amount must be at least ₹50,000';
        if (formData.loanAmount > 5000000) newErrors.loanAmount = 'Loan amount cannot exceed ₹50,00,000';
        if (!formData.purpose.trim()) newErrors.purpose = 'Purpose is required';
        if (!formData.annualIncome || formData.annualIncome < 100000) newErrors.annualIncome = 'Annual income must be at least ₹1,00,000';
        if (!formData.employmentType.trim()) newErrors.employmentType = 'Employment type is required';
        if (!formData.employerName.trim()) newErrors.employerName = 'Employer name is required';
        if (!formData.workExperience.trim()) newErrors.workExperience = 'Work experience is required';
        break;

      case 4: // Documents
        const requiredDocs = ['aadhar_card', 'pan_card', 'income_certificate', 'bank_statement', 'admission_letter', 'fee_structure'];
        for (const doc of requiredDocs) {
          if (!uploadedFiles[doc] || uploadedFiles[doc].length === 0) {
            newErrors[doc] = `${doc.replace('_', ' ')} is required`;
          }
        }
        break;

      case 5: // Review
        if (!formData.agreeToTerms) newErrors.agreeToTerms = 'You must agree to terms and conditions';
        if (!formData.agreeToProcessing) newErrors.agreeToProcessing = 'You must agree to data processing';
        break;
    }

    setErrors(newErrors);
    return Object.keys(newErrors).length === 0;
  };

  const nextStep = () => {
    if (validateStep(currentStep)) {
      setCurrentStep(prev => Math.min(prev + 1, steps.length));
    }
  };

  const prevStep = () => {
    setCurrentStep(prev => Math.max(prev - 1, 1));
  };

  const handleSubmit = async () => {
    if (!validateStep(5)) return;

    try {
      // Create FormData for multipart/form-data submission
      const formDataToSubmit = new FormData();

      // Add application data as JSON string
      const applicationData = {
        personalInfo: {
          firstName: formData.firstName,
          lastName: formData.lastName,
          email: formData.email,
          phone: formData.phone,
          dateOfBirth: formData.dateOfBirth,
          aadharNumber: formData.aadharNumber,
          panNumber: formData.panNumber,
          address: {
            street: formData.address,
            city: formData.city,
            state: formData.state,
            pincode: formData.pincode,
          },
        },
        educationInfo: {
          instituteName: formData.institution,
          course: formData.course,
          duration: formData.duration,
          admissionDate: formData.admissionDate,
          feeStructure: formData.feeStructure,
        },
        loanInfo: {
          amount: formData.loanAmount,
          purpose: formData.purpose,
        },
        financialInfo: {
          annualIncome: formData.annualIncome,
          employmentType: formData.employmentType,
          employerName: formData.employerName,
          workExperience: formData.workExperience,
        },
        coApplicant: formData.hasCoApplicant ? {
          name: formData.coApplicantName,
          relation: formData.coApplicantRelation,
          annualIncome: formData.coApplicantIncome,
        } : undefined,
      };

      formDataToSubmit.append('applicationData', JSON.stringify(applicationData));

      // Add files to FormData - map form field names to API field names
      const fileFieldMapping = {
        'aadhar_card': 'aadharCard',
        'pan_card': 'panCard',
        'income_certificate': 'incomeProof',
        'bank_statement': 'bankStatement',
        'admission_letter': 'educationCertificate',
        'fee_structure': 'feeReceipt'
      };

      Object.entries(fileFieldMapping).forEach(([formFieldName, apiFieldName]) => {
        const files = uploadedFiles[formFieldName] || [];
        files.forEach((file: File) => {
          if (file) {
            formDataToSubmit.append(apiFieldName, file);
          }
        });
      });

      const result = await createApplicationWithFiles(formDataToSubmit).unwrap();

      toast.success('Application submitted successfully!');
      router.push(`/user/applications/${result.applicationId}`);

    } catch (error: any) {
      console.error('Application submission error:', error);
      toast.error(error?.data?.error || 'Failed to submit application');
    }
  };

  const handleFileUpload = (documentType: string, files: File[]) => {
    setUploadedFiles(prev => ({
      ...prev,
      [documentType]: files
    }));
  };

  const renderStepContent = () => {
    switch (currentStep) {
      case 1:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="firstName">First Name *</Label>
                <Input
                  id="firstName"
                  value={formData.firstName}
                  onChange={(e) => updateFormData('firstName', e.target.value)}
                  className={errors.firstName ? 'border-red-500' : ''}
                />
                {errors.firstName && <p className="text-sm text-red-500">{errors.firstName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="lastName">Last Name *</Label>
                <Input
                  id="lastName"
                  value={formData.lastName}
                  onChange={(e) => updateFormData('lastName', e.target.value)}
                  className={errors.lastName ? 'border-red-500' : ''}
                />
                {errors.lastName && <p className="text-sm text-red-500">{errors.lastName}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="email">Email Address *</Label>
                <Input
                  id="email"
                  type="email"
                  value={formData.email}
                  onChange={(e) => updateFormData('email', e.target.value)}
                  className={errors.email ? 'border-red-500' : ''}
                />
                {errors.email && <p className="text-sm text-red-500">{errors.email}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="phone">Phone Number *</Label>
                <Input
                  id="phone"
                  value={formData.phone}
                  onChange={(e) => updateFormData('phone', e.target.value)}
                  className={errors.phone ? 'border-red-500' : ''}
                />
                {errors.phone && <p className="text-sm text-red-500">{errors.phone}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="dateOfBirth">Date of Birth *</Label>
                <Input
                  id="dateOfBirth"
                  type="date"
                  value={formData.dateOfBirth}
                  onChange={(e) => updateFormData('dateOfBirth', e.target.value)}
                  className={errors.dateOfBirth ? 'border-red-500' : ''}
                />
                {errors.dateOfBirth && <p className="text-sm text-red-500">{errors.dateOfBirth}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="aadharNumber">Aadhar Number *</Label>
                <Input
                  id="aadharNumber"
                  value={formData.aadharNumber}
                  onChange={(e) => updateFormData('aadharNumber', e.target.value)}
                  className={errors.aadharNumber ? 'border-red-500' : ''}
                  maxLength={12}
                />
                {errors.aadharNumber && <p className="text-sm text-red-500">{errors.aadharNumber}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="panNumber">PAN Number *</Label>
                <Input
                  id="panNumber"
                  value={formData.panNumber}
                  onChange={(e) => updateFormData('panNumber', e.target.value.toUpperCase())}
                  className={errors.panNumber ? 'border-red-500' : ''}
                  maxLength={10}
                />
                {errors.panNumber && <p className="text-sm text-red-500">{errors.panNumber}</p>}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <h3 className="text-lg font-semibold">Address Information</h3>
              
              <div className="space-y-2">
                <Label htmlFor="address">Full Address *</Label>
                <Textarea
                  id="address"
                  value={formData.address}
                  onChange={(e) => updateFormData('address', e.target.value)}
                  className={errors.address ? 'border-red-500' : ''}
                  rows={3}
                />
                {errors.address && <p className="text-sm text-red-500">{errors.address}</p>}
              </div>

              <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
                <div className="space-y-2">
                  <Label htmlFor="city">City *</Label>
                  <Input
                    id="city"
                    value={formData.city}
                    onChange={(e) => updateFormData('city', e.target.value)}
                    className={errors.city ? 'border-red-500' : ''}
                  />
                  {errors.city && <p className="text-sm text-red-500">{errors.city}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="state">State *</Label>
                  <Select value={formData.state} onValueChange={(value) => updateFormData('state', value)}>
                    <SelectTrigger className={errors.state ? 'border-red-500' : ''}>
                      <SelectValue placeholder="Select state" />
                    </SelectTrigger>
                    <SelectContent>
                      <SelectItem value="andhra-pradesh">Andhra Pradesh</SelectItem>
                      <SelectItem value="karnataka">Karnataka</SelectItem>
                      <SelectItem value="tamil-nadu">Tamil Nadu</SelectItem>
                      <SelectItem value="telangana">Telangana</SelectItem>
                      <SelectItem value="maharashtra">Maharashtra</SelectItem>
                      <SelectItem value="gujarat">Gujarat</SelectItem>
                      <SelectItem value="rajasthan">Rajasthan</SelectItem>
                      <SelectItem value="uttar-pradesh">Uttar Pradesh</SelectItem>
                      <SelectItem value="west-bengal">West Bengal</SelectItem>
                      <SelectItem value="delhi">Delhi</SelectItem>
                    </SelectContent>
                  </Select>
                  {errors.state && <p className="text-sm text-red-500">{errors.state}</p>}
                </div>
                
                <div className="space-y-2">
                  <Label htmlFor="pincode">Pincode *</Label>
                  <Input
                    id="pincode"
                    value={formData.pincode}
                    onChange={(e) => updateFormData('pincode', e.target.value)}
                    className={errors.pincode ? 'border-red-500' : ''}
                    maxLength={6}
                  />
                  {errors.pincode && <p className="text-sm text-red-500">{errors.pincode}</p>}
                </div>
              </div>
            </div>
          </div>
        );

      case 2:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="institution">Institution Name *</Label>
                <Input
                  id="institution"
                  value={formData.institution}
                  onChange={(e) => updateFormData('institution', e.target.value)}
                  className={errors.institution ? 'border-red-500' : ''}
                />
                {errors.institution && <p className="text-sm text-red-500">{errors.institution}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="course">Course Name *</Label>
                <Input
                  id="course"
                  value={formData.course}
                  onChange={(e) => updateFormData('course', e.target.value)}
                  className={errors.course ? 'border-red-500' : ''}
                />
                {errors.course && <p className="text-sm text-red-500">{errors.course}</p>}
              </div>
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="duration">Course Duration *</Label>
                <Select value={formData.duration} onValueChange={(value) => updateFormData('duration', value)}>
                  <SelectTrigger className={errors.duration ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select duration" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="1-year">1 Year</SelectItem>
                    <SelectItem value="2-years">2 Years</SelectItem>
                    <SelectItem value="3-years">3 Years</SelectItem>
                    <SelectItem value="4-years">4 Years</SelectItem>
                    <SelectItem value="5-years">5 Years</SelectItem>
                  </SelectContent>
                </Select>
                {errors.duration && <p className="text-sm text-red-500">{errors.duration}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="admissionDate">Admission Date *</Label>
                <Input
                  id="admissionDate"
                  type="date"
                  value={formData.admissionDate}
                  onChange={(e) => updateFormData('admissionDate', e.target.value)}
                  className={errors.admissionDate ? 'border-red-500' : ''}
                />
                {errors.admissionDate && <p className="text-sm text-red-500">{errors.admissionDate}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="feeStructure">Total Fee Structure *</Label>
                <Input
                  id="feeStructure"
                  type="number"
                  value={formData.feeStructure || ''}
                  onChange={(e) => updateFormData('feeStructure', parseInt(e.target.value) || 0)}
                  className={errors.feeStructure ? 'border-red-500' : ''}
                  placeholder="Enter total fees"
                />
                {errors.feeStructure && <p className="text-sm text-red-500">{errors.feeStructure}</p>}
              </div>
            </div>
          </div>
        );

      case 3:
        return (
          <div className="space-y-6">
            <div className="grid grid-cols-1 md:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="loanAmount">Loan Amount Required *</Label>
                <Input
                  id="loanAmount"
                  type="number"
                  value={formData.loanAmount || ''}
                  onChange={(e) => updateFormData('loanAmount', parseInt(e.target.value) || 0)}
                  className={errors.loanAmount ? 'border-red-500' : ''}
                  placeholder="Enter loan amount"
                />
                <p className="text-sm text-gray-600">
                  Minimum: {formatFullCurrency(50000)} | Maximum: {formatFullCurrency(5000000)}
                </p>
                {errors.loanAmount && <p className="text-sm text-red-500">{errors.loanAmount}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="annualIncome">Annual Income *</Label>
                <Input
                  id="annualIncome"
                  type="number"
                  value={formData.annualIncome || ''}
                  onChange={(e) => updateFormData('annualIncome', parseInt(e.target.value) || 0)}
                  className={errors.annualIncome ? 'border-red-500' : ''}
                  placeholder="Enter annual income"
                />
                {errors.annualIncome && <p className="text-sm text-red-500">{errors.annualIncome}</p>}
              </div>
            </div>

            <div className="space-y-2">
              <Label htmlFor="purpose">Purpose of Loan *</Label>
              <Textarea
                id="purpose"
                value={formData.purpose}
                onChange={(e) => updateFormData('purpose', e.target.value)}
                className={errors.purpose ? 'border-red-500' : ''}
                rows={3}
                placeholder="Describe the purpose of the loan"
              />
              {errors.purpose && <p className="text-sm text-red-500">{errors.purpose}</p>}
            </div>

            <div className="grid grid-cols-1 md:grid-cols-3 gap-6">
              <div className="space-y-2">
                <Label htmlFor="employmentType">Employment Type *</Label>
                <Select value={formData.employmentType} onValueChange={(value) => updateFormData('employmentType', value)}>
                  <SelectTrigger className={errors.employmentType ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select employment type" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="salaried">Salaried</SelectItem>
                    <SelectItem value="self-employed">Self Employed</SelectItem>
                    <SelectItem value="business">Business Owner</SelectItem>
                    <SelectItem value="freelancer">Freelancer</SelectItem>
                    <SelectItem value="student">Student</SelectItem>
                  </SelectContent>
                </Select>
                {errors.employmentType && <p className="text-sm text-red-500">{errors.employmentType}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="employerName">Employer/Company Name *</Label>
                <Input
                  id="employerName"
                  value={formData.employerName}
                  onChange={(e) => updateFormData('employerName', e.target.value)}
                  className={errors.employerName ? 'border-red-500' : ''}
                />
                {errors.employerName && <p className="text-sm text-red-500">{errors.employerName}</p>}
              </div>
              
              <div className="space-y-2">
                <Label htmlFor="workExperience">Work Experience *</Label>
                <Select value={formData.workExperience} onValueChange={(value) => updateFormData('workExperience', value)}>
                  <SelectTrigger className={errors.workExperience ? 'border-red-500' : ''}>
                    <SelectValue placeholder="Select experience" />
                  </SelectTrigger>
                  <SelectContent>
                    <SelectItem value="0-1-years">0-1 Years</SelectItem>
                    <SelectItem value="1-3-years">1-3 Years</SelectItem>
                    <SelectItem value="3-5-years">3-5 Years</SelectItem>
                    <SelectItem value="5-10-years">5-10 Years</SelectItem>
                    <SelectItem value="10+-years">10+ Years</SelectItem>
                  </SelectContent>
                </Select>
                {errors.workExperience && <p className="text-sm text-red-500">{errors.workExperience}</p>}
              </div>
            </div>

            <Separator />

            <div className="space-y-4">
              <div className="flex items-center space-x-2">
                <Checkbox
                  id="hasCoApplicant"
                  checked={formData.hasCoApplicant}
                  onCheckedChange={(checked) => updateFormData('hasCoApplicant', checked)}
                />
                <Label htmlFor="hasCoApplicant">Add Co-applicant (Optional)</Label>
              </div>

              {formData.hasCoApplicant && (
                <div className="grid grid-cols-1 md:grid-cols-3 gap-6 p-4 border rounded-lg bg-gray-50">
                  <div className="space-y-2">
                    <Label htmlFor="coApplicantName">Co-applicant Name</Label>
                    <Input
                      id="coApplicantName"
                      value={formData.coApplicantName}
                      onChange={(e) => updateFormData('coApplicantName', e.target.value)}
                    />
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="coApplicantRelation">Relation</Label>
                    <Select value={formData.coApplicantRelation} onValueChange={(value) => updateFormData('coApplicantRelation', value)}>
                      <SelectTrigger>
                        <SelectValue placeholder="Select relation" />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="father">Father</SelectItem>
                        <SelectItem value="mother">Mother</SelectItem>
                        <SelectItem value="spouse">Spouse</SelectItem>
                        <SelectItem value="sibling">Sibling</SelectItem>
                        <SelectItem value="guardian">Guardian</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  
                  <div className="space-y-2">
                    <Label htmlFor="coApplicantIncome">Annual Income</Label>
                    <Input
                      id="coApplicantIncome"
                      type="number"
                      value={formData.coApplicantIncome || ''}
                      onChange={(e) => updateFormData('coApplicantIncome', parseInt(e.target.value) || 0)}
                      placeholder="Enter annual income"
                    />
                  </div>
                </div>
              )}
            </div>
          </div>
        );

      case 4:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Upload Required Documents</h3>
              <p className="text-gray-600">Please upload all required documents to proceed with your application</p>
            </div>

            <div className="grid grid-cols-1 lg:grid-cols-2 gap-6">
              <div className="space-y-2">
                <Label htmlFor="aadhar_card">Aadhar Card *</Label>
                <Input
                  id="aadhar_card"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    handleFileUpload('aadhar_card', files);
                  }}
                  className={errors.aadhar_card ? 'border-red-500' : ''}
                />
                {errors.aadhar_card && <p className="text-sm text-red-500">{errors.aadhar_card}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="pan_card">PAN Card *</Label>
                <Input
                  id="pan_card"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    handleFileUpload('pan_card', files);
                  }}
                  className={errors.pan_card ? 'border-red-500' : ''}
                />
                {errors.pan_card && <p className="text-sm text-red-500">{errors.pan_card}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="income_certificate">Income Certificate *</Label>
                <Input
                  id="income_certificate"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    handleFileUpload('income_certificate', files);
                  }}
                  className={errors.income_certificate ? 'border-red-500' : ''}
                />
                {errors.income_certificate && <p className="text-sm text-red-500">{errors.income_certificate}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="bank_statement">Bank Statement *</Label>
                <Input
                  id="bank_statement"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    handleFileUpload('bank_statement', files);
                  }}
                  className={errors.bank_statement ? 'border-red-500' : ''}
                />
                {errors.bank_statement && <p className="text-sm text-red-500">{errors.bank_statement}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="admission_letter">Admission Letter *</Label>
                <Input
                  id="admission_letter"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    handleFileUpload('admission_letter', files);
                  }}
                  className={errors.admission_letter ? 'border-red-500' : ''}
                />
                {errors.admission_letter && <p className="text-sm text-red-500">{errors.admission_letter}</p>}
              </div>

              <div className="space-y-2">
                <Label htmlFor="fee_structure">Fee Structure *</Label>
                <Input
                  id="fee_structure"
                  type="file"
                  accept=".pdf,.jpg,.jpeg,.png"
                  onChange={(e) => {
                    const files = e.target.files ? Array.from(e.target.files) : [];
                    handleFileUpload('fee_structure', files);
                  }}
                  className={errors.fee_structure ? 'border-red-500' : ''}
                />
                {errors.fee_structure && <p className="text-sm text-red-500">{errors.fee_structure}</p>}
              </div>
            </div>

            {Object.keys(errors).some(key => key.includes('_')) && (
              <div className="bg-red-50 border border-red-200 rounded-lg p-4">
                <div className="flex items-center space-x-2 text-red-600">
                  <AlertCircle className="h-5 w-5" />
                  <span className="font-medium">Missing Required Documents</span>
                </div>
                <ul className="mt-2 text-sm text-red-600 list-disc list-inside">
                  {Object.entries(errors)
                    .filter(([key]) => key.includes('_'))
                    .map(([key, error]) => (
                      <li key={key}>{error}</li>
                    ))}
                </ul>
              </div>
            )}
          </div>
        );

      case 5:
        return (
          <div className="space-y-6">
            <div className="text-center mb-6">
              <h3 className="text-lg font-semibold mb-2">Review Your Application</h3>
              <p className="text-gray-600">Please review all information before submitting</p>
            </div>

            {/* Personal Information Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <User className="h-5 w-5" />
                  <span>Personal Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Name:</strong> {formData.firstName} {formData.lastName}</div>
                  <div><strong>Email:</strong> {formData.email}</div>
                  <div><strong>Phone:</strong> {formData.phone}</div>
                  <div><strong>Date of Birth:</strong> {formData.dateOfBirth}</div>
                  <div><strong>Aadhar:</strong> {formData.aadharNumber}</div>
                  <div><strong>PAN:</strong> {formData.panNumber}</div>
                </div>
                <div className="text-sm">
                  <strong>Address:</strong> {formData.address}, {formData.city}, {formData.state} - {formData.pincode}
                </div>
              </CardContent>
            </Card>

            {/* Education Information Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <GraduationCap className="h-5 w-5" />
                  <span>Education Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Institution:</strong> {formData.institution}</div>
                  <div><strong>Course:</strong> {formData.course}</div>
                  <div><strong>Duration:</strong> {formData.duration}</div>
                  <div><strong>Admission Date:</strong> {formData.admissionDate}</div>
                  <div><strong>Total Fees:</strong> {formatFullCurrency(formData.feeStructure)}</div>
                </div>
              </CardContent>
            </Card>

            {/* Financial Information Summary */}
            <Card>
              <CardHeader>
                <CardTitle className="flex items-center space-x-2">
                  <DollarSign className="h-5 w-5" />
                  <span>Financial Information</span>
                </CardTitle>
              </CardHeader>
              <CardContent className="space-y-2">
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div><strong>Loan Amount:</strong> {formatFullCurrency(formData.loanAmount)}</div>
                  <div><strong>Annual Income:</strong> {formatFullCurrency(formData.annualIncome)}</div>
                  <div><strong>Employment:</strong> {formData.employmentType}</div>
                  <div><strong>Employer:</strong> {formData.employerName}</div>
                  <div><strong>Experience:</strong> {formData.workExperience}</div>
                </div>
                <div className="text-sm">
                  <strong>Purpose:</strong> {formData.purpose}
                </div>
              </CardContent>
            </Card>

            {/* Service Charge Information */}
            <Card className="border-blue-200 bg-blue-50">
              <CardHeader>
                <CardTitle className="flex items-center space-x-2 text-blue-700">
                  <CreditCard className="h-5 w-5" />
                  <span>Service Charges</span>
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="flex items-center justify-between">
                  <div>
                    <p className="text-sm text-blue-600">Application Processing Fee</p>
                    <p className="text-xs text-blue-500">One-time non-refundable fee</p>
                  </div>
                  <div className="text-right">
                    <span className="font-bold text-lg text-blue-600">{formatFullCurrency(99)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Terms and Conditions */}
            <div className="space-y-4">
              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToTerms"
                  checked={formData.agreeToTerms}
                  onCheckedChange={(checked) => updateFormData('agreeToTerms', checked)}
                  className={errors.agreeToTerms ? 'border-red-500' : ''}
                />
                <Label htmlFor="agreeToTerms" className="text-sm leading-relaxed">
                  I agree to the <a href="#" className="text-blue-600 hover:underline">Terms and Conditions</a> and 
                  understand that the information provided is accurate and complete.
                </Label>
              </div>
              {errors.agreeToTerms && <p className="text-sm text-red-500 ml-6">{errors.agreeToTerms}</p>}

              <div className="flex items-start space-x-2">
                <Checkbox
                  id="agreeToProcessing"
                  checked={formData.agreeToProcessing}
                  onCheckedChange={(checked) => updateFormData('agreeToProcessing', checked)}
                  className={errors.agreeToProcessing ? 'border-red-500' : ''}
                />
                <Label htmlFor="agreeToProcessing" className="text-sm leading-relaxed">
                  I consent to the processing of my personal data for loan application purposes and 
                  communication from authorized DSAs and bank representatives.
                </Label>
              </div>
              {errors.agreeToProcessing && <p className="text-sm text-red-500 ml-6">{errors.agreeToProcessing}</p>}
            </div>
          </div>
        );

      default:
        return null;
    }
  };

  return (
    <DashboardLayout>
      <div className="max-w-4xl mx-auto p-6 space-y-6">
        {/* Header */}
        <div className="text-center">
          <h1 className="text-3xl font-bold text-gray-900 mb-2">New Loan Application</h1>
          <p className="text-gray-600">Complete your education loan application in simple steps</p>
        </div>

        {/* Progress Steps */}
        <div className="flex items-center justify-between mb-8">
          {steps.map((step, index) => {
            const isActive = currentStep === step.id;
            const isCompleted = currentStep > step.id;
            const IconComponent = step.icon;

            return (
              <div key={step.id} className="flex items-center">
                <div className={`flex items-center justify-center w-10 h-10 rounded-full border-2 ${
                  isCompleted ? 'bg-green-500 border-green-500 text-white' :
                  isActive ? 'bg-blue-500 border-blue-500 text-white' :
                  'bg-gray-100 border-gray-300 text-gray-400'
                }`}>
                  {isCompleted ? (
                    <CheckCircle className="h-5 w-5" />
                  ) : (
                    <IconComponent className="h-5 w-5" />
                  )}
                </div>
                <div className="ml-3 hidden sm:block">
                  <p className={`text-sm font-medium ${
                    isActive ? 'text-blue-600' : isCompleted ? 'text-green-600' : 'text-gray-500'
                  }`}>
                    {step.title}
                  </p>
                  <p className="text-xs text-gray-500">{step.description}</p>
                </div>
                {index < steps.length - 1 && (
                  <div className={`hidden sm:block w-16 h-0.5 ml-4 ${
                    isCompleted ? 'bg-green-500' : 'bg-gray-300'
                  }`} />
                )}
              </div>
            );
          })}
        </div>

        {/* Progress Bar */}
        <div className="mb-8">
          <div className="flex justify-between text-sm text-gray-600 mb-2">
            <span>Step {currentStep} of {steps.length}</span>
            <span>{Math.round((currentStep / steps.length) * 100)}% Complete</span>
          </div>
          <Progress value={(currentStep / steps.length) * 100} className="h-2" />
        </div>

        {/* Step Content */}
        <Card>
          <CardHeader>
            <CardTitle className="flex items-center space-x-2">
              {React.createElement(steps[currentStep - 1].icon, { className: "h-5 w-5" })}
              <span>{steps[currentStep - 1].title}</span>
            </CardTitle>
            <CardDescription>{steps[currentStep - 1].description}</CardDescription>
          </CardHeader>
          <CardContent>
            {renderStepContent()}
          </CardContent>
        </Card>

        {/* Navigation Buttons */}
        <div className="flex justify-between">
          <Button
            variant="outline"
            onClick={prevStep}
            disabled={currentStep === 1}
            className="flex items-center space-x-2"
          >
            <ArrowLeft className="h-4 w-4" />
            <span>Previous</span>
          </Button>

          {currentStep < steps.length ? (
            <Button
              onClick={nextStep}
              className="flex items-center space-x-2"
            >
              <span>Next</span>
              <ArrowRight className="h-4 w-4" />
            </Button>
          ) : (
            <Button
              onClick={handleSubmit}
              disabled={isSubmitting}
              className="flex items-center space-x-2 bg-green-600 hover:bg-green-700"
            >
              {isSubmitting ? (
                <>
                  <Clock className="h-4 w-4 animate-spin" />
                  <span>Submitting...</span>
                </>
              ) : (
                <>
                  <Send className="h-4 w-4" />
                  <span>Submit Application</span>
                </>
              )}
            </Button>
          )}
        </div>
      </div>
    </DashboardLayout>
  );
}
