'use client';

import { useState, useEffect } from 'react';
import { useRouter } from 'next/navigation';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import { Separator } from '@/components/ui/separator';
import { 
  CreditCard, 
  Smartphone, 
  Building, 
  Wallet,
  CheckCircle,
  XCircle,
  Clock,
  AlertCircle,
  Loader2
} from 'lucide-react';

interface PaymentProcessorProps {
  paymentId: string;
}

interface PaymentDetails {
  paymentId: string;
  transactionRef: string;
  amount: number;
  currency: string;
  status: string;
  expiresAt?: string;
}

export function PaymentProcessor({ paymentId }: PaymentProcessorProps) {
  const router = useRouter();
  const [paymentDetails, setPaymentDetails] = useState<PaymentDetails | null>(null);
  const [selectedMethod, setSelectedMethod] = useState<'card' | 'upi' | 'netbanking' | 'wallet'>('card');
  const [loading, setLoading] = useState(true);
  const [processing, setProcessing] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [timeLeft, setTimeLeft] = useState<number>(0);

  // Form states
  const [cardNumber, setCardNumber] = useState('');
  const [expiryDate, setExpiryDate] = useState('');
  const [cvv, setCvv] = useState('');
  const [cardName, setCardName] = useState('');
  const [upiId, setUpiId] = useState('');

  useEffect(() => {
    fetchPaymentDetails();
  }, [paymentId]);

  useEffect(() => {
    if (paymentDetails?.expiresAt) {
      const interval = setInterval(() => {
        const now = new Date().getTime();
        const expiry = new Date(paymentDetails.expiresAt!).getTime();
        const difference = expiry - now;
        
        if (difference > 0) {
          setTimeLeft(Math.floor(difference / 1000));
        } else {
          setTimeLeft(0);
          setError('Payment session has expired');
        }
      }, 1000);

      return () => clearInterval(interval);
    }
  }, [paymentDetails]);

  const fetchPaymentDetails = async () => {
    try {
      const response = await fetch(`/api/payments/verify?paymentId=${paymentId}`);
      const data = await response.json();

      if (data.success) {
        setPaymentDetails(data.payment);
        
        // If payment is already completed, redirect
        if (data.payment.status === 'completed') {
          router.push(`/user/applications?payment=success&paymentId=${paymentId}`);
          return;
        }
        
        // If payment failed or expired, show error
        if (['failed', 'expired', 'cancelled'].includes(data.payment.status)) {
          setError(`Payment ${data.payment.status}. Please try again.`);
        }
      } else {
        setError(data.error || 'Failed to load payment details');
      }
    } catch (err) {
      setError('Failed to load payment details');
    } finally {
      setLoading(false);
    }
  };

  const processPayment = async () => {
    if (!paymentDetails) return;

    setProcessing(true);
    setError(null);

    try {
      // Simulate payment processing delay
      await new Promise(resolve => setTimeout(resolve, 2000));

      const response = await fetch('/api/payments/verify', {
        method: 'POST',
        headers: {
          'Content-Type': 'application/json',
        },
        body: JSON.stringify({
          paymentId: paymentDetails.paymentId,
          transactionRef: paymentDetails.transactionRef,
          gatewayTransactionId: `GW_${Date.now()}_${Math.random().toString(36).substr(2, 9)}`,
          paymentMethod: selectedMethod
        }),
      });

      const data = await response.json();

      if (data.success) {
        // Payment successful
        router.push(`/user/applications?payment=success&paymentId=${paymentId}`);
      } else {
        setError(data.error || 'Payment failed. Please try again.');
      }
    } catch (err) {
      setError('Payment processing failed. Please try again.');
    } finally {
      setProcessing(false);
    }
  };

  const formatTime = (seconds: number) => {
    const minutes = Math.floor(seconds / 60);
    const remainingSeconds = seconds % 60;
    return `${minutes}:${remainingSeconds.toString().padStart(2, '0')}`;
  };

  if (loading) {
    return (
      <div className="flex items-center justify-center py-8">
        <Loader2 className="h-8 w-8 animate-spin text-blue-600" />
      </div>
    );
  }

  if (error) {
    return (
      <div className="text-center py-8">
        <XCircle className="h-12 w-12 text-red-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Payment Error</h3>
        <p className="text-slate-600 mb-4">{error}</p>
        <Button onClick={() => router.push('/user/applications')} variant="outline">
          Back to Applications
        </Button>
      </div>
    );
  }

  if (!paymentDetails) {
    return (
      <div className="text-center py-8">
        <AlertCircle className="h-12 w-12 text-yellow-500 mx-auto mb-4" />
        <h3 className="text-lg font-semibold text-slate-900 mb-2">Payment Not Found</h3>
        <p className="text-slate-600 mb-4">The payment session could not be found.</p>
        <Button onClick={() => router.push('/user/applications')} variant="outline">
          Back to Applications
        </Button>
      </div>
    );
  }

  return (
    <div className="space-y-6">
      {/* Payment Summary */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Payment Summary</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="space-y-3">
            <div className="flex justify-between">
              <span className="text-slate-600">Service Charge</span>
              <span className="font-semibold">₹{paymentDetails.amount}</span>
            </div>
            <div className="flex justify-between">
              <span className="text-slate-600">Processing Fee</span>
              <span className="font-semibold">₹0</span>
            </div>
            <Separator />
            <div className="flex justify-between text-lg font-bold">
              <span>Total Amount</span>
              <span>₹{paymentDetails.amount}</span>
            </div>
          </div>
          
          {timeLeft > 0 && (
            <div className="mt-4 p-3 bg-yellow-50 rounded-lg border border-yellow-200">
              <div className="flex items-center gap-2 text-yellow-800">
                <Clock className="h-4 w-4" />
                <span className="text-sm font-medium">
                  Session expires in: {formatTime(timeLeft)}
                </span>
              </div>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Payment Methods */}
      <Card>
        <CardHeader>
          <CardTitle className="text-lg">Select Payment Method</CardTitle>
        </CardHeader>
        <CardContent>
          <div className="grid grid-cols-2 gap-3 mb-6">
            {[
              { id: 'card', label: 'Card', icon: CreditCard },
              { id: 'upi', label: 'UPI', icon: Smartphone },
              { id: 'netbanking', label: 'Net Banking', icon: Building },
              { id: 'wallet', label: 'Wallet', icon: Wallet }
            ].map(({ id, label, icon: Icon }) => (
              <button
                key={id}
                onClick={() => setSelectedMethod(id as any)}
                className={`p-4 border rounded-lg flex flex-col items-center gap-2 transition-colors ${
                  selectedMethod === id
                    ? 'border-blue-500 bg-blue-50 text-blue-700'
                    : 'border-slate-200 hover:border-slate-300'
                }`}
              >
                <Icon className="h-6 w-6" />
                <span className="text-sm font-medium">{label}</span>
              </button>
            ))}
          </div>

          {/* Payment Form */}
          {selectedMethod === 'card' && (
            <div className="space-y-4">
              <div>
                <Label htmlFor="cardNumber">Card Number</Label>
                <Input
                  id="cardNumber"
                  placeholder="1234 5678 9012 3456"
                  value={cardNumber}
                  onChange={(e) => setCardNumber(e.target.value)}
                  maxLength={19}
                />
              </div>
              <div className="grid grid-cols-2 gap-4">
                <div>
                  <Label htmlFor="expiryDate">Expiry Date</Label>
                  <Input
                    id="expiryDate"
                    placeholder="MM/YY"
                    value={expiryDate}
                    onChange={(e) => setExpiryDate(e.target.value)}
                    maxLength={5}
                  />
                </div>
                <div>
                  <Label htmlFor="cvv">CVV</Label>
                  <Input
                    id="cvv"
                    placeholder="123"
                    value={cvv}
                    onChange={(e) => setCvv(e.target.value)}
                    maxLength={4}
                    type="password"
                  />
                </div>
              </div>
              <div>
                <Label htmlFor="cardName">Cardholder Name</Label>
                <Input
                  id="cardName"
                  placeholder="John Doe"
                  value={cardName}
                  onChange={(e) => setCardName(e.target.value)}
                />
              </div>
            </div>
          )}

          {selectedMethod === 'upi' && (
            <div>
              <Label htmlFor="upiId">UPI ID</Label>
              <Input
                id="upiId"
                placeholder="yourname@paytm"
                value={upiId}
                onChange={(e) => setUpiId(e.target.value)}
              />
            </div>
          )}

          {selectedMethod === 'netbanking' && (
            <div className="text-center py-8 text-slate-600">
              <Building className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p>You will be redirected to your bank&apos;s website</p>
            </div>
          )}

          {selectedMethod === 'wallet' && (
            <div className="text-center py-8 text-slate-600">
              <Wallet className="h-12 w-12 mx-auto mb-4 text-slate-400" />
              <p>Select your preferred wallet</p>
            </div>
          )}
        </CardContent>
      </Card>

      {/* Process Payment Button */}
      <Button
        onClick={processPayment}
        disabled={processing || timeLeft === 0}
        className="w-full h-12 text-lg"
      >
        {processing ? (
          <>
            <Loader2 className="h-5 w-5 mr-2 animate-spin" />
            Processing Payment...
          </>
        ) : (
          <>
            <CheckCircle className="h-5 w-5 mr-2" />
            Pay ₹{paymentDetails.amount}
          </>
        )}
      </Button>
    </div>
  );
}
