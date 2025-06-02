import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"
import dbConnect from "@/lib/mongoose"
import User from "@/models/user.model"
import Workspace from "@/models/workspace.model"
import Channel from "@/models/channel.model"

export async function POST(request) {
  try {
    // Connect to MongoDB
    await dbConnect();
    
    const { email, password } = await request.json()
console.log(email, password);

    // Validate input
    if (!email || !password) {
      return NextResponse.json({ message: "Email and password are required" }, { status: 400 })
    }

    // Find user with password included (normally excluded by select: false)
    const user = await User.findOne({ email }).select('+password')
    if (!user) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Verify password using the method defined in the user model
    const isPasswordValid = await user.comparePassword(password)
    if (!isPasswordValid) {
      return NextResponse.json({ message: "Invalid credentials" }, { status: 401 })
    }

    // Get user's workspaces with populated channels
    const userWorkspaces = await Workspace.find({
      _id: { $in: user.workspaces }
    }).populate({
      path: 'channels',
      model: Channel,
      select: 'name description isPrivate members'
    })

    // Create JWT token
    const token = jwt.sign({ id: user._id }, process.env.JWT_SECRET, {
      expiresIn: "7d",
    })

    // Set cookie - must use await with cookies() in Next.js App Router
    const cookieStore = await cookies();
    await cookieStore.set("auth_token", token, {
      httpOnly: true,
      secure: process.env.NODE_ENV === "production",
      sameSite: "strict",
      maxAge: 7 * 24 * 60 * 60, // 7 days
      path: "/",
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

    // Return user data (without password)
    return NextResponse.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        workspaces: formattedWorkspaces,
      },
    })
  } catch (error) {
    console.error("Login error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}