import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";
import { notFound } from "next/navigation";
import { FollowButton } from "./follow-button";
import { formatDate } from "@/lib/format";

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
    .select("id, is_anonymous, created_at, contract_period, ratings, narrative, review_type")
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

  const { data: signalIssues } = await supabase
    .from("signal_issues")
    .select(
      "id, category, stage, flare_count, corroboration_total, vessel_count, first_reported_at, resolution_date, resolution_description, company_contacted_at, is_recurring"
    )
    .eq("company_id", id)
    .neq("stage", "monitoring")
    .order("last_reported_at", { ascending: false });

  // Aggregated Signal Flare stats for this company
  const { data: publishedFlares } = await supabase
    .from("signal_flares")
    .select("id, category, severity, signal_flare_corroborations(id)")
    .eq("company_id", id)
    .eq("status", "published")
    .lte("batch_release_at", new Date().toISOString());

  const payScore = company.pay_reliability_score
    ? Number(company.pay_reliability_score)
    : null;

  return (
    <div className="max-w-4xl mx-auto">
      <Link
        href="/intel/companies"
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
        <p className="text-xs text-slate-600 mt-3 text-center">
          Scores are from 1 to 5 based on seafarer reviews.{" "}
          <span className="text-green-400">4+</span> Good &middot;{" "}
          <span className="text-amber-400">2.5–3.9</span> Mixed &middot;{" "}
          <span className="text-red-400">&lt;2.5</span> Poor
        </p>

        {company.pattern_flags && (() => {
          const flags = company.pattern_flags as Record<string, unknown>;
          const hasFlags = Boolean(flags.bait_and_switch || flags.hidden_fees || flags.deployment_delays || flags.wage_issues || flags.safety_concerns);
          if (!hasFlags) return null;
          return (
            <div className="mt-4 pt-4 border-t border-navy-700">
              <h3 className="text-sm font-medium text-slate-300 mb-2">Pattern Flags</h3>
              <p className="text-xs text-slate-600 mb-2">
                Flags appear when multiple seafarers report the same type of problem.
              </p>
              <div className="flex flex-wrap gap-2">
                {Boolean(flags.bait_and_switch) && (
                  <span className="text-xs px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400" title="Job offer differs from actual contract — different pay, rank, vessel, or conditions than promised">
                    Bait &amp; Switch Reports
                  </span>
                )}
                {Boolean(flags.hidden_fees) && (
                  <span className="text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400" title="Charges not disclosed upfront — recruitment fees, agency costs, or unexpected deductions">
                    Hidden Fees Reported
                  </span>
                )}
                {Boolean(flags.deployment_delays) && (
                  <span className="text-xs px-2 py-1 bg-amber-500/10 border border-amber-500/20 rounded text-amber-400" title="Extended waiting period before joining vessel after signing contract">
                    Deployment Delays
                  </span>
                )}
                {Boolean(flags.wage_issues) && (
                  <span className="text-xs px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400" title="Late, partial, or incorrect payment reported by crew">
                    Wage Issues
                  </span>
                )}
                {Boolean(flags.safety_concerns) && (
                  <span className="text-xs px-2 py-1 bg-red-500/10 border border-red-500/20 rounded text-red-400" title="Reports of hazardous conditions or inadequate safety equipment on board">
                    Safety Concerns
                  </span>
                )}
              </div>
            </div>
          );
        })()}
      </div>

      <div className="flex gap-3 mb-6">
        <Link
          href={`/reviews/new?company=${id}`}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
        >
          Write Review
        </Link>
        <Link
          href={`/intel/flares/new?company=${id}`}
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-medium rounded text-sm transition-colors"
        >
          Report an Issue
        </Link>
        <FollowButton companyId={id} />
      </div>

      {publishedFlares && publishedFlares.length > 0 && (() => {
        const totalFlares = publishedFlares.length;
        const totalCorroborations = publishedFlares.reduce((s, f) => s + (f.signal_flare_corroborations?.length ?? 0), 0);
        const categoryCounts: Record<string, number> = {};
        const severityCounts: Record<string, number> = { concern: 0, violation: 0, critical: 0 };
        for (const f of publishedFlares) {
          categoryCounts[f.category] = (categoryCounts[f.category] || 0) + 1;
          if (f.severity && f.severity in severityCounts) severityCounts[f.severity]++;
        }
        const categoryLabels: Record<string, string> = {
          unsafe_water: "Unsafe Water", wage_theft: "Wage Theft", forced_overtime: "Forced Overtime",
          document_retention: "Document Retention", unsafe_conditions: "Unsafe Conditions",
          harassment_abuse: "Harassment / Abuse", environmental_violation: "Environmental",
          food_safety: "Food Safety", medical_neglect: "Medical Neglect", other: "Other",
        };
        const hasCritical = severityCounts.critical > 0;
        return (
          <div className={`mb-6 rounded-lg p-4 border ${hasCritical ? "bg-red-500/5 border-red-500/20" : "bg-amber-500/5 border-amber-500/20"}`}>
            <h2 className={`text-sm font-semibold mb-2 ${hasCritical ? "text-red-400" : "text-amber-400"}`}>
              Signal Flare Summary
            </h2>
            <p className="text-sm text-slate-300 mb-3">
              {totalFlares} active report{totalFlares !== 1 ? "s" : ""} from seafarers
              {totalCorroborations > 0 && <>, {totalCorroborations} corroboration{totalCorroborations !== 1 ? "s" : ""}</>}
            </p>
            <div className="flex flex-wrap gap-2 mb-3">
              {Object.entries(categoryCounts)
                .sort((a, b) => b[1] - a[1])
                .map(([cat, count]) => (
                  <span key={cat} className="text-xs px-2 py-1 bg-navy-800 border border-navy-600 rounded text-slate-300">
                    {categoryLabels[cat] || cat} ({count})
                  </span>
                ))}
            </div>
            <div className="flex gap-3 text-xs">
              {severityCounts.critical > 0 && (
                <span className="text-red-400">{severityCounts.critical} critical</span>
              )}
              {severityCounts.violation > 0 && (
                <span className="text-orange-400">{severityCounts.violation} violation{severityCounts.violation !== 1 ? "s" : ""}</span>
              )}
              {severityCounts.concern > 0 && (
                <span className="text-amber-400">{severityCounts.concern} concern{severityCounts.concern !== 1 ? "s" : ""}</span>
              )}
            </div>
            <p className="text-[10px] text-slate-600 mt-2">
              These reports reflect individual seafarer observations and have not been independently verified.
            </p>
          </div>
        );
      })()}

      {signalIssues && signalIssues.length > 0 && (
        <div className="mb-6">
          <h2 className="text-lg font-semibold mb-3">Reported Issues</h2>
          <div className="space-y-2">
            {signalIssues.map((issue) => {
              const isResolved = issue.stage === "resolved";
              const categoryLabel: Record<string, string> = {
                unsafe_water: "Water Quality",
                wage_theft: "Wage Theft",
                forced_overtime: "Forced Overtime",
                document_retention: "Document Retention",
                unsafe_conditions: "Unsafe Conditions",
                harassment_abuse: "Harassment / Abuse",
                environmental_violation: "Environmental",
                food_safety: "Food Safety",
                medical_neglect: "Medical Neglect",
                other: "Other",
              };
              const stageColors: Record<string, string> = {
                emerging: "text-amber-400",
                investigating: "text-amber-400",
                company_contacted: "text-orange-400",
                published: "text-teal-400",
                resolved: "text-green-400",
                unresolved: "text-red-400",
              };
              const stageLabel: Record<string, string> = {
                emerging: "Emerging",
                investigating: "Investigating",
                company_contacted: "Company Contacted",
                published: "Active",
                resolved: "Resolved",
                unresolved: "Unresolved",
              };
              return (
                <div
                  key={issue.id}
                  className={`bg-navy-900 border rounded-lg p-3 ${
                    isResolved
                      ? "border-green-500/20"
                      : "border-amber-500/20"
                  }`}
                >
                  <div className="flex items-center justify-between">
                    <div className="flex items-center gap-2">
                      <span
                        className={`w-2 h-2 rounded-full ${
                          isResolved ? "bg-green-400" : "bg-amber-400"
                        }`}
                      />
                      <span className="text-sm font-medium text-slate-100">
                        {categoryLabel[issue.category] || issue.category}
                      </span>
                      <span
                        className={`text-xs ${(issue.stage && stageColors[issue.stage]) || "text-slate-500"}`}
                      >
                        {(issue.stage && stageLabel[issue.stage]) || issue.stage}
                      </span>
                      {issue.is_recurring && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-400">
                          Recurring
                        </span>
                      )}
                    </div>
                  </div>
                  <div className="flex items-center gap-3 mt-1.5 text-xs text-slate-500">
                    <span>
                      {issue.flare_count} report
                      {issue.flare_count !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {issue.corroboration_total} corroboration
                      {issue.corroboration_total !== 1 ? "s" : ""}
                    </span>
                    <span>
                      {issue.vessel_count} vessel
                      {issue.vessel_count !== 1 ? "s" : ""}
                    </span>
                    <span>&middot;</span>
                    <span>
                      Since {formatDate(issue.first_reported_at)}
                    </span>
                  </div>
                  {isResolved && issue.resolution_description && (
                    <p className="text-xs text-green-400/80 mt-2">
                      {issue.resolution_description}
                    </p>
                  )}
                  {issue.company_contacted_at && !isResolved && (
                    <p className="text-xs text-orange-400/80 mt-2">
                      Company contacted {formatDate(issue.company_contacted_at)}
                      {issue.stage === "unresolved"
                        ? " \u2014 no resolution"
                        : " \u2014 awaiting response"}
                    </p>
                  )}
                </div>
              );
            })}
          </div>
          <p className="text-xs text-slate-500 mt-2">
            These reports reflect individual seafarer observations and have not
            been independently verified.
          </p>
        </div>
      )}

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
                    {formatDate(r.created_at)}
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
