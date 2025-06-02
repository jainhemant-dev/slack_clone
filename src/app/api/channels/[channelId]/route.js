import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Channel from "@/models/channel.model";
import Workspace from "@/models/workspace.model";
import { withChannelAccess } from "@/app/middleware/authMiddleware";

// Get channel details
export const GET = withChannelAccess(async (req, res) => {
  try {
    // Channel is already attached to req by the middleware
    const channel = req.channel;

    return NextResponse.json({
      success: true,
      channel: {
        id: channel._id,
        name: channel.name,
        description: channel.description,
        isPrivate: channel.isPrivate,
        createdBy: channel.createdBy,
        pinnedItems: channel.pinnedItems,
      },
    });
  } catch (error) {
    console.error("Channel fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch channel" },
      { status: 500 }
    );
  }
});

// Update channel
export const PATCH = withChannelAccess(async (req, res) => {
  try {
    const { name, description, isPrivate } = await req.json();
    const { channelId } = req.params;

    // Update fields
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;
    if (isPrivate !== undefined) updateData.isPrivate = isPrivate;

    // Update channel
    const updatedChannel = await Channel.findByIdAndUpdate(
      channelId,
      updateData,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      channel: {
        id: updatedChannel._id,
        name: updatedChannel.name,
        description: updatedChannel.description,
        isPrivate: updatedChannel.isPrivate,
      },
    });
  } catch (error) {
    console.error("Channel update error:", error);
    return NextResponse.json(
      { success: false, message: "Channel update failed" },
      { status: 500 }
    );
  }
});

// Delete channel
export const DELETE = withChannelAccess(async (req, res) => {
  try {
    const { channelId } = req.params;
    const { workspaceId } = req.query;

    // Check if it's the general channel (which shouldn't be deletable)
    const channel = await Channel.findById(channelId);
    if (channel.name === "general") {
      return NextResponse.json(
        { success: false, message: "Cannot delete the general channel" },
        { status: 403 }
      );
    }

    // Delete channel
    await Channel.findByIdAndDelete(channelId);

    // Remove channel from workspace
    await Workspace.findByIdAndUpdate(workspaceId, {
      $pull: { channels: channelId },
    });

    return NextResponse.json({
      success: true,
      message: "Channel deleted successfully",
    });
  } catch (error) {
    console.error("Channel deletion error:", error);
    return NextResponse.json(
      { success: false, message: "Channel deletion failed" },
      { status: 500 }
    );
  }
});
