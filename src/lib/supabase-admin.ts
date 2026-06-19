import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let admin: SupabaseClient | null = null;

function getServiceRoleKey(): string | null {
  return process.env.SUPABASE_SERVICE_ROLE_KEY || null;
}

export function getAdminClient(): SupabaseClient | null {
  const key = getServiceRoleKey();
  if (!key) return null;
  if (admin) return admin;
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) return null;
  admin = createClient(url, key, {
    auth: {
      autoRefreshToken: false,
      persistSession: false,
    },
  });
  return admin;
}

export function hasAdminAccess(): boolean {
  return !!getServiceRoleKey();
}
