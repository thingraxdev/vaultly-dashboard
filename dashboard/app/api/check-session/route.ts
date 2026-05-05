/**
 * GET /api/check-session?sessionId=xxx
 * Checks if a session is still valid (not ended, user still has access)
 * Used by extension to know when to clear cookies
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";
import { verifyApiKey, unauthorizedResponse } from "@/lib/api-auth";

interface SessionWithRelations {
  id: string;
  session_end: string | null;
  user_id: string;
  tool_id: string;
  users: { is_active: boolean };
  tools: { is_active: boolean; cookie_domain: string };
}

export async function GET(request: NextRequest): Promise<NextResponse> {
  if (!verifyApiKey(request)) {
    return unauthorizedResponse();
  }

  const sessionId = request.nextUrl.searchParams.get("sessionId");

  if (!sessionId) {
    return NextResponse.json({ error: "sessionId required" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceRole();

    // Get session with related data
    const { data, error } = await supabase
      .from("active_sessions")
      .select(`
        id,
        session_end,
        user_id,
        tool_id,
        users!inner(is_active),
        tools!inner(is_active, cookie_domain)
      `)
      .eq("id", sessionId)
      .single();

    const session = data as unknown as SessionWithRelations | null;

    if (error || !session) {
      return NextResponse.json({
        valid: false,
        reason: "session_not_found",
        clearCookies: true,
      });
    }

    // Check if session was ended (revoked)
    if (session.session_end) {
      return NextResponse.json({
        valid: false,
        reason: "session_ended",
        clearCookies: true,
        cookieDomain: session.tools.cookie_domain,
      });
    }

    // Check if user is still active
    if (!session.users.is_active) {
      return NextResponse.json({
        valid: false,
        reason: "user_deactivated",
        clearCookies: true,
        cookieDomain: session.tools.cookie_domain,
      });
    }

    // Check if tool is still active
    if (!session.tools.is_active) {
      return NextResponse.json({
        valid: false,
        reason: "tool_deactivated",
        clearCookies: true,
        cookieDomain: session.tools.cookie_domain,
      });
    }

    // Check if access grant is still active
    const { data: grant } = await supabase
      .from("access_grants")
      .select("is_active, expires_at")
      .eq("user_id", session.user_id)
      .eq("tool_id", session.tool_id)
      .single();

    if (!grant || !grant.is_active) {
      return NextResponse.json({
        valid: false,
        reason: "access_revoked",
        clearCookies: true,
        cookieDomain: session.tools.cookie_domain,
      });
    }

    // Check if grant expired
    if (grant.expires_at && new Date(grant.expires_at) < new Date()) {
      return NextResponse.json({
        valid: false,
        reason: "access_expired",
        clearCookies: true,
        cookieDomain: session.tools.cookie_domain,
      });
    }

    return NextResponse.json({ valid: true });
  } catch (error) {
    console.error("Check session error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
