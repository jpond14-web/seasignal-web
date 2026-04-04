"use client";

import { useEffect, useState, useCallback } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import type { Tables, Enums } from "@/lib/supabase/types";

type SeaTimeRecord = Tables<"sea_time_records">;
type VesselLookup = Pick<Tables<"vessels">, "id" | "name" | "imo_number" | "vessel_type">;

const vesselTypeOptions: { value: string; label: string }[] = [
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

function formatVesselType(val: string): string {
  return val.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase());
}

function formatDate(d: string | null): string {
  if (!d) return "--";
  return new Date(d).toLocaleDateString("en-GB", {
    day: "numeric",
    month: "short",
    year: "numeric",
  });
}

// Sea time requirements for common rank progressions (approximate STCW minimums in days)
const rankProgressions: { from: string; to: string; requiredDays: number }[] = [
  { from: "Cadet", to: "Officer of the Watch", requiredDays: 365 },
  { from: "Officer of the Watch", to: "Chief Officer", requiredDays: 540 },
  { from: "Chief Officer", to: "Master", requiredDays: 1080 },
  { from: "Junior Engineer", to: "Fourth Engineer", requiredDays: 365 },
  { from: "Fourth Engineer", to: "Second Engineer", requiredDays: 540 },
  { from: "Second Engineer", to: "Chief Engineer", requiredDays: 1080 },
];

