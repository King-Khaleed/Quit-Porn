import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const body = await request.json();

    const alertName = body.alert_name;
    const passthrough = body.passthrough ? JSON.parse(body.passthrough) : null;
    const userId = passthrough?.userId;

    if (!userId) {
      return NextResponse.json({ success: false, error: "No userId in passthrough" }, { status: 400 });
    }

    const supabase = getSupabase();

    if (alertName === "subscription_created" || alertName === "subscription_updated") {
      const cancelAt = body.cancellation_effective_date || null;

      if (cancelAt) {
        await supabase
          .from("profiles")
          .update({ premium_expires_at: cancelAt })
          .eq("id", userId);
      } else {
        const expiresAt = body.plan === "yearly"
          ? new Date(Date.now() + 365 * 86400000).toISOString()
          : new Date(Date.now() + 30 * 86400000).toISOString();
        await supabase
          .from("profiles")
          .update({ premium_expires_at: expiresAt })
          .eq("id", userId);
      }
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json({ success: false }, { status: 500 });
  }
}
