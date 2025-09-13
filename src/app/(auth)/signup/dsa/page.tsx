'use client';

import { useState } from 'react';
import { useRouter } from 'next/navigation';
import Link from 'next/link';
import { useForm } from 'react-hook-form';
import { zodResolver } from '@hookform/resolvers/zod';
import { z } from 'zod';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { FormInput, BankSelect } from '@/components/forms';
import { LoadingSpinner } from '@/components/common';
import { toast } from 'sonner';
import { Eye, EyeOff, AlertCircle } from 'lucide-react';
import { Alert, AlertDescription } from '@/components/ui/alert';

const dsaRegisterSchema = z.object({
  firstName: z.string().min(1, 'First name is required').max(50, 'First name too long'),
  lastName: z.string().min(1, 'Last name is required').max(50, 'Last name too long'),
  email: z.string().email('Invalid email address'),
  phone: z.string().regex(/^[6-9]\d{9}$/, 'Invalid phone number'),
  password: z.string().min(8, 'Password must be at least 8 characters'),
  confirmPassword: z.string(),
  bankName: z.enum(['SBI', 'HDFC', 'ICICI', 'AXIS', 'KOTAK'], {
    message: 'Please select a bank',
  }),
}).refine((data) => data.password === data.confirmPassword, {
  message: "Passwords don't match",
  path: ["confirmPassword"],
});

type DSARegisterForm = z.infer<typeof dsaRegisterSchema>;

export default function DSARegisterPage() {
  const [isLoading, setIsLoading] = useState(false);
  const [showPassword, setShowPassword] = useState(false);
  const [showConfirmPassword, setShowConfirmPassword] = useState(false);
  const router = useRouter();

  const {
    register,
    handleSubmit,
    setValue,
    formState: { errors },
  } = useForm<DSARegisterForm>({
    resolver: zodResolver(dsaRegisterSchema),
  });

  const onSubmit = async (data: DSARegisterForm) => {
    setIsLoading(true);
    
    try {
      const response = await fetch('/api/auth/register', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          ...data,
          role: 'dsa',
        }),
      });

      const result = await response.json();

      if (result.success) {
        toast.success(result.message);
        router.push('/login');
      } else {
        toast.error(result.error || 'Registration failed');
      }
    } catch {
      toast.error('An unexpected error occurred');
    } finally {
      setIsLoading(false);
    }
  };

  return (
    <div className="min-h-screen flex items-center justify-center bg-gray-50 py-12 px-4 sm:px-6 lg:px-8">
      <div className="max-w-md w-full space-y-8">
        <div className="text-center">
          <div className="mx-auto h-12 w-12 bg-primary rounded-lg flex items-center justify-center">
            <span className="text-white font-bold text-xl">LM</span>
          </div>
          <h2 className="mt-6 text-3xl font-bold text-gray-900">
            DSA Registration
          </h2>
          <p className="mt-2 text-sm text-gray-600">
            Register as a Direct Selling Agent
          </p>
        </div>

        <Alert>
          <AlertCircle className="h-4 w-4" />
          <AlertDescription>
            DSA accounts require admin verification before activation. You will be notified once your account is approved.
          </AlertDescription>
        </Alert>

        <Card>
          <CardHeader>
            <CardTitle>DSA Registration</CardTitle>
            <CardDescription>
              Fill in your details to register as a DSA
            </CardDescription>
          </CardHeader>
          <CardContent>
            <form onSubmit={handleSubmit(onSubmit)} className="space-y-4">
              <div className="grid grid-cols-2 gap-4">
                <FormInput
                  label="First Name"
                  placeholder="Enter first name"
                  error={errors.firstName?.message}
                  required
                  {...register('firstName')}
                />
                <FormInput
                  label="Last Name"
                  placeholder="Enter last name"
                  error={errors.lastName?.message}
                  required
                  {...register('lastName')}
                />
              </div>

              <FormInput
                label="Email Address"
                type="email"
                placeholder="Enter your email"
                error={errors.email?.message}
                required
                {...register('email')}
              />

              <FormInput
                label="Phone Number"
                type="tel"
                placeholder="Enter 10-digit phone number"
                error={errors.phone?.message}
                helperText="Enter a valid 10-digit Indian mobile number"
                required
                {...register('phone')}
              />

              <BankSelect
                label="Bank Affiliation"
                placeholder="Select your bank"
                error={errors.bankName?.message}
                required
                onValueChange={(value) => setValue('bankName', value as 'SBI' | 'HDFC' | 'ICICI' | 'AXIS' | 'KOTAK')}
              />

              <div className="relative">
                <FormInput
                  label="Password"
                  type={showPassword ? 'text' : 'password'}
                  placeholder="Create a password"
                  error={errors.password?.message}
                  helperText="Must be at least 8 characters with uppercase, lowercase, number, and special character"
                  required
                  {...register('password')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-8 h-8 w-8 p-0"
                  onClick={() => setShowPassword(!showPassword)}
                >
                  {showPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <div className="relative">
                <FormInput
                  label="Confirm Password"
                  type={showConfirmPassword ? 'text' : 'password'}
                  placeholder="Confirm your password"
                  error={errors.confirmPassword?.message}
                  required
                  {...register('confirmPassword')}
                />
                <Button
                  type="button"
                  variant="ghost"
                  size="sm"
                  className="absolute right-2 top-8 h-8 w-8 p-0"
                  onClick={() => setShowConfirmPassword(!showConfirmPassword)}
                >
                  {showConfirmPassword ? (
                    <EyeOff className="h-4 w-4" />
                  ) : (
                    <Eye className="h-4 w-4" />
                  )}
                </Button>
              </div>

              <Button
                type="submit"
                className="w-full"
                disabled={isLoading}
              >
                {isLoading ? (
                  <LoadingSpinner size="sm" />
                ) : (
                  'Register as DSA'
                )}
              </Button>
            </form>

            <div className="mt-6 text-center">
              <p className="text-sm text-gray-600">
                Already have an account?{' '}
                <Link href="/login" className="text-primary hover:text-primary/80">
                  Sign in
                </Link>
              </p>
            </div>
          </CardContent>
        </Card>
      </div>
    </div>
  );
}
