import { type NextRequest } from "next/server";
import { createClient } from "@/lib/supabase/server";

const APP_VERSION = "0.1.0";

/**
 * Convert an array of objects to CSV text.
 * Handles quoting of values that contain commas, quotes, or newlines.
 */
function toCsv(rows: Record<string, unknown>[]): string {
  if (rows.length === 0) return "";

  const headers = Object.keys(rows[0]);

  const escapeCell = (value: unknown): string => {
    const str = value === null || value === undefined ? "" : String(value);
    if (str.includes(",") || str.includes('"') || str.includes("\n")) {
      return `"${str.replace(/"/g, '""')}"`;
    }
    return str;
  };

  const lines = [
    headers.map(escapeCell).join(","),
    ...rows.map((row) => headers.map((h) => escapeCell(row[h])).join(",")),
  ];

  return lines.join("\n");
}

export async function GET(request: NextRequest) {
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
    return new Response(JSON.stringify({ error: "Profile not found" }), {
      status: 404,
      headers: { "Content-Type": "application/json" },
    });
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

  // forum_posts
  const forumPosts = await supabase
    .from("forum_posts")
    .select("*")
    .eq("profile_id", profileId);

  const exportDate = new Date().toISOString();
  const dateSlug = exportDate.split("T")[0];

  // Build tables map for both formats
  const tables: Record<string, unknown[]> = {
    certificates: (certificates.data || []) as Record<string, unknown>[],
    sea_time_records: (seaTimeRecords.data || []) as Record<string, unknown>[],
    crew_history: (crewHistory.data || []) as Record<string, unknown>[],
    reviews: (reviews.data || []) as Record<string, unknown>[],
    pay_reports: (payReports.data || []) as Record<string, unknown>[],
    incident_logs: (incidentLogs.data || []) as Record<string, unknown>[],
    forum_posts: (forumPosts.data || []) as Record<string, unknown>[],
  };

  // Record counts for metadata
  const recordCounts: Record<string, number> = {};
  for (const [key, value] of Object.entries(tables)) {
    recordCounts[key] = (value as unknown[]).length;
  }

  const format = request.nextUrl.searchParams.get("format") || "json";

  if (format === "csv") {
    // Build a single response with each table as a labelled CSV section
    const sections: string[] = [];

    // Profile section (single row wrapped in array)
    sections.push(`# profiles`);
    sections.push(toCsv([profile as Record<string, unknown>]));

    for (const [tableName, rows] of Object.entries(tables)) {
      sections.push(`\n# ${tableName} (${(rows as unknown[]).length} records)`);
      const csv = toCsv(rows as Record<string, unknown>[]);
      sections.push(csv || "(no records)");
    }

    // Prepend metadata comment
    const header = [
      `# SeaSignal Data Export`,
      `# exported_at: ${exportDate}`,
      `# user_id: ${user.id}`,
      `# app_version: ${APP_VERSION}`,
      `# format: csv`,
      ``,
    ].join("\n");

    return new Response(header + sections.join("\n"), {
      status: 200,
      headers: {
        "Content-Type": "text/csv; charset=utf-8",
        "Content-Disposition": `attachment; filename="seasignal-export-${dateSlug}.csv"`,
      },
    });
  }

  // Default: JSON format with enhanced metadata
  const exportData = {
    metadata: {
      exported_at: exportDate,
      user_id: user.id,
      format_version: "1.1",
      app_version: APP_VERSION,
      record_counts: recordCounts,
    },
    profiles: profile,
    ...tables,
  };

  return new Response(JSON.stringify(exportData, null, 2), {
    status: 200,
    headers: {
      "Content-Type": "application/json",
      "Content-Disposition": `attachment; filename="seasignal-export-${dateSlug}.json"`,
    },
  });
}
