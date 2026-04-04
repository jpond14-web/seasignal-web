"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

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

export default function FindCrewPage() {
  const supabase = createClient();
  const [crew, setCrew] = useState<MutualCrewMember[]>([]);
  const [loading, setLoading] = useState(true);
  const [error, setError] = useState<string | null>(null);

  useEffect(() => {
    async function load() {
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

      // eslint-disable-next-line @typescript-eslint/no-explicit-any
      const { data, error: rpcError } = await (supabase.rpc as any)(
        "find_mutual_crew",
        { p_profile_id: user.id }
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
  }, [supabase]);

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

      <h1 className="text-2xl font-bold mb-2">Find Crew</h1>
      <p className="text-sm text-slate-400 mb-6">
        Seafarers who served on the same vessels as you.
      </p>

      {loading ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-slate-400">Searching for mutual crew...</p>
        </div>
      ) : error ? (
        <div className="flex items-center justify-center py-12">
          <p className="text-red-400">{error}</p>
        </div>
      ) : crew.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">
            No mutual crew found yet. As you add crew history records,
            connections will appear here.
          </p>
        </div>
      ) : (
        <div className="grid grid-cols-1 sm:grid-cols-2 lg:grid-cols-3 gap-4">
          {crew.map((member) => (
            <div
              key={member.profile_id}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4 card-hover"
            >
              <div className="flex items-start gap-3">
                <div className="w-12 h-12 rounded-full bg-navy-700 flex items-center justify-center text-lg font-bold text-teal-400 shrink-0">
                  {member.avatar_url ? (
                    <img
                      src={member.avatar_url}
                      alt=""
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
              <div className="mt-3 pt-3 border-t border-navy-700">
                <Link
                  href="/messages"
                  className="w-full inline-flex items-center justify-center gap-1.5 px-3 py-1.5 bg-teal-500/10 border border-teal-500/30 text-teal-400 hover:bg-teal-500/20 rounded text-xs font-medium transition-colors"
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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
