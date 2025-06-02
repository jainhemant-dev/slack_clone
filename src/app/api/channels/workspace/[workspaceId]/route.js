import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose";
import Channel from "@/models/channel.model";
import Workspace from "@/models/workspace.model";
import { withWorkspaceAccess } from "@/app/middleware/authMiddleware";

// Create a new channel
export const POST = withWorkspaceAccess(async (req, { params }) => {
  try {
    const { name, description, isPrivate, members = [] } = await req.json();
    const workspaceId = await params.workspaceId;

    // Validate input
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Channel name is required" },
        { status: 400 }
      );
    }

    // Create channel
    const channel = new Channel({
      name,
      description: description || "",
      isPrivate: isPrivate || false,
      workspace: workspaceId,
      members: [req.user._id, ...members], // Always add creator as a member
      createdBy: req.user._id,
    });

    // Save channel
    await channel.save();

    // Update workspace with new channel
    await Workspace.findByIdAndUpdate(workspaceId, {
      $push: { channels: channel._id },
    });

    return NextResponse.json({
      success: true,
      channel: {
        id: channel._id,
        name: channel.name,
        description: channel.description,
        isPrivate: channel.isPrivate,
      },
    });
  } catch (error) {
    console.error("Channel creation error:", error);
    return NextResponse.json(
      { success: false, message: "Channel creation failed" },
      { status: 500 }
    );
  }
});

// Get all channels for a workspace
export const GET = withWorkspaceAccess(async (req, res) => {
  try {
    const { workspaceId } = req.query;

    // Find all channels in the workspace
    const channels = await Channel.find({ workspace: workspaceId });

    // Filter out private channels that the user is not a member of
    const accessibleChannels = channels.filter(
      (channel) =>
        !channel.isPrivate || channel.members.includes(req.user._id)
    );

    return NextResponse.json({
      success: true,
      channels: accessibleChannels.map((channel) => ({
        id: channel._id,
        name: channel.name,
        description: channel.description,
        isPrivate: channel.isPrivate,
      })),
    });
  } catch (error) {
    console.error("Channels fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch channels" },
      { status: 500 }
    );
  }
});
