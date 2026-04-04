"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { trackSearch } from "@/lib/analytics";
import type { Tables, Enums } from "@/lib/supabase/types";

const vesselTypes: { value: Enums<"vessel_type">; label: string }[] = [
  { value: "tanker", label: "Tanker" },
  { value: "bulk_carrier", label: "Bulk Carrier" },
  { value: "container", label: "Container" },
  { value: "general_cargo", label: "General Cargo" },
  { value: "offshore", label: "Offshore" },
  { value: "passenger", label: "Passenger" },
  { value: "roro", label: "RoRo" },
  { value: "lng", label: "LNG" },
  { value: "lpg", label: "LPG" },
  { value: "chemical", label: "Chemical" },
  { value: "reefer", label: "Reefer" },
  { value: "tug", label: "Tug" },
  { value: "fishing", label: "Fishing" },
  { value: "other", label: "Other" },
];

export default function VesselsPage() {
  const supabase = createClient();
  const [vessels, setVessels] = useState<Tables<"vessels">[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [typeFilter, setTypeFilter] = useState<string>("");

  useEffect(() => {
    async function load() {
      let query = supabase
        .from("vessels")
        .select("*")
        .order("name");

      if (typeFilter) {
        query = query.eq("vessel_type", typeFilter as Enums<"vessel_type">);
      }
      if (search) {
        query = query.or(`name.ilike.%${search}%,imo_number.ilike.%${search}%`);
      }

      const { data } = await query;
      const results = data || [];
      setVessels(results);
      setLoading(false);

      if (search.trim()) {
        trackSearch("vessel", search.trim(), { vessel_type: typeFilter || undefined }, results.length);
      }
    }
    load();
  }, [search, typeFilter]);

  function formatEnum(val: string): string {
    return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
  }

  return (
    <div className="max-w-4xl mx-auto">
      <h1 className="text-2xl font-bold mb-6">Vessels</h1>

      <div className="flex flex-col sm:flex-row gap-3 mb-6">
        <input
          type="text"
          placeholder="Search by name or IMO..."
          value={search}
          onChange={(e) => setSearch(e.target.value)}
          aria-label="Search vessels by name or IMO number"
          className="flex-1 px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
        />
        <select
          value={typeFilter}
          onChange={(e) => setTypeFilter(e.target.value)}
          aria-label="Filter by vessel type"
          className="px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
        >
          <option value="">All Types</option>
          {vesselTypes.map((t) => (
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
                  <div className="h-5 w-40 bg-navy-800 animate-pulse rounded mb-2" />
                  <div className="flex items-center gap-2">
                    <div className="h-3 w-24 bg-navy-800 animate-pulse rounded" />
                    <div className="h-5 w-16 bg-navy-800 animate-pulse rounded" />
                  </div>
                </div>
                <div className="h-6 w-10 bg-navy-800 animate-pulse rounded" />
              </div>
            </div>
          ))}
        </div>
      ) : vessels.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No vessels found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {vessels.map((v) => (
            <Link
              key={v.id}
              href={`/vessels/${v.id}`}
              className="block bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-navy-600 transition-colors"
            >
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-100">{v.name}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className="text-xs font-mono text-slate-500">IMO {v.imo_number}</span>
                    <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400">
                      {formatEnum(v.vessel_type || "other")}
                    </span>
                    {v.flag_state && (
                      <span className="text-xs text-slate-500">{v.flag_state}</span>
                    )}
                  </div>
                </div>
                <div className="text-right">
                  {v.avg_rating ? (
                    <p className="text-lg font-mono font-bold text-teal-400">
                      {Number(v.avg_rating).toFixed(1)}
                    </p>
                  ) : (
                    <p className="text-sm text-slate-500">No ratings</p>
                  )}
                  <p className="text-xs text-slate-500">
                    {v.review_count} review{v.review_count !== 1 ? "s" : ""}
                  </p>
                </div>
              </div>
              <div className="flex gap-3 mt-2 text-xs text-slate-500">
                {v.dwt && <span>{v.dwt.toLocaleString()} DWT</span>}
                {v.built_year && <span>Built {v.built_year}</span>}
              </div>
            </Link>
          ))}
        </div>
      )}
    </div>
  );
}
