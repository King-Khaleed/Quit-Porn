import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";

export async function POST(request: Request) {
  try {
    const subscription = await request.json();

    if (!subscription || !subscription.endpoint) {
      return NextResponse.json(
        { error: "Invalid subscription" },
        { status: 400 }
      );
    }

    const supabase = getSupabase();
    const { data: { session } } = await supabase.auth.getSession();

    if (!session?.user) {
      const { error } = await supabase.from("push_subscriptions").insert({
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || "",
        auth: subscription.keys?.auth || "",
      });
      if (error) console.error("Failed to save subscription:", error);
    } else {
      const { error } = await supabase.from("push_subscriptions").insert({
        user_id: session.user.id,
        endpoint: subscription.endpoint,
        p256dh: subscription.keys?.p256dh || "",
        auth: subscription.keys?.auth || "",
      });
      if (error) console.error("Failed to save subscription:", error);
    }

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to process subscription" },
      { status: 500 }
    );
  }
}

export async function DELETE(request: Request) {
  try {
    const { endpoint } = await request.json();
    if (!endpoint) {
      return NextResponse.json({ error: "Missing endpoint" }, { status: 400 });
    }

    const supabase = getSupabase();
    await supabase.from("push_subscriptions").delete().eq("endpoint", endpoint);

    return NextResponse.json({ success: true });
  } catch {
    return NextResponse.json(
      { error: "Failed to unsubscribe" },
      { status: 500 }
    );
  }
}
