// Server-side push notification utility — do NOT import from client components
import webpush from "web-push";
import { createClient } from "@/lib/supabase/server";

const VAPID_PUBLIC_KEY =
  process.env.NEXT_PUBLIC_VAPID_PUBLIC_KEY ??
  "BDz0EH_Vu60-4ddqvMu8_aur1oY9KbZocLGoDvL8VhpS09KlqLy_lz8Za1yzoAsLXodWOhD7h4jnDUE0woThCP0";

const VAPID_PRIVATE_KEY = process.env.VAPID_PRIVATE_KEY ?? "";

if (VAPID_PRIVATE_KEY) {
  webpush.setVapidDetails(
    "mailto:support@seasignal.app",
    VAPID_PUBLIC_KEY,
    VAPID_PRIVATE_KEY,
  );
}

interface PushPayload {
  title: string;
  body: string;
  url?: string;
}

/**
 * Send a push notification to all subscriptions belonging to a profile.
 * Stale subscriptions (410 Gone) are automatically cleaned up.
 */
export async function sendPushNotification(
  profileId: string,
  payload: PushPayload,
): Promise<{ sent: number; failed: number }> {
  if (!VAPID_PRIVATE_KEY) {
    // VAPID key not configured — silently skip push in dev
    return { sent: 0, failed: 0 };
  }

  const supabase = await createClient();

  const { data: subscriptions, error } = await supabase
    .from("push_subscriptions")
    .select("id, endpoint, p256dh, auth")
    .eq("profile_id", profileId);

  if (error || !subscriptions || subscriptions.length === 0) {
    return { sent: 0, failed: 0 };
  }

  const notificationPayload = JSON.stringify({
    title: payload.title,
    body: payload.body,
    url: payload.url ?? "/messages",
    tag: `msg-${Date.now()}`,
  });

  let sent = 0;
  let failed = 0;
  const staleIds: string[] = [];

  await Promise.allSettled(
    subscriptions.map(async (sub) => {
      try {
        await webpush.sendNotification(
          {
            endpoint: sub.endpoint,
            keys: {
              p256dh: sub.p256dh,
              auth: sub.auth,
            },
          },
          notificationPayload,
        );
        sent++;
      } catch (err: unknown) {
        failed++;
        // 410 Gone or 404 means the subscription is no longer valid
        const statusCode =
          err && typeof err === "object" && "statusCode" in err
            ? (err as { statusCode: number }).statusCode
            : 0;
        if (statusCode === 410 || statusCode === 404) {
          staleIds.push(sub.id);
        }
      }
    }),
  );

  // Clean up stale subscriptions
  if (staleIds.length > 0) {
    await supabase
      .from("push_subscriptions")
      .delete()
      .in("id", staleIds);
  }

  return { sent, failed };
}
