import { NextResponse } from "next/server";
import { withAuth } from "@/app/middleware/authMiddleware";
import { parseTask, queryOrgBrain, parseTranscript } from "@/lib/features/ai/gemini";
import dbConnect from "@/lib/mongoose";
import Message from "@/models/message.model";
import Channel from "@/models/channel.model";

export const POST = withAuth(async (req) => {
  try {
    await dbConnect();
    
    // Parse request body
    const body = await req.json();
    const { action } = body;
    
    if (!action) {
      return NextResponse.json(
        { success: false, message: "Action is required" },
        { status: 400 }
      );
    }
    
    let response;
    
    // Handle different AI features based on action type
    switch (action) {
      case "parseTask":
        const { taskDescription } = body;
        if (!taskDescription) {
          return NextResponse.json(
            { success: false, message: "Task description is required" },
            { status: 400 }
          );
        }
        response = await parseTask(taskDescription);
        break;

      case "parseTranscript":
        const { transcript } = body;
        if (!transcript) {
          return NextResponse.json(
            { success: false, message: "Transcript is required" },
            { status: 400 }
          );
        }
        response = await parseTranscript(transcript);
        break;
        
      case "orgBrain":
        const { query } = body;
        if (!query) {
          return NextResponse.json(
            { success: false, message: "Query is required" },
            { status: 400 }
          );
        }
        
        // Get all public channels the user has access to
        const publicChannels = await Channel.find({
          workspace: req.user.workspace,
          isPrivate: false
        }).select('_id name');
        
        // Collect messages and pinned docs from all public channels
        const channelMessages = [];
        const pinnedDocs = [];
        
        for (const channel of publicChannels) {
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
        }
        
        // Use the Gemini AI to query the org brain
        response = await queryOrgBrain(query, channelMessages, pinnedDocs);
        break;
        
      default:
        return NextResponse.json(
          { success: false, message: "Invalid AI action" },
          { status: 400 }
        );
    }
    
    return NextResponse.json({
      success: true,
      response
    });
  } catch (error) {
    console.error("AI request error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to process AI request" },
      { status: 500 }
    );
  }
});
