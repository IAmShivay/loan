import { redirect } from 'next/navigation';
import { getAuthSession } from '@/lib/auth/utils';
import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent, CardDescription, CardHeader, CardTitle } from '@/components/ui/card';
import { Badge } from '@/components/ui/badge';
import {
  GraduationCap,
  BookOpen,
  Calculator,
  Shield,
  Clock,
  CheckCircle,
  ArrowRight,
  Star,
  Users,
  TrendingUp,
  Award
} from 'lucide-react';

export default async function Home() {
  const session = await getAuthSession();

  if (session?.user) {
    // Redirect to appropriate dashboard based on role
    redirect(`/${session.user.role}`);
  }

  // If no session, show the landing page
  const features = [
    {
      icon: GraduationCap,
      title: 'Education Focused',
      description: 'Specialized loans for all types of education - from undergraduate to PhD programs'
    },
    {
      icon: Calculator,
      title: 'Competitive Rates',
      description: 'Best-in-market interest rates starting from 8.5% per annum'
    },
    {
      icon: Clock,
      title: 'Quick Processing',
      description: 'Get approval within 3-5 business days with minimal documentation'
    },
    {
      icon: Shield,
      title: 'Secure & Trusted',
      description: 'Bank-grade security with partnerships across leading financial institutions'
    }
  ];

  const loanTypes = [
    {
      title: 'Undergraduate Programs',
      description: 'Bachelor\'s degree programs in India and abroad',
      amount: 'Up to ₹20 Lakhs',
      rate: '8.5% onwards',
      features: ['No collateral up to ₹7.5L', 'Flexible repayment', 'Moratorium period']
    },
    {
      title: 'Postgraduate Programs',
      description: 'Master\'s and professional courses',
      amount: 'Up to ₹50 Lakhs',
      rate: '9.0% onwards',
      features: ['Higher loan amounts', 'Extended tenure', 'Career-focused programs']
    },
    {
      title: 'Study Abroad',
      description: 'International education financing',
      amount: 'Up to ₹1.5 Crores',
      rate: '9.5% onwards',
      features: ['Forex assistance', 'Pre-visa support', 'Global partnerships']
    },
    {
      title: 'Professional Courses',
      description: 'Medical, Engineering, MBA programs',
      amount: 'Up to ₹75 Lakhs',
      rate: '8.75% onwards',
      features: ['Specialized programs', 'Industry partnerships', 'Placement assistance']
    }
  ];

  const stats = [
    { label: 'Students Funded', value: '50,000+', icon: Users },
    { label: 'Loans Disbursed', value: '₹2,500 Cr+', icon: TrendingUp },
    { label: 'Success Rate', value: '95%', icon: Award },
    { label: 'Partner Banks', value: '25+', icon: CheckCircle }
  ];

  const testimonials = [
    {
      name: 'Priya Sharma',
      course: 'MS Computer Science, Stanford',
      text: 'The loan process was incredibly smooth. Got approval within 4 days and the DSA guided me through every step.',
      rating: 5
    },
    {
      name: 'Rahul Patel',
      course: 'MBA, IIM Ahmedabad',
      text: 'Competitive interest rates and flexible repayment options made my MBA dream possible.',
      rating: 5
    },
    {
      name: 'Ananya Singh',
      course: 'MBBS, AIIMS Delhi',
      text: 'No hassle documentation and quick processing. Highly recommend for medical students.',
      rating: 5
    }
  ];

  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50">
      {/* Header */}
      <header className="bg-white/80 backdrop-blur-sm border-b border-slate-200 sticky top-0 z-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="flex items-center justify-between h-16">
            <div className="flex items-center space-x-2">
              <GraduationCap className="h-8 w-8 text-blue-600" />
              <span className="text-xl font-bold text-slate-900">EduLoan Pro</span>
            </div>
            <div className="flex items-center space-x-4">
              <Link href="/login">
                <Button variant="ghost">Login</Button>
              </Link>
              <Link href="/register">
                <Button className="bg-blue-600 hover:bg-blue-700">Get Started</Button>
              </Link>
            </div>
          </div>
        </div>
      </header>

      {/* Hero Section */}
      <section className="relative py-20 lg:py-32">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center">
            <Badge className="mb-4 bg-blue-100 text-blue-800 hover:bg-blue-100">
              🎓 Trusted by 50,000+ Students
            </Badge>
            <h1 className="text-4xl sm:text-5xl lg:text-6xl font-bold text-slate-900 mb-6">
              Fund Your
              <span className="text-blue-600"> Education Dreams</span>
            </h1>
            <p className="text-xl text-slate-600 mb-8 max-w-3xl mx-auto">
              Get instant education loans with competitive rates, minimal documentation,
              and expert guidance from our dedicated DSA network.
            </p>
            <div className="flex flex-col sm:flex-row gap-4 justify-center">
              <Link href="/register">
                <Button size="lg" className="bg-blue-600 hover:bg-blue-700 text-lg px-8 py-3">
                  Apply Now
                  <ArrowRight className="ml-2 h-5 w-5" />
                </Button>
              </Link>
              <Button size="lg" variant="outline" className="text-lg px-8 py-3">
                <Calculator className="mr-2 h-5 w-5" />
                Calculate EMI
              </Button>
            </div>
          </div>
        </div>
      </section>

      {/* Stats Section */}
      <section className="py-16 bg-blue-600">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-2 lg:grid-cols-4 gap-8">
            {stats.map((stat, index) => {
              const IconComponent = stat.icon;
              return (
                <div key={index} className="text-center">
                  <IconComponent className="h-8 w-8 text-blue-200 mx-auto mb-2" />
                  <div className="text-3xl font-bold text-white mb-1">{stat.value}</div>
                  <div className="text-blue-200">{stat.label}</div>
                </div>
              );
            })}
          </div>
        </div>
      </section>

      {/* Features Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Why Choose EduLoan Pro?
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              We make education financing simple, fast, and accessible for every student
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 lg:grid-cols-4 gap-8">
            {features.map((feature, index) => {
              const IconComponent = feature.icon;
              return (
                <Card key={index} className="text-center hover:shadow-lg transition-shadow">
                  <CardContent className="pt-6">
                    <div className="w-12 h-12 bg-blue-100 rounded-lg flex items-center justify-center mx-auto mb-4">
                      <IconComponent className="h-6 w-6 text-blue-600" />
                    </div>
                    <h3 className="text-lg font-semibold text-slate-900 mb-2">{feature.title}</h3>
                    <p className="text-slate-600">{feature.description}</p>
                  </CardContent>
                </Card>
              );
            })}
          </div>
        </div>
      </section>

      {/* Loan Types Section */}
      <section className="py-20 bg-slate-50">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Education Loan Options
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Tailored financing solutions for every educational journey
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-2 gap-8">
            {loanTypes.map((loan, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardHeader>
                  <CardTitle className="text-xl text-slate-900">{loan.title}</CardTitle>
                  <CardDescription className="text-slate-600">{loan.description}</CardDescription>
                </CardHeader>
                <CardContent>
                  <div className="flex justify-between items-center mb-4">
                    <div>
                      <div className="text-2xl font-bold text-blue-600">{loan.amount}</div>
                      <div className="text-sm text-slate-500">Loan Amount</div>
                    </div>
                    <div className="text-right">
                      <div className="text-2xl font-bold text-green-600">{loan.rate}</div>
                      <div className="text-sm text-slate-500">Interest Rate</div>
                    </div>
                  </div>
                  <ul className="space-y-2">
                    {loan.features.map((feature, idx) => (
                      <li key={idx} className="flex items-center text-sm text-slate-600">
                        <CheckCircle className="h-4 w-4 text-green-500 mr-2 flex-shrink-0" />
                        {feature}
                      </li>
                    ))}
                  </ul>
                  <Button className="w-full mt-4 bg-blue-600 hover:bg-blue-700">
                    Apply Now
                  </Button>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* Testimonials Section */}
      <section className="py-20">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="text-center mb-16">
            <h2 className="text-3xl lg:text-4xl font-bold text-slate-900 mb-4">
              Student Success Stories
            </h2>
            <p className="text-xl text-slate-600 max-w-2xl mx-auto">
              Hear from students who achieved their dreams with our support
            </p>
          </div>
          <div className="grid grid-cols-1 md:grid-cols-3 gap-8">
            {testimonials.map((testimonial, index) => (
              <Card key={index} className="hover:shadow-lg transition-shadow">
                <CardContent className="pt-6">
                  <div className="flex mb-4">
                    {[...Array(testimonial.rating)].map((_, i) => (
                      <Star key={i} className="h-5 w-5 text-yellow-400 fill-current" />
                    ))}
                  </div>
                  <p className="text-slate-600 mb-4 italic">&ldquo;{testimonial.text}&rdquo;</p>
                  <div>
                    <div className="font-semibold text-slate-900">{testimonial.name}</div>
                    <div className="text-sm text-slate-500">{testimonial.course}</div>
                  </div>
                </CardContent>
              </Card>
            ))}
          </div>
        </div>
      </section>

      {/* CTA Section */}
      <section className="py-20 bg-blue-600">
        <div className="max-w-4xl mx-auto px-4 sm:px-6 lg:px-8 text-center">
          <h2 className="text-3xl lg:text-4xl font-bold text-white mb-4">
            Ready to Start Your Educational Journey?
          </h2>
          <p className="text-xl text-blue-100 mb-8">
            Join thousands of students who have funded their dreams with us
          </p>
          <div className="flex flex-col sm:flex-row gap-4 justify-center">
            <Link href="/register">
              <Button size="lg" className="bg-white text-blue-600 hover:bg-slate-100 text-lg px-8 py-3">
                Apply for Loan
                <ArrowRight className="ml-2 h-5 w-5" />
              </Button>
            </Link>
            <Button size="lg" variant="outline" className="border-white text-white hover:bg-white hover:text-blue-600 text-lg px-8 py-3">
              <BookOpen className="mr-2 h-5 w-5" />
              Learn More
            </Button>
          </div>
        </div>
      </section>

      {/* Footer */}
      <footer className="bg-slate-900 text-white py-12">
        <div className="max-w-7xl mx-auto px-4 sm:px-6 lg:px-8">
          <div className="grid grid-cols-1 md:grid-cols-4 gap-8">
            <div>
              <div className="flex items-center space-x-2 mb-4">
                <GraduationCap className="h-6 w-6 text-blue-400" />
                <span className="text-lg font-bold">EduLoan Pro</span>
              </div>
              <p className="text-slate-400">
                Making education accessible through smart financing solutions.
              </p>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Loan Types</h3>
              <ul className="space-y-2 text-slate-400">
                <li>Undergraduate Loans</li>
                <li>Postgraduate Loans</li>
                <li>Study Abroad</li>
                <li>Professional Courses</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Support</h3>
              <ul className="space-y-2 text-slate-400">
                <li>Help Center</li>
                <li>Contact Us</li>
                <li>EMI Calculator</li>
                <li>Documentation</li>
              </ul>
            </div>
            <div>
              <h3 className="font-semibold mb-4">Company</h3>
              <ul className="space-y-2 text-slate-400">
                <li>About Us</li>
                <li>Careers</li>
                <li>Privacy Policy</li>
                <li>Terms of Service</li>
              </ul>
            </div>
          </div>
          <div className="border-t border-slate-800 mt-8 pt-8 text-center text-slate-400">
            <p>&copy; 2024 EduLoan Pro. All rights reserved.</p>
          </div>
        </div>
      </footer>
    </div>
  );
}
