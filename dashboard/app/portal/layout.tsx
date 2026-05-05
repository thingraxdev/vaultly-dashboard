"use client";

import { usePathname, useRouter } from "next/navigation";
import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";
import UserSidebar from "@/components/UserSidebar";
import UserTopbar from "@/components/UserTopbar";

/**
 * Portal shell layout for end users.
 */
export default function PortalLayout({ children }: { children: React.ReactNode }) {
  const pathname = usePathname();
  const router = useRouter();
  const [ready, setReady] = useState(false);

  useEffect(() => {
    const check = async () => {
      if (pathname === "/portal/login" || pathname === "/portal/set-password") {
        setReady(true);
        return;
      }
      const { data } = await supabase.auth.getSession();
      if (!data.session) {
        router.push("/portal/login");
        return;
      }

      const email = data.session.user.email;
      if (!email) {
        await supabase.auth.signOut();
        router.push("/portal/login");
        return;
      }
      const { data: dbUser } = await supabase
        .from("users")
        .select("password_set, is_active")
        .eq("email", email)
        .single();

      if (!dbUser?.is_active) {
        await supabase.auth.signOut();
        router.push("/portal/login");
        return;
      }

      if (!dbUser?.password_set && pathname !== "/portal/set-password") {
        router.push("/portal/set-password");
        return;
      }
      setReady(true);
    };
    void check();
  }, [pathname, router]);

  const logout = async () => {
    await supabase.auth.signOut();
    router.push("/portal/login");
  };

  if (!ready) {
    return (
      <div className="min-h-screen flex items-center justify-center bg-gray-50">
        <div className="text-center">
          <div className="w-16 h-16 rounded-2xl bg-primary-100 flex items-center justify-center mx-auto mb-4 animate-pulse">
            <svg className="w-8 h-8 text-primary-600" fill="none" stroke="currentColor" viewBox="0 0 24 24">
              <path strokeLinecap="round" strokeLinejoin="round" strokeWidth={2} d="M13 10V3L4 14h7v7l9-11h-7z" />
            </svg>
          </div>
          <p className="text-gray-500 font-medium">Loading portal...</p>
        </div>
      </div>
    );
  }

  if (pathname === "/portal/login" || pathname === "/portal/set-password") {
    return <div className="min-h-screen bg-gray-50">{children}</div>;
  }

  return (
    <div className="min-h-screen bg-gray-50">
      {/* Sidebar */}
      <UserSidebar onLogout={logout} />

      {/* Main Content */}
      <div className="pl-64">
        {/* Topbar */}
        <UserTopbar />

        {/* Page Content */}
        <main className="p-8 animate-fade-in">{children}</main>
      </div>
    </div>
  );
}
