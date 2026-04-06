"use client";

import { useEffect, useState } from "react";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";
import type { Tables } from "@/lib/supabase/types";
import { formatDate } from "@/lib/format";

type Profile = Tables<"profiles">;

export default function AdminVerifyPage() {
  const router = useRouter();
  const supabase = createClient();

  const [currentProfile, setCurrentProfile] = useState<Profile | null>(null);
  const [unverified, setUnverified] = useState<Profile[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [error, setError] = useState("");

  useEffect(() => {
    async function load() {
      const {
        data: { user },
      } = await supabase.auth.getUser();
      if (!user) {
        router.push("/login");
        return;
      }

      // Check that current user is verified (basic admin gate)
      const { data: myProfile } = await supabase
        .from("profiles")
        .select("*")
        .eq("auth_user_id", user.id)
        .single();

      if (!myProfile || !myProfile.is_verified) {
        router.push("/home");
        return;
      }

      setCurrentProfile(myProfile);

      // Fetch all unverified profiles
      const { data: profiles, error: fetchError } = await supabase
        .from("profiles")
        .select("*")
        .eq("is_verified", false)
        .order("created_at", { ascending: false });

      if (fetchError) {
        setError(fetchError.message);
      } else {
        setUnverified(profiles ?? []);
      }

      setLoading(false);
    }
    load();
  }, []);

  async function handleApprove(profileId: string) {
    setActionLoading(profileId);
    setError("");

    const { error: updateError } = await supabase
      .from("profiles")
      .update({ is_verified: true })
      .eq("id", profileId);

    setActionLoading(null);

    if (updateError) {
      setError(updateError.message);
    } else {
      setUnverified((prev) => prev.filter((p) => p.id !== profileId));
    }
  }

  function handleReject(profileId: string) {
    // V1: just remove from the visible list
    setUnverified((prev) => prev.filter((p) => p.id !== profileId));
  }

  function getDocsUrl(profileId: string) {
    // Build a link to the Supabase dashboard storage browser for this profile's folder
    const supabaseUrl = process.env.NEXT_PUBLIC_SUPABASE_URL ?? "";
    const projectRef = supabaseUrl.replace("https://", "").split(".")[0];
    return `https://supabase.com/dashboard/project/${projectRef}/storage/buckets/verification-docs?path=${profileId}`;
  }

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center gap-3 mb-6">
        <Link
          href="/home"
          className="text-slate-400 hover:text-teal-400 transition-colors text-sm"
        >
          &larr; Dashboard
        </Link>
      </div>

      <h1 className="text-2xl font-bold mb-2">Verification Requests</h1>
      <p className="text-slate-400 text-sm mb-6">
        Review uploaded credential documents and approve or reject seafarer
        verification requests.
      </p>

      {error && (
        <div className="bg-red-500/10 border border-red-500/30 rounded-lg p-3 mb-4">
          <p className="text-sm text-red-400">{error}</p>
        </div>
      )}

      {unverified.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No pending verification requests.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {unverified.map((profile) => (
            <div
              key={profile.id}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4"
            >
              <div className="flex items-center justify-between gap-4">
                <div className="flex items-center gap-3 min-w-0">
                  <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-lg font-bold text-teal-400 shrink-0">
                    {profile.display_name.charAt(0).toUpperCase()}
                  </div>
                  <div className="min-w-0">
                    <p className="text-sm font-medium text-slate-100 truncate">
                      {profile.display_name}
                    </p>
                    <p className="text-xs text-slate-500">
                      Joined{" "}
                      {formatDate(new Date(profile.created_at!))}
                    </p>
                  </div>
                </div>

                <div className="flex items-center gap-2 shrink-0">
                  <a
                    href={getDocsUrl(profile.id)}
                    target="_blank"
                    rel="noopener noreferrer"
                    className="px-3 py-1.5 text-xs bg-navy-800 border border-navy-600 rounded hover:bg-navy-700 text-slate-300 transition-colors"
                  >
                    View Docs
                  </a>
                  <button
                    onClick={() => handleApprove(profile.id)}
                    disabled={actionLoading === profile.id}
                    className="px-3 py-1.5 text-xs bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded transition-colors"
                  >
                    {actionLoading === profile.id ? "..." : "Approve"}
                  </button>
                  <button
                    onClick={() => handleReject(profile.id)}
                    disabled={actionLoading === profile.id}
                    className="px-3 py-1.5 text-xs bg-navy-800 border border-red-500/30 rounded hover:bg-red-500/10 text-red-400 transition-colors"
                  >
                    Reject
                  </button>
                </div>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
