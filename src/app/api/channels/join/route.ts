import { createClient } from "@/lib/supabase/server";
import { checkRateLimit, rateLimitKey } from "@/lib/rateLimit";

export async function POST(request: Request) {
  const rl = checkRateLimit(rateLimitKey(request, "join"), { limit: 30, windowSeconds: 60 });
  if (!rl.allowed) {
    return Response.json({ error: "Too many requests" }, { status: 429, headers: rl.headers });
  }

  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return Response.json({ error: "Unauthorized" }, { status: 401 });
  }

  let body: { conversationId: string };
  try {
    body = await request.json();
  } catch {
    return Response.json({ error: "Invalid JSON" }, { status: 400 });
  }

  const { conversationId } = body;
  if (!conversationId) {
    return Response.json({ error: "conversationId required" }, { status: 400 });
  }

  // Get user profile
  const { data: profile } = await supabase
    .from("profiles")
    .select("id, created_at")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) {
    return Response.json({ error: "Profile not found" }, { status: 404 });
  }

  // Get conversation details including access_mode and max_members
  const { data: conversation } = await supabase
    .from("conversations")
    .select("id, type, context_vessel_id, context_company_id, access_mode, max_members")
    .eq("id", conversationId)
    .single();

  if (!conversation) {
    return Response.json({ error: "Channel not found" }, { status: 404 });
  }

  const accessMode = conversation.access_mode || "open";

  // Check if already a member
  const { data: existing } = await supabase
    .from("conversation_members")
    .select("id")
    .eq("conversation_id", conversationId)
    .eq("profile_id", profile.id)
    .single();

  if (existing) {
    return Response.json({ ok: true, alreadyMember: true });
  }

  // --- Max Members Enforcement ---
  if (conversation.max_members && conversation.max_members > 0) {
    const { count } = await supabase
      .from("conversation_members")
      .select("id", { count: "exact", head: true })
      .eq("conversation_id", conversationId);

    if (count !== null && count >= conversation.max_members) {
      return Response.json(
        { error: "This channel has reached its maximum member limit." },
        { status: 403 }
      );
    }
  }

  const convType = conversation.type;

  // --- Access Control ---

  // Account age: crew-verified channels require 24h old accounts
  if (accessMode === "crew_verified") {
    const accountAge = Date.now() - new Date(profile.created_at!).getTime();
    const ONE_DAY = 24 * 60 * 60 * 1000;
    if (accountAge < ONE_DAY) {
      return Response.json(
        { error: "Your account must be at least 24 hours old to join crew-verified channels." },
        { status: 403 }
      );
    }
  }

  // Vessel channel: must have crew_history on that vessel
  if (convType === "vessel_channel" && conversation.context_vessel_id) {
    const { data: crewRecord } = await supabase
      .from("crew_history")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("vessel_id", conversation.context_vessel_id)
      .limit(1)
      .single();

    if (!crewRecord) {
      return Response.json(
        { error: "You must have crew history on this vessel to join its channel. Add your crew history in your profile first." },
        { status: 403 }
      );
    }
  }

  // Company channel: must have crew_history with that company
  if (convType === "company_channel" && conversation.context_company_id) {
    const { data: crewRecord } = await supabase
      .from("crew_history")
      .select("id")
      .eq("profile_id", profile.id)
      .eq("company_id", conversation.context_company_id)
      .limit(1)
      .single();

    if (!crewRecord) {
      return Response.json(
        { error: "You must have worked for this company to join its channel. Add your crew history first." },
        { status: 403 }
      );
    }
  }

  // Invite-only channels
  if (accessMode === "invite_only") {
    return Response.json(
      { error: "This channel is invite-only. Ask an existing member to invite you." },
      { status: 403 }
    );
  }

  // Port channels and open channels: no restrictions

  // Join the channel
  const { error } = await supabase.from("conversation_members").insert({
    conversation_id: conversationId,
    profile_id: profile.id,
    role: "member",
  });

  if (error) {
    return Response.json({ error: error.message }, { status: 500 });
  }

  return Response.json({ ok: true });
}
