import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

// In a real app, this would be a database
const workspaces = []

export async function POST(request, { params }) {
  try {
    // Authenticate user
    const cookieStore = await cookies();
    const token = await cookieStore.get("auth_token")?.value
    if (!token) {
      return NextResponse.json({ message: "Not authenticated" }, { status: 401 })
    }

    let decoded
    try {
      decoded = jwt.verify(token, process.env.JWT_SECRET || "default_secret")
    } catch (error) {
      return NextResponse.json({ message: "Invalid token" }, { status: 401 })
    }

    const userId = decoded.userId
    const { workspaceId } = params

    // Find workspace
    const workspace = workspaces.find((w) => w.id === workspaceId)
    if (!workspace) {
      return NextResponse.json({ message: "Workspace not found" }, { status: 404 })
    }

    // Check if user is a member of the workspace
    if (!workspace.members.includes(userId)) {
      return NextResponse.json({ message: "Not authorized" }, { status: 403 })
    }

    // Get channel data
    const { name, description, isPrivate, members } = await request.json()

    // Validate input
    if (!name) {
      return NextResponse.json({ message: "Channel name is required" }, { status: 400 })
    }

    // Create channel
    const channelId = uuidv4()
    const channel = {
      id: channelId,
      name,
      description,
      isPrivate: isPrivate || false,
      members: members || workspace.members,
      createdAt: new Date().toISOString(),
    }

    // Add channel to workspace
    workspace.channels.push(channel)

    return NextResponse.json({ channel })
  } catch (error) {
    console.error("Create channel error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
