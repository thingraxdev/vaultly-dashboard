import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";
import { verifyApiKey, unauthorizedResponse } from "@/lib/api-auth";

/**
 * POST /api/end-session
 * Marks an active session as closed.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  if (!verifyApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const { sessionId } = (await request.json()) as { sessionId?: string };
    if (!sessionId) {
      return NextResponse.json({ error: "sessionId is required" }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();
    const { error } = await supabase
      .from("active_sessions")
      .update({ session_end: new Date().toISOString() })
      .eq("id", sessionId)
      .is("session_end", null);

    if (error) {
      return NextResponse.json({ error: "Failed to end session" }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
