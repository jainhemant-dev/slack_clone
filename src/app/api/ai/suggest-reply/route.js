import { NextResponse } from "next/server";
import { withAuth } from "@/lib/auth";
import { suggestReply } from "@/lib/features/ai/gemini";
import dbConnect from "@/lib/mongoose"

export const POST = async (req) => {
  try {
    await dbConnect();
    
    // Parse request body
    const body = await req.json();
    const { thread } = body;
    
    console.log('Received thread data for AI reply:', thread);
    
    // Validate thread data
    if (!thread || !Array.isArray(thread) || thread.length === 0) {
      console.error('Invalid thread data received:', thread);
      return NextResponse.json(
        { success: false, message: "Valid thread messages are required" },
        { status: 400 }
      );
    }
    
    // Make sure each message has the required fields
    const validatedThread = thread.map(msg => ({
      id: msg.id,
      content: msg.content || msg.comment || msg.message || '',
      sender: msg.sender || { fullName: msg.user || 'User' },
      createdAt: msg.createdAt || new Date().toISOString(),
    }));
    
    // Generate AI reply suggestion based on thread messages
    console.log('Sending validated thread data to suggestReply:', validatedThread);
    const reply = await suggestReply(validatedThread);
    
    return NextResponse.json({
      success: true,
      reply
    });
  } catch (error) {
    console.error("Suggest reply error:", error);
    return NextResponse.json(
      { success: false, message: error.message || "Failed to generate reply suggestion" },
      { status: 500 }
    );
  }
}
