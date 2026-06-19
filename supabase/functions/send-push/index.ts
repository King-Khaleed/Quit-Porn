import { serve } from "https://deno.land/std@0.224.0/http/server.ts";
import webpush from "npm:web-push@3.6.7";

interface NotificationPayload {
  subscription: {
    endpoint: string;
    keys: {
      p256dh: string;
      auth: string;
    };
  };
  title: string;
  body: string;
  url?: string;
}

serve(async (req) => {
  try {
    const payload: NotificationPayload = await req.json();

    if (!payload.subscription || !payload.title) {
      return new Response(
        JSON.stringify({ error: "Missing subscription or title" }),
        { status: 400, headers: { "Content-Type": "application/json" } }
      );
    }

    const vapidPrivateKey = Deno.env.get("VAPID_PRIVATE_KEY");
    const vapidPublicKey = Deno.env.get("VAPID_PUBLIC_KEY");

    if (!vapidPrivateKey || !vapidPublicKey) {
      return new Response(
        JSON.stringify({ error: "VAPID keys not configured" }),
        { status: 500, headers: { "Content-Type": "application/json" } }
      );
    }

    webpush.setVapidDetails(
      "mailto:support@quitporn.app",
      vapidPublicKey,
      vapidPrivateKey
    );

    const pushSubscription = {
      endpoint: payload.subscription.endpoint,
      keys: {
        p256dh: payload.subscription.keys.p256dh,
        auth: payload.subscription.keys.auth,
      },
    };

    const notificationPayload = JSON.stringify({
      title: payload.title,
      body: payload.body,
      url: payload.url || "/",
    });

    try {
      const result = await webpush.sendNotification(
        pushSubscription,
        notificationPayload,
        { TTL: 86400 }
      );

      return new Response(
        JSON.stringify({ success: true, status: result.statusCode }),
        { status: 200, headers: { "Content-Type": "application/json" } }
      );
    } catch (err: unknown) {
      if (err instanceof webpush.WebPushError) {
        if (err.statusCode === 410) {
          return new Response(
            JSON.stringify({ success: false, expired: true, status: 410 }),
            { status: 410, headers: { "Content-Type": "application/json" } }
          );
        }
        return new Response(
          JSON.stringify({ success: false, error: err.message, status: err.statusCode }),
          { status: 502, headers: { "Content-Type": "application/json" } }
        );
      }
      throw err;
    }
  } catch (error) {
    return new Response(
      JSON.stringify({
        error: error instanceof Error ? error.message : "Unknown error",
      }),
      { status: 500, headers: { "Content-Type": "application/json" } }
    );
  }
});