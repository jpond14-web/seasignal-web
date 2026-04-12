import { createClient } from "@/lib/supabase/server";
import { NextResponse } from "next/server";

/**
 * Cron job: auto-publish pending Signal Flares whose batch_release_at has passed.
 * Runs every Sunday at 00:15 UTC via Vercel Cron.
 *
 * The status change triggers notify_followers_on_flare_publish() in the DB,
 * which inserts notifications for company followers.
 */
export async function GET(request: Request) {
  // Verify the request is from Vercel Cron (or has the correct secret)
  const authHeader = request.headers.get("authorization");
  const cronSecret = process.env.CRON_SECRET;

  if (cronSecret && authHeader !== `Bearer ${cronSecret}`) {
    return NextResponse.json({ error: "Unauthorized" }, { status: 401 });
  }

  const supabase = await createClient();
  const now = new Date().toISOString();

  // Find all pending flares whose batch_release_at has passed
  const { data: pendingFlares, error: fetchError } = await supabase
    .from("signal_flares")
    .select("id")
    .eq("status", "pending")
    .lte("batch_release_at", now);

  if (fetchError) {
    return NextResponse.json(
      { error: fetchError.message },
      { status: 500 }
    );
  }

  if (!pendingFlares || pendingFlares.length === 0) {
    return NextResponse.json({ published: 0 });
  }

  const ids = pendingFlares.map((f) => f.id);

  // Update each flare individually to trigger the row-level notification trigger
  let published = 0;
  let errors = 0;

  for (const id of ids) {
    const { error: updateError } = await supabase
      .from("signal_flares")
      .update({ status: "published" })
      .eq("id", id);

    if (updateError) {
      errors++;
    } else {
      published++;
    }
  }

  return NextResponse.json({ published, errors, total: ids.length });
}
