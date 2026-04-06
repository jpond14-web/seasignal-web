"use client";

import { useEffect, useState, useRef, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";
import { parseCertCsv, type ParsedCertRow } from "@/lib/utils/certCsvParser";
import type { Tables, Enums } from "@/lib/supabase/types";

const certTypes: { value: Enums<"cert_type">; label: string }[] = [
  { value: "coc", label: "Certificate of Competency" },
  { value: "stcw", label: "STCW" },
  { value: "medical", label: "Medical" },
  { value: "visa", label: "Visa" },
  { value: "endorsement", label: "Endorsement" },
  { value: "short_course", label: "Short Course" },
  { value: "flag_state", label: "Flag State" },
  { value: "gmdss", label: "GMDSS" },
  { value: "other", label: "Other" },
];

const statusColors: Record<string, string> = {
  valid: "border-green-500/30 bg-green-500/10 text-green-400",
  expiring: "border-amber-500/30 bg-amber-500/10 text-amber-400",
  expired: "border-red-500/30 bg-red-500/10 text-red-400",
};

const CERTS_CACHE_KEY = "seasignal_certs_cache";
const CERTS_CACHE_TS_KEY = "seasignal_certs_cache_ts";

const CERT_STEPS = [
  { num: 1, label: "Basics" },
  { num: 2, label: "Details" },
  { num: 3, label: "Dates" },
];

function StepIndicator({ current }: { current: number }) {
  return (
    <div className="flex items-center justify-center gap-0 mb-6">
      {CERT_STEPS.map((step, i) => (
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
          {i < CERT_STEPS.length - 1 && (
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

function CertCsvImportModal({
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

  const [parsed, setParsed] = useState<{ valid: ParsedCertRow[]; errors: { row: number; message: string }[] } | null>(null);
  const [importing, setImporting] = useState(false);

  function downloadTemplate() {
    const csv = `cert_type,title,cert_number,issuing_authority,flag_state,issue_date,expiry_date\ncoc,Master Unlimited,MC-12345,MCA,United Kingdom,2024-03-01,2029-03-01\nstcw,Basic Safety Training,BST-9876,MARINA,Philippines,2023-06-15,2028-06-15\nmedical,ENG1 Medical,ENG1-4567,MCA,United Kingdom,2025-01-10,2027-01-10`;
    const blob = new Blob([csv], { type: "text/csv" });
    const url = URL.createObjectURL(blob);
    const a = document.createElement("a");
    a.href = url;
    a.download = "certificates_template.csv";
    a.click();
    URL.revokeObjectURL(url);
  }

  function handleFile(e: React.ChangeEvent<HTMLInputElement>) {
    const file = e.target.files?.[0];
    if (!file) return;
    const reader = new FileReader();
    reader.onload = (ev) => {
      const text = ev.target?.result as string;
      setParsed(parseCertCsv(text));
    };
    reader.readAsText(file);
  }

  async function handleImport() {
    if (!parsed || parsed.valid.length === 0) return;
    setImporting(true);

    const rows = parsed.valid.map((r) => ({
      profile_id: profileId,
      cert_type: r.cert_type as "coc" | "stcw" | "medical" | "visa" | "endorsement" | "short_course" | "flag_state" | "gmdss" | "other",
      title: r.title,
      cert_number: r.cert_number || null,
      issuing_authority: r.issuing_authority || null,
      flag_state: r.flag_state || null,
      issue_date: r.issue_date || null,
      expiry_date: r.expiry_date || null,
    }));

    const { error } = await supabase.from("certificates").insert(rows);
    setImporting(false);

    if (error) {
      showToast(error.message, "error");
    } else {
      showToast(`Imported ${rows.length} certificate${rows.length !== 1 ? "s" : ""} successfully`);
      onSuccess();
      onClose();
    }
  }

  function formatCertType(val: string): string {
    const match = certTypes.find((t) => t.value === val);
    return match ? match.label : val.toUpperCase();
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
          <h2 className="text-lg font-semibold text-slate-100">Import Certificates from CSV</h2>
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
          Import multiple certificates at once from a CSV file.
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
                  {parsed.valid.length} valid certificate{parsed.valid.length !== 1 ? "s" : ""}
                </p>
                <div className="overflow-x-auto">
                  <table className="w-full text-xs text-left">
                    <thead>
                      <tr className="border-b border-navy-700 text-slate-500">
                        <th className="pb-2 pr-3">Type</th>
                        <th className="pb-2 pr-3">Title</th>
                        <th className="pb-2 pr-3">Number</th>
                        <th className="pb-2 pr-3">Authority</th>
                        <th className="pb-2 pr-3">Flag</th>
                        <th className="pb-2 pr-3">Issued</th>
                        <th className="pb-2">Expiry</th>
                      </tr>
                    </thead>
                    <tbody>
                      {parsed.valid.map((r, i) => (
                        <tr key={i} className="border-b border-navy-800 text-slate-300">
                          <td className="py-1.5 pr-3">
                            <span className="px-1.5 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400 uppercase text-[10px]">
                              {r.cert_type}
                            </span>
                          </td>
                          <td className="py-1.5 pr-3 font-medium">{r.title}</td>
                          <td className="py-1.5 pr-3 font-mono">{r.cert_number || "--"}</td>
                          <td className="py-1.5 pr-3">{r.issuing_authority || "--"}</td>
                          <td className="py-1.5 pr-3">{r.flag_state || "--"}</td>
                          <td className="py-1.5 pr-3">{r.issue_date || "--"}</td>
                          <td className="py-1.5">{r.expiry_date || "--"}</td>
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

export default function CertsPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [certs, setCerts] = useState<Tables<"certificates">[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);
  const [formStep, setFormStep] = useState(1);

  const [form, setForm] = useState({
    cert_type: "coc" as Enums<"cert_type">,
    title: "",
    cert_number: "",
    issuing_authority: "",
    flag_state: "",
    issue_date: "",
    expiry_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");
  const [showCsvModal, setShowCsvModal] = useState(false);

  useEffect(() => {
    // Check if we have cached data on mount
    try {
      const cached = localStorage.getItem(CERTS_CACHE_KEY);
      if (cached) setIsOfflineCached(true);
    } catch {}
    loadCerts();
  }, []);

  async function loadCerts() {
    try {
      const { data: { user } } = await supabase.auth.getUser();
      if (!user) {
        loadFromCache();
        return;
      }
      const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
      if (!profile) {
        loadFromCache();
        return;
      }
      setProfileId(profile.id);

      const { data } = await supabase
        .from("certificates")
        .select("*")
        .eq("profile_id", profile.id)
        .order("expiry_date", { ascending: true, nullsFirst: false });

      const certData = data || [];
      setCerts(certData);
      setLoading(false);
      setIsOfflineMode(false);

      // Cache in localStorage for offline access
      try {
        localStorage.setItem(CERTS_CACHE_KEY, JSON.stringify(certData));
        localStorage.setItem(CERTS_CACHE_TS_KEY, new Date().toISOString());
        setIsOfflineCached(true);
      } catch {}
    } catch {
      // Network error — fall back to cached data
      loadFromCache();
    }
  }

  function loadFromCache() {
    try {
      const cached = localStorage.getItem(CERTS_CACHE_KEY);
      if (cached) {
        setCerts(JSON.parse(cached));
        setIsOfflineMode(true);
        setIsOfflineCached(true);
      }
    } catch {}
    setLoading(false);
  }

  function resetForm() {
    setForm({ cert_type: "coc", title: "", cert_number: "", issuing_authority: "", flag_state: "", issue_date: "", expiry_date: "" });
    setEditingId(null);
    setShowForm(false);
    setFormStep(1);
    setError("");
  }

  function startEdit(cert: Tables<"certificates">) {
    setForm({
      cert_type: cert.cert_type,
      title: cert.title,
      cert_number: cert.cert_number || "",
      issuing_authority: cert.issuing_authority || "",
      flag_state: cert.flag_state || "",
      issue_date: cert.issue_date?.split("T")[0] || "",
      expiry_date: cert.expiry_date?.split("T")[0] || "",
    });
    setEditingId(cert.id);
    setFormStep(1);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId) return;
    setSaving(true);
    setError("");

    const payload = {
      cert_type: form.cert_type,
      title: form.title,
      cert_number: form.cert_number || null,
      issuing_authority: form.issuing_authority || null,
      flag_state: form.flag_state || null,
      issue_date: form.issue_date || null,
      expiry_date: form.expiry_date || null,
    };

    if (editingId) {
      const { error: err } = await supabase.from("certificates").update(payload).eq("id", editingId);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from("certificates").insert({ ...payload, profile_id: profileId });
      if (err) { setError(err.message); setSaving(false); return; }
    }

    setSaving(false);
    resetForm();
    loadCerts();
  }

  async function handleDelete(id: string) {
    await supabase.from("certificates").delete().eq("id", id);
    loadCerts();
  }

  async function handleDocUpload(certId: string, file: File) {
    const ext = file.name.split(".").pop()?.toLowerCase() || "pdf";
    const path = `certs/${profileId}/${certId}.${ext}`;

    const { error: uploadErr } = await supabase.storage
      .from("certificates")
      .upload(path, file, { upsert: true });

    if (uploadErr) {
      showToast("Upload failed: " + uploadErr.message, "error");
      return;
    }

    const { data: urlData } = supabase.storage.from("certificates").getPublicUrl(path);
    const publicUrl = urlData?.publicUrl;

    if (publicUrl) {
      await supabase
        .from("certificates")
        .update({ document_url: publicUrl, verification_level: "document_uploaded" })
        .eq("id", certId);
      loadCerts();
      showToast("Document uploaded — verification level upgraded", "success");
    }
  }

  const daysUntilExpiry = useCallback((date: string | null): number | null => {
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now(); // eslint-disable-line react-hooks/purity -- Date.now() is acceptable here
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
  }, []);

  function canAdvanceStep(): boolean {
    if (formStep === 1) {
      return form.title.trim().length > 0;
    }
    return true;
  }

  if (loading) return <div className="max-w-3xl mx-auto"><p className="text-slate-400">Loading...</p></div>;

  return (
    <div className="max-w-3xl mx-auto">
      {isOfflineMode && (
        <div className="mb-4 flex items-center gap-2 px-3 py-2 bg-amber-500/10 border border-amber-500/30 rounded-lg text-amber-400 text-sm">
          <svg className="w-4 h-4 shrink-0" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
            <path strokeLinecap="round" strokeLinejoin="round" d="M18.364 5.636a9 9 0 11-12.728 0M12 9v4m0 4h.01" />
          </svg>
          <span>Offline mode — showing cached certificates</span>
        </div>
      )}

      <div className="flex items-center justify-between mb-6">
        <div className="flex items-center gap-3">
          <span className="text-2xl font-bold">Certificate Wallet</span>
          {isOfflineCached && !isOfflineMode && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Available Offline
            </span>
          )}
        </div>
        <div className="flex gap-2">
          <button
            onClick={() => setShowCsvModal(true)}
            className="px-4 py-2 bg-navy-800 border border-navy-600 hover:bg-navy-700 text-slate-300 font-medium rounded text-sm transition-colors"
          >
            Import CSV
          </button>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
          >
            + Add Certificate
          </button>
        </div>
      </div>

      {showForm && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h2 className="font-semibold text-slate-100 mb-4">{editingId ? "Edit" : "Add"} Certificate</h2>

          <StepIndicator current={formStep} />

          <form onSubmit={handleSave}>
            {/* Step 1: Basics */}
            {formStep === 1 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cert-type" className="block text-sm text-slate-300 mb-1">Type</label>
                    <select id="cert-type" value={form.cert_type} onChange={(e) => setForm({ ...form, cert_type: e.target.value as Enums<"cert_type"> })}
                      className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none">
                      {certTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                    </select>
                    <p className="text-[11px] text-slate-500 mt-1">
                      CoC = Certificate of Competency &bull; STCW = Standards of Training, Certification and Watchkeeping &bull; GMDSS = Global Maritime Distress and Safety System
                    </p>
                  </div>
                  <div>
                    <label htmlFor="cert-title" className="block text-sm text-slate-300 mb-1">Title *</label>
                    <input id="cert-title" type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                      className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
                  </div>
                </div>
              </div>
            )}

            {/* Step 2: Details */}
            {formStep === 2 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cert-number" className="block text-sm text-slate-300 mb-1">Cert Number</label>
                    <input id="cert-number" type="text" value={form.cert_number} onChange={(e) => setForm({ ...form, cert_number: e.target.value })}
                      className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="cert-issuer" className="block text-sm text-slate-300 mb-1">Issuing Authority</label>
                    <input id="cert-issuer" type="text" value={form.issuing_authority} onChange={(e) => setForm({ ...form, issuing_authority: e.target.value })}
                      placeholder="e.g. MCA (UK), MARINA (PH), DG Shipping (IN)"
                      className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
                  </div>
                </div>
                <div>
                  <label htmlFor="cert-flag" className="block text-sm text-slate-300 mb-1">Flag State</label>
                  <input id="cert-flag" type="text" value={form.flag_state} onChange={(e) => setForm({ ...form, flag_state: e.target.value })}
                    placeholder="e.g. Panama, Marshall Islands, Liberia"
                    className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none" />
                </div>
              </div>
            )}

            {/* Step 3: Dates */}
            {formStep === 3 && (
              <div className="space-y-4">
                <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
                  <div>
                    <label htmlFor="cert-issue-date" className="block text-sm text-slate-300 mb-1">Issue Date</label>
                    <input id="cert-issue-date" type="date" value={form.issue_date} onChange={(e) => setForm({ ...form, issue_date: e.target.value })}
                      className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
                  </div>
                  <div>
                    <label htmlFor="cert-expiry-date" className="block text-sm text-slate-300 mb-1">Expiry Date</label>
                    <input id="cert-expiry-date" type="date" value={form.expiry_date} onChange={(e) => setForm({ ...form, expiry_date: e.target.value })}
                      className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
                  </div>
                </div>
              </div>
            )}

            {error && <p className="text-sm text-red-400 mt-4">{error}</p>}

            <div className="flex gap-3 mt-6">
              {formStep > 1 && (
                <button
                  type="button"
                  onClick={() => setFormStep(formStep - 1)}
                  className="px-4 py-2 bg-navy-800 border border-navy-600 rounded text-slate-300 text-sm hover:bg-navy-700 transition-colors"
                >
                  Back
                </button>
              )}
              {formStep < 3 && (
                <button
                  type="button"
                  disabled={!canAdvanceStep()}
                  onClick={() => setFormStep(formStep + 1)}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
                >
                  Next
                </button>
              )}
              {formStep === 3 && (
                <button type="submit" disabled={saving}
                  className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
                  {saving ? "Saving..." : editingId ? "Update" : "Add Certificate"}
                </button>
              )}
              <button type="button" onClick={resetForm}
                className="px-4 py-2 bg-navy-800 border border-navy-600 rounded text-slate-300 text-sm hover:bg-navy-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {certs.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-10 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M6 2a2 2 0 00-2 2v12a2 2 0 002 2h8a2 2 0 002-2V7.414A2 2 0 0015.414 6L12 2.586A2 2 0 0010.586 2H6zm2 10a1 1 0 10-2 0v3a1 1 0 102 0v-3zm2-3a1 1 0 011 1v5a1 1 0 11-2 0v-5a1 1 0 011-1zm4-1a1 1 0 10-2 0v7a1 1 0 102 0V8z" clipRule="evenodd" />
          </svg>
          <p className="text-slate-300 font-medium">No certificates yet</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">Track your maritime certificates, get expiry reminders, and access them offline.</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
          >
            Add Your First Certificate
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {certs.map((cert) => {
            const days = daysUntilExpiry(cert.expiry_date);
            return (
              <div key={cert.id} className={`bg-navy-900 border rounded-lg p-4 ${statusColors[cert.status ?? "valid"] || "border-navy-700"}`}>
                <div className="flex items-start justify-between">
                  <div>
                    <div className="flex items-center gap-2">
                      <h3 className="font-semibold text-slate-100">{cert.title}</h3>
                      <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400 uppercase">
                        {cert.cert_type}
                      </span>
                    </div>
                    <div className="flex flex-wrap gap-x-4 gap-y-1 mt-1.5 text-xs text-slate-500">
                      {cert.cert_number && <span>#{cert.cert_number}</span>}
                      {cert.issuing_authority && <span>{cert.issuing_authority}</span>}
                      {cert.flag_state && <span>{cert.flag_state}</span>}
                    </div>
                  </div>
                  <div className="text-right shrink-0 ml-4">
                    <p className={`text-sm font-medium capitalize ${
                      cert.status === "valid" ? "text-green-400" : cert.status === "expiring" ? "text-amber-400" : "text-red-400"
                    }`}>
                      {cert.status}
                    </p>
                    {days !== null && (
                      <p className="text-xs text-slate-500">
                        {days > 0 ? `${days}d left` : days === 0 ? "Expires today" : `${Math.abs(days)}d ago`}
                      </p>
                    )}
                  </div>
                </div>
                {/* Verification Level */}
                <div className="flex items-center gap-2 mt-2">
                  <VerificationBadge level={cert.verification_level ?? "self_reported"} />
                  {!cert.document_url && (
                    <label className="text-xs text-teal-400 hover:text-teal-300 cursor-pointer transition-colors">
                      Upload Document
                      <input
                        type="file"
                        accept=".pdf,.jpg,.jpeg,.png"
                        className="hidden"
                        onChange={(e) => {
                          const file = e.target.files?.[0];
                          if (file) handleDocUpload(cert.id, file);
                        }}
                      />
                    </label>
                  )}
                  {cert.document_url && (
                    <a
                      href={cert.document_url}
                      target="_blank"
                      rel="noopener noreferrer"
                      className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
                    >
                      View Document
                    </a>
                  )}
                </div>
                <div className="flex items-center justify-between mt-3 pt-3 border-t border-navy-700/50">
                  <div className="flex gap-3 text-xs text-slate-500">
                    {cert.issue_date && <span>Issued: {new Date(cert.issue_date).toLocaleDateString()}</span>}
                    {cert.expiry_date && <span>Expires: {new Date(cert.expiry_date).toLocaleDateString()}</span>}
                  </div>
                  <div className="flex gap-2">
                    <button onClick={() => startEdit(cert)} className="text-xs text-slate-400 hover:text-teal-400 transition-colors" aria-label={`Edit certificate: ${cert.title}`}>Edit</button>
                    <button onClick={() => handleDelete(cert.id)} className="text-xs text-slate-400 hover:text-red-400 transition-colors" aria-label={`Delete certificate: ${cert.title}`}>Delete</button>
                  </div>
                </div>
              </div>
            );
          })}
        </div>
      )}

      {/* CSV Import Modal */}
      {showCsvModal && profileId && (
        <CertCsvImportModal
          profileId={profileId}
          onClose={() => setShowCsvModal(false)}
          onSuccess={() => loadCerts()}
        />
      )}
    </div>
  );
}

const VERIFICATION_LEVELS: Record<string, { label: string; color: string; icon: string }> = {
  self_reported: { label: "Self Reported", color: "text-slate-400 border-slate-500/30 bg-slate-500/10", icon: "\u2022" },
  document_uploaded: { label: "Document Uploaded", color: "text-blue-400 border-blue-500/30 bg-blue-500/10", icon: "\uD83D\uDCC4" },
  hash_verified: { label: "Hash Verified", color: "text-amber-400 border-amber-500/30 bg-amber-500/10", icon: "\uD83D\uDD12" },
  authority_confirmed: { label: "Authority Confirmed", color: "text-emerald-400 border-emerald-500/30 bg-emerald-500/10", icon: "\u2713" },
};

function VerificationBadge({ level }: { level: string }) {
  const info = VERIFICATION_LEVELS[level] || VERIFICATION_LEVELS.self_reported;
  return (
    <span className={`text-xs px-2 py-0.5 rounded border inline-flex items-center gap-1 ${info.color}`}>
      <span>{info.icon}</span>
      {info.label}
    </span>
  );
}
