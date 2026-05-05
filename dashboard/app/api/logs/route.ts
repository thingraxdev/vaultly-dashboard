import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";

/**
 * GET /api/logs
 * Returns filtered usage logs and supports CSV export.
 */
export async function GET(request: NextRequest): Promise<NextResponse> {
  try {
    const userId = request.nextUrl.searchParams.get("userId");
    const toolId = request.nextUrl.searchParams.get("toolId");
    const start = request.nextUrl.searchParams.get("start");
    const end = request.nextUrl.searchParams.get("end");
    const format = request.nextUrl.searchParams.get("format");

    const supabase = getSupabaseServiceRole();

    let query = supabase
      .from("usage_logs")
      .select("id, accessed_at, action, extension_version, user_id, tool_id")
      .order("accessed_at", { ascending: false })
      .limit(1000);

    if (userId) query = query.eq("user_id", userId);
    if (toolId) query = query.eq("tool_id", toolId);
    if (start) query = query.gte("accessed_at", new Date(start).toISOString());
    if (end) query = query.lte("accessed_at", new Date(end).toISOString());

    const { data: logs, error } = await query;
    if (error) throw error;

    const [usersRes, toolsRes] = await Promise.all([
      supabase.from("users").select("id, name"),
      supabase.from("tools").select("id, name"),
    ]);

    const userMap = new Map((usersRes.data || []).map((u) => [u.id, u.name]));
    const toolMap = new Map((toolsRes.data || []).map((t) => [t.id, t.name]));

    const rows = (logs || []).map((log) => ({
      ...log,
      user_name: userMap.get(log.user_id) || "Unknown",
      tool_name: toolMap.get(log.tool_id) || "Unknown",
    }));

    if (format === "csv") {
      const header = "user_name,tool_name,timestamp,action,extension_version";
      const lines = rows.map(
        (r) =>
          `"${r.user_name}","${r.tool_name}","${r.accessed_at}","${r.action}","${r.extension_version || ""}"`
      );
      const csv = [header, ...lines].join("\n");
      return new NextResponse(csv, {
        headers: {
          "Content-Type": "text/csv; charset=utf-8",
          "Content-Disposition": "attachment; filename=usage_logs.csv",
        },
      });
    }

    return NextResponse.json({ logs: rows });
  } catch {
    return NextResponse.json({ error: "Failed to fetch logs" }, { status: 500 });
  }
}
