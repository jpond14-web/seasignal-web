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

  const result = await sendPushNotification(profileId, {
    title,
    body: msgBody,
    url,
  });

  return Response.json({ ok: true, ...result });
}
