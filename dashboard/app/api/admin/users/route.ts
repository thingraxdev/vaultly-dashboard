import { NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";

/**
 * GET /api/admin/users
 * Returns all users with their access grants (for admin dashboard)
 * Uses service role to bypass RLS
 */
export async function GET(): Promise<NextResponse> {
  try {
    // Check if service role key is configured
    if (!process.env.SUPABASE_SERVICE_ROLE_KEY) {
      console.error("SUPABASE_SERVICE_ROLE_KEY is not configured");
      return NextResponse.json(
        { error: "Server configuration error: Service role key missing" },
        { status: 500 }
      );
    }

    const supabase = getSupabaseServiceRole();

    // Fetch users and access grants in parallel
    const [usersResult, grantsResult] = await Promise.all([
      supabase
        .from("users")
        .select("*")
        .order("created_at", { ascending: false }),
      supabase
        .from("access_grants")
        .select("user_id, tool_id, tools(id, name, url, icon_url)")
        .eq("is_active", true),
    ]);

    if (usersResult.error) {
      console.error("Failed to fetch users:", usersResult.error);
      return NextResponse.json({ error: usersResult.error.message }, { status: 500 });
    }

    // Build user access map
    const userAccess: Record<string, Array<{ id: string; name: string; url: string; icon_url: string | null }>> = {};
    if (grantsResult.data) {
      for (const grant of grantsResult.data) {
        if (!userAccess[grant.user_id]) {
          userAccess[grant.user_id] = [];
        }
        if (grant.tools) {
          const tool = grant.tools as unknown as { id: string; name: string; url: string; icon_url: string | null };
          userAccess[grant.user_id].push(tool);
        }
      }
    }

    // Set no-cache headers
    return NextResponse.json(
      { users: usersResult.data || [], userAccess },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
