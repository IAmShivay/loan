'use client';

import Link from 'next/link';
import { Button } from '@/components/ui/button';
import { Card, CardContent } from '@/components/ui/card';
import { 
  Home, 
  ArrowLeft, 
  Search, 
  FileQuestion,
  AlertTriangle,
  RefreshCw
} from 'lucide-react';

export default function NotFound() {
  return (
    <div className="min-h-screen bg-gradient-to-br from-blue-50 via-white to-slate-50 flex items-center justify-center p-4">
      <div className="max-w-2xl w-full text-center">
        {/* 404 Illustration */}
        <div className="mb-8">
          <div className="relative">
            {/* Large 404 Text */}
            <div className="text-8xl md:text-9xl font-bold text-blue-100 select-none">
              404
            </div>
            
            {/* Floating Icons */}
            <div className="absolute inset-0 flex items-center justify-center">
              <div className="relative">
                <FileQuestion className="h-16 w-16 text-blue-600 animate-bounce" />
                <div className="absolute -top-2 -right-2">
                  <AlertTriangle className="h-6 w-6 text-amber-500 animate-pulse" />
                </div>
              </div>
            </div>
          </div>
        </div>

        {/* Main Content Card */}
        <Card className="shadow-xl border-0 bg-white/80 backdrop-blur-sm">
          <CardContent className="p-8 md:p-12">
            <div className="space-y-6">
              {/* Title */}
              <div>
                <h1 className="text-3xl md:text-4xl font-bold text-slate-900 mb-3">
                  Page Not Found
                </h1>
                <p className="text-lg text-slate-600 leading-relaxed">
                  Oops! The page you're looking for seems to have wandered off. 
                  Don't worry, even the best explorers sometimes take a wrong turn.
                </p>
              </div>

              {/* Suggestions */}
              <div className="bg-blue-50 rounded-lg p-6 text-left">
                <h3 className="font-semibold text-slate-900 mb-3 flex items-center gap-2">
                  <Search className="h-5 w-5 text-blue-600" />
                  Here's what you can try:
                </h3>
                <ul className="space-y-2 text-slate-700">
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    Check the URL for any typos or errors
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    Go back to the previous page and try again
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    Visit our homepage to find what you're looking for
                  </li>
                  <li className="flex items-start gap-2">
                    <span className="text-blue-600 mt-1">•</span>
                    Contact support if you believe this is an error
                  </li>
                </ul>
              </div>

              {/* Action Buttons */}
              <div className="flex flex-col sm:flex-row gap-4 justify-center">
                <Button 
                  asChild 
                  size="lg" 
                  className="bg-blue-600 hover:bg-blue-700 text-white shadow-lg hover:shadow-xl transition-all duration-200"
                >
                  <Link href="/" className="flex items-center gap-2">
                    <Home className="h-5 w-5" />
                    Go to Homepage
                  </Link>
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.history.back()}
                  className="border-slate-300 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <ArrowLeft className="h-5 w-5 mr-2" />
                  Go Back
                </Button>
                
                <Button 
                  variant="outline" 
                  size="lg"
                  onClick={() => window.location.reload()}
                  className="border-slate-300 hover:bg-slate-50 shadow-md hover:shadow-lg transition-all duration-200"
                >
                  <RefreshCw className="h-5 w-5 mr-2" />
                  Refresh Page
                </Button>
              </div>

              {/* Help Section */}
              <div className="pt-6 border-t border-slate-200">
                <p className="text-sm text-slate-500 mb-4">
                  Still having trouble? We're here to help!
                </p>
                <div className="flex flex-col sm:flex-row gap-4 justify-center text-sm">
                  <Link 
                    href="/contact" 
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                  >
                    Contact Support
                  </Link>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <Link 
                    href="/help" 
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                  >
                    Help Center
                  </Link>
                  <span className="hidden sm:inline text-slate-300">|</span>
                  <Link 
                    href="/sitemap" 
                    className="text-blue-600 hover:text-blue-700 font-medium hover:underline transition-colors"
                  >
                    Site Map
                  </Link>
                </div>
              </div>
            </div>
          </CardContent>
        </Card>

        {/* Footer */}
        <div className="mt-8 text-sm text-slate-500">
          <p>
            Error Code: 404 | Page Not Found
          </p>
          <p className="mt-1">
            © 2024 Loan Management System. All rights reserved.
          </p>
        </div>
      </div>

      {/* Background Decorations */}
      <div className="fixed inset-0 -z-10 overflow-hidden pointer-events-none">
        <div className="absolute top-1/4 left-1/4 w-64 h-64 bg-blue-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse"></div>
        <div className="absolute top-3/4 right-1/4 w-64 h-64 bg-purple-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-1000"></div>
        <div className="absolute bottom-1/4 left-1/3 w-64 h-64 bg-pink-200 rounded-full mix-blend-multiply filter blur-xl opacity-30 animate-pulse delay-2000"></div>
      </div>
    </div>
  );
}
