import { NextResponse } from 'next/server';
import { connectToDatabase } from './db';
import User from '@/models/user.model';

/**
 * Middleware to verify authentication for API routes
 * @param {Function} handler - The API route handler
 * @returns {Function} - Wrapped handler with authentication check
 */
export function withAuth(handler) {
  return async (req, context) => {
    try {
      await connectToDatabase();
      
      // In a real app, this would verify a JWT token or session
      // For now, we'll use a simple userId in the request body
      const { userId } = await req.json();
      
      if (!userId) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Find the user
      const user = await User.findById(userId);
      
      if (!user) {
        return NextResponse.json(
          { error: 'User not found' },
          { status: 401 }
        );
      }
      
      // Attach user to request object
      req.user = user;
      
      // Continue to the handler
      return handler(req, context);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json(
        { error: 'Authentication failed' },
        { status: 401 }
      );
    }
  };
}
