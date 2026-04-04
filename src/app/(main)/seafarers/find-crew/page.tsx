"use client";

import { useEffect, useState, useCallback } from "react";
import Image from "next/image";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import { copyProfileLink, copyInviteLink } from "@/lib/utils/shareProfile";

type SharedVessel = {
  vessel_id: string;
  vessel_name: string;
};

type MutualCrewMember = {
  profile_id: string;
  display_name: string;
  avatar_url: string | null;
  shared_vessel_count: number;
  shared_vessels: SharedVessel[];
};

type SortOption = "shared_desc" | "shared_asc" | "name_asc";

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-6 right-6 bg-navy-800 border border-navy-600 text-sm text-slate-200 px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 z-50 ${
        visible
          ? "opacity-100 translate-y-0"
          : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      {message}
    </div>
  );
}

export default function FindCrewPage() {
  const [crew, setCrew] = useState<MutualCrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  // Filter / sort state
  const [sortBy, setSortBy] = useState<SortOption>("shared_desc");
  const [vesselTypeFilter, setVesselTypeFilter] = useState<string>("all");

  // Toast state
  const [toastMessage, setToastMessage] = useState("");
  const [toastVisible, setToastVisible] = useState(false);

  const showToast = useCallback((msg: string) => {
    setToastMessage(msg);
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2500);
  }, []);

  useEffect(() => {
    async function load() {
      const supabase = createClient();
      setLoading(true);
      setError(null);

      const {
        data: { user },
      } = await supabase.auth.getUser();

      if (!user) {
        setError("You must be signed in to find crew.");
        setLoading(false);
        return;
      }

      // Get profile_id first (the RPC expects profile_id, not auth user id)
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!profile) {
        setError("Profile not found. Please set up your profile first.");
        setLoading(false);
        return;
      }

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcError } = await (supabase.rpc as any)(
        "find_mutual_crew",
        { p_profile_id: profile.id }
      );

      if (rpcError) {
        setError("Failed to load mutual crew. Please try again later.");
        setLoading(false);
        return;
      }

      const results = (data || []) as MutualCrewMember[];
      results.sort((a, b) => b.shared_vessel_count - a.shared_vessel_count);
      setCrew(results);
      setLoading(false);
    }

    load();
  }, []);

  // Derive unique vessel names for the filter dropdown
  const allVesselNames = Array.from(
    new Set(crew.flatMap((m) => m.shared_vessels.map((v) => v.vessel_name)))
  ).sort();

  // Apply filter and sort
  const displayCrew = crew
    .filter((member) => {
      if (vesselTypeFilter === "all") return true;
      return member.shared_vessels.some(
        (v) => v.vessel_name === vesselTypeFilter
      );
    })
    .sort((a, b) => {
      switch (sortBy) {
        case "shared_desc":
          return b.shared_vessel_count - a.shared_vessel_count;
        case "shared_asc":
          return a.shared_vessel_count - b.shared_vessel_count;
        case "name_asc":
          return a.display_name.localeCompare(b.display_name);
        default:
          return 0;
      }
    });

  async function handleShareProfile(profileId: string) {
    const ok = await copyProfileLink(profileId);
    showToast(ok ? "Profile link copied!" : "Failed to copy link");
  }

  async function handleCopyInvite() {
    const ok = await copyInviteLink();
    showToast(ok ? "Invite link copied!" : "Failed to copy link");
  }

  return (
    <div className="max-w-6xl mx-auto">
      <div className="flex items-center gap-4 mb-6">
        <Link
          href="/seafarers"
          className="text-sm text-slate-400 hover:text-teal-400 transition-colors flex items-center gap-1"
        >
          <svg
            className="w-4 h-4"
            viewBox="0 0 20 20"
            fill="currentColor"
          >
            <path
              fillRule="evenodd"
              d="M12.707 5.293a1 1 0 010 1.414L9.414 10l3.293 3.293a1 1 0 01-1.414 1.414l-4-4a1 1 0 010-1.414l4-4a1 1 0 011.414 0z"
              clipRule="evenodd"
            />
          </svg>
          Back to Directory
        </Link>
      </div>

      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-6">
        <div>
          <h1 className="text-2xl font-bold mb-1">Find Crew</h1>
          <p className="text-sm text-slate-400">
            Seafarers who served on the same vessels as you.
          </p>
        </div>
        <button
          onClick={handleCopyInvite}
          className="inline-flex items-center gap-1.5 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 rounded text-xs font-medium transition-colors shrink-0"
        >
          <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor">
            <path d="M12.586 4.586a2 2 0 112.828 2.828l-3 3a2 2 0 01-2.828 0 1 1 0 00-1.414 1.414 4 4 0 005.656 0l3-3a4 4 0 00-5.656-5.656l-1.5 1.5a1 1 0 101.414 1.414l1.5-1.5zm-5 5a2 2 0 012.828 0 1 1 0 001.414-1.414 4 4 0 00-5.656 0l-3 3a4 4 0 105.656 5.656l1.5-1.5a1 1 0 10-1.414-1.414l-1.5 1.5a2 2 0 11-2.828-2.828l3-3z" />
          </svg>
          Copy Invite Link
        </button>
      </div>

      {/* Filter / Sort controls */}
      {!loading && !error && crew.length > 0 && (
        <div className="flex flex-wrap items-center gap-3 mb-6">
          <div className="flex items-center gap-2">
            <label
              htmlFor="sort-select"
              className="text-xs text-slate-500 uppercase tracking-wider"
            >
              Sort
            </label>
            <select
              id="sort-select"
              value={sortBy}
              onChange={(e) => setSortBy(e.target.value as SortOption)}
              className="bg-navy-800 border border-navy-600 text-sm text-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-teal-500/50"
            >
              <option value="shared_desc">Most shared vessels</option>
              <option value="shared_asc">Fewest shared vessels</option>
              <option value="name_asc">Name (A-Z)</option>
            </select>
          </div>

          <div className="flex items-center gap-2">
            <label
              htmlFor="vessel-filter"
              className="text-xs text-slate-500 uppercase tracking-wider"
            >
              Vessel
            </label>
            <select
              id="vessel-filter"
              value={vesselTypeFilter}
              onChange={(e) => setVesselTypeFilter(e.target.value)}
              className="bg-navy-800 border border-navy-600 text-sm text-slate-300 rounded px-2 py-1.5 focus:outline-none focus:border-teal-500/50"
            >
              <option value="all">All vessels</option>
              {allVesselNames.map((name) => (
                <option key={name} value={name}>
                  {name}
                </option>
              ))}
            </select>
          </div>
        </div>
      )}

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">Searching for mutual crew...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      ) : displayCrew.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">
            {crew.length === 0
              ? "No mutual crew found yet. As you add crew history records, connections will appear here."
              : "No crew match your current filters."}
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {displayCrew.map((member) => (
            <div
              key={member.profile_id}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4 card-hover"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center text-lg font-bold text-teal-400 shrink-0">
                  {member.avatar_url ? (
                    <Image
                      src={member.avatar_url}
                      alt={member.display_name}
                      width={48}
                      height={48}
                      className="w-12 h-12 rounded-full object-cover"
                    />
                  ) : (
                    member.display_name.charAt(0).toUpperCase()
                  )}
                </div>
                <div className="min-w-0 flex-1">
                  <Link
                    href={`/seafarers/${member.profile_id}`}
                    className="text-sm font-semibold text-slate-100 hover:text-teal-400 transition-colors truncate block"
                  >
                    {member.display_name}
                  </Link>
                  <p className="text-xs text-teal-500 mt-0.5">
                    {member.shared_vessel_count} shared vessel
                    {member.shared_vessel_count !== 1 ? "s" : ""}
                  </p>
                  <div className="flex flex-wrap gap-1 mt-2">
                    {member.shared_vessels.map((v) => (
                      <span
                        key={v.vessel_id}
                        className="px-1.5 py-0.5 text-xs bg-navy-800 text-slate-300 border border-navy-600 rounded"
                      >
                        {v.vessel_name}
                      </span>
                    ))}
                  </div>
                </div>
              </div>
              <div className="mt-3 pt-3 border-t border-navy-700 flex gap-2">
                <Link
                  href="/messages"
                  className="flex-1 inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 rounded text-xs font-medium transition-colors"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M2 5a2 2 0 012-2h7a2 2 0 012 2v4a2 2 0 01-2 2H9l-3 3v-3H4a2 2 0 01-2-2V5z" />
                    <path d="M15 7v2a4 4 0 01-4 4H9.828l-1.766 1.767c.28.149.599.233.938.233h2l3 3v-3h2a2 2 0 002-2V9a2 2 0 00-2-2h-1z" />
                  </svg>
                  Message
                </Link>
                <button
                  onClick={() => handleShareProfile(member.profile_id)}
                  className="inline-flex items-center justify-center gap-1 px-2.5 py-1.5 bg-navy-800 border border-navy-600 text-slate-400 hover:text-slate-200 hover:border-navy-500 rounded text-xs font-medium transition-colors"
                  title="Share profile link"
                >
                  <svg
                    className="w-3.5 h-3.5"
                    viewBox="0 0 20 20"
                    fill="currentColor"
                  >
                    <path d="M15 8a3 3 0 10-2.977-2.63l-4.94 2.47a3 3 0 100 4.319l4.94 2.47a3 3 0 10.895-1.789l-4.94-2.47a3.027 3.027 0 000-.74l4.94-2.47C13.456 7.68 14.19 8 15 8z" />
                  </svg>
                  Share
                </button>
              </div>
            </div>
          ))}
        </div>
      )}

      <Toast message={toastMessage} visible={toastVisible} />
    </div>
  );
}
