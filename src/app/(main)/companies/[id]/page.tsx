import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FollowButton } from "./follow-button";

type Props = {
  params: Promise<{ id: string }>;
};

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("name, avg_rating, review_count")
    .eq("id", id)
    .single();

  if (!company) {
    return { title: "Company Not Found | SeaSignal" };
  }

  const ratingText = company.avg_rating
    ? ` Rated ${Number(company.avg_rating).toFixed(1)}/5 from ${company.review_count} review${company.review_count !== 1 ? "s" : ""}.`
    : "";

  return {
    title: `${company.name} Reviews | SeaSignal`,
    description: `Read seafarer reviews for ${company.name}.${ratingText} See pay reliability, safety culture, and contract accuracy ratings on SeaSignal.`,
  };
}

function formatEnum(val: string | null): string {
  if (!val) return "";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function payReliabilityColor(score: number): string {
  if (score >= 4) return "text-green-400";
  if (score >= 2.5) return "text-amber-400";
  return "text-red-400";
}

function payReliabilityBorderColor(score: number): string {
  if (score >= 4) return "border-green-500/30";
  if (score >= 2.5) return "border-amber-500/30";
  return "border-red-500/30";
}

function payReliabilityBgColor(score: number): string {
  if (score >= 4) return "bg-green-500/10";
  if (score >= 2.5) return "bg-amber-500/10";
  return "bg-red-500/10";
}

function ScoreCard({ label, value }: { label: string; value: number | null }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-xl font-mono font-bold text-slate-100 mt-1">
        {value ? Number(value).toFixed(1) : "\u2014"}
      </p>
    </div>
  );
}

export default async function PublicCompanyDetailPage({ params }: Props) {
  const { id } = await params;
  const supabase = await createClient();

  const { data: company } = await supabase
    .from("companies")
    .select("*")
    .eq("id", id)
    .single();

  if (!company) return notFound();

  const { data: reviews } = await supabase
    .from("reviews")
    .select("*")
    .eq("company_id", id)
    .eq("status", "published")
    .order("created_at", { ascending: false });

  const { data: vessels } = await supabase
    .from("vessels")
    .select("id, name, vessel_type, imo_number")
    .or(
      `owner_company_id.eq.${id},operator_company_id.eq.${id},manager_company_id.eq.${id}`
    )
    .order("name");

  const payScore = company.pay_reliability_score
    ? Number(company.pay_reliability_score)
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/companies"
        className="text-sm text-slate-400 hover:text-slate-300 mb-4 inline-block"
      >
        &larr; Companies
      </Link>

      {payScore !== null && (
        <div
          className={`rounded-lg p-5 mb-4 border ${payReliabilityBgColor(payScore)} ${payReliabilityBorderColor(payScore)}`}
        >
          <div className="flex items-center justify-between">
            <div>
              <h2 className="text-sm font-medium text-slate-300">
                Pay Reliability
              </h2>
              <p className="text-xs text-slate-500 mt-0.5">
                Do they pay on time and in full?
              </p>
            </div>
            <p
              className={`text-5xl font-mono font-bold ${payReliabilityColor(payScore)}`}
            >
              {payScore.toFixed(1)}
            </p>
          </div>
        </div>
      )}

      <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 mb-6">
        <div className="flex items-start justify-between">
          <div>
            <h1 className="text-2xl font-bold text-slate-100">
              {company.name}
            </h1>
            <div className="flex items-center gap-2 mt-2">
              <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400">
                {formatEnum(company.company_type)}
              </span>
              {company.country && (
                <span className="text-sm text-slate-400">
                  {company.country}
                </span>
              )}
            </div>
          </div>
          {company.avg_rating && (
            <div className="text-right">
              <p className="text-3xl font-mono font-bold text-teal-400">
                {Number(company.avg_rating).toFixed(1)}
              </p>
              <p className="text-xs text-slate-500">
                {company.review_count} reviews
              </p>
            </div>
          )}
        </div>

        <div className="grid grid-cols-3 gap-4 mt-6 pt-4 border-t border-navy-700">
          <ScoreCard label="Pay Reliability" value={company.pay_reliability_score} />
          <ScoreCard label="Safety Culture" value={company.safety_culture_score} />
          <ScoreCard
            label="Contract Accuracy"
            value={company.contract_accuracy_score}
          />
        </div>
      </div>

      <div className="flex gap-3 mb-6">
        <Link
          href={`/reviews/new?company=${id}`}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
        >
          Write Review
        </Link>
        <FollowButton companyId={id} />
      </div>

      {vessels && vessels.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Vessels</h2>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {vessels.map((v) => (
              <div
                key={v.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-3"
              >
                <p className="font-medium text-slate-100">{v.name}</p>
                <p className="text-xs text-slate-500">
                  IMO {v.imo_number} &middot; {formatEnum(v.vessel_type)}
                </p>
              </div>
            ))}
          </div>
        </div>
      )}

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
              <div
                key={r.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-4"
              >
                <div className="flex items-center justify-between mb-2">
                  <p className="text-sm text-slate-300">
                    {r.is_anonymous ? "Anonymous" : "Seafarer"}
                  </p>
                  <p className="text-xs text-slate-500">
                    {new Date(r.created_at).toLocaleDateString()}
                  </p>
                </div>
                {r.contract_period && (
                  <p className="text-xs text-slate-500 mb-2">
                    Contract: {r.contract_period}
                  </p>
                )}
                {ratings && (
                  <div className="flex flex-wrap gap-3 mb-3">
                    {Object.entries(ratings).map(([key, val]) => (
                      <div key={key} className="text-center">
                        <p className="text-xs text-slate-500">
                          {formatEnum(key)}
                        </p>
                        <p className="text-sm font-mono text-teal-400">
                          {val}/5
                        </p>
                      </div>
                    ))}
                  </div>
                )}
                {r.narrative && (
                  <p className="text-sm text-slate-300 leading-relaxed">
                    {r.narrative}
                  </p>
                )}
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
