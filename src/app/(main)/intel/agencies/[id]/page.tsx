import React from "react";
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
  const { data: agency } = await supabase
    .from("companies")
    .select("name, avg_rating, review_count, country")
    .eq("id", id)
    .eq("company_type", "manning_agency")
    .single();

  if (!agency) return { title: "Agency Not Found | SeaSignal" };

  const ratingText = agency.avg_rating
    ? ` Rated ${Number(agency.avg_rating).toFixed(1)}/5 from ${agency.review_count} review${agency.review_count !== 1 ? "s" : ""}.`
    : "";

  return {
    title: `${agency.name} Manning Agency Reviews | SeaSignal`,
    description: `Seafarer reviews for ${agency.name}${agency.country ? ` (${agency.country})` : ""}.${ratingText} See pay reliability, hidden fees, and deployment delay reports on SeaSignal.`,
  };
}

function formatEnum(val: string | null): string {
  if (!val) return "";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function AgencyDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: agency } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .eq("company_type", "manning_agency")
    .single();

  if (!agency) return notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("company_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const flags = (agency.pattern_flags as Record<string, unknown>) || {};

  return (
    <div className="max-w-4xl mx-auto">
      <Link href="/intel/agencies" className="text-sm text-slate-400 hover:text-slate-300 mb-4 inline-block">
        &larr; Agencies
      </Link>

      <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">{agency.name}</h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400">
                Manning Agency
              </span>
              {agency.country && (
                <span className="text-sm text-slate-400">{agency.country}</span>
              )}
            </div>
          </div>
          {agency.avg_rating && (
            <div className="text-right">
              <p className="text-3xl font-mono font-bold text-teal-400">
                {Number(agency.avg_rating).toFixed(1)}
              </p>
              <p className="text-xs text-slate-500">{agency.review_count} reviews</p>
            </div>
          )}
        </div>

        {/* Manning Agency Specific Scores */}
        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-navy-700">
          <ScoreCard label="Pay Reliability" value={agency.pay_reliability_score} />
          <ScoreCard label="Safety Culture" value={agency.safety_culture_score} />
          <ScoreCard label="Contract Accuracy" value={agency.contract_accuracy_score} />
        </div>

        {/* Manning Agency Flags */}
        {Boolean(flags.bait_and_switch || flags.hidden_fees || flags.deployment_delays) && (
          <div className="mt-4 pt-4 border-t border-navy-700">
            <h3 className="text-sm font-medium text-slate-300 mb-2">Reported Issues</h3>
            <div className="flex flex-wrap gap-2">
              {Boolean(flags.bait_and_switch) && (
                <span className="text-xs px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400">
                  Bait &amp; Switch Reports
                </span>
              )}
              {Boolean(flags.hidden_fees) && (
                <span className="text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400">
                  Hidden Fees Reported
                </span>
              )}
              {Boolean(flags.deployment_delays) && (
                <span className="text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400">
                  Deployment Delays
                </span>
              )}
            </div>
          </div>
        )}
      </div>

      <div className="flex gap-3 mb-6">
        <Link
          href={`/reviews/new?company=${id}`}
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
                    {r.is_anonymous ? "Anonymous" : "Seafarer"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.created_at ?? "").toLocaleDateString()}
                  </p>
                </div>
                {r.contract_period && (
                  <p className="text-xs text-slate-500 mb-2">Contract: {r.contract_period}</p>
                )}
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

function ScoreCard({ label, value }: { label: string; value: number | null }): React.JSX.Element {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-mono font-bold text-slate-100 mt-1">
        {value ? Number(value).toFixed(1) : "\u2014"}
      </p>
    </div>
  );
}
