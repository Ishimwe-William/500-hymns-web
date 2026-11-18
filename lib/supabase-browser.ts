"use client";

import { createClient } from "@supabase/supabase-js";
import { isSupabaseConfigured, supabaseKey, supabaseUrl } from "@/lib/supabase";

let client: ReturnType<typeof createClient> | undefined;
export function getSupabaseBrowser() {
  if (!isSupabaseConfigured) return null;
  return client ??= createClient(supabaseUrl, supabaseKey, {
    auth: { flowType: "pkce", detectSessionInUrl: false, persistSession: true, autoRefreshToken: true },
  });
}
