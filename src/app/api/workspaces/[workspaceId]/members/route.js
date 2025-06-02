import { NextResponse } from "next/server";
import dbConnect from "@/lib/mongoose"
import User from "@/models/user.model"
import Workspace from "@/models/workspace.model"
import Channel from "@/models/channel.model"
import { withWorkspaceAccess } from "@/app/middleware/authMiddleware";

// Get all members of a workspace
export const GET = withWorkspaceAccess(async (req, context) => {
  try {
    const { workspaceId } = await context.params;

    // Find workspace and populate member data
    const workspace = await Workspace.findById(workspaceId)
      .populate({
        path: 'members.user',
        select: 'fullName email avatar status lastSeen'
      });

    if (!workspace) {
      return NextResponse.json(
        { success: false, message: "Workspace not found" },
        { status: 404 }
      );
    }

    // Format members with roles
    const members = workspace.members.map(member => ({
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
      members
    });
  } catch (error) {
    console.error("Workspace members fetch error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to fetch workspace members" },
      { status: 500 }
    );
  }
});

// Add member to workspace
export const POST = withWorkspaceAccess(async (req, context) => {
  try {
    const { workspaceId } = await context.params;
    const { email, role = 'member' } = await req.json();

    if (!email) {
      return NextResponse.json(
        { success: false, message: "Email is required" },
        { status: 400 }
      );
    }

    // Find user by email
    const user = await User.findOne({ email });

    if (!user) {
      return NextResponse.json(
        { success: false, message: "User not found" },
        { status: 404 }
      );
    }

    // Find workspace
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { success: false, message: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if requesting user has admin permission
    const requestingUserMembership = workspace.members.find(
      member => member.user.toString() === req.user._id.toString()
    );

    if (!requestingUserMembership ||
      (requestingUserMembership.role !== 'admin' &&
        workspace.owner.toString() !== req.user._id.toString())) {
      return NextResponse.json(
        { success: false, message: "Only admins can add members" },
        { status: 403 }
      );
    }

    // Check if user is already a member
    const isAlreadyMember = workspace.members.some(
      member => member.user.toString() === user._id.toString()
    );

    if (isAlreadyMember) {
      return NextResponse.json(
        { success: false, message: "User is already a member of this workspace" },
        { status: 400 }
      );
    }

    // Add user to workspace
    workspace.members.push({
      user: user._id,
      role: role
    });

    await workspace.save();

    // Add user to general channel
    const generalChannel = await Channel.findOne({
      workspace: workspaceId,
      name: 'general'
    });

    if (generalChannel) {
      generalChannel.members.push(user._id);
      await generalChannel.save();
    }

    // Add workspace to user's workspaces
    await User.findByIdAndUpdate(user._id, {
      $addToSet: { workspaces: workspaceId }
    });

    return NextResponse.json({
      success: true,
      member: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        avatar: user.avatar,
        role: role,
        status: user.status || 'offline',
        lastSeen: user.lastSeen
      }
    });
  } catch (error) {
    console.error("Add workspace member error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to add workspace member" },
      { status: 500 }
    );
  }
});

// Update or remove multiple members in batch
export const PATCH = withWorkspaceAccess(async (req, context) => {
  try {
    const { workspaceId } = await context.params;
    const { updates } = await req.json();

    if (!updates || !Array.isArray(updates)) {
      return NextResponse.json(
        { success: false, message: "Updates array is required" },
        { status: 400 }
      );
    }

    // Find workspace
    const workspace = await Workspace.findById(workspaceId);

    if (!workspace) {
      return NextResponse.json(
        { success: false, message: "Workspace not found" },
        { status: 404 }
      );
    }

    // Check if requesting user has admin permission
    const requestingUserMembership = workspace.members.find(
      member => member.user.toString() === req.user._id.toString()
    );

    const isAdmin = requestingUserMembership &&
      (requestingUserMembership.role === 'admin' ||
        workspace.owner.toString() === req.user._id.toString());

    if (!isAdmin) {
      return NextResponse.json(
        { success: false, message: "Only admins can update members" },
        { status: 403 }
      );
    }

    const results = [];

    // Process each update
    for (const update of updates) {
      const { userId, action, role } = update;

      // Skip if no userId or invalid action
      if (!userId || !['update', 'remove'].includes(action)) {
        results.push({
          userId,
          success: false,
          message: "Invalid user ID or action"
        });
        continue;
      }

      // Prevent removing workspace owner
      if (action === 'remove' && workspace.owner.toString() === userId) {
        results.push({
          userId,
          success: false,
          message: "Cannot remove workspace owner"
        });
        continue;
      }

      if (action === 'update') {
        // Update member role
        const memberIndex = workspace.members.findIndex(
          member => member.user.toString() === userId
        );

        if (memberIndex === -1) {
          results.push({
            userId,
            success: false,
            message: "User is not a member of this workspace"
          });
          continue;
        }

        workspace.members[memberIndex].role = role || 'member';
        results.push({
          userId,
          success: true,
          message: "Member role updated successfully",
          role: workspace.members[memberIndex].role
        });
      } else if (action === 'remove') {
        // Remove member from workspace
        const initialLength = workspace.members.length;
        workspace.members = workspace.members.filter(
          member => member.user.toString() !== userId
        );

        if (workspace.members.length === initialLength) {
          results.push({
            userId,
            success: false,
            message: "User is not a member of this workspace"
          });
          continue;
        }

        // Remove user from all channels in the workspace
        await Channel.updateMany(
          { workspace: workspaceId },
          { $pull: { members: userId } }
        );

        // Remove workspace from user's workspaces
        await User.findByIdAndUpdate(userId, {
          $pull: { workspaces: workspaceId }
        });

        results.push({
          userId,
          success: true,
          message: "Member removed successfully"
        });
      }
    }

    // Save workspace after all updates
    await workspace.save();

    return NextResponse.json({
      success: true,
      results
    });
  } catch (error) {
    console.error("Update workspace members error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to update workspace members" },
      { status: 500 }
    );
  }
});
