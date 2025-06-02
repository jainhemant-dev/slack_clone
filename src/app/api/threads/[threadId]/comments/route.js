import { NextResponse } from "next/server"
import { v4 as uuidv4 } from "uuid"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

// In a real app, this would be a database
const threads = {}
const users = []

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
    const { threadId } = params

    // Find user
    const user = users.find((u) => u.id === userId)
    if (!user) {
      return NextResponse.json({ message: "User not found" }, { status: 404 })
    }

    // Get comment data
    const { content } = await request.json()

    // Validate input
    if (!content) {
      return NextResponse.json({ message: "Comment content is required" }, { status: 400 })
    }

    // Create comment
    const comment = {
      id: uuidv4(),
      threadId,
      userId,
      userName: user.name,
      content,
      createdAt: new Date().toISOString(),
    }

    // Add comment to thread
    if (!threads[threadId]) {
      threads[threadId] = []
    }
    threads[threadId].push(comment)

    return NextResponse.json({ comment })
  } catch (error) {
    console.error("Add comment error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
