import { NextResponse } from 'next/server';
import type { NextRequest } from 'next/server';
import { getToken } from 'next-auth/jwt';

// Define protected routes for each role
const protectedRoutes = {
  admin: ['/admin'],
  dsa: ['/dsa'],
  user: ['/user'],
};

const authRoutes = ['/login', '/register', '/signup'];

export async function middleware(request: NextRequest) {
  const { pathname } = request.nextUrl;
  
  // Get the token from the request
  const token = await getToken({
    req: request,
    secret: process.env.NEXTAUTH_SECRET,
  });

  // Check if user is trying to access auth routes while logged in
  if (authRoutes.some(route => pathname.startsWith(route))) {
    if (token) {
      // Redirect to appropriate dashboard based on role
      const role = token.role as string;
      return NextResponse.redirect(new URL(`/${role}`, request.url));
    }
    return NextResponse.next();
  }

  // Check if user is trying to access protected routes
  const isProtectedRoute = Object.values(protectedRoutes)
    .flat()
    .some(route => pathname.startsWith(route));

  if (isProtectedRoute) {
    // If no token, redirect to login
    if (!token) {
      const loginUrl = new URL('/login', request.url);
      loginUrl.searchParams.set('callbackUrl', pathname);
      return NextResponse.redirect(loginUrl);
    }

    // Check role-based access
    const userRole = token.role as keyof typeof protectedRoutes;
    const allowedRoutes = protectedRoutes[userRole] || [];
    
    const hasAccess = allowedRoutes.some(route => pathname.startsWith(route));
    
    if (!hasAccess) {
      // Redirect to appropriate dashboard
      return NextResponse.redirect(new URL(`/${userRole}`, request.url));
    }

    // Check if DSA is verified and active
    if (userRole === 'dsa' && (!token.isVerified || !token.isActive)) {
      return NextResponse.redirect(new URL('/dsa/pending-verification', request.url));
    }
  }

  // Add security headers
  const response = NextResponse.next();
  
  response.headers.set('X-Frame-Options', 'DENY');
  response.headers.set('X-Content-Type-Options', 'nosniff');
  response.headers.set('Referrer-Policy', 'origin-when-cross-origin');
  response.headers.set(
    'Content-Security-Policy',
    "default-src 'self'; script-src 'self' 'unsafe-eval' 'unsafe-inline'; style-src 'self' 'unsafe-inline'; img-src 'self' data: https:; font-src 'self' data:;"
  );

  return response;
}

export const config = {
  matcher: [
    /*
     * Match all request paths except for the ones starting with:
     * - api (API routes)
     * - _next/static (static files)
     * - _next/image (image optimization files)
     * - favicon.ico (favicon file)
     * - public folder
     */
    '/((?!api|_next/static|_next/image|favicon.ico|public).*)',
  ],
};
