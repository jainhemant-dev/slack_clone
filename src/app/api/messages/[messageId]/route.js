import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose"
import Message from "@/models/message.model";
import Channel from "@/models/channel.model";
import { withAuth } from "@/app/middleware/authMiddleware";

// Helper to check message ownership
async function checkMessageOwnership(req, messageId) {
  // Find the message
  const message = await Message.findById(messageId);

  if (!message) {
    return { owned: false, error: "Message not found", status: 404, message: null };
  }

  // Check if user is the sender
  if (message.sender.toString() !== req.user._id.toString()) {
    return { owned: false, error: "Not authorized to modify this message", status: 403, message };
  }

  return { owned: true, error: null, status: 200, message };
}

// Get a specific message
export const GET = withAuth(async (req, res) => {
  try {
    await dbConnect();

    const { messageId } = req.params;

    // Find message and populate related fields
    const message = await Message.findById(messageId)
      .populate('sender', 'fullName avatar')
      .populate('mentions', 'fullName avatar');

    if (!message) {
      return NextResponse.json(
        { success: false, message: "Message not found" },
        { status: 404 }
      );
    }

    // Check if user has access to the channel
    const channel = await Channel.findById(message.channel);
    if (channel.isPrivate && !channel.members.includes(req.user._id)) {
      return NextResponse.json(
        { success: false, message: "Not authorized to view this message" },
        { status: 403 }
      );
    }

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
        mentions: message.mentions.map(user => ({
          id: user._id,
          fullName: user.fullName,
          avatar: user.avatar,
        })),
        attachments: message.attachments,
        createdAt: message.createdAt,
        isEdited: message.isEdited,
        isPinned: message.isPinned,
      },
    });
  } catch (error) {
    console.error("Message fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch message" },
      { status: 500 }
    );
  }
});

// Update a message
export const PATCH = withAuth(async (req, res) => {
  try {
    await dbConnect();

    const { messageId } = req.params;
    const { content, mentions = [] } = await req.json();

    // Check ownership
    const { owned, error, status, message } = await checkMessageOwnership(req, messageId);
    if (!owned) {
      return NextResponse.json({ success: false, message: error }, { status });
    }

    // Save previous content to edit history
    const editHistory = message.editHistory || [];
    editHistory.push({
      content: message.content,
      editedAt: new Date(),
    });

    // Update message
    const updatedMessage = await Message.findByIdAndUpdate(
      messageId,
      {
        content,
        mentions,
        isEdited: true,
        editHistory,
      },
      { new: true }
    ).populate('sender', 'fullName avatar')
      .populate('mentions', 'fullName avatar');

    return NextResponse.json({
      success: true,
      message: {
        id: updatedMessage._id,
        content: updatedMessage.content,
        sender: {
          id: updatedMessage.sender._id,
          fullName: updatedMessage.sender.fullName,
          avatar: updatedMessage.sender.avatar,
        },
        channel: updatedMessage.channel,
        parentMessage: updatedMessage.parentMessage,
        mentions: updatedMessage.mentions.map(user => ({
          id: user._id,
          fullName: user.fullName,
          avatar: user.avatar,
        })),
        attachments: updatedMessage.attachments,
        createdAt: updatedMessage.createdAt,
        isEdited: updatedMessage.isEdited,
        isPinned: updatedMessage.isPinned,
      },
    });
  } catch (error) {
    console.error("Message update error:", error);
    return NextResponse.json(
      { success: false, message: "Message update failed" },
      { status: 500 }
    );
  }
});

// Delete a message
export const DELETE = withAuth(async (req, res) => {
  try {
    await dbConnect();

    const { messageId } = req.params;

    // Check ownership
    const { owned, error, status } = await checkMessageOwnership(req, messageId);
    if (!owned) {
      return NextResponse.json({ success: false, message: error }, { status });
    }

    // Delete message
    await Message.findByIdAndDelete(messageId);

    return NextResponse.json({
      success: true,
      message: "Message deleted successfully",
    });
  } catch (error) {
    console.error("Message deletion error:", error);
    return NextResponse.json(
      { success: false, message: "Message deletion failed" },
      { status: 500 }
    );
  }
});
