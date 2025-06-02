import { NextResponse } from "next/server"
import { cookies } from "next/headers"
import jwt from "jsonwebtoken"
import dbConnect from "@/lib/mongoose"
import User from "@/models/user.model"
import Workspace from "@/models/workspace.model"
import Channel from "@/models/channel.model"

export async function POST(request) {
  try {
    // Connect to MongoDB
    await dbConnect();

    const { fullName, email, password } = await request.json()

    // Validate input
    if (!fullName || !email || !password) {
      return NextResponse.json({ message: "Missing required fields" }, { status: 400 })
    }

    // Check if user already exists
    const existingUser = await User.findOne({ email })
    if (existingUser) {
      return NextResponse.json({ message: "User already exists" }, { status: 409 })
    }

    // Create user
    const user = new User({
      fullName,
      email,
      password, // Will be hashed by pre-save hook in the model
    })

    // Save user to database
    await user.save()

    // Create a default workspace for the user
    const workspace = new Workspace({
      name: `${fullName}'s Workspace`,
      owner: user._id,
      members: [{
        user: user._id,
        role: 'owner',
      }],
      description: 'My personal workspace',
    })

    // Save workspace
    await workspace.save()

    // Create default channels
    const generalChannel = new Channel({
      name: "general",
      workspace: workspace._id,
      description: "General discussion",
      isPrivate: false,
      members: [user._id],
      createdBy: user._id,
    })

    const cohortChannel = new Channel({
      name: "cohort-1",
      workspace: workspace._id,
      description: "Cohort 1 discussion",
      isPrivate: false,
      members: [user._id],
      createdBy: user._id,
    })

    // Save channels
    await generalChannel.save()
    await cohortChannel.save()

    // Update workspace with channel references
    workspace.channels = [generalChannel._id, cohortChannel._id]
    await workspace.save()

    // Update user with workspace reference
    user.workspaces = [workspace._id]
    await user.save()

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

    // Return user data (without password)
    return NextResponse.json({
      user: {
        id: user._id,
        fullName: user.fullName,
        email: user.email,
        workspaces: [{
          id: workspace._id,
          name: workspace.name,
          channels: [
            {
              id: generalChannel._id,
              name: generalChannel.name,
              description: generalChannel.description,
              isPrivate: generalChannel.isPrivate
            },
            {
              id: cohortChannel._id,
              name: cohortChannel.name,
              description: cohortChannel.description,
              isPrivate: cohortChannel.isPrivate
            }
          ]
        }],
      },
    })
  } catch (error) {
    console.error("Registration error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}