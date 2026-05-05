"use client";

import { useEffect, useState } from "react";
import { supabase } from "@/lib/supabase";

interface UserTopbarProps {
  greeting?: boolean;
}

export default function UserTopbar({ greeting = true }: UserTopbarProps) {
  const [userEmail, setUserEmail] = useState<string | null>(null);

  useEffect(() => {
    const getUser = async () => {
      try {
        const { data } = await supabase.auth.getUser();
        setUserEmail(data.user?.email || null);
      } catch {
        // Ignore auth lock race condition errors
      }
    };
    getUser();
  }, []);

  const userName = userEmail?.split("@")[0] || "User";

  return (
    <header className="h-16 bg-white border-b border-gray-200 flex items-center justify-between px-8 sticky top-0 z-40">
      {/* Greeting */}
      <div>
        {greeting && (
          <div className="flex items-center gap-2">
            <span className="text-2xl">👋</span>
            <h1 className="text-xl font-semibold text-gray-800">
              Hey, <span className="text-primary-600">{userName}</span>
            </h1>
          </div>
        )}
      </div>

      {/* Right side - placeholder for future features */}
      <div className="flex items-center gap-4">
      </div>
    </header>
  );
}
