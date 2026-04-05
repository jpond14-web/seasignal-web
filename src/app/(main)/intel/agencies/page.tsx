"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";

export default function AgenciesPage() {
  const supabase = createClient();
  const [agencies, setAgencies] = useState<Tables<"companies">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("companies")
        .select("*")
        .eq("company_type", "manning_agency")
        .order("name");

      if (search) {
        query = query.ilike("name", `%${search}%`);
      }

      const { data } = await query;
      setAgencies(data || []);
      setLoading(false);
    }
    load();
  }, [search]);

  return (
    <div className="max-w-4xl mx-auto">
      <div className="mb-6">
        <input
          type="text"
          placeholder="Search agencies..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search manning agencies by name"
          className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
        />
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
      ) : agencies.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No manning agencies found.</p>
          <p className="text-slate-500 text-sm mt-1">
            Agencies are added when users submit reviews.
          </p>
        </div>
      ) : (
        <div className="space-y-3">
          {agencies.map((a) => (
            <Link
              key={a.id}
              href={`/intel/agencies/${a.id}`}
              className="block bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-navy-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-100">{a.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400">
                      Manning Agency
                    </span>
                    {a.country && (
                      <span className="text-xs text-slate-500">{a.country}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {a.avg_rating ? (
                    <p className="text-lg font-mono font-bold text-teal-400">
                      {Number(a.avg_rating).toFixed(1)}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">No ratings</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {a.review_count} review{a.review_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-4 mt-3 pt-3 border-t border-navy-700">
                <MiniScore label="Pay" value={a.pay_reliability_score} />
                <MiniScore label="Safety" value={a.safety_culture_score} />
                <MiniScore label="Contract" value={a.contract_accuracy_score} />
              </div>
              {a.pattern_flags && (
                <AgencyFlags flags={a.pattern_flags as Record<string, unknown>} />
              )}
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}

function MiniScore({ label, value }: { label: string; value: number | null }) {
  if (!value) return null;
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm font-mono text-slate-200">{Number(value).toFixed(1)}</p>
    </div>
  );
}

function AgencyFlags({ flags }: { flags: Record<string, unknown> }) {
  const items: { key: string; label: string; color: string }[] = [];
  if (flags.bait_and_switch) items.push({ key: "bait", label: "Bait & Switch Reports", color: "text-red-400" });
  if (flags.hidden_fees) items.push({ key: "fees", label: "Hidden Fees Reported", color: "text-amber-400" });
  if (flags.deployment_delays) items.push({ key: "delays", label: "Deployment Delays", color: "text-amber-400" });

  if (items.length === 0) return null;

  return (
    <div className="flex flex-wrap gap-2 mt-2">
      {items.map((item) => (
        <span
          key={item.key}
          className={`text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded ${item.color}`}
        >
          {item.label}
        </span>
      ))}
    </div>
  );
}
