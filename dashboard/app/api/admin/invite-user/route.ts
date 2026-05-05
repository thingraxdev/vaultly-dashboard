import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";

/**
 * POST /api/admin/invite-user
 * Sends a Supabase invite email for first login onboarding.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email } = (await request.json()) as { email?: string };
    if (!email) {
      return NextResponse.json({ error: "email is required" }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole();
    const { error } = await supabase.auth.admin.inviteUserByEmail(email, {
      redirectTo: `${request.nextUrl.origin}/portal/set-password`,
    });

    if (error) {
      return NextResponse.json({ error: error.message }, { status: 500 });
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ error: "Failed to invite user" }, { status: 500 });
  }
}
