import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";

/**
 * DELETE /api/admin/delete-user
 * Deletes a user and all their associated data.
 * Uses service role to bypass RLS.
 */
export async function DELETE(request: NextRequest): Promise<NextResponse> {
  try {
    const { id } = (await request.json()) as { id?: string };
    if (!id) {
      return NextResponse.json({ error: "id is required" }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();

    // End all active sessions for this user
    await supabase
      .from("active_sessions")
      .update({ session_end: new Date().toISOString() })
      .eq("user_id", id)
      .is("session_end", null);

    // Delete usage logs
    await supabase.from("usage_logs").delete().eq("user_id", id);

    // Delete access grants
    await supabase.from("access_grants").delete().eq("user_id", id);

    // Delete user
    const { error } = await supabase.from("users").delete().eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to delete user" }, { status: 500 });
  }
}
