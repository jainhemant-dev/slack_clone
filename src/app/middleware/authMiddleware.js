import { getUserFromToken } from '@/lib/jwt';
import User from '@/models/user.model';
import dbConnect from "@/lib/mongoose"
import { NextResponse } from 'next/server';

/**
 * Middleware to authenticate API routes in Next.js App Router
 * @param {Function} handler - The API route handler
 * @returns {Function} The wrapped handler with authentication
 */
export function withAuth(handler) {
  return async (request, context) => {
    try {
      // Get user data from token
      const userData = await getUserFromToken(request);

      // If no user data, return unauthorized
      if (!userData) {
        return NextResponse.json({ success: false, message: 'Unauthorized' }, { status: 401 });
      }

      // Connect to the database
      await dbConnect();

      // Find the user in the database
      const user = await User.findById(userData.id);

      // If no user found, return unauthorized
      if (!user) {
        return NextResponse.json({ success: false, message: 'User not found' }, { status: 401 });
      }

      // Create a new request object with the user attached
      const requestWithUser = new Request(request);
      // @ts-ignore
      requestWithUser.user = user;

      // Call the handler with the modified request
      return handler(requestWithUser, context);
    } catch (error) {
      console.error('Authentication error:', error);
      return NextResponse.json({ success: false, message: 'Authentication error' }, { status: 500 });
    }
  };
}

/**
 * Middleware to validate workspace access in Next.js App Router
 * @param {Function} handler - The API route handler
 * @returns {Function} The wrapped handler with workspace validation
 */
export function withWorkspaceAccess(handler) {
  return withAuth(async (request, context) => {
    try {
      
      // Get workspaceId from URL or params
      const { params } = context;
      const workspaceId = (await params)?.workspaceId;

      if (!workspaceId) {
        return NextResponse.json({ success: false, message: 'Workspace ID is required' }, { status: 400 });
      }

      // Check if user has access to this workspace
      // @ts-ignore
      const hasAccess = request.user.workspaces.some(ws => ws.toString() === workspaceId);

      if (!hasAccess) {
        return NextResponse.json({ success: false, message: 'No access to this workspace' }, { status: 403 });
      }

      // Call the handler
      return handler(request, context);
    } catch (error) {
      console.error('Workspace access error:', error);
      return NextResponse.json({ success: false, message: 'Workspace access error' }, { status: 500 });
    }
  });
}

/**
 * Middleware to validate channel access in Next.js App Router
 * @param {Function} handler - The API route handler
 * @returns {Function} The wrapped handler with channel validation
 */
export function withChannelAccess(handler) {
  return withWorkspaceAccess(async (request, context) => {
    try {
      const { params } = context;
      const channelId =  (await params)?.channelId;
      const workspaceId = (await params)?.workspaceId;

      if (!channelId || channelId === 'undefined') {
        return NextResponse.json({ success: false, message: 'Channel ID is required' }, { status: 400 });
      }
      
      const Channel = (await import('@/models/channel.model')).default;
      
      // Validate channelId before query to prevent MongoDB errors
      if (!/^[0-9a-fA-F]{24}$/.test(channelId)) {
        console.error(`Invalid channel ID format: ${channelId}`);
        return NextResponse.json({ success: false, message: 'Invalid channel ID format' }, { status: 400 });
      }
      
      // Find the channel
      const channel = await Channel.findById(channelId);

      if (!channel) {
        return NextResponse.json({ success: false, message: 'Channel not found' }, { status: 404 });
      }

      // Check if the channel is in the user's workspace
      if (channel.workspace.toString() !== workspaceId) {
        return NextResponse.json({ success: false, message: 'Channel not in workspace' }, { status: 403 });
      }

      // If private channel, check if user is a member
      // @ts-ignore
      if (channel.isPrivate && !channel.members.includes(request.user._id)) {
        return NextResponse.json({ success: false, message: 'No access to this private channel' }, { status: 403 });
      }

      // Create a new request object with the channel attached
      const requestWithChannel = new Request(request);
      // @ts-ignore
      requestWithChannel.channel = channel;
      // @ts-ignore
      requestWithChannel.user = request.user;

      // Call the handler
      return handler(requestWithChannel, context);
    } catch (error) {
      console.error('Channel access error:', error);
      return NextResponse.json({ success: false, message: 'Channel access error' }, { status: 500 });
    }
  });
}

// export default {
//   withAuth,
//   withWorkspaceAccess,
//   withChannelAccess
// };
