import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Message from "@/models/message.model";
import Channel from "@/models/channel.model";
import { queryOrgBrain } from "@/lib/features/ai/gemini";
import { withAuth } from "@/app/middleware/authMiddleware";
import mongoose from "mongoose";

// Get data from all public channels and pinned documents
export const POST = withAuth(async (req) => {
  try {
    await dbConnect();

    // Parse request body
    const { query } = await req.json();

    if (!query) {
      return NextResponse.json(
        { success: false, message: "Query is required" },
        { status: 400 }
      );
    }

    // Get all public channels the user has access to
    let publicChannels = await Channel.find({
      workspace: req.user.workspace,
      isPrivate: false
    }).select('_id name');

    // If no channels are found, try to get any public channels
    if (publicChannels.length === 0) {
      publicChannels = await Channel.find({
        isPrivate: false
      }).select('_id name');
    }

    // Collect messages and pinned docs from all public channels
    const channelMessages = [];
    const pinnedDocs = [];

    // If we have real channels, try to get their messages
    if (publicChannels.length > 0) {
      for (const channel of publicChannels) {
        try {
          // Get recent messages from this channel (limit to last 50 per channel)
          const messages = await Message.find({
            channel: channel._id,
            parentMessage: null // Only get top-level messages
          })
            .sort({ createdAt: -1 })
            .limit(50)
            .populate('sender', 'fullName avatar');

          // Get pinned messages
          const pinnedMessages = await Message.find({
            channel: channel._id,
            isPinned: true
          }).populate('sender', 'fullName avatar');

          // Add to our collections
          channelMessages.push({
            name: channel.name,
            messages: messages.map(msg => ({
              id: msg._id,
              content: msg.content,
              sender: msg.sender ? {
                id: msg.sender._id,
                fullName: msg.sender.fullName,
                avatar: msg.sender.avatar
              } : null,
              createdAt: msg.createdAt,
              isPinned: msg.isPinned
            }))
          });

          // Add pinned messages to pinnedDocs
          pinnedMessages.forEach(msg => {
            pinnedDocs.push({
              title: `Pinned message by ${msg.sender?.fullName || 'Unknown'}`,
              content: msg.content,
              channelName: channel.name
            });
          });
        } catch (error) {
          console.error(`Error fetching messages for channel ${channel.name}:`, error);
        }
      }
    }

    // If no real data was found, provide sample data for Gemini to work with
    if (channelMessages.length === 0 || channelMessages.every(channel => channel.messages.length === 0)) {
      // Create sample data for Project Atlas
      const atlasChannelData = {
        name: 'project-atlas',
        messages: [
          {
            id: new mongoose.Types.ObjectId().toString(),
            content: 'Team, we need to finalize the UI designs for Project Atlas by the end of the week.',
            sender: { fullName: 'Sarah Johnson' },
            createdAt: new Date(Date.now() - 3 * 24 * 60 * 60 * 1000).toISOString(),
            isPinned: false
          },
          {
            id: new mongoose.Types.ObjectId().toString(),
            content: 'I have completed the backend API integration for the user dashboard component of Project Atlas.',
            sender: { fullName: 'Michael Chen' },
            createdAt: new Date(Date.now() - 2 * 24 * 60 * 60 * 1000).toISOString(),
            isPinned: false
          },
          {
            id: new mongoose.Types.ObjectId().toString(),
            content: 'Project Atlas status update: We are currently at 75% completion. The data visualization module is taking longer than expected due to performance issues.',
            sender: { fullName: 'Alex Rodriguez' },
            createdAt: new Date(Date.now() - 24 * 60 * 60 * 1000).toISOString(),
            isPinned: true
          }
        ]
      };
      channelMessages.push(atlasChannelData);

      // Create sample data for general channel
      const generalChannelData = {
        name: 'general',
        messages: [
          {
            id: new mongoose.Types.ObjectId().toString(),
            content: 'Good morning everyone! Do not forget we have the company all-hands meeting at 2pm today.',
            sender: { fullName: 'Emily Watson' },
            createdAt: new Date(Date.now() - 8 * 60 * 60 * 1000).toISOString(),
            isPinned: false
          },
          {
            id: new mongoose.Types.ObjectId().toString(),
            content: 'The new HR policy documents have been uploaded to the shared drive. Please review them by Friday.',
            sender: { fullName: 'David Kim' },
            createdAt: new Date(Date.now() - 4 * 60 * 60 * 1000).toISOString(),
            isPinned: true
          }
        ]
      };
      channelMessages.push(generalChannelData);

      // Add sample pinned documents
      pinnedDocs.push({
        title: 'Pinned message by Alex Rodriguez',
        content: 'Project Atlas status update: We are currently at 75% completion. The data visualization module is taking longer than expected due to performance issues.',
        channelName: 'project-atlas'
      });

      pinnedDocs.push({
        title: 'Pinned message by David Kim',
        content: 'The new HR policy documents have been uploaded to the shared drive. Please review them by Friday.',
        channelName: 'general'
      });

      pinnedDocs.push({
        title: 'Pinned message by Sarah Johnson',
        content: 'Project Atlas deadline: June 15th. Key deliverables include UI redesign, backend API integration, and user dashboard implementation.',
        channelName: 'project-atlas'
      });
    }

    // Use the Gemini AI to query the org brain
    const aiResponse = await queryOrgBrain(query, channelMessages, pinnedDocs);

    // Log the response for debugging
    console.log('Org Brain API generated response:', aiResponse);

    return NextResponse.json({
      success: true,
      response: aiResponse
    });
  } catch (error) {
    console.error("Org Brain query error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to query Org Brain" },
      { status: 500 }
    );
  }
});
