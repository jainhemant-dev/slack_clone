import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose"
import Message from "@/models/message.model";
import { withChannelAccess } from "@/app/middleware/authMiddleware";
import { analyzeTone } from "@/lib/features/ai/gemini";

// Create a new message
export const POST = withChannelAccess(async (req, context) => {
  try {
  
    await dbConnect();
    // Parse request body
    const { content, parentMessage, mentions = [], attachments = [] } = await req.json();
    const channelId = req.channel._id;
   
    // Validate input
    if (!content && (!attachments || attachments.length === 0)) {
      return NextResponse.json(
        { success: false, message: "Message content or attachments are required" },
        { status: 400 }
      );
    }

    // Create message
    const message = new Message({
      content: content || "",
      sender: req.user._id,
      channel: channelId,
      parentMessage: parentMessage || null,
      mentions,
      attachments,
    });

    // Save message initially to get an ID
    await message.save();
    
    try {
      // Only analyze tone for non-empty text messages
      if (content && content.trim().length > 0) {
        console.log(`Analyzing tone for message: ${message._id}`);
        const toneAnalysis = await analyzeTone(content);
        
        // Update message with tone analysis
        message.tone = {
          sentiment: toneAnalysis.sentiment,
          impact: toneAnalysis.impact,
          category: toneAnalysis.category,
          score: toneAnalysis.score
        };
        
        // Save message with tone analysis
        await message.save();
        console.log(`Tone analysis saved for message: ${message._id}`);
      }
    } catch (toneError) {
      // Log error but don't fail the message creation
      console.error("Tone analysis error:", toneError);
      // Message is already saved without tone analysis
    }

    // Populate sender info
    await message.populate('sender', 'fullName avatar');

    return NextResponse.json({
      success: true,
      message: {
        id: message._id,
        content: message.content,
        sender: {
          id: message.sender._id,
          fullName: message.sender.fullName,
          avatar: message.sender.avatar,
        },
        channel: message.channel,
        parentMessage: message.parentMessage,
        mentions: message.mentions,
        attachments: message.attachments,
        createdAt: message.createdAt,
        tone: message.tone || null,
      },
    });
  } catch (error) {
    console.error("Message creation error:", error);
    return NextResponse.json(
      { success: false, message: "Message creation failed" },
      { status: 500 }
    );
  }
});

// Get messages for a channel with pagination
export const GET = withChannelAccess(async (req, res) => {
  try {
    const channelId = req.channel._id;
    const { cursor, limit = 50 } = req.query || {};
const url = new URL(req.url);
const thread = url.searchParams.get('thread');

    // Build query
    const query = {
      channel: channelId,
      // If thread is specified, find messages in that thread
      // If thread is null, find only root messages (not replies)
      ...(thread ? { parentMessage: thread } : { parentMessage: null }),
    };

    // If cursor is provided, get messages before that timestamp
    if (cursor) {
      query.createdAt = { $lt: new Date(parseInt(cursor)) };
    }
  
    // Find messages
    const messages = await Message.find(query)
      .sort({ createdAt: -1 })
      .limit(parseInt(limit))
      .populate('sender', 'fullName avatar')
      .populate('mentions', 'fullName avatar');


    // Get thread counts for each message if not in a thread view
    let messageData = [];
    if (!thread) {
      for (const message of messages) {
        const repliesCount = await Message.countDocuments({
          parentMessage: message._id,
        });
        
        messageData.push({
          id: message._id,
          content: message.content,
          sender: {
            id: message.sender._id,
            fullName: message.sender.fullName,
            avatar: message.sender.avatar,
          },
          channel: message.channel,
          mentions: message.mentions.map(user => ({
            id: user._id,
            fullName: user.fullName,
            avatar: user.avatar,
          })),
          attachments: message.attachments,
          createdAt: message.createdAt,
          isEdited: message.isEdited,
          isPinned: message.isPinned,
          tone: message.tone || null,
          repliesCount,
        });
      }
    } else {
      // Just format messages without thread counts
      messageData = messages.map(message => ({
        id: message._id,
        content: message.content,
        sender: {
          id: message.sender._id,
          fullName: message.sender.fullName,
          avatar: message.sender.avatar,
        },
        channel: message.channel,
        parentMessage: message.parentMessage,
        mentions: message.mentions.map(user => ({
          id: user._id,
          fullName: user.fullName,
          avatar: user.avatar,
        })),
        attachments: message.attachments,
        createdAt: message.createdAt,
        isEdited: message.isEdited,
        isPinned: message.isPinned,
        tone: message.tone || null,
      }));
    }

    // Get the next cursor
    const nextCursor = messages.length > 0 
      ? messages[messages.length - 1].createdAt.getTime() 
      : null;

    return NextResponse.json({
      success: true,
      messages: messageData,
      nextCursor,
      hasMore: messages.length === parseInt(limit),
    });
  } catch (error) {
    console.error("Messages fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch messages" },
      { status: 500 }
    );
  }
});