export default function SeaTimePage() {
  const router = useRouter();
  const supabase = createClient();
  const { showToast } = useToast();

  const [profileId, setProfileId] = useState<string | null>(null);
  const [records, setRecords] = useState<SeaTimeRecord[]>([]);
  const [vessels, setVessels] = useState<VesselLookup[]>([]);
  const [loading, setLoading] = useState(true);

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [formVesselType, setFormVesselType] = useState("tanker");
  const [formRankHeld, setFormRankHeld] = useState("");
  const [formDays, setFormDays] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formVesselId, setFormVesselId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [vesselSearch, setVesselSearch] = useState("");
  const [saving, setSaving] = useState(false);

  const loadData = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      router.push("/login");
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();

    if (!profile) {
      router.push("/profile/setup");
      return;
    }

    setProfileId(profile.id);

    const [recordsRes, vesselsRes] = await Promise.all([
      supabase
        .from("sea_time_records")
        .select("*")
        .eq("profile_id", profile.id)
        .order("start_date", { ascending: false }),
      supabase.from("vessels").select("id, name, imo_number, vessel_type").limit(500),
    ]);

    setRecords(recordsRes.data || []);
    setVessels((vesselsRes.data || []) as VesselLookup[]);
    setLoading(false);
  }, [supabase, router]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  const totalDays = records.reduce((sum, r) => sum + r.days, 0);

  // Breakdown by vessel type
  const breakdownMap = new Map<string, number>();
  for (const r of records) {
    breakdownMap.set(r.vessel_type, (breakdownMap.get(r.vessel_type) || 0) + r.days);
  }
  const breakdown = Array.from(breakdownMap.entries())
    .sort((a, b) => b[1] - a[1]);
  const maxBreakdownDays = breakdown.length > 0 ? breakdown[0][1] : 1;

  // Vessel lookup map
  const vesselMap = new Map(vessels.map((v) => [v.id, v]));

  // Filtered vessels for search
  const filteredVessels = vesselSearch.length >= 2
    ? vessels.filter(
        (v) =>
          v.name.toLowerCase().includes(vesselSearch.toLowerCase()) ||
          v.imo_number.includes(vesselSearch)
      ).slice(0, 10)
    : [];

  function resetForm() {
    setFormVesselType("tanker");
    setFormRankHeld("");
    setFormDays("");
    setFormStartDate("");
    setFormEndDate("");
    setFormVesselId("");
    setFormNotes("");
    setVesselSearch("");
    setEditingId(null);
    setShowForm(false);
  }

  function startEdit(record: SeaTimeRecord) {
    setEditingId(record.id);
    setFormVesselType(record.vessel_type);
    setFormRankHeld(record.rank_held || "");
    setFormDays(String(record.days));
    setFormStartDate(record.start_date || "");
    setFormEndDate(record.end_date || "");
    setFormVesselId(record.vessel_id || "");
    setFormNotes(record.notes || "");
    if (record.vessel_id) {
      const v = vesselMap.get(record.vessel_id);
      setVesselSearch(v ? v.name : "");
    } else {
      setVesselSearch("");
    }
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId) return;
    setSaving(true);

    const payload = {
      profile_id: profileId,
      vessel_type: formVesselType,
      rank_held: formRankHeld.trim() || null,
      days: parseInt(formDays, 10),
      start_date: formStartDate || null,
      end_date: formEndDate || null,
      vessel_id: formVesselId || null,
      notes: formNotes.trim() || null,
    };

    if (editingId) {
      const { error } = await supabase
        .from("sea_time_records")
        .update(payload)
        .eq("id", editingId);
      if (error) {
        showToast(error.message, "error");
      } else {
        showToast("Record updated");
      }
    } else {
      const { error } = await supabase.from("sea_time_records").insert(payload);
      if (error) {
        showToast(error.message, "error");
      } else {
        showToast("Sea time record added");
      }
    }

    setSaving(false);
    resetForm();
    loadData();
  }

  async function handleDelete(id: string) {
    if (!confirm("Delete this sea time record?")) return;
    const { error } = await supabase.from("sea_time_records").delete().eq("id", id);
    if (error) {
      showToast(error.message, "error");
    } else {
      showToast("Record deleted");
      loadData();
    }
  }

  // Career readiness
  const bestProgression = rankProgressions.find((p) => totalDays < p.requiredDays) || rankProgressions[rankProgressions.length - 1];
  const progressPercent = Math.min(100, Math.round((totalDays / bestProgression.requiredDays) * 100));

  if (loading) {
    return (
      <div className="flex items-center justify-center py-12">
        <p className="text-slate-400">Loading sea time records...</p>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <h1 className="text-2xl font-bold text-slate-100">Sea Time</h1>
        <button
          onClick={() => {
            resetForm();
            setShowForm(true);
          }}
          className="px-4 py-2 text-sm bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded transition-colors"
        >
          + Add Sea Time
        </button>
      </div>

      {/* Total sea time display */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 mb-6">
        <div className="text-center">
          <p className="text-5xl font-mono font-bold text-teal-400">{totalDays.toLocaleString()}</p>
          <p className="text-sm text-slate-400 mt-1">Total Sea Days</p>
        </div>

        {/* Breakdown by vessel type */}
        {breakdown.length > 0 && (
          <div className="mt-6 space-y-3">
            <p className="text-xs text-slate-500 uppercase tracking-wider">Breakdown by Vessel Type</p>
            {breakdown.map(([type, days]) => (
              <div key={type} className="space-y-1">
                <div className="flex items-center justify-between text-sm">
                  <span className="text-slate-300">{formatVesselType(type)}</span>
                  <span className="text-teal-400 font-mono">{days} days</span>
                </div>
                <div className="w-full h-2 bg-navy-800 rounded-full overflow-hidden">
                  <div
                    className="h-full bg-teal-500 rounded-full transition-all"
                    style={{ width: `${(days / maxBreakdownDays) * 100}%` }}
                  />
                </div>
              </div>
            ))}
          </div>
        )}
      </div>

      {/* Career readiness */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
        <p className="text-xs text-slate-500 uppercase tracking-wider mb-3">Career Readiness</p>
        <p className="text-sm text-slate-300 mb-2">
          Based on your sea time, you have{" "}
          <span className="text-teal-400 font-bold">{totalDays} days</span> toward{" "}
          <span className="text-slate-100 font-semibold">{bestProgression.to}</span>{" "}
          ({bestProgression.requiredDays} days required)
        </p>
        <div className="w-full h-3 bg-navy-800 rounded-full overflow-hidden">
          <div
            className="h-full bg-teal-500 rounded-full transition-all"
            style={{ width: `${progressPercent}%` }}
          />
        </div>
        <p className="text-xs text-slate-500 mt-1.5 text-right">{progressPercent}%</p>
      </div>

      {/* Add/Edit Form */}
      {showForm && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            {editingId ? "Edit Sea Time Record" : "Add Sea Time Record"}
          </h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
              <div>
                <label htmlFor="vesselType" className="block text-sm text-slate-300 mb-1">
                  Vessel Type
                </label>
                <select
                  id="vesselType"
                  value={formVesselType}
                  onChange={(e) => setFormVesselType(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                >
                  {vesselTypeOptions.map((vt) => (
                    <option key={vt.value} value={vt.value}>
                      {vt.label}
                    </option>
                  ))}
                </select>
              </div>
              <div>
                <label htmlFor="rankHeld" className="block text-sm text-slate-300 mb-1">
                  Rank Held
                </label>
                <input
                  id="rankHeld"
                  type="text"
                  value={formRankHeld}
                  onChange={(e) => setFormRankHeld(e.target.value)}
                  placeholder="e.g. Third Officer"
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="days" className="block text-sm text-slate-300 mb-1">
                  Days
                </label>
                <input
                  id="days"
                  type="number"
                  min={1}
                  value={formDays}
                  onChange={(e) => setFormDays(e.target.value)}
                  required
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="startDate" className="block text-sm text-slate-300 mb-1">
                  Start Date
                </label>
                <input
                  id="startDate"
                  type="date"
                  value={formStartDate}
                  onChange={(e) => setFormStartDate(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div>
                <label htmlFor="endDate" className="block text-sm text-slate-300 mb-1">
                  End Date
                </label>
                <input
                  id="endDate"
                  type="date"
                  value={formEndDate}
                  onChange={(e) => setFormEndDate(e.target.value)}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
              <div className="relative">
                <label htmlFor="vesselSearch" className="block text-sm text-slate-300 mb-1">
                  Vessel (optional)
                </label>
                <input
                  id="vesselSearch"
                  type="text"
                  value={vesselSearch}
                  onChange={(e) => {
                    setVesselSearch(e.target.value);
                    if (!e.target.value) setFormVesselId("");
                  }}
                  placeholder="Search by name or IMO..."
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
                />
                {filteredVessels.length > 0 && !formVesselId && (
                  <ul className="absolute z-10 mt-1 w-full bg-navy-800 border border-navy-600 rounded shadow-lg max-h-40 overflow-y-auto">
                    {filteredVessels.map((v) => (
                      <li key={v.id}>
                        <button
                          type="button"
                          onClick={() => {
                            setFormVesselId(v.id);
                            setVesselSearch(v.name);
                          }}
                          className="w-full text-left px-3 py-2 text-sm text-slate-200 hover:bg-navy-700 transition-colors"
                        >
                          {v.name}{" "}
                          <span className="text-slate-500 text-xs">IMO {v.imo_number}</span>
                        </button>
                      </li>
                    ))}
                  </ul>
                )}
                {formVesselId && (
                  <button
                    type="button"
                    onClick={() => {
                      setFormVesselId("");
                      setVesselSearch("");
                    }}
                    className="absolute right-2 top-8 text-slate-500 hover:text-slate-300 text-xs"
                  >
                    clear
                  </button>
                )}
              </div>
            </div>
            <div>
              <label htmlFor="notes" className="block text-sm text-slate-300 mb-1">
                Notes
              </label>
              <textarea
                id="notes"
                value={formNotes}
                onChange={(e) => setFormNotes(e.target.value)}
                rows={2}
                maxLength={500}
                placeholder="Any additional notes..."
                className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none resize-none"
              />
            </div>
            <div className="flex gap-3">
              <button
                type="submit"
                disabled={saving}
                className="px-5 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
              >
                {saving ? "Saving..." : editingId ? "Update Record" : "Add Record"}
              </button>
              <button
                type="button"
                onClick={resetForm}
                className="px-4 py-2 bg-navy-800 border border-navy-600 rounded hover:bg-navy-700 text-slate-300 text-sm transition-colors"
              >
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {/* Records list */}
      <div className="space-y-3">
        <p className="text-xs text-slate-500 uppercase tracking-wider">
          All Records ({records.length})
        </p>
        {records.length === 0 ? (
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
            <p className="text-slate-400">No sea time records yet.</p>
            <p className="text-slate-500 text-sm mt-1">
              Add your first record to start tracking your career.
            </p>
          </div>
        ) : (
          records.map((record) => {
            const vessel = record.vessel_id ? vesselMap.get(record.vessel_id) : null;
            return (
              <div
                key={record.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-4 flex items-start justify-between gap-4"
              >
                <div className="min-w-0 flex-1">
                  <div className="flex items-center gap-2 flex-wrap">
                    <span className="text-sm font-medium text-slate-100">
                      {formatVesselType(record.vessel_type)}
                    </span>
                    {record.rank_held && (
                      <span className="px-2 py-0.5 text-xs bg-navy-800 border border-navy-600 rounded text-slate-400">
                        {record.rank_held}
                      </span>
                    )}
                    <span className="text-teal-400 font-mono text-sm font-bold">
                      {record.days} days
                    </span>
                  </div>
                  <div className="text-xs text-slate-500 mt-1 flex items-center gap-2 flex-wrap">
                    <span>
                      {formatDate(record.start_date)} - {formatDate(record.end_date)}
                    </span>
                    {vessel && (
                      <span className="text-slate-400">
                        on <span className="text-slate-300">{vessel.name}</span>
                      </span>
                    )}
                  </div>
                  {record.notes && (
                    <p className="text-xs text-slate-500 mt-1">{record.notes}</p>
                  )}
                </div>
                <div className="flex items-center gap-1 shrink-0">
                  <button
                    onClick={() => startEdit(record)}
                    className="p-1.5 text-slate-500 hover:text-teal-400 transition-colors"
                    aria-label="Edit record"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M11 5H6a2 2 0 00-2 2v11a2 2 0 002 2h11a2 2 0 002-2v-5m-1.414-9.414a2 2 0 112.828 2.828L11.828 15H9v-2.828l8.586-8.586z" />
                    </svg>
                  </button>
                  <button
                    onClick={() => handleDelete(record.id)}
                    className="p-1.5 text-slate-500 hover:text-red-400 transition-colors"
                    aria-label="Delete record"
                  >
                    <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M19 7l-.867 12.142A2 2 0 0116.138 21H7.862a2 2 0 01-1.995-1.858L5 7m5 4v6m4-6v6m1-10V4a1 1 0 00-1-1h-4a1 1 0 00-1 1v3M4 7h16" />
                    </svg>
                  </button>
                </div>
              </div>
            );
          })
        )}
      </div>
    </div>
  );
}
