"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { trackSearch } from "@/lib/analytics";
import type { Enums } from "@/lib/supabase/types";

type SeafarerCard = {
  id: string;
  display_name: string;
  avatar_url: string | null;
  is_verified: boolean;
  department_tag: Enums<"department_type"> | null;
  rank_range: Enums<"rank_category"> | null;
  experience_band: Enums<"experience_band"> | null;
  vessel_type_tags: Enums<"vessel_type">[] | null;
  bio: string | null;
  current_port: string | null;
  last_seen_at: string | null;
};

const departments: { value: Enums<"department_type">; label: string }[] = [
  { value: "deck", label: "Deck" },
  { value: "engine", label: "Engine" },
  { value: "electro", label: "Electro-Technical" },
  { value: "catering", label: "Catering" },
];

const rankCategories: { value: Enums<"rank_category">; label: string }[] = [
  { value: "officer", label: "Officer" },
  { value: "rating", label: "Rating" },
  { value: "cadet", label: "Cadet" },
];

const experienceBands: { value: Enums<"experience_band">; label: string }[] = [
  { value: "0_2y", label: "0-2 years" },
  { value: "3_5y", label: "3-5 years" },
  { value: "6_10y", label: "6-10 years" },
  { value: "10y_plus", label: "10+ years" },
];

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

const PAGE_SIZE = 24;

const DEPT_COLORS: Record<string, string> = {
  deck: "bg-blue-500/20 text-blue-400 border-blue-500/30",
  engine: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  electro: "bg-cyan-500/20 text-cyan-400 border-cyan-500/30",
  catering: "bg-green-500/20 text-green-400 border-green-500/30",
};

function isOnline(lastSeen: string | null): boolean {
  if (!lastSeen) return false;
  return Date.now() - new Date(lastSeen).getTime() < 5 * 60 * 1000;
}

