import { NextResponse } from "next/server";
import { withAuth } from "@/app/middleware/authMiddleware";
import { analyzeTone } from "@/lib/features/ai/gemini";

export const POST = withAuth(async (req) => {
  try {
    // Parse request body
    const { content } = await req.json();
    
    if (!content) {
      return NextResponse.json(
        { success: false, message: "Message content is required" },
        { status: 400 }
      );
    }
    
    // Use the Gemini AI to analyze the tone
    const analysis = await analyzeTone(content);
    
    // Log the analysis for debugging
    console.log('Tone analysis result:', analysis);
    
    return NextResponse.json({
      success: true,
      analysis
    });
  } catch (error) {
    console.error("Tone analysis error:", error);
    return NextResponse.json(
      { success: false, message: "Failed to analyze tone" },
      { status: 500 }
    );
  }
});
