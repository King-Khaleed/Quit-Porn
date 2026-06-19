import { NextResponse } from "next/server";
import { getSupabase } from "@/lib/supabase";
import { getAdminClient, hasAdminAccess } from "@/lib/supabase-admin";

export async function POST() {
  try {
    const supabase = getSupabase();
    const { data: { session }, error: sessionError } = await supabase.auth.getSession();

    if (sessionError || !session?.user) {
      return NextResponse.json({ error: "Not authenticated" }, { status: 401 });
    }

    const userId = session.user.id;
    const deletions: string[] = [];
    const errors: string[] = [];

    const { error: subError } = await supabase
      .from("push_subscriptions")
      .delete()
      .eq("user_id", userId);

    if (subError) {
      errors.push(`push_subscriptions: ${subError.message}`);
    } else {
      deletions.push("push_subscriptions");
    }

    const admin = getAdminClient();
    if (admin) {
      const { error: profileError } = await admin
        .from("profiles")
        .delete()
        .eq("id", userId);

      if (profileError) {
        errors.push(`profiles: ${profileError.message}`);
      } else {
        deletions.push("profiles");
      }

      const { error: userError } = await admin.auth.admin.deleteUser(userId);

      if (userError) {
        errors.push(`auth user: ${userError.message}`);
      } else {
        deletions.push("auth_user");
      }
    }

    await supabase.auth.signOut();

    return NextResponse.json({
      success: true,
      deleted: deletions,
      errors: errors.length > 0 ? errors : undefined,
      note: hasAdminAccess()
        ? undefined
        : "Auth user not deleted — SUPABASE_SERVICE_ROLE_KEY not set. Client-side data must be cleared by the browser.",
    });
  } catch (err) {
    console.error("Delete account error:", err);
    return NextResponse.json({ error: "Account deletion failed" }, { status: 500 });
  }
}
