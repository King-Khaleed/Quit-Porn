import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAdminClient } from "@/lib/supabase-admin";

export async function POST() {
  try {
    const supabase = getSupabase();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const user = session.user;
    const payload: Record<string, unknown> = {
      user_id: user.id,
      created_at: user.created_at,
      last_sign_in: user.last_sign_in_at,
      push_subscriptions: [],
    };

    const { data: subs } = await supabase
      .from("push_subscriptions")
      .select("endpoint, created_at")
      .eq("user_id", user.id);

    if (subs) {
      payload.push_subscriptions = subs;
    }

    const admin = getAdminClient();
    if (admin) {
      const { data: profile } = await admin
        .from("profiles")
        .select("*")
        .eq("id", user.id)
        .single();

      if (profile) {
        payload.profile = profile;
      }
    }

    return NextResponse.json({
      exported_at: new Date().toISOString(),
      application: "QuitPorn",
      data: payload,
    });
  } catch (err) {
    console.error("Export error:", err);
    return NextResponse.json({ error: "Export failed" }, { status: 500 });
  }
}
