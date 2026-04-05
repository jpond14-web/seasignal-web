import Link from "next/link";
import type { Metadata } from "next";
import { createClient } from "@/lib/supabase/server";

export const metadata: Metadata = {
  title: "Maritime Company Reviews | SeaSignal",
  description:
    "Read honest reviews from verified seafarers about maritime companies. Compare pay reliability, safety culture, and contract accuracy ratings across ship owners, operators, and managers.",
};

function MiniScore({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-mono text-slate-200">
        {Number(value).toFixed(1)}
      </p>
    </div>
  );
}

export default async function PublicCompaniesPage() {
  const supabase = await createClient();

  const { data: companies } = await supabase
    .from("companies")
    .select("*")
    .order("name");

  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-slate-400 text-sm mb-6">
        Browse reviews from seafarers about ship owners, operators, managers, and
        manning agencies. Sign in to leave your own review.
      </p>

      {!companies || companies.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No companies found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {companies.map((c) => (
            <Link
              key={c.id}
              href={`/intel/companies/${c.id}`}
              className="block bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-navy-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-100">{c.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400">
                      {c.company_type.replace(/_/g, " ")}
                    </span>
                    {c.country && (
                      <span className="text-xs text-slate-500">
                        {c.country}
                      </span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {c.avg_rating ? (
                    <p className="text-lg font-mono font-bold text-teal-400">
                      {Number(c.avg_rating).toFixed(1)}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">No ratings</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {c.review_count} review{c.review_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              {(c.pay_reliability_score ||
                c.safety_culture_score ||
                c.contract_accuracy_score) && (
                <div className="flex gap-4 mt-3 pt-3 border-t border-navy-700">
                  <MiniScore label="Pay" value={c.pay_reliability_score} />
                  <MiniScore label="Safety" value={c.safety_culture_score} />
                  <MiniScore
                    label="Contract"
                    value={c.contract_accuracy_score}
                  />
                </div>
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
