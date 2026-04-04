"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
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

export default function CertsPage() {
  const supabase = createClient();
  const [certs, setCerts] = useState<Tables<"certificates">[]>([]);
  const [loading, setLoading] = useState(true);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [isOfflineCached, setIsOfflineCached] = useState(false);
  const [isOfflineMode, setIsOfflineMode] = useState(false);

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

  function daysUntilExpiry(date: string | null): number | null {
    if (!date) return null;
    const diff = new Date(date).getTime() - Date.now();
    return Math.ceil(diff / (1000 * 60 * 60 * 24));
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
          <h1 className="text-2xl font-bold">Certificate Wallet</h1>
          {isOfflineCached && !isOfflineMode && (
            <span className="flex items-center gap-1 px-2 py-0.5 bg-green-500/10 border border-green-500/30 rounded text-green-400 text-xs">
              <svg className="w-3 h-3" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2.5}>
                <path strokeLinecap="round" strokeLinejoin="round" d="M5 13l4 4L19 7" />
              </svg>
              Available Offline
            </span>
          )}
        </div>
        <button
          onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
        >
          + Add Certificate
        </button>
      </div>

      {showForm && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h2 className="font-semibold text-slate-100 mb-4">{editingId ? "Edit" : "Add"} Certificate</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cert-type" className="block text-sm text-slate-300 mb-1">Type</label>
                <select id="cert-type" value={form.cert_type} onChange={(e) => setForm({ ...form, cert_type: e.target.value as Enums<"cert_type"> })}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none">
                  {certTypes.map((t) => <option key={t.value} value={t.value}>{t.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="cert-title" className="block text-sm text-slate-300 mb-1">Title *</label>
                <input id="cert-title" type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="cert-number" className="block text-sm text-slate-300 mb-1">Cert Number</label>
                <input id="cert-number" type="text" value={form.cert_number} onChange={(e) => setForm({ ...form, cert_number: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
              </div>
              <div>
                <label htmlFor="cert-issuer" className="block text-sm text-slate-300 mb-1">Issuing Authority</label>
                <input id="cert-issuer" type="text" value={form.issuing_authority} onChange={(e) => setForm({ ...form, issuing_authority: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
              </div>
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-3 gap-3">
              <div>
                <label htmlFor="cert-flag" className="block text-sm text-slate-300 mb-1">Flag State</label>
                <input id="cert-flag" type="text" value={form.flag_state} onChange={(e) => setForm({ ...form, flag_state: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
              </div>
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
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
                {saving ? "Saving..." : editingId ? "Update" : "Add"}
              </button>
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
              <div key={cert.id} className={`bg-navy-900 border rounded-lg p-4 ${statusColors[cert.status] || "border-navy-700"}`}>
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
    </div>
  );
}
