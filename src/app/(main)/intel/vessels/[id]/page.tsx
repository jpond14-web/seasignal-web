import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();
  const { data: vessel } = await supabase
    .from("vessels")
    .select("name, imo_number, vessel_type, avg_rating, review_count")
    .eq("id", id)
    .single();

  if (!vessel) return { title: "Vessel Not Found | SeaSignal" };

  const ratingText = vessel.avg_rating
    ? ` Rated ${Number(vessel.avg_rating).toFixed(1)}/5 from ${vessel.review_count} review${vessel.review_count !== 1 ? "s" : ""}.`
    : "";

  return {
    title: `${vessel.name} (IMO ${vessel.imo_number}) Reviews | SeaSignal`,
    description: `Seafarer reviews for ${vessel.name}, ${formatEnum(vessel.vessel_type)}.${ratingText} See crew safety, conditions, and management ratings on SeaSignal.`,
  };
}

function formatEnum(val: string | null): string {
  if (!val) return "";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function VesselDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: vessel } = await supabase
    .from("vessels")
    .select("*")
    .eq("id", id)
    .single();

  if (!vessel) return notFound();

  // Fetch linked companies
  const companyIds = [vessel.owner_company_id, vessel.operator_company_id, vessel.manager_company_id].filter((cid): cid is string => cid !== null);
  let companies: Record<string, { id: string; name: string }> = {};
  if (companyIds.length > 0) {
    const { data } = await supabase
      .from("companies")
      .select("id, name")
      .in("id", companyIds);
    if (data) {
      companies = Object.fromEntries(data.map((c) => [c.id, c]));
    }
  }

  const { data: reviews } = await supabase
    .from("reviews")
    .select("id, is_anonymous, created_at, ratings, narrative, review_type")
    .eq("vessel_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  // Witness Network: check for safety signals
  const { data: safetySignalRaw } = await supabase.rpc("check_vessel_safety_signals", {
    p_vessel_id: id,
    p_months_back: 12,
  });

  const safetySignal = safetySignalRaw as { has_pattern?: boolean } | null;
  const hasPattern = safetySignal?.has_pattern === true;

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/intel/vessels" className="text-sm text-slate-400 hover:text-slate-300 mb-4 inline-block">
        &larr; Vessels
      </Link>

      {/* Safety Signal Banner */}
      {hasPattern && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-4 mb-4">
          <div className="flex items-start gap-3">
            <svg className="w-5 h-5 text-red-400 flex-shrink-0 mt-0.5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M12 9v2m0 4h.01m-6.938 4h13.856c1.54 0 2.502-1.667 1.732-2.5L13.732 4c-.77-.833-1.964-.833-2.732 0L4.082 16.5c-.77.833.192 2.5 1.732 2.5z" />
            </svg>
            <div>
              <p className="text-sm font-medium text-red-400">Safety Signals Detected</p>
              <p className="text-xs text-slate-400 mt-1">
                Multiple verified crew members have reported safety concerns about this vessel
                in the past 12 months. Your identity is never revealed in these signals.
              </p>
            </div>
          </div>
        </div>
      )}

      <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{vessel.name}</h1>
            <div className="flex items-center gap-2 mt-2 flex-wrap">
              <span className="text-xs font-mono text-slate-400">IMO {vessel.imo_number}</span>
              <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400">
                {formatEnum(vessel.vessel_type)}
              </span>
              {vessel.flag_state && (
                <span className="text-xs text-slate-500">{vessel.flag_state}</span>
              )}
            </div>
          </div>
          {vessel.avg_rating && (
            <div className="text-right">
              <p className="text-3xl font-mono font-bold text-teal-400">
                {Number(vessel.avg_rating).toFixed(1)}
              </p>
              <p className="text-xs text-slate-500">{vessel.review_count} reviews</p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-navy-700">
          {vessel.dwt && (
            <div>
              <p className="text-xs text-slate-500">DWT</p>
              <p className="text-sm font-mono text-slate-200">{vessel.dwt.toLocaleString()}</p>
            </div>
          )}
          {vessel.built_year && (
            <div>
              <p className="text-xs text-slate-500">Built</p>
              <p className="text-sm font-mono text-slate-200">{vessel.built_year}</p>
            </div>
          )}
          {vessel.owner_company_id && companies[vessel.owner_company_id] && (
            <div>
              <p className="text-xs text-slate-500">Owner</p>
              <Link href={`/intel/companies/${vessel.owner_company_id}`} className="text-sm text-teal-400 hover:text-teal-300">
                {companies[vessel.owner_company_id].name}
              </Link>
            </div>
          )}
          {vessel.operator_company_id && companies[vessel.operator_company_id] && (
            <div>
              <p className="text-xs text-slate-500">Operator</p>
              <Link href={`/intel/companies/${vessel.operator_company_id}`} className="text-sm text-teal-400 hover:text-teal-300">
                {companies[vessel.operator_company_id].name}
              </Link>
            </div>
          )}
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Link
          href={`/reviews/new?vessel=${id}`}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
        >
          Write Review
        </Link>
      </div>

      <h2 className="text-lg font-semibold mb-3">Reviews</h2>
      {!reviews || reviews.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 text-center">
          <p className="text-slate-400">No reviews yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {reviews.map((r) => {
            const ratings = r.ratings as Record<string, number> | null;
            return (
              <div key={r.id} className="bg-navy-900 border border-navy-700 rounded-lg p-4">
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-300">
                    {r.is_anonymous
                      ? "Anonymous"
                      : "Seafarer"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.created_at ?? "").toLocaleDateString()}
                  </p>
                </div>
                {ratings && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {Object.entries(ratings).map(([key, val]) => (
                      <div key={key} className="text-center">
                        <p className="text-xs text-slate-500">{formatEnum(key)}</p>
                        <p className="text-sm font-mono text-teal-400">{val}/5</p>
                      </div>
                    ))}
                  </div>
                )}
                {r.narrative && (
                  <p className="text-sm text-slate-300 leading-relaxed">{r.narrative}</p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
