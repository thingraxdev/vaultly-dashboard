/**
 * GET /api/cookies?email=xxx&toolId=yyy
 * Returns cookies for a specific tool if user has access
 *
 * @query email - User email
 * @query toolId - Tool ID
 * @returns { cookies: CookieInjectObject[], toolId: string, toolUrl: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";
import { verifyApiKey, unauthorizedResponse } from "@/lib/api-auth";
import {
  consumeUserRateLimit,
  getMinimumExtensionVersion,
  isSupportedExtensionVersion,
} from "@/lib/extension-policy";
import type { GetCookiesResponse, CookieInjectObject } from "@/shared/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify API key
  if (!verifyApiKey(request)) {
    return unauthorizedResponse();
  }

  const email = request.nextUrl.searchParams.get("email");
  const toolId = request.nextUrl.searchParams.get("toolId");
  const extensionVersion = request.headers.get("X-Extension-Version");

  if (!isSupportedExtensionVersion(extensionVersion)) {
    return NextResponse.json(
      {
        error: "Please reload your extension",
        minVersion: getMinimumExtensionVersion(),
      },
      {
        status: 426,
        headers: {
          "X-Min-Extension-Version": getMinimumExtensionVersion(),
        },
      }
    );
  }

  if (!email || !toolId) {
    return NextResponse.json(
      { error: "Email and toolId parameters required" },
      { status: 400 }
    );
  }

  try {
    const supabase = getSupabaseServiceRole();

    const rate = consumeUserRateLimit(email, 10, 60_000);
    if (!rate.allowed) {
      return NextResponse.json(
        { error: "Rate limit exceeded. Try again in a moment." },
        {
          status: 429,
          headers: {
            "Retry-After": String(rate.retryAfterSeconds),
          },
        }
      );
    }

    // Get user
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id")
      .eq("email", email)
      .eq("is_active", true)
      .single();

    if (userError || !user) {
      return NextResponse.json({ error: "User not found" }, { status: 403 });
    }

    // Check if user has access to this tool
    const { data: grant, error: grantError } = await supabase
      .from("access_grants")
      .select("expires_at")
      .eq("user_id", user.id)
      .eq("tool_id", toolId)
      .eq("is_active", true)
      .single();

    if (grantError || !grant) {
      return NextResponse.json({ error: "Access denied" }, { status: 403 });
    }

    // Check if grant is expired
    if (grant.expires_at && new Date(grant.expires_at) < new Date()) {
      return NextResponse.json({ error: "Access expired" }, { status: 403 });
    }

    // Get tool and its cookies
    const { data: tool, error: toolError } = await supabase
      .from("tools")
      .select("*")
      .eq("id", toolId)
      .eq("is_active", true)
      .single();

    if (toolError || !tool) {
      return NextResponse.json({ error: "Tool not found" }, { status: 404 });
    }

    if (!tool.is_active) {
      return NextResponse.json({ error: "Tool is currently unavailable" }, { status: 423 });
    }

    if (typeof tool.max_concurrent_users === "number" && tool.max_concurrent_users > 0) {
      const { data: openSessions, error: sessionErr } = await supabase
        .from("active_sessions")
        .select("id")
        .eq("tool_id", toolId)
        .is("session_end", null);

      if (sessionErr) {
        console.error("Session count error:", sessionErr);
      }

      const current = openSessions?.length || 0;
      if (current >= tool.max_concurrent_users) {
        return NextResponse.json(
          { error: "Tool is busy, try again soon" },
          { status: 423 }
        );
      }
    }

    // Decrypt cookies (if encryption is implemented)
    let cookies: CookieInjectObject[] = [];
    try {
      // For now, assume cookies_json is stored as plain JSON
      // In production, decrypt it: decryptData(tool.cookies_json, [])
      cookies = JSON.parse(tool.cookies_json) as CookieInjectObject[];
    } catch {
      console.warn("Failed to parse cookies for tool:", toolId);
      cookies = [];
    }

    // End any existing active sessions for this user + this tool (prevent same tool on multiple devices)
    // User can still have sessions for different tools simultaneously
    await supabase
      .from("active_sessions")
      .update({ session_end: new Date().toISOString() })
      .eq("user_id", user.id)
      .eq("tool_id", toolId)
      .is("session_end", null);

    const { data: sessionRecord } = await supabase
      .from("active_sessions")
      .insert([
        {
          user_id: user.id,
          tool_id: toolId,
        },
      ])
      .select("id")
      .single();

    return NextResponse.json<GetCookiesResponse>(
      {
        cookies,
        toolId,
        toolUrl: tool.url,
        sessionId: sessionRecord?.id,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Get cookies error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
