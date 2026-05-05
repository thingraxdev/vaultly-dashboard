/**
 * POST /api/log-access
 * Logs user tool access for audit trail
 *
 * @body { email: string, toolId: string }
 * @returns { success: boolean }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";
import { verifyApiKey, unauthorizedResponse } from "@/lib/api-auth";
import type { LogAccessRequest } from "@/shared/types";

export async function POST(request: NextRequest): Promise<NextResponse> {
  // Verify API key
  if (!verifyApiKey(request)) {
    return unauthorizedResponse();
  }

  try {
    const body = (await request.json()) as LogAccessRequest;
    const { email, toolId, action = "launch", extensionVersion } = body;

    if (!email || !toolId) {
      return NextResponse.json(
        { error: "Email and toolId are required" },
        { status: 400 }
      );
    }

    const supabase = getSupabaseServiceRole();

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

    // Log the access
    const { error: logError } = await supabase.from("usage_logs").insert([
      {
        user_id: user.id,
        tool_id: toolId,
        action,
        extension_version: extensionVersion || request.headers.get("X-Extension-Version"),
      },
    ]);

    if (logError) {
      console.error("Log access error:", logError);
      return NextResponse.json(
        { error: "Failed to log access" },
        { status: 500 }
      );
    }

    return NextResponse.json({ success: true }, { status: 200 });
  } catch (error) {
    console.error("POST /api/log-access error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
