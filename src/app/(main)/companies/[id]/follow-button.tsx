"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function FollowButton({ companyId }: { companyId: string }) {
  const supabase = createClient();
  const [following, setFollowing] = useState(false);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  useEffect(() => {
    async function checkFollow() {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) { setLoading(false); return; }

      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();

      if (!profile) { setLoading(false); return; }
      setProfileId(profile.id);

      const { data: follow } = await supabase
        .from("company_follows")
        .select("id")
        .eq("profile_id", profile.id)
        .eq("company_id", companyId)
        .maybeSingle();

      setFollowing(!!follow);
      setLoading(false);
    }
    checkFollow();
  }, [companyId]);

  async function toggleFollow() {
    if (!profileId) return;
    setLoading(true);

    if (following) {
      await supabase
        .from("company_follows")
        .delete()
        .eq("profile_id", profileId)
        .eq("company_id", companyId);
      setFollowing(false);
    } else {
      await supabase
        .from("company_follows")
        .insert({ profile_id: profileId, company_id: companyId });
      setFollowing(true);
    }
    setLoading(false);
  }

  if (loading) {
    return (
      <button
        disabled
        className="px-4 py-2 bg-navy-800 border border-navy-600 text-slate-500 rounded text-sm"
      >
        ...
      </button>
    );
  }

  if (!profileId) return null;

  return (
    <button
      onClick={toggleFollow}
      className={`px-4 py-2 rounded text-sm font-medium transition-colors ${
        following
          ? "bg-teal-500/20 text-teal-400 border border-teal-500/30 hover:bg-navy-800 hover:text-slate-300 hover:border-navy-600"
          : "bg-navy-800 border border-navy-600 text-slate-300 hover:border-teal-500/30 hover:text-teal-400"
      }`}
    >
      {following ? "Following" : "Follow"}
    </button>
  );
}
