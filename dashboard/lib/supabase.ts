/**
 * Supabase client wrapper for the dashboard
 */

import { createClient } from "@supabase/supabase-js";
import type { Database } from "./database.types";

const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL;
const supabaseAnonKey = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;

if (!supabaseUrl || !supabaseAnonKey) {
  throw new Error("Missing Supabase environment variables");
}

const dashboardSupabaseUrl: string = supabaseUrl;
const dashboardSupabaseAnonKey: string = supabaseAnonKey;

/**
 * Supabase client for browser/client-side operations
 * Uses anon key for client-side authentication
 */
export const supabase = createClient<Database>(dashboardSupabaseUrl, dashboardSupabaseAnonKey);

/**
 * Service role client for server-side operations
 * Only use on the server with service role key
 */
let supabaseServiceRole: ReturnType<typeof createClient<Database>> | null = null;

export function getSupabaseServiceRole() {
  if (!supabaseServiceRole) {
    const serviceRoleKey = process.env.SUPABASE_SERVICE_ROLE_KEY;
    if (!serviceRoleKey) {
      throw new Error("SUPABASE_SERVICE_ROLE_KEY not configured");
    }
    supabaseServiceRole = createClient<Database>(dashboardSupabaseUrl, serviceRoleKey);
  }
  return supabaseServiceRole;
}
