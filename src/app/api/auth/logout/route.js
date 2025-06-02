import { NextResponse } from "next/server"
import { cookies } from "next/headers"

export async function POST() {
  try {
    // Clear auth cookie - must use await with cookies() in Next.js App Router
    const cookieStore = await cookies();
    await cookieStore.delete("auth_token")

    return NextResponse.json({ message: "Logged out successfully." })
  } catch (error) {
    console.error("Logout error:", error)
    return NextResponse.json({ message: "Internal server error" }, { status: 500 })
  }
}