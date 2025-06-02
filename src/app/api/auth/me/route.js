import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongoose"
import User from "@/models/user.model"
import Workspace from "@/models/workspace.model"
import Channel from "@/models/channel.model"

export async function GET() {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    // Get token from cookies - must use await with cookies() in Next.js App Router
    const cookieStore = await cookies();
    const token = await cookieStore.get("auth_token")?.value

    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    // Verify token
    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET)
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    // Find user by ID from token
    const user = await User.findById(decoded.id)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get user's workspaces with populated channels
    const userWorkspaces = await Workspace.find({
      _id: { $in: user.workspaces }
    }).populate({
      path: 'channels',
      model: Channel,
      select: 'name description isPrivate members'
    })
    
    // Format response data
    const formattedWorkspaces = userWorkspaces.map(workspace => ({
      id: workspace._id,
      name: workspace.name,
      description: workspace.description,
      channels: workspace.channels.map(channel => ({
        id: channel._id,
        name: channel.name,
        description: channel.description,
        isPrivate: channel.isPrivate
      }))
    }))

    // Return user data
    return NextResponse.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        status: user.status,
        workspaces: formattedWorkspaces,
      },
    })
  } catch (error) {
    console.error("Auth check error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}