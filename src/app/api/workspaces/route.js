import { NextResponse } from "next/server"
import dbConnect from "@/lib/mongoose"
import Workspace from "@/models/workspace.model"
import Channel from "@/models/channel.model"
import User from "@/models/user.model"
import { withAuth } from "@/app/middleware/authMiddleware"

// Get all workspaces for the authenticated user
export const GET = withAuth(async (req, res) => {
  try {
    await dbConnect();

    // Find all workspaces where the user is a member
    const workspaces = await Workspace.find({
      'members.user': req.user._id
    }).populate('owner', 'fullName email avatar');

    // Format the response
    const formattedWorkspaces = workspaces.map(workspace => ({
      id: workspace._id,
      name: workspace.name,
      description: workspace.description,
      owner: {
        id: workspace.owner._id,
        fullName: workspace.owner.fullName,
        email: workspace.owner.email,
        avatar: workspace.owner.avatar
      },
      members: workspace.members.length,
      channels: workspace.channels.length,
      createdAt: workspace.createdAt
    }));

    return NextResponse.json({
      success: true,
      workspaces: formattedWorkspaces
    });
  } catch (error) {
    console.error("Fetch workspaces error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch workspaces" },
      { status: 500 }
    );
  }
});

// Create a new workspace
export const POST = withAuth(async (req, res) => {
  try {
    await dbConnect();

    // Get workspace data from request
    const { name, description } = await req.json();

    // Validate input
    if (!name) {
      return NextResponse.json(
        { success: false, message: "Workspace name is required" },
        { status: 400 }
      );
    }

    // Create workspace
    const workspace = new Workspace({
      name,
      description: description || "",
      owner: req.user._id,
      members: [{ user: req.user._id, role: 'admin' }],
    });

    // Save workspace
    await workspace.save();

    // Create default general channel
    const generalChannel = new Channel({
      name: "general",
      description: "General discussion",
      workspace: workspace._id,
      isPrivate: false,
      members: [req.user._id],
      createdBy: req.user._id,
    });

    await generalChannel.save();

    // Update workspace with channel
    workspace.channels.push(generalChannel._id);
    await workspace.save();

    // Add workspace to user's workspaces
    await User.findByIdAndUpdate(req.user._id, {
      $addToSet: { workspaces: workspace._id }
    });

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace._id,
        name: workspace.name,
        description: workspace.description,
        channels: [{
          id: generalChannel._id,
          name: generalChannel.name,
          description: generalChannel.description,
          isPrivate: generalChannel.isPrivate
        }]
      }
    });
  } catch (error) {
    console.error("Create workspace error:", error);
    return NextResponse.json(
      { success: false, message: "Workspace creation failed" },
      { status: 500 }
    );
  }
});
