import { getServerSession } from 'next-auth';
import { authOptions } from './config';
import { NextRequest } from 'next/server';
import jwt from 'jsonwebtoken';

// Get server session
export async function getAuthSession() {
  return await getServerSession(authOptions);
}

// Check if user has required role
export function hasRole(userRole: string, requiredRoles: string[]): boolean {
  return requiredRoles.includes(userRole);
}

// Check if user is admin
export function isAdmin(userRole: string): boolean {
  return userRole === 'admin';
}

// Check if user is DSA
export function isDSA(userRole: string): boolean {
  return userRole === 'dsa';
}

// Check if user is regular user
export function isUser(userRole: string): boolean {
  return userRole === 'user';
}

// Generate JWT token for API authentication
export function generateJWT(payload: Record<string, unknown>): string {
  return jwt.sign(payload, process.env.JWT_SECRET!, {
    expiresIn: '24h',
  });
}

// Verify JWT token
export function verifyJWT(token: string): Record<string, unknown> {
  try {
    return jwt.verify(token, process.env.JWT_SECRET!) as Record<string, unknown>;
  } catch {
    throw new Error('Invalid token');
  }
}

// Extract token from request headers
export function extractTokenFromRequest(request: NextRequest): string | null {
  const authHeader = request.headers.get('authorization');
  if (authHeader && authHeader.startsWith('Bearer ')) {
    return authHeader.substring(7);
  }
  return null;
}

// Password validation
export function validatePassword(password: string): { isValid: boolean; errors: string[] } {
  const errors: string[] = [];
  
  if (password.length < 8) {
    errors.push('Password must be at least 8 characters long');
  }
  
  if (!/[A-Z]/.test(password)) {
    errors.push('Password must contain at least one uppercase letter');
  }
  
  if (!/[a-z]/.test(password)) {
    errors.push('Password must contain at least one lowercase letter');
  }
  
  if (!/\d/.test(password)) {
    errors.push('Password must contain at least one number');
  }
  
  if (!/[!@#$%^&*(),.?":{}|<>]/.test(password)) {
    errors.push('Password must contain at least one special character');
  }
  
  return {
    isValid: errors.length === 0,
    errors,
  };
}

// Email validation
export function validateEmail(email: string): boolean {
  const emailRegex = /^[^\s@]+@[^\s@]+\.[^\s@]+$/;
  return emailRegex.test(email);
}

// Phone validation (Indian format)
export function validatePhone(phone: string): boolean {
  const phoneRegex = /^[6-9]\d{9}$/;
  return phoneRegex.test(phone);
}
