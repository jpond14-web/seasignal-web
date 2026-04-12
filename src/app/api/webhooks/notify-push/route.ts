import { NextResponse } from "next/server";
import { sendPushNotification } from "@/lib/pushNotify";
import { createClient } from "@/lib/supabase/server";

/**
 * Webhook endpoint called by Supabase Database Webhook on notification INSERT.
 * Sends web push notifications for the newly created notification.
 *
 * Expected payload from Supabase webhook (type: INSERT):
 * { type: "INSERT", table: "notifications", record: { id, user_id, title, body, type, link } }
 */
export async function POST(request: Request) {
  // Verify webhook secret
  const authHeader = request.headers.get("authorization");
  const webhookSecret = process.env.WEBHOOK_SECRET;

  if (webhookSecret && authHeader !== `Bearer ${webhookSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  let payload: {
    type: string;
    table: string;
    record: {
      id: string;
      user_id: string;
      title: string;
      body: string | null;
      type: string;
      link: string | null;
    };
  };

  try {
    payload = await request.json();
  } catch {
    return NextResponse.json({ error: "Invalid JSON" }, { status: 400 });
  }

  if (payload.type !== "INSERT" || payload.table !== "notifications") {
    return NextResponse.json({ skipped: true });
  }

  const { user_id, title, body, link } = payload.record;

  // Look up the profile_id from the auth user_id
  const supabase = await createClient();
  const { data: profile } = await supabase
    .from("profiles")
    .select("id")
    .eq("auth_user_id", user_id)
    .single();

  if (!profile) {
    return NextResponse.json({ error: "Profile not found" }, { status: 404 });
  }

  // Check if user has push_notifications enabled
  const { data: settings } = await supabase
    .from("user_settings")
    .select("push_notifications")
    .eq("profile_id", profile.id)
    .single();

  if (settings && settings.push_notifications === false) {
    return NextResponse.json({ skipped: true, reason: "push_disabled" });
  }

  const result = await sendPushNotification(profile.id, {
    title,
    body: body ?? "",
    url: link ?? "/notifications",
  });

  return NextResponse.json({ ok: true, ...result });
}