function formatEnum(val: string | null): string {
  if (!val) return "";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function SeafarersPage() {
  const supabase = createClient();
  const [seafarers, setSeafarers] = useState<SeafarerCard[]>([]);
  const [loading, setLoading] = useState(true);
  const [search, setSearch] = useState("");
  const [filterDept, setFilterDept] = useState("");
  const [filterRank, setFilterRank] = useState("");
  const [filterExp, setFilterExp] = useState("");
  const [filterVessel, setFilterVessel] = useState("");
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);

  const fetchSeafarers = useCallback(
    async (pageNum: number, append = false) => {
      setLoading(true);
      let query = supabase
        .from("profiles")
        .select(
          "id, display_name, avatar_url, is_verified, department_tag, rank_range, experience_band, vessel_type_tags, bio, current_port, last_seen_at"
        )
        .order("display_name", { ascending: true })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (search.trim()) {
        query = query.ilike("display_name", `%${search.trim()}%`);
      }
      if (filterDept) {
        query = query.eq("department_tag", filterDept as "deck" | "engine" | "electro" | "catering");
      }
      if (filterRank) {
        query = query.eq("rank_range", filterRank as "officer" | "rating" | "cadet");
      }
      if (filterExp) {
        query = query.eq("experience_band", filterExp as "0_2y" | "3_5y" | "6_10y" | "10y_plus");
      }
      if (filterVessel) {
        query = query.contains("vessel_type_tags", [filterVessel]);
      }

      const { data } = await query;
      const results = (data || []) as SeafarerCard[];
      setHasMore(results.length === PAGE_SIZE);
      if (append) {
        setSeafarers((prev) => [...prev, ...results]);
      } else {
        setSeafarers(results);
      }
      setLoading(false);

      if (search.trim() && !append) {
        trackSearch("seafarer", search.trim(), {
          department: filterDept || undefined,
          rank: filterRank || undefined,
          experience: filterExp || undefined,
          vessel_type: filterVessel || undefined,
        }, results.length);
      }
    },
    [supabase, search, filterDept, filterRank, filterExp, filterVessel]
  );

  useEffect(() => {
    setPage(0);
    fetchSeafarers(0);
  }, [fetchSeafarers]);

  function loadMore() {
    const next = page + 1;
    setPage(next);
    fetchSeafarers(next, true);
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/community/seafarers/find-crew"
          className="px-4 py-1.5 border border-teal-500 text-teal-400 hover:bg-teal-500/10 rounded text-sm font-medium transition-colors"
        >
          Find Crew
        </Link>
      </div>

      {/* Search & Filters */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-4 mb-6">
        <div className="flex flex-col md:flex-row gap-3">
          <input
            type="text"
            placeholder="Search by name..."
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            className="flex-1 px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
          />
          <select
            value={filterDept}
            onChange={(e) => setFilterDept(e.target.value)}
            className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">All Departments</option>
            {departments.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
          <select
            value={filterRank}
            onChange={(e) => setFilterRank(e.target.value)}
            className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">All Ranks</option>
            {rankCategories.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
          <select
            value={filterExp}
            onChange={(e) => setFilterExp(e.target.value)}
            className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">All Experience</option>
            {experienceBands.map((eb) => (
              <option key={eb.value} value={eb.value}>
                {eb.label}
              </option>
            ))}
          </select>
          <select
            value={filterVessel}
            onChange={(e) => setFilterVessel(e.target.value)}
            className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">All Vessel Types</option>
            {vesselTypes.map((vt) => (
              <option key={vt.value} value={vt.value}>
                {vt.label}
              </option>
            ))}
          </select>
        </div>
      </div>

      {/* Card Grid */}
      {loading && seafarers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">Loading seafarers...</p>
        </div>
      ) : seafarers.length === 0 ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">No seafarers found matching your filters.</p>
        </div>
      ) : (
        <>
          <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
            {seafarers.map((s) => (
              <Link
                key={s.id}
                href={`/community/seafarers/${s.id}`}
                className="bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-teal-500/50 transition-colors block"
              >
                <div className="flex items-start gap-3">
                  <div className="relative shrink-0">
                    <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center text-lg font-bold text-teal-400">
                      {s.avatar_url ? (
                        <Image
                          src={s.avatar_url}
                          alt={`${s.display_name} profile picture`}
                          width={48}
                          height={48}
                          className="w-12 h-12 rounded-full object-cover"
                        />
                      ) : (
                        s.display_name.charAt(0).toUpperCase()
                      )}
                    </div>
                    {isOnline(s.last_seen_at) && (
                      <span className="absolute -bottom-0.5 -right-0.5 w-3 h-3 bg-green-500 rounded-full ring-2 ring-navy-900" />
                    )}
                  </div>
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-1.5">
                      <span className="text-sm font-semibold text-slate-100 truncate">
                        {s.display_name}
                      </span>
                      {s.is_verified && (
                        <svg
                          className="w-4 h-4 text-teal-500 shrink-0"
                          viewBox="0 0 20 20"
                          fill="currentColor"
                        >
                          <path
                            fillRule="evenodd"
                            d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z"
                            clipRule="evenodd"
                          />
                        </svg>
                      )}
                    </div>
                    <div className="flex flex-wrap items-center gap-1.5 mt-1">
                      {s.department_tag && (
                        <span
                          className={`px-1.5 py-0.5 text-xs rounded border ${DEPT_COLORS[s.department_tag] || "bg-navy-800 text-slate-400 border-navy-600"}`}
                        >
                          {formatEnum(s.department_tag)}
                        </span>
                      )}
                      {s.rank_range && (
                        <span className="px-1.5 py-0.5 text-xs bg-navy-800 text-slate-300 border border-navy-600 rounded">
                          {formatEnum(s.rank_range)}
                        </span>
                      )}
                      {s.experience_band && (
                        <span className="text-xs text-slate-500">
                          {formatEnum(s.experience_band)}
                        </span>
                      )}
                    </div>
                    {s.bio && (
                      <p className="text-xs text-slate-400 mt-1.5 line-clamp-2">
                        {s.bio}
                      </p>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>

          {hasMore && (
            <div className="flex justify-center mt-6">
              <button
                onClick={loadMore}
                disabled={loading}
                className="px-6 py-2.5 bg-navy-800 border border-navy-600 rounded hover:bg-navy-700 text-slate-300 text-sm transition-colors disabled:opacity-50"
              >
                {loading ? "Loading..." : "Load More"}
              </button>
            </div>
          )}
        </>
      )}
    </div>
  );
}
