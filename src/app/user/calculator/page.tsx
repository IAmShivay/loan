'use client';

import { useState } from 'react';
import { DashboardLayout } from '@/components/layout';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Button } from '@/components/ui/button';
import { Input } from '@/components/ui/input';
import { Label } from '@/components/ui/label';
import { Select, SelectContent, SelectItem, SelectTrigger, SelectValue } from '@/components/ui/select';
import { Slider } from '@/components/ui/slider';
import { Separator } from '@/components/ui/separator';
import { 
  Calculator, 
  DollarSign, 
  Calendar, 
  Percent, 
  TrendingUp,
  Download,
  Share,
  Info
} from 'lucide-react';

export default function LoanCalculatorPage() {
  const [loanAmount, setLoanAmount] = useState(500000);
  const [interestRate, setInterestRate] = useState(9.5);
  const [tenure, setTenure] = useState(10);
  const [tenureType, setTenureType] = useState('years');
  const [loanType, setLoanType] = useState('education');

  // Calculate EMI
  const calculateEMI = () => {
    const principal = loanAmount;
    const monthlyRate = interestRate / (12 * 100);
    const totalMonths = tenureType === 'years' ? tenure * 12 : tenure;
    
    if (monthlyRate === 0) {
      return principal / totalMonths;
    }
    
    const emi = (principal * monthlyRate * Math.pow(1 + monthlyRate, totalMonths)) / 
                (Math.pow(1 + monthlyRate, totalMonths) - 1);
    
    return emi;
  };

  const emi = calculateEMI();
  const totalMonths = tenureType === 'years' ? tenure * 12 : tenure;
  const totalAmount = emi * totalMonths;
  const totalInterest = totalAmount - loanAmount;

  const loanTypes = [
    { value: 'education', label: 'Education Loan', rate: '8.5-12%' },
    { value: 'personal', label: 'Personal Loan', rate: '10-18%' },
    { value: 'home', label: 'Home Loan', rate: '8-10%' },
    { value: 'car', label: 'Car Loan', rate: '7-12%' }
  ];

  const formatCurrency = (amount: number) => {
    return new Intl.NumberFormat('en-IN', {
      style: 'currency',
      currency: 'INR',
      maximumFractionDigits: 0
    }).format(amount);
  };

  const formatNumber = (num: number) => {
    return new Intl.NumberFormat('en-IN').format(Math.round(num));
  };

  return (
    <DashboardLayout>
      <div className="space-y-6 lg:space-y-8">
        {/* Header */}
        <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-4">
          <div>
            <h1 className="text-2xl font-bold text-slate-900">Loan Calculator</h1>
            <p className="text-slate-600">Calculate your EMI and plan your education loan</p>
          </div>
          <div className="flex gap-2">
            <Button variant="outline" size="sm">
              <Share className="h-4 w-4 mr-2" />
              Share
            </Button>
            <Button variant="outline" size="sm">
              <Download className="h-4 w-4 mr-2" />
              Download
            </Button>
          </div>
        </div>

        <div className="grid grid-cols-1 lg:grid-cols-2 gap-6 lg:gap-8">
          {/* Calculator Input */}
          <div className="space-y-6">
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <Calculator className="h-5 w-5 text-blue-600" />
                  Loan Details
                </CardTitle>
                <CardDescription>Enter your loan requirements</CardDescription>
              </CardHeader>
              <CardContent className="space-y-6">
                <div>
                  <Label htmlFor="loanType">Loan Type</Label>
                  <Select value={loanType} onValueChange={setLoanType}>
                    <SelectTrigger>
                      <SelectValue placeholder="Select loan type" />
                    </SelectTrigger>
                    <SelectContent>
                      {loanTypes.map((type) => (
                        <SelectItem key={type.value} value={type.value}>
                          <div className="flex justify-between items-center w-full">
                            <span>{type.label}</span>
                            <span className="text-xs text-slate-500 ml-2">{type.rate}</span>
                          </div>
                        </SelectItem>
                      ))}
                    </SelectContent>
                  </Select>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="loanAmount">Loan Amount</Label>
                    <span className="text-sm font-medium text-blue-600">
                      {formatCurrency(loanAmount)}
                    </span>
                  </div>
                  <Slider
                    value={[loanAmount]}
                    onValueChange={(value) => setLoanAmount(value[0])}
                    max={5000000}
                    min={50000}
                    step={10000}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>₹50K</span>
                    <span>₹50L</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="interestRate">Interest Rate (% per annum)</Label>
                    <span className="text-sm font-medium text-blue-600">
                      {interestRate}%
                    </span>
                  </div>
                  <Slider
                    value={[interestRate]}
                    onValueChange={(value) => setInterestRate(value[0])}
                    max={20}
                    min={6}
                    step={0.1}
                    className="mb-2"
                  />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>6%</span>
                    <span>20%</span>
                  </div>
                </div>

                <div>
                  <div className="flex justify-between items-center mb-2">
                    <Label htmlFor="tenure">Loan Tenure</Label>
                    <span className="text-sm font-medium text-blue-600">
                      {tenure} {tenureType}
                    </span>
                  </div>
                  <div className="flex gap-2 mb-2">
                    <div className="flex-1">
                      <Slider
                        value={[tenure]}
                        onValueChange={(value) => setTenure(value[0])}
                        max={tenureType === 'years' ? 30 : 360}
                        min={1}
                        step={1}
                      />
                    </div>
                    <Select value={tenureType} onValueChange={setTenureType}>
                      <SelectTrigger className="w-24">
                        <SelectValue />
                      </SelectTrigger>
                      <SelectContent>
                        <SelectItem value="years">Years</SelectItem>
                        <SelectItem value="months">Months</SelectItem>
                      </SelectContent>
                    </Select>
                  </div>
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>1 {tenureType.slice(0, -1)}</span>
                    <span>{tenureType === 'years' ? '30 years' : '360 months'}</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Loan Breakdown */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="flex items-center gap-2">
                  <TrendingUp className="h-5 w-5 text-blue-600" />
                  Payment Breakdown
                </CardTitle>
              </CardHeader>
              <CardContent>
                <div className="space-y-4">
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Principal Amount</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(loanAmount)}</span>
                  </div>
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Interest</span>
                    <span className="font-semibold text-orange-600">{formatCurrency(totalInterest)}</span>
                  </div>
                  <Separator />
                  <div className="flex justify-between items-center">
                    <span className="text-slate-600">Total Amount</span>
                    <span className="font-semibold text-slate-900">{formatCurrency(totalAmount)}</span>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>

          {/* Results */}
          <div className="space-y-6">
            {/* EMI Result */}
            <Card className="bg-gradient-to-br from-blue-50 to-blue-100 border border-blue-200">
              <CardContent className="p-6 text-center">
                <div className="mb-4">
                  <DollarSign className="h-12 w-12 text-blue-600 mx-auto mb-2" />
                  <h3 className="text-lg font-semibold text-slate-900 mb-1">Monthly EMI</h3>
                  <p className="text-3xl font-bold text-blue-600">{formatCurrency(emi)}</p>
                </div>
                <div className="grid grid-cols-2 gap-4 text-sm">
                  <div>
                    <div className="text-slate-600">Tenure</div>
                    <div className="font-semibold text-slate-900">
                      {totalMonths} months
                    </div>
                  </div>
                  <div>
                    <div className="text-slate-600">Interest Rate</div>
                    <div className="font-semibold text-slate-900">{interestRate}%</div>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Quick Stats */}
            <div className="grid grid-cols-2 gap-4">
              <Card className="bg-white border border-slate-200">
                <CardContent className="p-4 text-center">
                  <Calendar className="h-6 w-6 text-green-600 mx-auto mb-2" />
                  <div className="text-sm text-slate-600">Total Payments</div>
                  <div className="text-lg font-bold text-slate-900">{totalMonths}</div>
                </CardContent>
              </Card>
              <Card className="bg-white border border-slate-200">
                <CardContent className="p-4 text-center">
                  <Percent className="h-6 w-6 text-purple-600 mx-auto mb-2" />
                  <div className="text-sm text-slate-600">Interest %</div>
                  <div className="text-lg font-bold text-slate-900">
                    {((totalInterest / loanAmount) * 100).toFixed(1)}%
                  </div>
                </CardContent>
              </Card>
            </div>

            {/* Amortization Preview */}
            <Card className="bg-white border border-slate-200">
              <CardHeader>
                <CardTitle className="text-lg">Payment Schedule Preview</CardTitle>
                <CardDescription>First few months breakdown</CardDescription>
              </CardHeader>
              <CardContent>
                <div className="space-y-3">
                  {[1, 2, 3].map((month) => {
                    const monthlyRate = interestRate / (12 * 100);
                    const remainingPrincipal = loanAmount - (emi - (loanAmount * monthlyRate)) * (month - 1);
                    const interestComponent = remainingPrincipal * monthlyRate;
                    const principalComponent = emi - interestComponent;

                    return (
                      <div key={month} className="flex justify-between items-center text-sm">
                        <span className="text-slate-600">Month {month}</span>
                        <div className="flex gap-4">
                          <span className="text-blue-600">₹{formatNumber(principalComponent)}</span>
                          <span className="text-orange-600">₹{formatNumber(interestComponent)}</span>
                        </div>
                      </div>
                    );
                  })}
                  <Separator />
                  <div className="flex justify-between text-xs text-slate-500">
                    <span>Principal</span>
                    <span>Interest</span>
                  </div>
                </div>
              </CardContent>
            </Card>

            {/* Tips */}
            <Card className="bg-amber-50 border border-amber-200">
              <CardContent className="p-4">
                <div className="flex items-start gap-3">
                  <Info className="h-5 w-5 text-amber-600 mt-0.5" />
                  <div>
                    <h4 className="font-semibold text-amber-900 mb-1">Pro Tips</h4>
                    <ul className="text-sm text-amber-800 space-y-1">
                      <li>• Consider making prepayments to reduce total interest</li>
                      <li>• Education loans offer tax benefits under Section 80E</li>
                      <li>• Compare rates from multiple banks before applying</li>
                    </ul>
                  </div>
                </div>
              </CardContent>
            </Card>
          </div>
        </div>
      </div>
    </DashboardLayout>
  );
}
