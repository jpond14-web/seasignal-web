import Link from "next/link";
import { createClient } from "@/lib/supabase/server";
import { formatDate } from "@/lib/format";

const ARTICLE_TYPE_STYLES: Record<string, { label: string; style: string }> = {
  investigation: {
    label: "Investigation",
    style: "bg-amber-500/10 border-amber-500/20 text-amber-400",
  },
  guide: {
    label: "Seafarer Guide",
    style: "bg-teal-500/10 border-teal-500/20 text-teal-400",
  },
  resolution_spotlight: {
    label: "Resolution",
    style: "bg-green-500/10 border-green-500/20 text-green-400",
  },
};

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

const STAGE_LABELS: Record<string, { label: string; style: string }> = {
  monitoring: { label: "Monitoring", style: "text-slate-500" },
  emerging: { label: "Emerging Pattern", style: "text-amber-400" },
  investigating: { label: "Under Investigation", style: "text-amber-400" },
  company_contacted: { label: "Company Contacted", style: "text-orange-400" },
  published: { label: "Published", style: "text-teal-400" },
  resolved: { label: "Resolved", style: "text-green-400" },
  unresolved: { label: "Unresolved", style: "text-red-400" },
};

export default async function SignalReportsPage() {
  const supabase = await createClient();

  // Fetch published articles
  const { data: articles } = await (supabase as any)
    .from("signal_articles")
    .select(
      `
      id, article_type, title, slug, content, published_at, author_id,
      profiles:author_id (display_name)
    `
    )
    .eq("status", "published")
    .order("published_at", { ascending: false })
    .limit(20);

  // Fetch active issues (emerging+ stage) for the "Active Issues" section
  const { data: issues } = await (supabase as any)
    .from("signal_issues")
    .select(
      `
      id, category, stage, flare_count, corroboration_total, vessel_count,
      first_reported_at, last_reported_at, company_contacted_at,
      company_responded_at, resolution_date, is_recurring,
      companies (id, name)
    `
    )
    .neq("stage", "monitoring")
    .order("last_reported_at", { ascending: false })
    .limit(20);

  return (
    <div>
      <div className="mb-6">
        <h2 className="text-lg font-semibold text-slate-100">
          Signal Reports
        </h2>
        <p className="text-sm text-slate-400 mt-1">
          Data-backed investigations, seafarer guides, and resolution stories.
          When patterns emerge from Signal Flares, we investigate and hold
          companies accountable.
        </p>
      </div>

      {/* Active Issues tracker */}
      {issues && issues.length > 0 && (
        <div className="mb-8">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
            Active Issues
          </h3>
          <div className="space-y-2">
            {issues.map((issue: any) => {
              const company = issue.companies as {
                id: string;
                name: string;
              } | null;
              const stageInfo =
                STAGE_LABELS[issue.stage] || STAGE_LABELS.monitoring;

              return (
                <div
                  key={issue.id}
                  className="bg-navy-900 border border-navy-700 rounded-lg p-3 flex items-center justify-between gap-3"
                >
                  <div className="min-w-0">
                    <div className="flex items-center gap-2 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400">
                        {CATEGORY_LABELS[issue.category] || issue.category}
                      </span>
                      <span className={`text-xs font-medium ${stageInfo.style}`}>
                        {stageInfo.label}
                      </span>
                      {issue.is_recurring && (
                        <span className="text-xs px-1.5 py-0.5 bg-red-500/10 border border-red-500/20 rounded text-red-400">
                          Recurring
                        </span>
                      )}
                    </div>
                    <div className="flex items-center gap-2 mt-1.5">
                      {company && (
                        <Link
                          href={`/intel/companies/${company.id}`}
                          className="text-sm text-slate-100 hover:text-teal-400 font-medium transition-colors"
                        >
                          {company.name}
                        </Link>
                      )}
                    </div>
                    <div className="flex items-center gap-3 mt-1 text-xs text-slate-500">
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
                    </div>
                  </div>
                  <div className="text-right shrink-0">
                    {issue.resolution_date ? (
                      <p className="text-xs text-green-400">
                        Resolved {formatDate(issue.resolution_date)}
                      </p>
                    ) : issue.company_contacted_at ? (
                      <p className="text-xs text-orange-400">
                        Contacted {formatDate(issue.company_contacted_at)}
                      </p>
                    ) : (
                      <p className="text-xs text-slate-500">
                        Since {formatDate(issue.first_reported_at)}
                      </p>
                    )}
                  </div>
                </div>
              );
            })}
          </div>
        </div>
      )}

      {/* Articles section */}
      <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wider mb-3">
        Reports &amp; Guides
      </h3>

      {!articles || articles.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400 mb-2">No reports published yet.</p>
          <p className="text-sm text-slate-500">
            When Signal Flares reveal patterns, our team investigates and
            publishes findings here.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {articles.map((article: any) => {
            const typeInfo =
              ARTICLE_TYPE_STYLES[article.article_type] ||
              ARTICLE_TYPE_STYLES.guide;
            const author = article.profiles as {
              display_name: string;
            } | null;

            return (
              <Link
                key={article.id}
                href={`/intel/signals/${article.slug}`}
                className="block bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-navy-600 transition-colors"
              >
                <div className="flex items-center gap-2 mb-2">
                  <span
                    className={`text-xs px-2 py-0.5 rounded border ${typeInfo.style}`}
                  >
                    {typeInfo.label}
                  </span>
                  <span className="text-xs text-slate-500">
                    {formatDate(article.published_at)}
                  </span>
                </div>
                <h3 className="text-sm font-medium text-slate-100 mb-1">
                  {article.title}
                </h3>
                {article.content && (
                  <p className="text-xs text-slate-400 line-clamp-2">
                    {article.content.slice(0, 200)}
                  </p>
                )}
                {author && (
                  <p className="text-xs text-slate-500 mt-2">
                    By {author.display_name}
                  </p>
                )}
              </Link>
            );
          })}
        </div>
      )}
    </div>
  );
}
