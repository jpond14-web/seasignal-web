"use client";

import { useEffect, useState, useCallback, useRef } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { parseSeaTimeCsv, type ParsedRow } from "@/lib/utils/csvParser";
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

const SEA_TIME_STEPS = [
  { num: 1, label: "Assignment" },
  { num: 2, label: "Duration" },
  { num: 3, label: "Vessel" },
];

function StepIndicator({ steps, current }: { steps: { num: number; label: string }[]; current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {steps.map((step, i) => (
        <div key={step.num} className="flex items-center">
          <div className="flex flex-col items-center">
            <div
              className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold border-2 transition-colors ${
                current === step.num
                  ? "border-teal-500 bg-teal-500 text-navy-950"
                  : current > step.num
                    ? "border-teal-500 bg-teal-500/20 text-teal-400"
                    : "border-navy-600 bg-navy-800 text-slate-500"
              }`}
            >
              {current > step.num ? (
                <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={3}>
                  <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
                </svg>
              ) : (
                step.num
              )}
            </div>
            <span
              className={`text-xs mt-1 ${
                current >= step.num ? "text-teal-400" : "text-slate-500"
              }`}
            >
              {step.label}
            </span>
          </div>
          {i < steps.length - 1 && (
            <div
              className={`w-12 sm:w-16 h-0.5 mb-5 mx-1 transition-colors ${
                current > step.num ? "bg-teal-500" : "bg-navy-600"
              }`}
            />
          )}
        </div>
      ))}
    </div>
  );
}

/* ─── CSV Import Modal ─── */

function CsvImportModal({
  profileId,
  onClose,
  onSuccess,
}: {
  profileId: string;
  onClose: () => void;
  onSuccess: () => void;
}) {
  const supabase = createClient();
  const { showToast } = useToast();
  const fileRef = useRef<HTMLInputElement>(null);

  const [parsed, setParsed] = useState<{ valid: ParsedRow[]; errors: { row: number; message: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);

  function downloadTemplate() {
    const csv = `vessel_type,rank_held,days,start_date,end_date,notes\ntanker,Third Officer,120,2025-01-15,2025-05-15,Maiden voyage`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "sea_time_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setParsed(parseSeaTimeCsv(text));
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!parsed || parsed.valid.length === 0) return;
    setImporting(true);

    const rows = parsed.valid.map((r) => ({
      profile_id: profileId,
      vessel_type: r.vessel_type,
      rank_held: r.rank_held || null,
      days: r.days,
      start_date: r.start_date,
      end_date: r.end_date,
      notes: r.notes || null,
      vessel_id: null,
    }));

    const { error } = await supabase.from("sea_time_records").insert(rows);
    setImporting(false);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast(`Imported ${rows.length} record${rows.length !== 1 ? "s" : ""} successfully`);
      onSuccess();
      onClose();
    }
  }

  return (
    <div className="fixed inset-0 z-50 flex items-center justify-center p-4">
      {/* Backdrop */}
      <div
        className="absolute inset-0 bg-black/60 backdrop-blur-sm"
        onClick={onClose}
      />

      {/* Modal */}
      <div className="relative w-full max-w-2xl max-h-[85vh] overflow-y-auto bg-navy-900 border border-navy-700 rounded-xl shadow-2xl p-6">
        <div className="flex items-center justify-between mb-4">
          <h2 className="text-lg font-semibold text-slate-100">Import Sea Time from CSV</h2>
          <button
            onClick={onClose}
            className="p-1 text-slate-400 hover:text-slate-200 transition-colors"
            aria-label="Close modal"
          >
            <svg className="w-5 h-5" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M6 18L18 6M6 6l12 12" />
            </svg>
          </button>
        </div>

        <p className="text-sm text-slate-400 mb-4">
          Import multiple sea time records at once from a CSV file.
        </p>

        <div className="flex flex-wrap gap-3 mb-5">
          <button
            onClick={downloadTemplate}
            className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-teal-400 border border-teal-500/30 rounded hover:bg-teal-500/10 transition-colors"
          >
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-4l-4 4m0 0l-4-4m4 4V4" />
            </svg>
            Download Template
          </button>

          <label className="inline-flex items-center gap-1.5 px-3 py-1.5 text-sm text-slate-300 border border-navy-600 rounded hover:bg-navy-800 transition-colors cursor-pointer">
            <svg className="w-4 h-4" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
              <path strokeLinecap="round" strokeLinejoin="round" d="M4 16v1a3 3 0 003 3h10a3 3 0 003-3v-1m-4-8l-4-4m0 0L8 8m4-4v12" />
            </svg>
            Choose CSV File
            <input
              ref={fileRef}
              type="file"
              accept=".csv"
              onChange={handleFile}
              className="hidden"
            />
          </label>
        </div>

        {parsed && (
          <>
            {/* Valid rows preview */}
            {parsed.valid.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-green-400 mb-2">
                  {parsed.valid.length} valid record{parsed.valid.length !== 1 ? "s" : ""}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-navy-700 text-slate-500">
                        <th className="pb-2 pr-3">Vessel Type</th>
                        <th className="pb-2 pr-3">Rank</th>
                        <th className="pb-2 pr-3">Days</th>
                        <th className="pb-2 pr-3">Start</th>
                        <th className="pb-2 pr-3">End</th>
                        <th className="pb-2">Notes</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.valid.map((r, i) => (
                        <tr key={i} className="border-b border-navy-800 text-slate-300">
                          <td className="py-1.5 pr-3">{formatVesselType(r.vessel_type)}</td>
                          <td className="py-1.5 pr-3">{r.rank_held || "--"}</td>
                          <td className="py-1.5 pr-3 text-teal-400 font-mono">{r.days}</td>
                          <td className="py-1.5 pr-3">{r.start_date}</td>
                          <td className="py-1.5 pr-3">{r.end_date}</td>
                          <td className="py-1.5 truncate max-w-[120px]">{r.notes || "--"}</td>
                        </tr>
                      ))}
                    </tbody>
                  </table>
                </div>
              </div>
            )}

            {/* Error rows */}
            {parsed.errors.length > 0 && (
              <div className="mb-4">
                <p className="text-sm font-medium text-red-400 mb-2">
                  {parsed.errors.length} error{parsed.errors.length !== 1 ? "s" : ""}
                </p>
                <ul className="space-y-1">
                  {parsed.errors.map((err, i) => (
                    <li key={i} className="text-xs text-red-300 bg-red-500/10 border border-red-500/20 rounded px-3 py-1.5">
                      Row {err.row}: {err.message}
                    </li>
                  ))}
                </ul>
              </div>
            )}

            {/* Import button */}
            {parsed.valid.length > 0 && (
              <div className="flex gap-3 mt-4">
                <button
                  onClick={handleImport}
                  disabled={importing}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
                >
                  {importing ? "Importing..." : `Import All (${parsed.valid.length})`}
                </button>
                <button
                  onClick={onClose}
                  className="px-4 py-2 bg-navy-800 border border-navy-600 rounded hover:bg-navy-700 text-slate-300 text-sm transition-colors"
                >
                  Cancel
                </button>
              </div>
            )}
          </>
        )}
      </div>
    </div>
  );
}

/* ─── Main Page ─── */

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
  const [formStep, setFormStep] = useState(1);
  const [formVesselType, setFormVesselType] = useState("tanker");
  const [formRankHeld, setFormRankHeld] = useState("");
  const [formDays, setFormDays] = useState("");
  const [formStartDate, setFormStartDate] = useState("");
  const [formEndDate, setFormEndDate] = useState("");
  const [formVesselId, setFormVesselId] = useState("");
  const [formNotes, setFormNotes] = useState("");
  const [vesselSearch, setVesselSearch] = useState("");
  const [saving, setSaving] = useState(false);

  // CSV import
  const [showCsvModal, setShowCsvModal] = useState(false);

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
    setFormStep(1);
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
    setFormStep(1);
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

  function canAdvanceStep(): boolean {
    if (formStep === 1) {
      return formVesselType.length > 0;
    }
    if (formStep === 2) {
      return formDays.length > 0 && parseInt(formDays, 10) > 0;
    }
    return true;
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
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-4 py-2 text-sm bg-navy-800 border border-navy-600 hover:bg-navy-700 text-slate-300 font-medium rounded transition-colors"
          >
            Import CSV
          </button>
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

      {/* Add/Edit Form — Multi-step wizard */}
      {showForm && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            {editingId ? "Edit Sea Time Record" : "Add Sea Time Record"}
          </h2>

          <StepIndicator steps={SEA_TIME_STEPS} current={formStep} />

          <form onSubmit={handleSave}>
            {/* Step 1: Assignment */}
            {formStep === 1 && (
              <div className="space-y-4">
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
                </div>
              </div>
            )}

            {/* Step 2: Duration */}
            {formStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-3 gap-4">
                  <div>
                    <label htmlFor="days" className="block text-sm text-slate-300 mb-1">
                      Days *
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
                </div>
              </div>
            )}

            {/* Step 3: Vessel + Notes */}
            {formStep === 3 && (
              <div className="space-y-4">
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
              </div>
            )}

            {/* Navigation buttons */}
            <div className="flex gap-3 mt-6">
              {formStep > 1 && (
                <button
                  type="button"
                  onClick={() => setFormStep(formStep - 1)}
                  className="px-4 py-2 bg-navy-800 border border-navy-600 rounded hover:bg-navy-700 text-slate-300 text-sm transition-colors"
                >
                  Back
                </button>
              )}
              {formStep < 3 && (
                <button
                  type="button"
                  disabled={!canAdvanceStep()}
                  onClick={() => setFormStep(formStep + 1)}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
                >
                  Next
                </button>
              )}
              {formStep === 3 && (
                <button
                  type="submit"
                  disabled={saving}
                  className="px-5 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
                >
                  {saving ? "Saving..." : editingId ? "Update Record" : "Add Record"}
                </button>
              )}
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

      {/* CSV Import Modal */}
      {showCsvModal && profileId && (
        <CsvImportModal
          profileId={profileId}
          onClose={() => setShowCsvModal(false)}
          onSuccess={loadData}
        />
      )}
    </div>
  );
}
