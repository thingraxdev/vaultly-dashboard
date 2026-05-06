import { NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";

/**
 * GET /api/admin/access
 * Returns users, tools, and access grants for the access matrix.
 * Uses service role to bypass RLS.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseServiceRole();

    // Fetch all data in parallel
    const [usersResult, toolsResult, grantsResult] = await Promise.all([
      supabase
        .from("users")
        .select("*")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("tools")
        .select("*")
        .eq("is_active", true)
        .order("name"),
      supabase
        .from("access_grants")
        .select("*")
        .eq("is_active", true),
    ]);

    // Build access matrix
    const accessMatrix: Record<string, Record<string, boolean>> = {};
    const expiryDates: Record<string, string> = {};

    (grantsResult.data || []).forEach((grant) => {
      if (!accessMatrix[grant.user_id]) {
        accessMatrix[grant.user_id] = {};
      }
      accessMatrix[grant.user_id][grant.tool_id] = true;

      if (grant.expires_at) {
        expiryDates[`${grant.user_id}-${grant.tool_id}`] = grant.expires_at;
      }
    });

    return NextResponse.json(
      {
        users: usersResult.data || [],
        tools: toolsResult.data || [],
        access: accessMatrix,
        expiryDates,
      },
      {
        headers: {
          "Cache-Control": "no-store, no-cache, must-revalidate",
          "Pragma": "no-cache",
        },
      }
    );
  } catch (error) {
    console.error("GET /api/admin/access error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
