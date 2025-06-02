import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose"
import Workspace from "@/models/workspace.model";
import Channel from "@/models/channel.model";
import User from "@/models/user.model";
import Message from "@/models/message.model";
import { withWorkspaceAccess } from "@/app/middleware/authMiddleware";

// Get workspace details
export const GET = withWorkspaceAccess(async (req, props) => {
  try {
    const { workspaceId } = (await props.params).workspaceId;

    // Find workspace and populate related data
    const workspace = await Workspace.findById(workspaceId)
      .populate('owner', 'fullName email avatar')
      .populate({
        path: 'members.user',
        select: 'fullName email avatar status lastSeen'
      })
      .populate({
        path: 'channels',
        select: 'name description isPrivate members pinnedItems createdAt',
        populate: {
          path: 'createdBy',
          select: 'fullName'
        }
      });

    if (!workspace) {
      return NextResponse.json(
        { success: false, message: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if user is a member of the workspace
    const isMember = workspace.members.some(
      member => member.user._id.toString() === req.user._id.toString()
    );

    if (!isMember) {
      return NextResponse.json(
        { success: false, message: "Not authorized to access this workspace" },
        { status: 403 }
      );
    }

    // Format channels (only include channels the user is a member of)
    const userChannels = workspace.channels.filter(channel =>
      !channel.isPrivate || channel.members.includes(req.user._id)
    ).map(channel => ({
      id: channel._id,
      name: channel.name,
      description: channel.description,
      isPrivate: channel.isPrivate,
      createdBy: channel.createdBy ? channel.createdBy.fullName : 'Unknown',
      createdAt: channel.createdAt
    }));

    // Format members with roles
    const formattedMembers = workspace.members.map(member => ({
      id: member.user._id,
      fullName: member.user.fullName,
      email: member.user.email,
      avatar: member.user.avatar,
      role: member.role,
      status: member.user.status || 'offline',
      lastSeen: member.user.lastSeen
    }));

    return NextResponse.json({
      success: true,
      workspace: {
        id: workspace._id,
        name: workspace.name,
        description: workspace.description,
        owner: {
          id: workspace.owner._id,
          fullName: workspace.owner.fullName,
          email: workspace.owner.email,
          avatar: workspace.owner.avatar
        },
        members: formattedMembers,
        channels: userChannels,
        createdAt: workspace.createdAt
      }
    });
  } catch (error) {
    console.error("Workspace fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch workspace" },
      { status: 500 }
    );
  }
});

// Update workspace
export const PATCH = withWorkspaceAccess(async (req, res) => {
  try {
    const { workspaceId } = req.params;
    const { name, description } = await req.json();

    // Find workspace
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { success: false, message: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner or an admin
    const userMembership = workspace.members.find(
      member => member.user.toString() === req.user._id.toString()
    );

    if (!userMembership || (userMembership.role !== 'admin' && workspace.owner.toString() !== req.user._id.toString())) {
      return NextResponse.json(
        { success: false, message: "Not authorized to update this workspace" },
        { status: 403 }
      );
    }

    // Update fields
    const updateData = {};
    if (name) updateData.name = name;
    if (description !== undefined) updateData.description = description;

    // Update workspace
    const updatedWorkspace = await Workspace.findByIdAndUpdate(
      workspaceId,
      updateData,
      { new: true }
    );

    return NextResponse.json({
      success: true,
      workspace: {
        id: updatedWorkspace._id,
        name: updatedWorkspace.name,
        description: updatedWorkspace.description
      }
    });
  } catch (error) {
    console.error("Workspace update error:", error);
    return NextResponse.json(
      { success: false, message: "Workspace update failed" },
      { status: 500 }
    );
  }
});

// Delete workspace
export const DELETE = withWorkspaceAccess(async (req, res) => {
  try {
    const { workspaceId } = req.params;

    // Find workspace
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { success: false, message: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if user is the owner
    if (workspace.owner.toString() !== req.user._id.toString()) {
      return NextResponse.json(
        { success: false, message: "Only the workspace owner can delete it" },
        { status: 403 }
      );
    }

    // Delete all channels in the workspace
    const channels = await Channel.find({ workspace: workspaceId });
    const channelIds = channels.map(channel => channel._id);

    // Delete all messages in all channels
    await Message.deleteMany({ channel: { $in: channelIds } });

    // Delete all channels
    await Channel.deleteMany({ workspace: workspaceId });

    // Remove workspace from all users' workspaces array
    await User.updateMany(
      { workspaces: workspaceId },
      { $pull: { workspaces: workspaceId } }
    );

    // Delete workspace
    await Workspace.findByIdAndDelete(workspaceId);

    return NextResponse.json({
      success: true,
      message: "Workspace deleted successfully"
    });
  } catch (error) {
    console.error("Workspace deletion error:", error);
    return NextResponse.json(
      { success: false, message: "Workspace deletion failed" },
      { status: 500 }
    );
  }
});
