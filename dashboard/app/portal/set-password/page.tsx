"use client";

import { FormEvent, useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import { supabase } from "@/lib/supabase";

/**
 * First-login password setup page.
 */
export default function PortalSetPasswordPage() {
  const router = useRouter();
  const [password, setPassword] = useState("");
  const [confirmPassword, setConfirmPassword] = useState("");
  const [error, setError] = useState("");
  const [email, setEmail] = useState("");

  useEffect(() => {
    const load = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        if (!data.user?.email) {
          router.push("/portal/login");
          return;
        }
        setEmail(data.user.email);
      } catch {
        // Ignore auth lock race condition errors - will retry
      }
    };
    void load();
  }, [router]);

  const onSubmit = async (e: FormEvent) => {
    e.preventDefault();
    setError("");
    if (password.length < 8) {
      setError("Password must be at least 8 characters.");
      return;
    }
    if (password !== confirmPassword) {
      setError("Passwords do not match.");
      return;
    }

    const { error: authErr } = await supabase.auth.updateUser({ password });
    if (authErr) {
      setError(authErr.message);
      return;
    }

    if (email) {
      await supabase.from("users").update({ password_set: true }).eq("email", email);
    }

    router.push("/portal/dashboard");
  };

  return (
    <div className="min-h-screen flex items-center justify-center px-4">
      <form onSubmit={onSubmit} className="w-full max-w-md bg-white rounded-xl shadow p-6 space-y-4">
        <h1 className="text-2xl font-bold text-gray-900">Set Your Password</h1>
        <p className="text-sm text-gray-500">Complete onboarding before using the portal.</p>
        {error && <div className="text-sm text-red-700 bg-red-50 border border-red-200 rounded p-2">{error}</div>}
        <input type="password" value={password} onChange={(e) => setPassword(e.target.value)} placeholder="New password" className="w-full border rounded px-3 py-2" required />
        <input type="password" value={confirmPassword} onChange={(e) => setConfirmPassword(e.target.value)} placeholder="Confirm password" className="w-full border rounded px-3 py-2" required />
        <button className="w-full py-2 rounded bg-blue-600 text-white hover:bg-blue-700">Save password</button>
      </form>
    </div>
  );
}
