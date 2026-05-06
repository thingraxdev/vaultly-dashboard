import { NextRequest, NextResponse } from "next/server";
import { getSupabaseServiceRole } from "@/lib/supabase";

type CreateUserBody = {
  email?: string;
  name?: string;
};

/**
 * POST /api/admin/create-user
 * Creates a portal user and sends invite email as one atomic operation.
 * If invite fails, the inserted user row is rolled back.
 */
export async function POST(request: NextRequest): Promise<NextResponse> {
  try {
    const { email, name } = (await request.json()) as CreateUserBody;
    const normalizedEmail = email?.trim().toLowerCase();
    const normalizedName = name?.trim();

    if (!normalizedEmail || !normalizedName) {
      return NextResponse.json({ error: "email and name are required" }, { status: 400 });
    }

    const supabase = getSupabaseServiceRole() as any;

    // Check if app user already exists.
    const { data: existingUser, error: existingUserError } = await supabase
      .from("users")
      .select("id")
      .eq("email", normalizedEmail)
      .maybeSingle();

    if (existingUserError) {
      return NextResponse.json({ error: existingUserError.message }, { status: 500 });
    }

    if (existingUser) {
      return NextResponse.json({ error: "A user with this email already exists" }, { status: 409 });
    }

    // Check if email is already registered in Supabase Auth.
    const { data: authUsersPage, error: authUsersError } = await supabase.auth.admin.listUsers({
      page: 1,
      perPage: 1000,
    });

    if (authUsersError) {
      return NextResponse.json({ error: authUsersError.message }, { status: 500 });
    }

    const authUserExists = (authUsersPage.users || []).some(
      (u: { email?: string | null }) => u.email?.toLowerCase() === normalizedEmail,
    );

    if (authUserExists) {
      return NextResponse.json(
        { error: "A user with this email is already registered in authentication" },
        { status: 409 },
      );
    }

    // Create app-level user first.
    const { data: insertedRows, error: insertError } = await supabase
      .from("users")
      .insert([
        {
          email: normalizedEmail,
          name: normalizedName,
          is_active: true,
          password_set: false,
        },
      ])
      .select("id")
      .single();

    if (insertError) {
      return NextResponse.json({ error: insertError.message }, { status: 500 });
    }

    // Send invite. If this fails, rollback inserted user for atomic behavior.
    const appUrl = process.env.NEXT_PUBLIC_APP_URL || request.nextUrl.origin;
    const { error: inviteError } = await supabase.auth.admin.inviteUserByEmail(normalizedEmail, {
      redirectTo: `${appUrl}/portal/set-password`,
    });

    if (inviteError) {
      await supabase.from("users").delete().eq("id", insertedRows.id);
      const conflict = inviteError.message.toLowerCase().includes("already") ||
        inviteError.message.toLowerCase().includes("registered");
      return NextResponse.json({ error: inviteError.message }, { status: conflict ? 409 : 500 });
    }

    return NextResponse.json({ success: true }, { status: 201 });
  } catch {
    return NextResponse.json({ error: "Failed to create and invite user" }, { status: 500 });
  }
}
