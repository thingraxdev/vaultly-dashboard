import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";

/**
 * GET /api/portal/tools?email=...
 * Returns user tool cards for the web portal and includes revoked-access messaging.
 * Optimized with parallel queries.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const email = request.nextUrl.searchParams.get("email");
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();
    
    // First get user (required for subsequent queries)
    const { data: user } = await supabase
      .from("users")
      .select("id, is_active")
      .eq("email", email)
      .single();

    if (!user || !user.is_active) {
      return NextResponse.json({ tools: [], message: "Your account is inactive." });
    }

    // Run grants and tools queries in parallel
    const [grantsResult, allToolsResult] = await Promise.all([
      supabase
        .from("access_grants")
        .select("tool_id, is_active, expires_at")
        .eq("user_id", user.id),
      supabase
        .from("tools")
        .select("id, name, url, icon_url, is_active")
    ]);

    const grants = grantsResult.data || [];
    const allTools = allToolsResult.data || [];
    
    // Filter tools that user has grants for
    const grantedToolIds = new Set(grants.map((g) => g.tool_id));
    const tools = allTools.filter((t) => grantedToolIds.has(t.id));

    // Only fetch last used for tools user has access to (limit to recent)
    const { data: logs } = tools.length
      ? await supabase
          .from("usage_logs")
          .select("tool_id, accessed_at")
          .eq("user_id", user.id)
          .in("tool_id", tools.map(t => t.id))
          .order("accessed_at", { ascending: false })
          .limit(50)
      : { data: [] };

    const lastUsedMap = new Map<string, string>();
    for (const log of logs || []) {
      if (!lastUsedMap.has(log.tool_id)) lastUsedMap.set(log.tool_id, log.accessed_at);
    }

    const now = new Date();
    const revoked: string[] = [];

    const rows = tools.map((tool) => {
      const grant = grants.find((g) => g.tool_id === tool.id);
      const grantActive = !!grant?.is_active && (!grant?.expires_at || new Date(grant.expires_at) > now);
      if (!grantActive || !tool.is_active) revoked.push(tool.name);
      return {
        ...tool,
        grantActive,
        expiresAt: grant?.expires_at || null,
        lastUsed: lastUsedMap.get(tool.id) || null,
      };
    });

    return NextResponse.json(
      {
        tools: rows,
        message: revoked.length ? `Access to ${revoked[0]} has been removed` : "",
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      }
    );
  } catch {
    return NextResponse.json({ error: "Failed to fetch portal tools" }, { status: 500 });
  }
}
