import { NextRequest, NextResponse } from 'next/server';
import { connectDB } from '@/lib/db/connection';
import mongoose from 'mongoose';

export async function GET(request: NextRequest) {
  try {
    // Test database connection
    await connectDB();
    
    const dbStatus = mongoose.connection.readyState;
    const dbStates = {
      0: 'disconnected',
      1: 'connected',
      2: 'connecting',
      3: 'disconnecting'
    };

    return NextResponse.json({
      status: 'healthy',
      timestamp: new Date().toISOString(),
      database: {
        status: dbStates[dbStatus as keyof typeof dbStates] || 'unknown',
        readyState: dbStatus
      },
      environment: process.env.NODE_ENV || 'development'
    });

  } catch (error) {
    console.error('Health check failed:', error);
    return NextResponse.json({
      status: 'unhealthy',
      timestamp: new Date().toISOString(),
      error: error instanceof Error ? error.message : 'Unknown error',
      database: {
        status: 'error',
        readyState: mongoose.connection.readyState
      }
    }, { status: 500 });
  }
}
