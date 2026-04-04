import { redirect } from "next/navigation";
import { createClient } from "@/lib/supabase/server";
import Link from "next/link";
import { CrewHistorySection } from "./crew-history";

function formatEnum(val: string | null): string {
  if (!val) return "";
  return val
    .replace(/_/g, " ")
    .replace(/\b\w/g, (c) => c.toUpperCase());
}

export default async function ProfilePage() {
  const supabase = await createClient();
  const {
    data: { user },
  } = await supabase.auth.getUser();

  if (!user) return redirect("/login");

  const { data: profile } = await supabase
    .from("profiles")
    .select("*")
    .eq("auth_user_id", user.id)
    .single();

  if (!profile) return redirect("/profile/setup");

  return (
    <div className="max-w-2xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold">My Profile</h1>
        <Link
          href="/profile/edit"
          className="px-4 py-2 text-sm bg-navy-800 border border-navy-600 rounded hover:bg-navy-700 text-slate-200 transition-colors"
        >
          Edit Profile
        </Link>
      </div>

      <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
        <div className="flex items-start gap-4">
          <div className="w-16 h-16 rounded-full bg-navy-700 flex items-center justify-center text-2xl font-bold text-teal-400 shrink-0">
            {profile.display_name.charAt(0).toUpperCase()}
          </div>
          <div className="min-w-0">
            <div className="flex items-center gap-2">
              <h2 className="text-xl font-semibold text-slate-100">
                {profile.display_name}
              </h2>
              {profile.is_verified ? (
                <span className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-teal-500/20 text-teal-400 rounded-full border border-teal-500/30">
                  Verified Seafarer
                </span>
              ) : (
                <Link
                  href="/profile/verify"
                  className="inline-flex items-center gap-1 px-2 py-0.5 text-xs font-medium bg-amber-500/10 text-amber-400 rounded-full border border-amber-500/30 hover:bg-amber-500/20 transition-colors"
                >
                  Get Verified
                </Link>
              )}
            </div>
            {profile.bio && (
              <p className="text-slate-400 text-sm mt-1">{profile.bio}</p>
            )}
          </div>
        </div>

        <div className="grid grid-cols-2 md:grid-cols-4 gap-4 mt-6 pt-6 border-t border-navy-700">
          <InfoCard label="Department" value={formatEnum(profile.department_tag)} />
          <InfoCard label="Rank" value={formatEnum(profile.rank_range)} />
          <InfoCard label="Experience" value={profile.experience_band ? `${profile.experience_band} years` : null} />
          <InfoCard label="Home Port" value={profile.home_port} />
        </div>

        {profile.vessel_type_tags && profile.vessel_type_tags.length > 0 && (
          <div className="mt-4 pt-4 border-t border-navy-700">
            <p className="text-xs text-slate-500 mb-2">Vessel Types</p>
            <div className="flex flex-wrap gap-2">
              {profile.vessel_type_tags.map((vt) => (
                <span
                  key={vt}
                  className="px-2 py-1 text-xs bg-navy-800 border border-navy-600 rounded text-slate-300"
                >
                  {formatEnum(vt)}
                </span>
              ))}
            </div>
          </div>
        )}

        <div className="mt-4 pt-4 border-t border-navy-700">
          <div className="flex items-center gap-4">
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-teal-400">
                {profile.reputation_score}
              </p>
              <p className="text-xs text-slate-500">Reputation</p>
            </div>
            <div className="text-center">
              <p className="text-lg font-mono font-bold text-slate-300">
                {formatEnum(profile.subscription_tier)}
              </p>
              <p className="text-xs text-slate-500">Tier</p>
            </div>
          </div>
        </div>
      </div>

      <CrewHistorySection profileId={profile.id} />

      <div className="mt-6 text-center">
        <Link
          href="/settings"
          className="text-sm text-slate-400 hover:text-teal-400 transition-colors"
        >
          Account Settings
        </Link>
      </div>
    </div>
  );
}

function InfoCard({ label, value }: { label: string; value: string | null }) {
  return (
    <div>
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-sm text-slate-200 mt-0.5">
        {value || <span className="text-slate-600">—</span>}
      </p>
    </div>
  );
}
