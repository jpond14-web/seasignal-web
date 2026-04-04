import { createClient } from "@/lib/supabase/server";
import {
  sendEmail,
  newMessageEmail,
  certExpiryEmail,
} from "@/lib/email";

type NotificationType = "cert_expiry" | "message" | "review";

interface NotificationBody {
  type: NotificationType;
  profileId: string;
  /** Extra payload — shape depends on `type`. */
  data?: Record<string, unknown>;
}

/**
 * Map notification types to the user_settings column that controls them.
 */
const NOTIFICATION_PREF_MAP: Record<NotificationType, string> = {
  cert_expiry: "email_cert_expiry",
  message: "email_messages",
  review: "email_messages", // reviews use the general email-messages toggle
};

export async function POST(request: Request) {
  const supabase = await createClient();

  // Authenticate
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  // Parse & validate body
  let body: NotificationBody;
  try {
    body = await request.json();
  } catch {
    return Response.json(
      { error: "Invalid JSON body" },
      { status: 400 }
    );
  }

  const { type, profileId, data } = body;

  if (!type || !profileId) {
    return Response.json(
      { error: "Missing required fields: type, profileId" },
      { status: 400 }
    );
  }

  const validTypes: NotificationType[] = ["cert_expiry", "message", "review"];
  if (!validTypes.includes(type)) {
    return Response.json(
      { error: `Invalid type. Must be one of: ${validTypes.join(", ")}` },
      { status: 400 }
    );
  }

  // -----------------------------------------------------------------------
  // Check notification preferences from user_settings
  // -----------------------------------------------------------------------
  const prefColumn = NOTIFICATION_PREF_MAP[type];
  let prefsEnabled = true;

  try {
    const { data: settings } = await supabase
      .from("user_settings")
      .select(prefColumn)
      .eq("profile_id", profileId)
      .single();

    if (settings && prefColumn in settings) {
      prefsEnabled = (settings as unknown as Record<string, unknown>)[prefColumn] !== false;
    }
    // If no settings row exists, default to enabled
  } catch {
    // default to enabled if the query fails
  }

  if (!prefsEnabled) {
    return Response.json(
      { sent: false, reason: "disabled" },
      { status: 200 }
    );
  }

  // -----------------------------------------------------------------------
  // Resolve the recipient's email from the auth user
  // -----------------------------------------------------------------------
  const recipientEmail = user.email;
  if (!recipientEmail) {
    return Response.json(
      { sent: false, reason: "no_email" },
      { status: 200 }
    );
  }

  // -----------------------------------------------------------------------
  // Build the email based on notification type
  // -----------------------------------------------------------------------
  let subject: string;
  let html: string;

  switch (type) {
    case "message": {
      const senderName = String(data?.senderName ?? "Someone");
      const channelName = String(data?.channelName ?? "a channel");
      const preview = String(data?.preview ?? "");
      subject = `New message from ${senderName} in ${channelName}`;
      html = newMessageEmail({ senderName, channelName, preview });
      break;
    }

    case "cert_expiry": {
      const certTitle = String(data?.certTitle ?? "A certificate");
      const expiryDate = String(data?.expiryDate ?? "");
      const daysLeft = Number(data?.daysLeft ?? 0);
      subject = `Certificate expiring: ${certTitle} (${daysLeft} days left)`;
      html = certExpiryEmail({ certTitle, expiryDate, daysLeft });
      break;
    }

    case "review":
    default: {
      subject = "You have a new notification on SeaSignal";
      html = `<p>You have a new notification. <a href="https://seasignal.com">View on SeaSignal</a></p>`;
      break;
    }
  }

  // -----------------------------------------------------------------------
  // Send
  // -----------------------------------------------------------------------
  const result = await sendEmail({ to: recipientEmail, subject, html });

  if (!result.success) {
    return Response.json(
      { sent: false, error: result.error },
      { status: 502 }
    );
  }

  return Response.json({ sent: true }, { status: 200 });
}
