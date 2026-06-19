"use client";

import { useState, useEffect, useCallback } from "react";
import { getSupabase } from "@/lib/supabase";
import { signInAnonymously, getSession, signOut, registerPasskey } from "@/lib/auth";
import { cacheAuthStatus, wasLoggedInRecently, clearAuthCache } from "@/lib/appCache";
import type { Session } from "@supabase/supabase-js";

export function useAuth() {
  const [session, setSession] = useState<Session | null>(null);
  const [loading, setLoading] = useState(!wasLoggedInRecently());
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    getSession()
      .then((s) => {
        setSession(s);
        setLoading(false);
        if (s) {
          cacheAuthStatus(true);
        } else {
          clearAuthCache();
        }
      })
      .catch(() => {
        setLoading(false);
      });

    const {
      data: { subscription },
    } = getSupabase().auth.onAuthStateChange((_event, session) => {
      setSession(session);
      if (session) {
        cacheAuthStatus(true);
      } else {
        clearAuthCache();
      }
    });

    return () => subscription.unsubscribe();
  }, []);

  const loginAnonymously = useCallback(async () => {
    setLoading(true);
    setError(null);
    try {
      const data = await signInAnonymously();
      setSession(data.session);
      if (data.session) cacheAuthStatus(true);
    } catch (err: any) {
      setError(err.message || "Failed to sign in");
    } finally {
      setLoading(false);
    }
  }, []);

  const setupPasskey = useCallback(async () => {
    setError(null);
    try {
      await registerPasskey();
      return true;
    } catch (err: any) {
      setError(err.message || "Failed to setup passkey");
      return false;
    }
  }, []);

  const logout = useCallback(async () => {
    await signOut();
    setSession(null);
    clearAuthCache();
  }, []);

  return { session, loading, error, loginAnonymously, setupPasskey, logout };
}
