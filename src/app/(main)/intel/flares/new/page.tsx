"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Database } from "@/lib/supabase/types";

type FlareCategory = Database["public"]["Enums"]["flare_category"];
type FlareSeverity = Database["public"]["Enums"]["flare_severity"];

const FLARE_CATEGORIES = [
  { value: "unsafe_water", label: "Unsafe Drinking Water" },
  { value: "wage_theft", label: "Wage Theft / Unpaid Wages" },
  { value: "forced_overtime", label: "Forced Overtime" },
  { value: "document_retention", label: "Document Retention (Passports Held)" },
  { value: "unsafe_conditions", label: "Unsafe Working Conditions" },
  { value: "harassment_abuse", label: "Harassment / Abuse" },
  { value: "environmental_violation", label: "Environmental Violation" },
  { value: "food_safety", label: "Food Safety Issues" },
  { value: "medical_neglect", label: "Medical Neglect" },
  { value: "other", label: "Other" },
];

const SEVERITY_LEVELS = [
  {
    value: "concern",
    label: "Concern",
    description: "Something isn't right and should be on the radar",
    color: "bg-amber-500/20 text-amber-400 border-amber-500/30",
  },
  {
    value: "violation",
    label: "Violation",
    description: "A clear breach of regulations or seafarer rights",
    color: "bg-orange-500/20 text-orange-400 border-orange-500/30",
  },
  {
    value: "critical",
    label: "Critical",
    description: "Immediate danger to health, safety, or wellbeing",
    color: "bg-red-500/20 text-red-400 border-red-500/30",
  },
];

export default function NewFlarePage() {
  return (
    <Suspense
      fallback={
        <div className="max-w-lg mx-auto">
          <p className="text-slate-400">Loading...</p>
        </div>
      }
    >
      <NewFlareForm />
    </Suspense>
  );
}

function NewFlareForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [companyId, setCompanyId] = useState(
    searchParams.get("company") || ""
  );
  const [vesselId, setVesselId] = useState(
    searchParams.get("vessel") || ""
  );
  const [category, setCategory] = useState<FlareCategory | "">("");
  const [severity, setSeverity] = useState<FlareSeverity>("concern");
  const [title, setTitle] = useState("");
  const [description, setDescription] = useState("");
  const [incidentDateStart, setIncidentDateStart] = useState("");
  const [incidentDateEnd, setIncidentDateEnd] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");
  const [uploadingFile, setUploadingFile] = useState(false);
  const [attachments, setAttachments] = useState<string[]>([]);

  const [companies, setCompanies] = useState<{ id: string; name: string }[]>(
    []
  );
  const [vessels, setVessels] = useState<
    { id: string; name: string; owner_company_id: string | null; operator_company_id: string | null; manager_company_id: string | null }[]
  >([]);

  useEffect(() => {
    supabase
      .from("companies")
      .select("id, name")
      .order("name")
      .then(({ data }) => setCompanies(data || []));
    supabase
      .from("vessels")
      .select("id, name, owner_company_id, operator_company_id, manager_company_id")
      .order("name")
      .then(({ data }) => setVessels(data || []));
  }, []);

  const filteredVessels = companyId
    ? vessels.filter(
        (v) =>
          v.owner_company_id === companyId ||
          v.operator_company_id === companyId ||
          v.manager_company_id === companyId
      )
    : vessels;

  function getNextSunday(): string {
    const now = new Date();
    const daysUntilSunday = (7 - now.getUTCDay()) % 7 || 7;
    const next = new Date(now);
    next.setUTCDate(now.getUTCDate() + daysUntilSunday);
    next.setUTCHours(0, 0, 0, 0);
    return next.toISOString();
  }

  async function handleFileUpload(e: React.ChangeEvent<HTMLInputElement>) {
    const files = e.target.files;
    if (!files || files.length === 0) return;
    setUploadingFile(true);

    const newAttachments: string[] = [];
    for (const file of Array.from(files)) {
      if (file.size > 10 * 1024 * 1024) {
        setError("File must be under 10MB");
        continue;
      }
      const ext = file.name.split(".").pop();
      const path = `flares/${crypto.randomUUID()}.${ext}`;
      const { error: uploadError } = await supabase.storage
        .from("attachments")
        .upload(path, file);
      if (uploadError) {
        setError(`Upload failed: ${uploadError.message}`);
      } else {
        newAttachments.push(path);
      }
    }
    setAttachments((prev) => [...prev, ...newAttachments]);
    setUploadingFile(false);
    e.target.value = "";
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    if (!companyId) {
      setError("Please select a company");
      setLoading(false);
      return;
    }
    if (!category) {
      setError("Please select an issue category");
      setLoading(false);
      return;
    }
    if (!title.trim()) {
      setError("Please provide a short title");
      setLoading(false);
      return;
    }

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!profile) {
      setError("Profile not found");
      setLoading(false);
      return;
    }

    // Rate limit: max 5 flares per user per 30 days
    const thirtyDaysAgo = new Date();
    thirtyDaysAgo.setDate(thirtyDaysAgo.getDate() - 30);
    const { count: recentCount } = await supabase
      .from("signal_flares")
      .select("id", { count: "exact", head: true })
      .eq("profile_id", profile.id)
      .gte("created_at", thirtyDaysAgo.toISOString());

    if ((recentCount ?? 0) >= 5) {
      setError("You can submit up to 5 Signal Flares per month. Please wait before submitting another.");
      setLoading(false);
      return;
    }

    const { error: insertError } = await supabase
      .from("signal_flares")
      .insert({
        profile_id: profile.id,
        company_id: companyId,
        vessel_id: vesselId || null,
        category: category as FlareCategory,
        severity,
        title: title.trim(),
        description: description.trim() || null,
        incident_date_start: incidentDateStart || null,
        incident_date_end: incidentDateEnd || null,
        attachments,
        is_anonymous: isAnonymous,
        batch_release_at: getNextSunday(),
        status: "pending",
      });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      router.push("/intel/flares?submitted=true");
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-2 text-slate-100">
        Report an Issue
      </h1>
      <p className="text-sm text-slate-400 mb-6">
        Help the maritime community by reporting systemic issues you&apos;ve
        witnessed. Your report is anonymous by default and batch-released weekly.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        {/* Company */}
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">
            Company <span className="text-red-400">*</span>
          </label>
          <select
            value={companyId}
            onChange={(e) => {
              setCompanyId(e.target.value);
              setVesselId("");
            }}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>
                {c.name}
              </option>
            ))}
          </select>
        </div>

        {/* Vessel */}
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">
            Vessel <span className="text-slate-500">(optional)</span>
          </label>
          <select
            value={vesselId}
            onChange={(e) => setVesselId(e.target.value)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Select vessel</option>
            {filteredVessels.map((v) => (
              <option key={v.id} value={v.id}>
                {v.name}
              </option>
            ))}
          </select>
        </div>

        {/* Category dropdown */}
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">
            What&apos;s the issue? <span className="text-red-400">*</span>
          </label>
          <select
            value={category}
            onChange={(e) => setCategory(e.target.value as FlareCategory | "")}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Select issue type</option>
            {FLARE_CATEGORIES.map((c) => (
              <option key={c.value} value={c.value}>
                {c.label}
              </option>
            ))}
          </select>
        </div>

        {/* Severity */}
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">
            How serious?
          </label>
          <div className="space-y-2">
            {SEVERITY_LEVELS.map((s) => (
              <button
                key={s.value}
                type="button"
                onClick={() => setSeverity(s.value as FlareSeverity)}
                className={`w-full text-left px-3 py-2.5 rounded border text-sm transition-colors ${
                  severity === s.value
                    ? s.color
                    : "bg-navy-800 text-slate-400 border-navy-600"
                }`}
              >
                <span className="font-medium">{s.label}</span>
                <span className="text-xs block mt-0.5 opacity-80">
                  {s.description}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Title */}
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">
            Short title <span className="text-red-400">*</span>
          </label>
          <input
            type="text"
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="e.g. Tap water unsafe to drink on board"
            maxLength={120}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        {/* Description with guided language */}
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">
            Details
          </label>
          <div className="flex gap-2 bg-navy-800 border border-navy-700 p-3 rounded mb-2">
            <svg
              className="w-4 h-4 text-slate-500 shrink-0 mt-0.5"
              viewBox="0 0 20 20"
              fill="currentColor"
            >
              <path
                fillRule="evenodd"
                d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z"
                clipRule="evenodd"
              />
            </svg>
            <p className="text-sm text-slate-400">
              Describe what you personally witnessed. Use specific dates,
              locations, and details. Stick to facts — &ldquo;I saw...&rdquo; or
              &ldquo;The crew experienced...&rdquo; rather than accusations.
            </p>
          </div>
          <textarea
            value={description}
            onChange={(e) => setDescription(e.target.value)}
            rows={5}
            placeholder="Describe what you witnessed..."
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none resize-none"
          />
        </div>

        {/* Date range */}
        <div className="grid grid-cols-2 gap-3">
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">From</label>
            <input
              type="date"
              value={incidentDateStart}
              onChange={(e) => setIncidentDateStart(e.target.value)}
              className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">To</label>
            <input
              type="date"
              value={incidentDateEnd}
              onChange={(e) => setIncidentDateEnd(e.target.value)}
              className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        {/* Evidence upload */}
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">
            Evidence <span className="text-slate-500">(optional)</span>
          </label>
          <div className="flex items-center gap-3">
            <label className="px-3 py-2 bg-navy-800 border border-navy-600 rounded text-sm text-slate-400 hover:text-slate-300 hover:bg-navy-700 cursor-pointer transition-colors">
              {uploadingFile ? "Uploading..." : "Upload files"}
              <input
                type="file"
                multiple
                accept="image/*,.pdf,.doc,.docx"
                onChange={handleFileUpload}
                disabled={uploadingFile}
                className="hidden"
              />
            </label>
            <span className="text-xs text-slate-500">
              Photos, documents — max 10MB each
            </span>
          </div>
          {attachments.length > 0 && (
            <div className="mt-2 space-y-1">
              {attachments.map((a, i) => (
                <div
                  key={i}
                  className="flex items-center justify-between text-xs text-slate-400 bg-navy-800 px-2 py-1.5 rounded"
                >
                  <span className="truncate">
                    {a.split("/").pop()}
                  </span>
                  <button
                    type="button"
                    onClick={() =>
                      setAttachments((prev) => prev.filter((_, j) => j !== i))
                    }
                    className="text-red-400 hover:text-red-300 ml-2"
                  >
                    Remove
                  </button>
                </div>
              ))}
            </div>
          )}
        </div>

        {/* Anonymous toggle */}
        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 rounded border-navy-600 bg-navy-800 text-teal-500 focus:ring-teal-500"
          />
          <span className="text-sm text-slate-300">Submit anonymously</span>
        </label>

        <p className="text-xs text-slate-500">
          Reports are batch-released every Sunday to protect your identity.
        </p>

        <div className="bg-navy-800/50 border border-navy-700 rounded-lg p-3">
          <p className="text-xs text-slate-300 leading-relaxed">
            <span className="text-amber-400 font-medium">
              How this works:
            </span>{" "}
            Your report joins others to build a picture of systemic issues.
            When enough seafarers report the same problem, SeaSignal
            investigates, publishes findings, and contacts the company to seek
            resolution. Your identity is never shared with anyone outside
            SeaSignal.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading || uploadingFile}
          className="w-full py-2.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
        >
          {loading ? "Submitting..." : "Submit Report"}
        </button>
      </form>
    </div>
  );
}
