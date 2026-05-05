"use client";

import { useEffect } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * Portal root route redirects to login/dashboard based on session.
 */
export default function PortalHomePage() {
  const router = useRouter();

  useEffect(() => {
    const run = async () => {
      const { data } = await supabase.auth.getSession();
      if (data.session) {
        router.replace("/portal/dashboard");
      } else {
        router.replace("/portal/login");
      }
    };
    void run();
  }, [router]);

  return <div className="min-h-screen flex items-center justify-center text-gray-500">Redirecting...</div>;
}
