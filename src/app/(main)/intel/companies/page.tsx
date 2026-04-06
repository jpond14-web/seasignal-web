"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { trackSearch } from "@/lib/analytics";
import type { Tables, Enums } from "@/lib/supabase/types";

const companyTypes: { value: Enums<"company_type">; label: string }[] = [
  { value: "owner", label: "Ship Owner" },
  { value: "operator", label: "Operator" },
  { value: "manager", label: "Manager" },
  { value: "manning_agency", label: "Manning Agency" },
];

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

export default function CompaniesPage() {
  const supabase = createClient();
  const [companies, setCompanies] = useState<Tables<"companies">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("companies")
        .select("*")
        .order("name");

      if (typeFilter) {
        query = query.eq("company_type", typeFilter as Enums<"company_type">);
      }
      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data } = await query;
      const results = data || [];
      setCompanies(results);
      setLoading(false);

      if (search.trim()) {
        trackSearch("company", search.trim(), { company_type: typeFilter || undefined }, results.length);
      }
    }
    load();
  }, [search, typeFilter]);

  return (
    <div className="max-w-4xl mx-auto">
      <p className="text-slate-400 text-sm mb-6">
        Browse reviews from seafarers about ship owners, operators, managers, and
        manning agencies. Sign in to leave your own review.
      </p>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search companies by name..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search companies by name"
          className="flex-1 px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by company type"
          className="px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="">All Types</option>
          {companyTypes.map((t) => (
            <option key={t.value} value={t.value}>{t.label}</option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(4)].map((_, i) => (
            <div key={i} className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <div className="h-5 w-48 bg-navy-800 animate-pulse rounded mb-2" />
                  <div className="flex items-center gap-2">
                    <div className="h-5 w-20 bg-navy-800 animate-pulse rounded" />
                    <div className="h-3 w-16 bg-navy-800 animate-pulse rounded" />
                  </div>
                </div>
                <div className="h-6 w-10 bg-navy-800 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : companies.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">
            {search || typeFilter
              ? "No companies match your search. Try different filters."
              : "No companies found."}
          </p>
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
