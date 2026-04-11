"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";
import Link from "next/link";

const CATEGORY_LABELS: Record<string, string> = {
  unsafe_water: "Unsafe Drinking Water",
  wage_theft: "Wage Theft",
  forced_overtime: "Forced Overtime",
  document_retention: "Document Retention",
  unsafe_conditions: "Unsafe Conditions",
  harassment_abuse: "Harassment / Abuse",
  environmental_violation: "Environmental Violation",
  food_safety: "Food Safety",
  medical_neglect: "Medical Neglect",
  other: "Other",
};

const STAGES = [
  { value: "monitoring", label: "Monitoring", color: "text-slate-500" },
  { value: "emerging", label: "Emerging", color: "text-amber-400" },
  { value: "investigating", label: "Investigating", color: "text-amber-400" },
  {
    value: "company_contacted",
    label: "Company Contacted",
    color: "text-orange-400",
  },
  { value: "published", label: "Published", color: "text-teal-400" },
  { value: "resolved", label: "Resolved", color: "text-green-400" },
  { value: "unresolved", label: "Unresolved", color: "text-red-400" },
];

interface IssueRow {
  id: string;
  category: string;
  stage: string;
  flare_count: number;
  corroboration_total: number;
  vessel_count: number;
  first_reported_at: string | null;
  last_reported_at: string | null;
  company_contacted_at: string | null;
  company_response: string | null;
  company_responded_at: string | null;
  resolution_description: string | null;
  resolution_date: string | null;
  is_recurring: boolean;
  companies: { id: string; name: string } | null;
}

