import { NextResponse } from 'next/server';
import Channel from '@/models/channel.model';
import { connectToDatabase } from './db';

/**
 * Middleware to verify a user has access to a specified channel
 * @param {Function} handler - The API route handler
 * @returns {Function} - Wrapped handler with channel access check
 */
export function withChannelAccess(handler) {
  return async (req, context) => {
    try {
      await connectToDatabase();
      
      // Get user from request (assuming auth middleware has already run)
      const user = req.user;
      
      if (!user) {
        return NextResponse.json(
          { error: 'Authentication required' },
          { status: 401 }
        );
      }
      
      // Get channelId from request body or params
      const { channelId, workspaceId } = await req.json();
      
      if (!channelId || !workspaceId) {
        return NextResponse.json(
          { error: 'Channel ID and Workspace ID are required' },
          { status: 400 }
        );
      }
      
      // Check if channel exists and user has access
      const channel = await Channel.findOne({ 
        _id: channelId,
        workspace: workspaceId
      });
      
      if (!channel) {
        return NextResponse.json(
          { error: 'Channel not found' },
          { status: 404 }
        );
      }
      
      // Check if user has access to channel
      // For now, we'll assume all users have access to all channels
      // In a real app, you might check channel.members or workspace permissions
      
      // Continue to the handler
      return handler(req, context);
    } catch (error) {
      console.error('Channel access check error:', error);
      return NextResponse.json(
        { error: 'Server error checking channel access' },
        { status: 500 }
      );
    }
  };
}
