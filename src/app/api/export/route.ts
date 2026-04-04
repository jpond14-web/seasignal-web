import { createClient } from "@/lib/supabase/server";

export async function GET() {
  const supabase = await createClient();

  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) {
    return new Response(JSON.stringify({ error: "Unauthorized" }), {
      status: 401,
      headers: { "Content-Type": "application/json" },
    });
  }

  // Get the user's profile_id
  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) {
    return new Response(
      JSON.stringify({ error: "Profile not found" }),
      {
        status: 404,
        headers: { "Content-Type": "application/json" },
      }
    );
  }

  const profileId = profile.id;

  // Query all user data in parallel
  const [
    certificates,
    seaTimeRecords,
    crewHistory,
    reviews,
    payReports,
    incidentLogs,
  ] = await Promise.all([
    supabase.from("certificates").select("*").eq("profile_id", profileId),
    supabase.from("sea_time_records").select("*").eq("profile_id", profileId),
    supabase.from("crew_history").select("*").eq("profile_id", profileId),
    supabase.from("reviews").select("*").eq("profile_id", profileId),
    supabase.from("pay_reports").select("*").eq("profile_id", profileId),
    supabase.from("incident_logs").select("*").eq("profile_id", profileId),
  ]);

  // Tables that may not exist in the schema yet — wrap in try/catch
  let userSettingsResult: { data: unknown[] | null } = { data: null };
  try {
    // @ts-expect-error — user_settings table may not be in generated types yet
    userSettingsResult = await supabase.from("user_settings").select("*").eq("profile_id", profileId);
  } catch {
    // table may not exist yet
  }

  let forumPosts: { data: unknown[] | null } = { data: null };
  try {
    forumPosts = await supabase
      .from("forum_posts")
      .select("*")
      .eq("profile_id", profileId);
  } catch {
    // table may not exist yet
  }

  const exportDate = new Date().toISOString();
  const dateSlug = exportDate.split("T")[0];

  const exportData = {
    metadata: {
      exported_at: exportDate,
      user_id: user.id,
      format_version: "1.0",
    },
    profiles: profile,
    certificates: certificates.data || [],
    sea_time_records: seaTimeRecords.data || [],
    crew_history: crewHistory.data || [],
    reviews: reviews.data || [],
    pay_reports: payReports.data || [],
    incident_logs: incidentLogs.data || [],
    user_settings: userSettingsResult.data || [],
    forum_posts: forumPosts.data || [],
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="seasignal-export-${dateSlug}.json"`,
    },
  });
}