export default function AdvocacyDashboardPage() {
  const supabase = createClient();
  const [issues, setIssues] = useState<IssueRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [filterStage, setFilterStage] = useState<string>("all");

  useEffect(() => {
    loadIssues();
  }, []);

  async function loadIssues() {
    const { data } = await (supabase as any)
      .from("signal_issues")
      .select("*, companies (id, name)")
      .order("last_reported_at", { ascending: false })
      .limit(100);
    setIssues((data as IssueRow[]) ?? []);
    setLoading(false);
  }

  async function updateStage(id: string, newStage: string) {
    setActionLoading(id);
    const updates: Record<string, unknown> = { stage: newStage };
    if (newStage === "company_contacted") {
      updates.company_contacted_at = new Date().toISOString();
    }
    if (newStage === "resolved") {
      updates.resolution_date = new Date().toISOString();
    }
    await (supabase as any).from("signal_issues").update(updates).eq("id", id);
    setIssues((prev) =>
      prev.map((i) => (i.id === id ? { ...i, ...updates } as IssueRow : i))
    );
    setActionLoading(null);
  }

  async function markRecurring(id: string) {
    setActionLoading(id);
    await (supabase as any)
      .from("signal_issues")
      .update({ is_recurring: true, stage: "investigating" })
      .eq("id", id);
    setIssues((prev) =>
      prev.map((i) =>
        i.id === id
          ? { ...i, is_recurring: true, stage: "investigating" }
          : i
      )
    );
    setActionLoading(null);
  }

  const filteredIssues =
    filterStage === "all"
      ? issues
      : issues.filter((i) => i.stage === filterStage);

  // Summary counts
  const stageCounts = STAGES.reduce(
    (acc, s) => {
      acc[s.value] = issues.filter((i) => i.stage === s.value).length;
      return acc;
    },
    {} as Record<string, number>
  );

  return (
    <div>
      <h1 className="text-2xl font-bold mb-2">Advocacy Dashboard</h1>
      <p className="text-sm text-slate-400 mb-6">
        Track issues from initial reports through investigation, company
        outreach, and resolution.
      </p>

      {/* Pipeline summary */}
      <div className="grid grid-cols-2 sm:grid-cols-4 lg:grid-cols-7 gap-2 mb-6">
        {STAGES.map((s) => (
          <button
            key={s.value}
            onClick={() =>
              setFilterStage(filterStage === s.value ? "all" : s.value)
            }
            className={`text-center p-2 rounded border transition-colors ${
              filterStage === s.value
                ? "bg-navy-800 border-teal-500/30"
                : "bg-navy-900 border-navy-700 hover:border-navy-600"
            }`}
          >
            <p className={`text-lg font-mono font-bold ${s.color}`}>
              {stageCounts[s.value] || 0}
            </p>
            <p className="text-xs text-slate-500">{s.label}</p>
          </button>
        ))}
      </div>

      {loading ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
          <p className="text-slate-400">Loading issues...</p>
        </div>
      ) : filteredIssues.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">
            {filterStage === "all"
              ? "No issues tracked yet. Issues are created automatically when Signal Flares are published."
              : `No issues in "${filterStage.replace(/_/g, " ")}" stage.`}
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredIssues.map((issue) => {
            const stageInfo =
              STAGES.find((s) => s.value === issue.stage) || STAGES[0];
            const nextStages = getNextStages(issue.stage);

            return (
              <div
                key={issue.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 flex-wrap mb-1">
                      <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400">
                        {CATEGORY_LABELS[issue.category] || issue.category}
                      </span>
                      <span
                        className={`text-xs font-medium ${stageInfo.color}`}
                      >
                        {stageInfo.label}
                      </span>
                      {issue.is_recurring && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-400">
                          Recurring
                        </span>
                      )}
                    </div>

                    {issue.companies && (
                      <Link
                        href={`/intel/companies/${issue.companies.id}`}
                        className="text-sm font-medium text-slate-100 hover:text-teal-400 transition-colors"
                      >
                        {issue.companies.name}
                      </Link>
                    )}

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
                      {issue.first_reported_at && (
                        <>
                          <span>&middot;</span>
                          <span>
                            Since {formatDate(issue.first_reported_at)}
                          </span>
                        </>
                      )}
                    </div>

                    {/* Timeline events */}
                    <div className="mt-3 space-y-1">
                      {issue.company_contacted_at && (
                        <p className="text-xs text-orange-400">
                          Company contacted{" "}
                          {formatDate(issue.company_contacted_at)}
                        </p>
                      )}
                      {issue.company_responded_at && (
                        <p className="text-xs text-teal-400">
                          Response received{" "}
                          {formatDate(issue.company_responded_at)}
                        </p>
                      )}
                      {issue.company_response && (
                        <p className="text-xs text-slate-300 bg-navy-800 p-2 rounded mt-1">
                          {issue.company_response}
                        </p>
                      )}
                      {issue.resolution_date && (
                        <p className="text-xs text-green-400">
                          Resolved {formatDate(issue.resolution_date)}
                        </p>
                      )}
                      {issue.resolution_description && (
                        <p className="text-xs text-green-400/80 bg-navy-800 p-2 rounded mt-1">
                          {issue.resolution_description}
                        </p>
                      )}
                      {issue.company_contacted_at &&
                        !issue.company_responded_at &&
                        issue.stage === "company_contacted" && (() => {
                          const contacted = new Date(issue.company_contacted_at);
                          const daysSince = Math.floor(
                            (Date.now() - contacted.getTime()) /
                              (1000 * 60 * 60 * 24)
                          );
                          if (daysSince >= 14) {
                            return (
                              <p className="text-xs text-red-400">
                                No response in {daysSince} days
                              </p>
                            );
                          }
                          return (
                            <p className="text-xs text-slate-500">
                              Awaiting response ({14 - daysSince} days
                              remaining)
                            </p>
                          );
                        })()}
                    </div>
                  </div>

                  {/* Stage advancement buttons */}
                  <div className="flex flex-col items-end gap-1.5 shrink-0">
                    {nextStages.map((ns) => (
                      <button
                        key={ns.value}
                        onClick={() => updateStage(issue.id, ns.value)}
                        disabled={actionLoading === issue.id}
                        className={`text-xs px-2.5 py-1 rounded border transition-colors disabled:opacity-50 ${ns.buttonStyle}`}
                      >
                        {actionLoading === issue.id ? "..." : ns.label}
                      </button>
                    ))}
                    {issue.stage === "resolved" && !issue.is_recurring && (
                      <button
                        onClick={() => markRecurring(issue.id)}
                        disabled={actionLoading === issue.id}
                        className="text-xs px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === issue.id
                          ? "..."
                          : "Mark Recurring"}
                      </button>
                    )}
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}

function getNextStages(
  current: string
): { value: string; label: string; buttonStyle: string }[] {
  const transitions: Record<
    string,
    { value: string; label: string; buttonStyle: string }[]
  > = {
    monitoring: [
      {
        value: "emerging",
        label: "Mark Emerging",
        buttonStyle:
          "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20",
      },
    ],
    emerging: [
      {
        value: "investigating",
        label: "Investigate",
        buttonStyle:
          "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20",
      },
    ],
    investigating: [
      {
        value: "company_contacted",
        label: "Contact Company",
        buttonStyle:
          "bg-orange-500/10 border-orange-500/30 text-orange-400 hover:bg-orange-500/20",
      },
    ],
    company_contacted: [
      {
        value: "published",
        label: "Publish Report",
        buttonStyle:
          "bg-teal-500/10 border-teal-500/30 text-teal-400 hover:bg-teal-500/20",
      },
      {
        value: "resolved",
        label: "Mark Resolved",
        buttonStyle:
          "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20",
      },
      {
        value: "unresolved",
        label: "Mark Unresolved",
        buttonStyle:
          "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20",
      },
    ],
    published: [
      {
        value: "resolved",
        label: "Mark Resolved",
        buttonStyle:
          "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20",
      },
      {
        value: "unresolved",
        label: "Mark Unresolved",
        buttonStyle:
          "bg-red-500/10 border-red-500/30 text-red-400 hover:bg-red-500/20",
      },
    ],
    unresolved: [
      {
        value: "investigating",
        label: "Re-investigate",
        buttonStyle:
          "bg-amber-500/10 border-amber-500/30 text-amber-400 hover:bg-amber-500/20",
      },
      {
        value: "resolved",
        label: "Mark Resolved",
        buttonStyle:
          "bg-green-500/10 border-green-500/30 text-green-400 hover:bg-green-500/20",
      },
    ],
    resolved: [],
  };
  return transitions[current] || [];
}
