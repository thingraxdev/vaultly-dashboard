import { NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";

/**
 * GET /api/dashboard-stats
 * Returns overview metrics, launches per tool for 7 days, and recent activity.
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseServiceRole();
    const now = new Date();
    const startOfToday = new Date(now.getFullYear(), now.getMonth(), now.getDate()).toISOString();
    const sevenDaysAgo = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();

    const [users, tools, todayLogs, logs7, recentLogs] = await Promise.all([
      supabase.from("users").select("id", { count: "exact", head: true }),
      supabase.from("tools").select("id", { count: "exact", head: true }),
      supabase.from("usage_logs").select("id, user_id", { count: "exact" }).gte("accessed_at", startOfToday),
      supabase.from("usage_logs").select("tool_id, accessed_at").gte("accessed_at", sevenDaysAgo),
      supabase.from("usage_logs").select("id, user_id, tool_id, accessed_at, action").order("accessed_at", { ascending: false }).limit(10),
    ]);

    const activeUsersToday = new Set((todayLogs.data || []).map((l) => l.user_id)).size;

    const [usersRes, toolsRes] = await Promise.all([
      supabase.from("users").select("id, name"),
      supabase.from("tools").select("id, name"),
    ]);

    const userMap = new Map((usersRes.data || []).map((u) => [u.id, u.name]));
    const toolMap = new Map((toolsRes.data || []).map((t) => [t.id, t.name]));

    const launchesPerToolMap = new Map<string, number>();
    for (const row of logs7.data || []) {
      launchesPerToolMap.set(row.tool_id, (launchesPerToolMap.get(row.tool_id) || 0) + 1);
    }

    const launchesPerTool = Array.from(launchesPerToolMap.entries()).map(([toolId, count]) => ({
      toolId,
      toolName: toolMap.get(toolId) || "Unknown",
      launches: count,
    }));

    const recentActivity = (recentLogs.data || []).map((log) => ({
      ...log,
      userName: userMap.get(log.user_id) || "Unknown",
      toolName: toolMap.get(log.tool_id) || "Unknown",
    }));

    return NextResponse.json({
      metrics: {
        totalUsers: users.count || 0,
        activeUsersToday,
        totalLaunchesToday: todayLogs.count || 0,
        totalTools: tools.count || 0,
      },
      launchesPerTool,
      recentActivity,
    });
  } catch {
    return NextResponse.json({ error: "Failed to fetch dashboard stats" }, { status: 500 });
  }
}
