import { getAuthSession } from '@/lib/auth/utils';
import { redirect, notFound } from 'next/navigation';
import { PaymentProcessor } from '@/components/payment/PaymentProcessor';

interface PaymentProcessPageProps {
  params: Promise<{
    paymentId: string;
  }>;
}

export default async function PaymentProcessPage({ params }: PaymentProcessPageProps) {
  const session = await getAuthSession();

  if (!session?.user || session.user.role !== 'user') {
    redirect('/login');
  }

  const { paymentId } = await params;

  if (!paymentId) {
    notFound();
  }

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 to-indigo-100 flex items-center justify-center p-4">
      <div className="max-w-md w-full">
        <div className="bg-white rounded-2xl shadow-xl p-8">
          <div className="text-center mb-8">
            <div className="w-16 h-16 bg-blue-600 rounded-full flex items-center justify-center mx-auto mb-4">
              <svg className="w-8 h-8 text-white" fill="none" stroke="currentColor" viewBox="0 0 24 24">
                <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M12 8c-1.657 0-3 .895-3 2s1.343 2 3 2 3 .895 3 2-1.343 2-3 2m0-8c1.11 0 2.08.402 2.599 1M12 8V7m0 1v8m0 0v1m0-1c-1.11 0-2.08-.402-2.599-1" />
              </svg>
            </div>
            <h1 className="text-2xl font-bold text-slate-900 mb-2">Complete Payment</h1>
            <p className="text-slate-600">Secure payment processing for your loan application</p>
          </div>

          <PaymentProcessor paymentId={paymentId} />
        </div>

        {/* Security Notice */}
        <div className="mt-6 text-center">
          <div className="flex items-center justify-center gap-2 text-sm text-slate-600 mb-2">
            <svg className="w-4 h-4 text-green-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M9 12l2 2 4-4m5.618-4.016A11.955 11.955 0 0112 2.944a11.955 11.955 0 01-8.618 3.04A12.02 12.02 0 003 9c0 5.591 3.824 10.29 9 11.622 5.176-1.332 9-6.031 9-11.622 0-1.042-.133-2.052-.382-3.016z" />
            </svg>
            <span>256-bit SSL Encrypted</span>
          </div>
          <p className="text-xs text-slate-500">
            Your payment information is secure and encrypted. We never store your card details.
          </p>
        </div>
      </div>
    </div>
  );
}
