"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import Link from "next/link";

type CertSummary = {
  id: string;
  title: string;
  cert_type: string;
  status: string | null;
  expiry_date: string | null;
  verification_level: string | null;
};

type CrewEntry = {
  id: string;
  rank_held: string | null;
  joined_at: string | null;
  left_at: string | null;
  is_current: boolean | null;
  vessels: { name: string; vessel_type: string | null; imo_number: string } | null;
  companies: { name: string } | null;
};

type SeaTimeRecord = {
  vessel_type: string | null;
  days: number | null;
};

type ProfileData = {
  display_name: string;
  department_tag: string | null;
  rank_range: string | null;
  experience_band: string | null;
  vessel_type_tags: string[] | null;
  is_verified: boolean | null;
  created_at: string | null;
};

const VERIFICATION_LEVELS: Record<string, { label: string; color: string }> = {
  self_reported: { label: "Self Reported", color: "text-slate-400" },
  document_uploaded: { label: "Doc Uploaded", color: "text-blue-400" },
  hash_verified: { label: "Hash Verified", color: "text-amber-400" },
  authority_confirmed: { label: "Confirmed", color: "text-emerald-400" },
};

function formatEnum(val: string | null): string {
  if (!val) return "";
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

export default function MaritimeProfessionalRecordPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [profile, setProfile] = useState<ProfileData | null>(null);
  const [certs, setCerts] = useState<CertSummary[]>([]);
  const [crewHistory, setCrewHistory] = useState<CrewEntry[]>([]);
  const [seaTime, setSeaTime] = useState<SeaTimeRecord[]>([]);
  const [totalSeaDays, setTotalSeaDays] = useState(0);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: prof } = await supabase
      .from("profiles")
      .select("display_name, department_tag, rank_range, experience_band, vessel_type_tags, is_verified, created_at")
      .eq("auth_user_id", user.id)
      .single();
    if (prof) setProfile(prof as ProfileData);

    const profileId = (await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single()).data?.id;
    if (!profileId) { setLoading(false); return; }

    // Certificates
    const { data: certsData } = await supabase
      .from("certificates")
      .select("id, title, cert_type, status, expiry_date, verification_level")
      .eq("profile_id", profileId)
      .order("cert_type");
    if (certsData) setCerts(certsData);

    // Crew history
    const { data: crewData } = await supabase
      .from("crew_history")
      .select("id, rank_held, joined_at, left_at, is_current, vessels(name, vessel_type, imo_number), companies(name)")
      .eq("profile_id", profileId)
      .order("joined_at", { ascending: false });
    if (crewData) setCrewHistory(crewData as unknown as CrewEntry[]);

    // Sea time records
    const { data: seaTimeData } = await supabase
      .from("sea_time_records")
      .select("vessel_type, days")
      .eq("profile_id", profileId);
    if (seaTimeData) {
      setSeaTime(seaTimeData);
      setTotalSeaDays(seaTimeData.reduce((sum, r) => sum + (r.days ?? 0), 0));
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => { loadData(); }, [loadData]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8 space-y-4">
        {[0, 1, 2, 3].map((i) => (
          <div key={i} className="h-24 bg-navy-800/50 rounded-lg animate-pulse" />
        ))}
      </div>
    );
  }

  if (!profile) {
    return (
      <div className="max-w-3xl mx-auto py-8 text-center">
        <p className="text-slate-400">Profile not found.</p>
      </div>
    );
  }

  // Calculate vessel type breakdown from sea time
  const vesselTypeBreakdown: Record<string, number> = {};
  for (const r of seaTime) {
    const type = r.vessel_type ?? "other";
    vesselTypeBreakdown[type] = (vesselTypeBreakdown[type] || 0) + (r.days ?? 0);
  }

  // Calculate rank progression from crew history
  const rankHistory = crewHistory
    .filter((e) => e.rank_held && e.joined_at)
    .map((e) => ({
      rank: e.rank_held!,
      date: e.joined_at!,
      vessel: e.vessels?.name ?? "Unknown",
      company: e.companies?.name ?? "",
    }))
    .sort((a, b) => new Date(a.date).getTime() - new Date(b.date).getTime());

  const uniqueVessels = new Set(crewHistory.map((e) => e.vessels?.name).filter(Boolean));
  const validCerts = certs.filter((c) => c.status === "valid").length;
  const verifiedCerts = certs.filter((c) => c.verification_level && c.verification_level !== "self_reported").length;
  const memberSince = profile.created_at ? new Date(profile.created_at).getFullYear() : "";

  // Career path recommendations
  const recommendations = getCareerRecommendations(certs, totalSeaDays, profile.rank_range, profile.department_tag);

  return (
    <div className="max-w-3xl mx-auto space-y-6">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
        <div className="flex items-start justify-between">
          <div>
            <h2 className="text-xl font-bold text-slate-100">{profile.display_name}</h2>
            <div className="flex items-center gap-2 mt-1 flex-wrap">
              {profile.is_verified && (
                <span className="text-xs px-2 py-0.5 bg-emerald-500/15 border border-emerald-500/40 rounded text-emerald-400">
                  Verified Seafarer
                </span>
              )}
              {profile.department_tag && (
                <span className="text-xs text-slate-400">{formatEnum(profile.department_tag)}</span>
              )}
              {profile.rank_range && (
                <span className="text-xs text-slate-400">{formatEnum(profile.rank_range)}</span>
              )}
              {profile.experience_band && (
                <span className="text-xs text-slate-500">{formatEnum(profile.experience_band)} experience</span>
              )}
            </div>
          </div>
          {memberSince && (
            <div className="text-right">
              <p className="text-xs text-slate-500">Member since</p>
              <p className="text-sm font-mono text-slate-300">{memberSince}</p>
            </div>
          )}
        </div>

        {/* Quick Stats */}
        <div className="grid grid-cols-2 sm:grid-cols-4 gap-4 mt-6 pt-4 border-t border-navy-700">
          <QuickStat label="Total Sea Time" value={`${totalSeaDays} days`} />
          <QuickStat label="Vessels Served" value={String(uniqueVessels.size)} />
          <QuickStat label="Valid Certs" value={String(validCerts)} />
          <QuickStat label="Verified Certs" value={String(verifiedCerts)} />
        </div>
      </div>

      {/* Certificates */}
      <section className="bg-navy-900 border border-navy-700 rounded-lg p-5">
        <div className="flex items-center justify-between mb-4">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide">Certificates</h3>
          <Link href="/career/certs" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
            Manage &rarr;
          </Link>
        </div>
        {certs.length === 0 ? (
          <p className="text-slate-500 text-sm">No certificates added yet.</p>
        ) : (
          <div className="space-y-2">
            {certs.map((cert) => {
              const vl = VERIFICATION_LEVELS[cert.verification_level ?? "self_reported"] || VERIFICATION_LEVELS.self_reported;
              return (
                <div key={cert.id} className="flex items-center justify-between py-2 border-b border-navy-700/50 last:border-0">
                  <div>
                    <p className="text-sm text-slate-200">{cert.title}</p>
                    <div className="flex items-center gap-2 mt-0.5">
                      <span className="text-xs text-slate-500 uppercase">{cert.cert_type}</span>
                      <span className={`text-xs ${vl.color}`}>{vl.label}</span>
                    </div>
                  </div>
                  <span className={`text-xs font-medium capitalize ${
                    cert.status === "valid" ? "text-green-400" : cert.status === "expiring" ? "text-amber-400" : "text-red-400"
                  }`}>
                    {cert.status}
                  </span>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Sea Time Breakdown */}
      {Object.keys(vesselTypeBreakdown).length > 0 && (
        <section className="bg-navy-900 border border-navy-700 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Sea Time by Vessel Type</h3>
          <div className="space-y-3">
            {Object.entries(vesselTypeBreakdown)
              .sort(([, a], [, b]) => b - a)
              .map(([type, days]) => {
                const pct = totalSeaDays > 0 ? (days / totalSeaDays) * 100 : 0;
                return (
                  <div key={type}>
                    <div className="flex items-center justify-between mb-1">
                      <span className="text-sm text-slate-300">{formatEnum(type)}</span>
                      <span className="text-xs font-mono text-slate-400">{days} days ({Math.round(pct)}%)</span>
                    </div>
                    <div className="h-2 bg-navy-800 rounded-full overflow-hidden">
                      <div className="h-full bg-teal-500 rounded-full" style={{ width: `${pct}%` }} />
                    </div>
                  </div>
                );
              })}
          </div>
        </section>
      )}

      {/* Rank Progression */}
      {rankHistory.length > 0 && (
        <section className="bg-navy-900 border border-navy-700 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Rank Progression</h3>
          <div className="relative pl-6 space-y-4">
            <div className="absolute left-2 top-1 bottom-1 w-0.5 bg-navy-700" />
            {rankHistory.map((entry, i) => (
              <div key={i} className="relative">
                <div className="absolute -left-4 top-1 w-3 h-3 rounded-full bg-teal-500 border-2 border-navy-900" />
                <div>
                  <p className="text-sm font-medium text-slate-200">{formatEnum(entry.rank)}</p>
                  <p className="text-xs text-slate-500">
                    {new Date(entry.date).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}
                    {entry.vessel && ` \u2022 ${entry.vessel}`}
                    {entry.company && ` \u2022 ${entry.company}`}
                  </p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Vessels Served */}
      {crewHistory.length > 0 && (
        <section className="bg-navy-900 border border-navy-700 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Vessels Served</h3>
          <div className="space-y-2">
            {crewHistory.map((entry) => (
              <div key={entry.id} className="flex items-center justify-between py-2 border-b border-navy-700/50 last:border-0">
                <div>
                  <p className="text-sm text-slate-200">{entry.vessels?.name ?? "Unknown"}</p>
                  <div className="flex items-center gap-2 mt-0.5 text-xs text-slate-500">
                    {entry.vessels?.vessel_type && <span>{formatEnum(entry.vessels.vessel_type)}</span>}
                    {entry.vessels?.imo_number && <span>IMO {entry.vessels.imo_number}</span>}
                    {entry.companies?.name && <span>{entry.companies.name}</span>}
                  </div>
                </div>
                <div className="text-right text-xs text-slate-500">
                  {entry.joined_at && (
                    <span>{new Date(entry.joined_at).toLocaleDateString("en-GB", { month: "short", year: "numeric" })}</span>
                  )}
                  {entry.is_current && (
                    <span className="ml-2 text-xs text-teal-400">Current</span>
                  )}
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      {/* Career Path Recommendations */}
      {recommendations.length > 0 && (
        <section className="bg-navy-900 border border-navy-700 rounded-lg p-5">
          <h3 className="text-sm font-semibold text-slate-300 uppercase tracking-wide mb-4">Next Steps</h3>
          <p className="text-xs text-slate-500 mb-3">
            Based on your current certificates and experience, these are recommended next steps for career progression.
          </p>
          <div className="space-y-2">
            {recommendations.map((rec, i) => (
              <div key={i} className="flex items-start gap-3 py-2 border-b border-navy-700/50 last:border-0">
                <span className="text-lg flex-shrink-0">{rec.icon}</span>
                <div>
                  <p className="text-sm text-slate-200">{rec.title}</p>
                  <p className="text-xs text-slate-500 mt-0.5">{rec.description}</p>
                </div>
              </div>
            ))}
          </div>
        </section>
      )}

      <p className="text-xs text-slate-600 text-center pb-4">
        This record is generated from your SeaSignal profile data. It is not exportable and accumulates value over time.
      </p>
    </div>
  );
}

function QuickStat({ label, value }: { label: string; value: string }) {
  return (
    <div className="text-center">
      <p className="text-xs text-slate-500">{label}</p>
      <p className="text-lg font-mono font-bold text-teal-400 mt-1">{value}</p>
    </div>
  );
}

type Recommendation = { icon: string; title: string; description: string };

function getCareerRecommendations(
  certs: CertSummary[],
  totalSeaDays: number,
  rankRange: string | null,
  department: string | null,
): Recommendation[] {
  const recs: Recommendation[] = [];
  const certTypes = new Set(certs.map((c) => c.cert_type));
  const hasExpiredCerts = certs.some((c) => c.status === "expired");
  const unverifiedCerts = certs.filter((c) => !c.verification_level || c.verification_level === "self_reported");

  if (hasExpiredCerts) {
    recs.push({
      icon: "\uD83D\uDEA8",
      title: "Renew expired certificates",
      description: "You have expired certificates that need renewal before your next contract.",
    });
  }

  if (unverifiedCerts.length > 0 && certs.length > 0) {
    recs.push({
      icon: "\uD83D\uDCC4",
      title: `Upload documents for ${unverifiedCerts.length} certificate${unverifiedCerts.length > 1 ? "s" : ""}`,
      description: "Uploading certificate documents increases your verification level and builds your professional record.",
    });
  }

  if (rankRange === "cadet" && totalSeaDays >= 360) {
    recs.push({
      icon: "\uD83C\uDF93",
      title: "Consider sitting for your OOW exam",
      description: "With 12+ months of qualifying sea service, you may be eligible for Officer of the Watch certification.",
    });
  }

  if (rankRange === "officer" && totalSeaDays >= 1080) {
    recs.push({
      icon: "\u2B50",
      title: "Progress to Chief Officer / 2nd Engineer",
      description: "Your 36+ months of officer sea time may qualify you for promotion. Check flag state requirements.",
    });
  }

  if (department === "deck" && !certTypes.has("gmdss")) {
    recs.push({
      icon: "\uD83D\uDCE1",
      title: "Consider GMDSS certification",
      description: "GMDSS (General Operator Certificate) is required for all deck officers on SOLAS vessels.",
    });
  }

  if (!certTypes.has("medical")) {
    recs.push({
      icon: "\uD83C\uDFE5",
      title: "Add your medical certificate",
      description: "A valid ENG1/PEME medical certificate is required for all sea service. Track its expiry here.",
    });
  }

  if (totalSeaDays === 0) {
    recs.push({
      icon: "\u26F5",
      title: "Log your sea time",
      description: "Start building your professional record by adding your sea time entries and crew history.",
    });
  }

  return recs.slice(0, 4);
}
