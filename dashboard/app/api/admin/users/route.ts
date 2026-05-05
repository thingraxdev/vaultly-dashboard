import { NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";

/**
 * GET /api/admin/users
 * Returns all users (for admin dashboard)
 * Uses service role to bypass RLS
 */
export async function GET(): Promise<NextResponse> {
  try {
    const supabase = getSupabaseServiceRole();

    const { data: users, error } = await supabase
      .from("users")
      .select("*")
      .order("created_at", { ascending: false });

    if (error) {
      console.error("Failed to fetch users:", error);
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ users: users || [] });
  } catch (error) {
    console.error("GET /api/admin/users error:", error);
    return NextResponse.json({ error: "Internal server error" }, { status: 500 });
  }
}
