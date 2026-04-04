"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import Link from "next/link";

type CrewHistoryEntry = {
  id: string;
  profile_id: string;
  vessel_id: string;
  company_id: string | null;
  rank_held: string;
  joined_at: string | null;
  left_at: string | null;
  is_current: boolean;
  created_at: string;
  vessel_name?: string;
  company_name?: string;
};

type VesselOption = {
  id: string;
  name: string;
  imo_number: string;
};

type CompanyOption = {
  id: string;
  name: string;
};

type ReconnectProfile = {
  id: string;
  display_name: string;
  department_tag: string | null;
  is_verified: boolean;
  avatar_url: string | null;
  vessel_name: string;
};

function formatDate(d: string | null): string {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("en-GB", {
    month: "short",
    year: "numeric",
  });
}

export function CrewHistorySection({ profileId }: { profileId: string }) {
  const supabase = createClient();
  const { showToast } = useToast();

  const [entries, setEntries] = useState<CrewHistoryEntry[]>([]);
  const [vessels, setVessels] = useState<VesselOption[]>([]);
  const [companies, setCompanies] = useState<CompanyOption[]>([]);
  const [reconnects, setReconnects] = useState<ReconnectProfile[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [saving, setSaving] = useState(false);

  // Invite modal
  const [showInvite, setShowInvite] = useState(false);
  const [lastAddedVesselName, setLastAddedVesselName] = useState("");

  // Form state
  const [vesselSearch, setVesselSearch] = useState("");
  const [selectedVesselId, setSelectedVesselId] = useState("");
  const [companySearch, setCompanySearch] = useState("");
  const [selectedCompanyId, setSelectedCompanyId] = useState("");
  const [rankHeld, setRankHeld] = useState("");
  const [joinedAt, setJoinedAt] = useState("");
  const [leftAt, setLeftAt] = useState("");
  const [isCurrent, setIsCurrent] = useState(false);

  const loadData = useCallback(async () => {
    // Load crew history with vessel/company names
    const { data: history } = await supabase
      .from("crew_history")
      .select("*")
      .eq("profile_id", profileId)
      .order("joined_at", { ascending: false });

    if (history && history.length > 0) {
      // Fetch vessel names
      const vesselIds = [...new Set(history.map((h) => h.vessel_id))];
      const { data: vesselData } = await supabase
        .from("vessels")
        .select("id, name")
        .in("id", vesselIds);
      const vesselMap = new Map((vesselData || []).map((v) => [v.id, v.name]));

      // Fetch company names
      const companyIds = [...new Set(history.filter((h) => h.company_id).map((h) => h.company_id!))];
      let companyMap = new Map<string, string>();
      if (companyIds.length > 0) {
        const { data: companyData } = await supabase
          .from("companies")
          .select("id, name")
          .in("id", companyIds);
        companyMap = new Map((companyData || []).map((c) => [c.id, c.name]));
      }

      const enriched = history.map((h) => ({
        ...h,
        vessel_name: vesselMap.get(h.vessel_id) || "Unknown Vessel",
        company_name: h.company_id ? companyMap.get(h.company_id) || undefined : undefined,
      }));
      setEntries(enriched);

      // Find crew reconnects: other profiles who served on the same vessels with overlapping dates
      await loadReconnects(history);
    } else {
      setEntries([]);
    }

    // Load vessels and companies for search
    const [vRes, cRes] = await Promise.all([
      supabase.from("vessels").select("id, name, imo_number").limit(500),
      supabase.from("companies").select("id, name").limit(500),
    ]);
    setVessels(vRes.data || []);
    setCompanies(cRes.data || []);
    setLoading(false);
  }, [supabase, profileId]);

  async function loadReconnects(
    history: { vessel_id: string; joined_at: string | null; left_at: string | null }[]
  ) {
    const vesselIds = [...new Set(history.map((h) => h.vessel_id))];
    if (vesselIds.length === 0) return;

    // Find other crew members on the same vessels
    const { data: otherCrew } = await supabase
      .from("crew_history")
      .select("profile_id, vessel_id, joined_at, left_at")
      .in("vessel_id", vesselIds)
      .neq("profile_id", profileId);

    if (!otherCrew || otherCrew.length === 0) return;

    // Check for date overlaps
    const matchedProfileIds = new Set<string>();
    const matchedVesselIds = new Map<string, string>();

    for (const other of otherCrew) {
      const myEntries = history.filter((h) => h.vessel_id === other.vessel_id);
      for (const mine of myEntries) {
        // Simple overlap check: if either has no dates, consider it a match
        const hasOverlap =
          !mine.joined_at ||
          !other.joined_at ||
          !mine.left_at ||
          !other.left_at ||
          (mine.joined_at <= (other.left_at || "9999-12-31") &&
            (mine.left_at || "9999-12-31") >= other.joined_at);

        if (hasOverlap) {
          matchedProfileIds.add(other.profile_id);
          matchedVesselIds.set(other.profile_id, other.vessel_id);
        }
      }
    }

    if (matchedProfileIds.size === 0) return;

    const ids = Array.from(matchedProfileIds).slice(0, 20);
    const { data: profiles } = await supabase
      .from("profiles")
      .select("id, display_name, department_tag, is_verified, avatar_url")
      .in("id", ids);

    // Get vessel names for display
    const matchedVesselIdSet = [...new Set(Array.from(matchedVesselIds.values()))];
    const { data: vesselNames } = await supabase
      .from("vessels")
      .select("id, name")
      .in("id", matchedVesselIdSet);
    const vMap = new Map((vesselNames || []).map((v) => [v.id, v.name]));

    const reconnectData: ReconnectProfile[] = (profiles || []).map((p) => ({
      ...p,
      vessel_name: vMap.get(matchedVesselIds.get(p.id) || "") || "Unknown",
    }));

    setReconnects(reconnectData);
  }

  useEffect(() => {
    loadData();
  }, [loadData]);

  const filteredVessels =
    vesselSearch.length >= 2
      ? vessels
          .filter(
            (v) =>
              v.name.toLowerCase().includes(vesselSearch.toLowerCase()) ||
              v.imo_number.includes(vesselSearch)
          )
          .slice(0, 8)
      : [];

  const filteredCompanies =
    companySearch.length >= 2
      ? companies
          .filter((c) => c.name.toLowerCase().includes(companySearch.toLowerCase()))
          .slice(0, 8)
      : [];

  function resetForm() {
    setVesselSearch("");
    setSelectedVesselId("");
    setCompanySearch("");
    setSelectedCompanyId("");
    setRankHeld("");
    setJoinedAt("");
    setLeftAt("");
    setIsCurrent(false);
    setShowForm(false);
  }

  async function handleAdd(e: React.FormEvent) {
    e.preventDefault();
    if (!selectedVesselId || !rankHeld.trim()) return;
    setSaving(true);

    const { error } = await supabase.from("crew_history").insert({
      profile_id: profileId,
      vessel_id: selectedVesselId,
      company_id: selectedCompanyId || null,
      rank_held: rankHeld.trim(),
      joined_at: joinedAt || null,
      left_at: isCurrent ? null : leftAt || null,
      is_current: isCurrent,
    });

    setSaving(false);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Vessel added to crew history");
      setLastAddedVesselName(vesselSearch);
      resetForm();
      setShowInvite(true);
      loadData();
    }
  }

  function getInviteLink() {
    const base = typeof window !== "undefined" ? window.location.origin : "https://seasignal.app";
    return `${base}?ref=${profileId.slice(0, 8)}`;
  }

  function copyInviteLink() {
    navigator.clipboard.writeText(getInviteLink());
    showToast("Invite link copied to clipboard");
  }

  function shareWhatsApp() {
    const text = encodeURIComponent(
      `Hey, I just added ${lastAddedVesselName || "a vessel"} to my crew history on SeaSignal. Were you on board too? Join here: ${getInviteLink()}`
    );
    window.open(`https://wa.me/?text=${text}`, "_blank");
  }

  if (loading) return null;

  return (
    <>
      {/* Crew History Section */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 mt-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Crew History</h2>
          <button
            onClick={() => setShowForm(true)}
            className="px-3 py-1.5 text-xs bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded transition-colors"
          >
            + Add Vessel
          </button>
        </div>

        {showForm && (
          <form onSubmit={handleAdd} className="mb-4 p-4 bg-navy-800 rounded-lg space-y-3">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div className="relative">
                <label className="block text-xs text-slate-400 mb-1">Vessel</label>
                <input
                  type="text"
                  value={vesselSearch}
                  onChange={(e) => {
                    setVesselSearch(e.target.value);
                    if (!e.target.value) setSelectedVesselId("");
                  }}
                  placeholder="Search vessel name or IMO..."
                  required
                  className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
                />
                {filteredVessels.length > 0 && !selectedVesselId && (
                  <ul className="absolute z-10 mt-1 w-full bg-navy-800 border border-navy-600 rounded shadow-lg max-h-36 overflow-y-auto">
                    {filteredVessels.map((v) => (
                      <li key={v.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedVesselId(v.id);
                            setVesselSearch(v.name);
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-navy-700"
                        >
                          {v.name}{" "}
                          <span className="text-slate-500 text-xs">IMO {v.imo_number}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div className="relative">
                <label className="block text-xs text-slate-400 mb-1">Company (optional)</label>
                <input
                  type="text"
                  value={companySearch}
                  onChange={(e) => {
                    setCompanySearch(e.target.value);
                    if (!e.target.value) setSelectedCompanyId("");
                  }}
                  placeholder="Search company..."
                  className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
                />
                {filteredCompanies.length > 0 && !selectedCompanyId && (
                  <ul className="absolute z-10 mt-1 w-full bg-navy-800 border border-navy-600 rounded shadow-lg max-h-36 overflow-y-auto">
                    {filteredCompanies.map((c) => (
                      <li key={c.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setSelectedCompanyId(c.id);
                            setCompanySearch(c.name);
                          }}
                          className="w-full text-left px-3 py-1.5 text-sm text-slate-200 hover:bg-navy-700"
                        >
                          {c.name}
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Rank Held</label>
                <input
                  type="text"
                  value={rankHeld}
                  onChange={(e) => setRankHeld(e.target.value)}
                  placeholder="e.g. Third Officer"
                  required
                  className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="flex items-end gap-2">
                <label className="flex items-center gap-2 text-sm text-slate-300 cursor-pointer">
                  <input
                    type="checkbox"
                    checked={isCurrent}
                    onChange={(e) => setIsCurrent(e.target.checked)}
                    className="accent-teal-500"
                  />
                  Currently on board
                </label>
              </div>
              <div>
                <label className="block text-xs text-slate-400 mb-1">Joined</label>
                <input
                  type="date"
                  value={joinedAt}
                  onChange={(e) => setJoinedAt(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              {!isCurrent && (
                <div>
                  <label className="block text-xs text-slate-400 mb-1">Left</label>
                  <input
                    type="date"
                    value={leftAt}
                    onChange={(e) => setLeftAt(e.target.value)}
                    className="w-full px-3 py-2 bg-navy-900 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                  />
                </div>
              )}
            </div>
            <div className="flex gap-2">
              <button
                type="submit"
                disabled={saving || !selectedVesselId}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
              >
                {saving ? "Saving..." : "Add to History"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-3 py-2 bg-navy-900 border border-navy-600 rounded text-slate-300 text-sm hover:bg-navy-700 transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        )}

        {entries.length === 0 ? (
          <p className="text-sm text-slate-500">No crew history yet. Add your first vessel.</p>
        ) : (
          <div className="space-y-2">
            {entries.map((entry) => (
              <div
                key={entry.id}
                className="flex items-center gap-3 p-3 bg-navy-800 rounded-lg"
              >
                <div className="w-8 h-8 rounded bg-navy-700 flex items-center justify-center text-teal-400 shrink-0">
                  <svg className="w-4 h-4" viewBox="0 0 20 20" fill="currentColor">
                    <path d="M3 14s1 3 7 3 7-3 7-3H3zm7-12l-3 8h6L10 2z" />
                  </svg>
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-100">
                      {entry.vessel_name}
                    </span>
                    {entry.is_current && (
                      <span className="px-1.5 py-0.5 text-[10px] bg-teal-500/20 text-teal-400 rounded border border-teal-500/30">
                        Current
                      </span>
                    )}
                  </div>
                  <div className="text-xs text-slate-500 flex items-center gap-2 flex-wrap">
                    <span>{entry.rank_held}</span>
                    {entry.company_name && (
                      <>
                        <span className="text-slate-600">|</span>
                        <span>{entry.company_name}</span>
                      </>
                    )}
                    <span className="text-slate-600">|</span>
                    <span>
                      {formatDate(entry.joined_at)} - {entry.is_current ? "Present" : formatDate(entry.left_at)}
                    </span>
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Crew Reconnect Section */}
      {reconnects.length > 0 && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 mt-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-1">Crew Reconnect</h2>
          <p className="text-xs text-slate-500 mb-4">
            You may have sailed with these people
          </p>
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {reconnects.map((person) => (
              <div
                key={person.id}
                className="flex items-center gap-3 p-3 bg-navy-800 rounded-lg"
              >
                <div className="w-10 h-10 rounded-full bg-navy-700 flex items-center justify-center text-lg font-bold text-teal-400 shrink-0">
                  {person.display_name.charAt(0).toUpperCase()}
                </div>
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-1.5">
                    <span className="text-sm font-medium text-slate-100 truncate">
                      {person.display_name}
                    </span>
                    {person.is_verified && (
                      <span className="text-teal-400 text-[10px]" title="Verified">
                        <svg className="w-3.5 h-3.5 inline" viewBox="0 0 20 20" fill="currentColor">
                          <path fillRule="evenodd" d="M6.267 3.455a3.066 3.066 0 001.745-.723 3.066 3.066 0 013.976 0 3.066 3.066 0 001.745.723 3.066 3.066 0 012.812 2.812c.051.643.304 1.254.723 1.745a3.066 3.066 0 010 3.976 3.066 3.066 0 00-.723 1.745 3.066 3.066 0 01-2.812 2.812 3.066 3.066 0 00-1.745.723 3.066 3.066 0 01-3.976 0 3.066 3.066 0 00-1.745-.723 3.066 3.066 0 01-2.812-2.812 3.066 3.066 0 00-.723-1.745 3.066 3.066 0 010-3.976 3.066 3.066 0 00.723-1.745 3.066 3.066 0 012.812-2.812zm7.44 5.252a1 1 0 00-1.414-1.414L9 10.586 7.707 9.293a1 1 0 00-1.414 1.414l2 2a1 1 0 001.414 0l4-4z" clipRule="evenodd" />
                        </svg>
                      </span>
                    )}
                  </div>
                  <div className="flex items-center gap-2 text-xs text-slate-500">
                    {person.department_tag && (
                      <span className="px-1.5 py-0.5 bg-navy-700 rounded text-slate-400 text-[10px]">
                        {person.department_tag.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
                      </span>
                    )}
                    <span>on {person.vessel_name}</span>
                  </div>
                </div>
                <Link
                  href="/messages"
                  className="px-2.5 py-1 text-xs bg-teal-500/10 text-teal-400 border border-teal-500/30 rounded hover:bg-teal-500/20 transition-colors shrink-0"
                >
                  Connect
                </Link>
              </div>
            ))}
          </div>
        </div>
      )}

      {/* Invite Your Crew Modal */}
      {showInvite && (
        <div className="fixed inset-0 z-50 flex items-center justify-center bg-navy-950/80 backdrop-blur-sm p-4">
          <div className="bg-navy-900 border border-navy-700 rounded-xl p-6 max-w-md w-full shadow-2xl">
            <div className="text-center mb-5">
              <div className="w-12 h-12 rounded-full bg-teal-500/20 flex items-center justify-center mx-auto mb-3">
                <svg className="w-6 h-6 text-teal-400" viewBox="0 0 20 20" fill="currentColor">
                  <path d="M9 6a3 3 0 11-6 0 3 3 0 016 0zM17 6a3 3 0 11-6 0 3 3 0 016 0zM12.93 17c.046-.327.07-.66.07-1a6.97 6.97 0 00-1.5-4.33A5 5 0 0119 16v1h-6.07zM6 11a5 5 0 015 5v1H1v-1a5 5 0 015-5z" />
                </svg>
              </div>
              <h3 className="text-lg font-semibold text-slate-100">Invite Your Crew</h3>
              <p className="text-sm text-slate-400 mt-1">
                Know who else was on board{lastAddedVesselName ? ` ${lastAddedVesselName}` : ""}? Invite them to SeaSignal.
              </p>
            </div>

            <div className="space-y-3">
              <div className="flex gap-2">
                <input
                  type="text"
                  readOnly
                  value={getInviteLink()}
                  className="flex-1 px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-300 text-sm truncate"
                />
                <button
                  onClick={copyInviteLink}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors shrink-0"
                >
                  Copy
                </button>
              </div>
              <button
                onClick={shareWhatsApp}
                className="w-full py-2.5 bg-green-600 hover:bg-green-500 text-white font-medium rounded text-sm transition-colors flex items-center justify-center gap-2"
              >
                <svg className="w-4 h-4" viewBox="0 0 24 24" fill="currentColor">
                  <path d="M17.472 14.382c-.297-.149-1.758-.867-2.03-.967-.273-.099-.471-.148-.67.15-.197.297-.767.966-.94 1.164-.173.199-.347.223-.644.075-.297-.15-1.255-.463-2.39-1.475-.883-.788-1.48-1.761-1.653-2.059-.173-.297-.018-.458.13-.606.134-.133.298-.347.446-.52.149-.174.198-.298.298-.497.099-.198.05-.371-.025-.52-.075-.149-.669-1.612-.916-2.207-.242-.579-.487-.5-.669-.51-.173-.008-.371-.01-.57-.01-.198 0-.52.074-.792.372-.272.297-1.04 1.016-1.04 2.479 0 1.462 1.065 2.875 1.213 3.074.149.198 2.096 3.2 5.077 4.487.709.306 1.262.489 1.694.625.712.227 1.36.195 1.871.118.571-.085 1.758-.719 2.006-1.413.248-.694.248-1.289.173-1.413-.074-.124-.272-.198-.57-.347m-5.421 7.403h-.004a9.87 9.87 0 01-5.031-1.378l-.361-.214-3.741.982.998-3.648-.235-.374a9.86 9.86 0 01-1.51-5.26c.001-5.45 4.436-9.884 9.888-9.884 2.64 0 5.122 1.03 6.988 2.898a9.825 9.825 0 012.893 6.994c-.003 5.45-4.437 9.884-9.885 9.884m8.413-18.297A11.815 11.815 0 0012.05 0C5.495 0 .16 5.335.157 11.892c0 2.096.547 4.142 1.588 5.945L.057 24l6.305-1.654a11.882 11.882 0 005.683 1.448h.005c6.554 0 11.89-5.335 11.893-11.893a11.821 11.821 0 00-3.48-8.413z" />
                </svg>
                Share via WhatsApp
              </button>
            </div>

            <button
              onClick={() => setShowInvite(false)}
              className="w-full mt-4 py-2 text-sm text-slate-400 hover:text-slate-200 transition-colors"
            >
              Maybe later
            </button>
          </div>
        </div>
      )}
    </>
  );
}
