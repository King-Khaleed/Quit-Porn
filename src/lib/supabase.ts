import { createClient } from "@supabase/supabase-js";
import type { SupabaseClient } from "@supabase/supabase-js";

let client: SupabaseClient | null = null;

function getSupabaseUrl(): string {
  const url = process.env.NEXT_PUBLIC_SUPABASE_URL;
  if (!url) throw new Error("supabaseUrl is required");
  return url;
}

function getSupabaseKey(): string {
  const key = process.env.NEXT_PUBLIC_SUPABASE_ANON_KEY;
  if (!key) throw new Error("supabaseAnonKey is required");
  return key;
}

export function getSupabase(): SupabaseClient {
  if (client) return client;
  client = createClient(getSupabaseUrl(), getSupabaseKey(), {
    auth: {
      persistSession: true,
      autoRefreshToken: true,
      detectSessionInUrl: true,
      storage: {
        getItem: (key) => {
          if (typeof window === "undefined") return null;
          try {
            return localStorage.getItem(key);
          } catch {
            return null;
          }
        },
        setItem: (key, value) => {
          if (typeof window === "undefined") return;
          try {
            localStorage.setItem(key, value);
          } catch {}
        },
        removeItem: (key) => {
          if (typeof window === "undefined") return;
          try {
            localStorage.removeItem(key);
          } catch {}
        },
      },
    },
  });
  return client;
}
