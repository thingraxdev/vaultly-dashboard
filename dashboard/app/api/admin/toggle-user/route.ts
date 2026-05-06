import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";

/**
 * PATCH /api/admin/toggle-user
 * Toggles user active status. Uses service role to bypass RLS.
 */
export async function PATCH(request: NextRequest): Promise<NextResponse> {
  try {
    const { id, isActive } = (await request.json()) as { id?: string; isActive?: boolean };
    if (!id || typeof isActive !== "boolean") {
      return NextResponse.json({ error: "id and isActive are required" }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();

    // Toggle user active status
    const { error } = await supabase
      .from("users")
      .update({ is_active: !isActive })
      .eq("id", id);

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    // If deactivating user, end all their active sessions
    if (isActive) {
      await supabase
        .from("active_sessions")
        .update({ session_end: new Date().toISOString() })
        .eq("user_id", id)
        .is("session_end", null);
    }

    return NextResponse.json({ success: true, isActive: !isActive });
  } catch {
    return NextResponse.json({ error: "Failed to toggle user status" }, { status: 500 });
  }
}
