/**
 * GET /api/validate-user?email=xxx
 * Validates user email and returns their accessible tools
 *
 * @query email - User email address
 * @returns { valid: boolean, allowedTools: ToolWithAccess[], email?: string }
 */

import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";
import { verifyApiKey, unauthorizedResponse } from "@/lib/api-auth";
import { getMinimumExtensionVersion, isSupportedExtensionVersion } from "@/lib/extension-policy";
import type { ValidateUserResponse, ToolWithAccess } from "@/shared/types";

export async function GET(request: NextRequest): Promise<NextResponse> {
  // Verify API key
  if (!verifyApiKey(request)) {
    return unauthorizedResponse();
  }

  const extensionVersion = request.headers.get("X-Extension-Version");
  if (!isSupportedExtensionVersion(extensionVersion)) {
    return NextResponse.json(
      { error: "Please reload your extension", minVersion: getMinimumExtensionVersion() },
      { status: 426 }
    );
  }

  const email = request.nextUrl.searchParams.get("email");

  if (!email) {
    return NextResponse.json({ error: "Email parameter required" }, { status: 400 });
  }

  try {
    const supabase = getSupabaseServiceRole();

    // Get user by email
    const { data: user, error: userError } = await supabase
      .from("users")
      .select("id, is_active")
      .eq("email", email)
      .single();

    if (userError || !user) {
      return NextResponse.json<ValidateUserResponse>(
        { valid: false, allowedTools: [] },
        { status: 200 }
      );
    }

    if (!user.is_active) {
      return NextResponse.json<ValidateUserResponse>(
        {
          valid: false,
          allowedTools: [],
          message: "Your account has been deactivated by the owner",
        },
        { status: 200 }
      );
    }

    // Get user's accessible tools
    const { data: grants, error: grantsError } = await supabase
      .from("access_grants")
      .select("tool_id, expires_at, is_active")
      .eq("user_id", user.id)
      .order("granted_at", { ascending: false });

    if (grantsError && grantsError.code !== "PGRST116") {
      throw grantsError;
    }

    // Filter out expired grants and get tool details
    const now = new Date();
    const grantByTool = new Map<string, { expires_at: string | null; is_active: boolean }>();
    for (const grant of grants || []) {
      if (!grantByTool.has(grant.tool_id)) {
        grantByTool.set(grant.tool_id, {
          expires_at: grant.expires_at,
          is_active: grant.is_active,
        });
      }
    }

    const allToolIds = Array.from(grantByTool.keys());

    let allowedTools: ToolWithAccess[] = [];
    const revokedTools: { toolId: string; toolName: string; reason: string }[] = [];
    if (allToolIds.length > 0) {
      const { data: tools, error: toolsError } = await supabase
        .from("tools")
        .select("*")
        .in("id", allToolIds);

      if (toolsError) throw toolsError;

      const activeSessionCounts = new Map<string, number>();
      const { data: sessions } = await supabase
        .from("active_sessions")
        .select("tool_id")
        .is("session_end", null)
        .in("tool_id", allToolIds);

      for (const s of sessions || []) {
        activeSessionCounts.set(s.tool_id, (activeSessionCounts.get(s.tool_id) || 0) + 1);
      }

      for (const tool of tools || []) {
        const grant = grantByTool.get(tool.id);
        if (!grant) continue;

        const expired = !!grant.expires_at && new Date(grant.expires_at) <= now;
        const grantInactive = !grant.is_active;
        const toolInactive = !tool.is_active;
        const currentSessions = activeSessionCounts.get(tool.id) || 0;
        const busy =
          typeof tool.max_concurrent_users === "number" &&
          tool.max_concurrent_users > 0 &&
          currentSessions >= tool.max_concurrent_users;

        if (grantInactive || expired || toolInactive) {
          revokedTools.push({
            toolId: tool.id,
            toolName: tool.name,
            reason: grantInactive
              ? "grant_revoked"
              : expired
              ? "grant_expired"
              : "tool_inactive",
          });
        }

        allowedTools.push({
          ...tool,
          grantActive: !grantInactive && !expired,
          busy,
          unavailableReason: toolInactive ? "Currently unavailable" : busy ? "Busy - try again shortly" : "",
        });
      }
    }

    return NextResponse.json<ValidateUserResponse>(
      {
        valid: true,
        allowedTools,
        email,
        revokedTools,
        message: revokedTools.length
          ? `Access to ${revokedTools[0].toolName} has been removed`
          : undefined,
      },
      { status: 200 }
    );
  } catch (error) {
    console.error("Validate user error:", error);
    return NextResponse.json(
      { error: "Internal server error" },
      { status: 500 }
    );
  }
}
