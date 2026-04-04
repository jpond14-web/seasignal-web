import { createClient } from "@/lib/supabase/server";
import { sendPushNotification } from "@/lib/pushNotify";

export async function POST(request: Request) {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { profileId: string; title: string; body: string; url?: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { profileId, title, body: msgBody, url } = body;

  if (!profileId || !title || !msgBody) {
    return Response.json(
      { error: "profileId, title, and body are required" },
      { status: 400 },
    );
  }

  // Ownership check: only send push to yourself (or be admin)
  const { data: callerProfile } = await supabase
    .from("profiles")
    .select("id, is_admin")
    .eq("auth_user_id", user.id)
    .single();

  if (!callerProfile) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  // Non-admins can only push to their own profile
  if (callerProfile.id !== profileId && !callerProfile.is_admin) {
    return Response.json(
      { error: "You can only send push notifications to your own profile" },
      { status: 403 },
    );
  }

  const result = await sendPushNotification(profileId, {
    title,
    body: msgBody,
    url,
  });

  return Response.json({ ok: true, ...result });
}
