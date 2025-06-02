import { NextResponse } from "next/server"
import jwt from "jsonwebtoken"
import { cookies } from "next/headers"

// In a real app, this would be a database
const threads = {}

export async function GET(request, { params }) {
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

    const { threadId } = params

    // Get thread messages
    const messages = threads[threadId] || []

    return NextResponse.json({ messages })
  } catch (error) {
    console.error("Fetch thread error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}
