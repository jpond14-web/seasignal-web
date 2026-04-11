import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";
import { CorroborateButton } from "@/components/flares/corroborate-button";

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

const SEVERITY_STYLES: Record<string, string> = {
  concern: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  violation: "bg-orange-500/10 border-orange-500/20 text-orange-400",
  critical: "bg-red-500/10 border-red-500/20 text-red-400",
};

export default async function SignalFlaresPage() {
  const supabase = await createClient();

  const now = new Date().toISOString();
  const { data: flares } = await (supabase as any)
    .from("signal_flares")
    .select(
      `
      id, category, severity, title, description, incident_date_start, incident_date_end,
      is_anonymous, created_at, company_id, vessel_id,
      companies (id, name),
      vessels (id, name),
      signal_flare_corroborations (id)
    `
    )
    .eq("status", "published")
    .lte("batch_release_at", now)
    .order("created_at", { ascending: false })
    .limit(50);

  return (
    <div>
      <div className="flex items-center justify-between mb-6">
        <div>
          <h2 className="text-lg font-semibold text-slate-100">
            Signal Flares
          </h2>
          <p className="text-sm text-slate-400 mt-1">
            Seafarer-reported issues across the industry. Patterns emerge when
            multiple crew report the same problem.
          </p>
        </div>
        <Link
          href="/intel/flares/new"
          className="px-4 py-2 bg-amber-500 hover:bg-amber-400 text-navy-950 font-medium rounded text-sm transition-colors whitespace-nowrap"
        >
          Report an Issue
        </Link>
      </div>

      <div className="bg-navy-800/50 border border-navy-700 rounded-lg p-4 mb-6 space-y-4">
        <div>
          <p className="text-xs font-medium text-slate-300 mb-2">How Signal Flares work:</p>
          <div className="grid grid-cols-1 sm:grid-cols-3 gap-2">
            <div className="flex items-start gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 mt-0.5">1</span>
              <p className="text-xs text-slate-400">You report an issue you witnessed on board — your identity stays protected.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 mt-0.5">2</span>
              <p className="text-xs text-slate-400">Other seafarers corroborate if they experienced the same problem. Patterns become visible.</p>
            </div>
            <div className="flex items-start gap-2">
              <span className="text-xs font-mono font-bold text-amber-400 mt-0.5">3</span>
              <p className="text-xs text-slate-400">SeaSignal investigates, contacts the company, and tracks whether they fix it.</p>
            </div>
          </div>
        </div>
        <div className="border-t border-navy-700 pt-3">
          <p className="text-xs font-medium text-slate-300 mb-1.5">Severity levels:</p>
          <div className="flex flex-wrap gap-3">
            <span className="text-xs text-amber-400"><span className="font-medium">Concern</span> — something isn&apos;t right, worth watching</span>
            <span className="text-xs text-orange-400"><span className="font-medium">Violation</span> — a clear breach of regulations or rights</span>
            <span className="text-xs text-red-400"><span className="font-medium">Critical</span> — immediate danger to health or safety</span>
          </div>
        </div>
        <p className="text-xs text-slate-500 border-t border-navy-700 pt-3">
          Reports reflect individual seafarer observations and have not been independently verified. Reports are released in weekly batches to protect reporter identity.
        </p>
      </div>

      {!flares || flares.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-2">No signal flares published yet.</p>
          <p className="text-sm text-slate-500">
            Be the first to report an issue you&apos;ve witnessed.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {flares.map((flare: any) => {
            const corroborationCount =
              flare.signal_flare_corroborations?.length || 0;
            const company = flare.companies as { id: string; name: string } | null;
            const vessel = flare.vessels as { id: string; name: string } | null;

            return (
              <div
                key={flare.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-3 mb-2">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span
                      className={`text-xs px-2 py-0.5 rounded border ${SEVERITY_STYLES[flare.severity] || SEVERITY_STYLES.concern}`}
                    >
                      {flare.severity}
                    </span>
                    <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400">
                      {CATEGORY_LABELS[flare.category] || flare.category}
                    </span>
                  </div>
                  <span className="text-xs text-slate-500 whitespace-nowrap">
                    {formatDate(flare.created_at)}
                  </span>
                </div>

                <h3 className="text-sm font-medium text-slate-100 mb-1">
                  {flare.title}
                </h3>

                <div className="flex items-center gap-2 text-xs text-slate-400 mb-3">
                  {company && (
                    <Link
                      href={`/intel/companies/${company.id}`}
                      className="hover:text-teal-400 transition-colors"
                    >
                      {company.name}
                    </Link>
                  )}
                  {vessel && (
                    <>
                      <span className="text-slate-600">&middot;</span>
                      <span>{vessel.name}</span>
                    </>
                  )}
                  {flare.incident_date_start && (
                    <>
                      <span className="text-slate-600">&middot;</span>
                      <span>
                        {formatDate(flare.incident_date_start)}
                        {flare.incident_date_end &&
                          ` \u2013 ${formatDate(flare.incident_date_end)}`}
                      </span>
                    </>
                  )}
                </div>

                {flare.description && (
                  <p className="text-sm text-slate-300 leading-relaxed mb-3 line-clamp-3">
                    {flare.description}
                  </p>
                )}

                <div className="flex items-center justify-between pt-2 border-t border-navy-700">
                  <div className="flex items-center gap-1.5 text-xs text-slate-500">
                    <svg
                      className="w-3.5 h-3.5"
                      viewBox="0 0 20 20"
                      fill="currentColor"
                    >
                      <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                    </svg>
                    {corroborationCount > 0 ? (
                      <span>
                        {corroborationCount} seafarer
                        {corroborationCount !== 1 ? "s" : ""} corroborated
                      </span>
                    ) : (
                      <span>No corroborations yet</span>
                    )}
                  </div>
                  <CorroborateButton flareId={flare.id} />
                </div>
              </div>
            );
          })}
        </div>
      )}
    </div>
  );
}
