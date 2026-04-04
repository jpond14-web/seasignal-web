"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import type { Tables, Enums } from "@/lib/supabase/types";

const categories: { value: Enums<"incident_category">; label: string }[] = [
  { value: "safety", label: "Safety" },
  { value: "maintenance", label: "Maintenance" },
  { value: "wages", label: "Wages" },
  { value: "harassment", label: "Harassment" },
  { value: "contract", label: "Contract" },
  { value: "other", label: "Other" },
];

const categoryColors: Record<string, string> = {
  safety: "text-red-400 bg-red-500/10 border-red-500/30",
  maintenance: "text-amber-400 bg-amber-500/10 border-amber-500/30",
  wages: "text-teal-400 bg-teal-500/10 border-teal-500/30",
  harassment: "text-red-400 bg-red-500/10 border-red-500/30",
  contract: "text-slate-300 bg-slate-500/10 border-slate-500/30",
  other: "text-slate-400 bg-navy-800 border-navy-600",
};

export default function IncidentsPage() {
  const supabase = createClient();
  const [incidents, setIncidents] = useState<Tables<"incident_logs">[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [showForm, setShowForm] = useState(false);
  const [editingId, setEditingId] = useState<string | null>(null);

  const [form, setForm] = useState({
    title: "",
    description_encrypted: "",
    category: "safety" as Enums<"incident_category">,
    incident_date: "",
  });
  const [saving, setSaving] = useState(false);
  const [error, setError] = useState("");

  useEffect(() => { load(); }, []);

  async function load() {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) return;
    const { data: profile } = await supabase.from("profiles").select("id").eq("auth_user_id", user.id).single();
    if (!profile) return;
    setProfileId(profile.id);

    const { data } = await supabase
      .from("incident_logs")
      .select("*")
      .eq("profile_id", profile.id)
      .order("created_at", { ascending: false });
    setIncidents(data || []);
    setLoading(false);
  }

  function resetForm() {
    setForm({ title: "", description_encrypted: "", category: "safety", incident_date: "" });
    setEditingId(null);
    setShowForm(false);
    setError("");
  }

  function startEdit(inc: Tables<"incident_logs">) {
    setForm({
      title: inc.title,
      description_encrypted: inc.description_encrypted || "",
      category: inc.category,
      incident_date: inc.incident_date?.split("T")[0] || "",
    });
    setEditingId(inc.id);
    setShowForm(true);
  }

  async function handleSave(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId) return;
    setSaving(true);
    setError("");

    const payload = {
      title: form.title.trim(),
      description_encrypted: form.description_encrypted.trim() || null,
      category: form.category,
      incident_date: form.incident_date || null,
    };

    if (editingId) {
      const { error: err } = await supabase.from("incident_logs").update(payload).eq("id", editingId);
      if (err) { setError(err.message); setSaving(false); return; }
    } else {
      const { error: err } = await supabase.from("incident_logs").insert({ ...payload, profile_id: profileId });
      if (err) { setError(err.message); setSaving(false); return; }
    }

    setSaving(false);
    resetForm();
    load();
  }

  async function handleDelete(id: string) {
    await supabase.from("incident_logs").delete().eq("id", id);
    load();
  }

  function handleExportPdf(inc: Tables<"incident_logs">) {
    const iframe = document.createElement("iframe");
    iframe.style.position = "fixed";
    iframe.style.right = "0";
    iframe.style.bottom = "0";
    iframe.style.width = "0";
    iframe.style.height = "0";
    iframe.style.border = "none";
    document.body.appendChild(iframe);

    const incidentDate = inc.incident_date
      ? new Date(inc.incident_date).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric" })
      : "Not specified";
    const recordedDate = new Date(inc.created_at).toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const exportedDate = new Date().toLocaleDateString("en-GB", { day: "numeric", month: "long", year: "numeric", hour: "2-digit", minute: "2-digit" });
    const description = inc.description_encrypted || "No description provided.";

    const html = `<!DOCTYPE html>
<html>
<head>
  <meta charset="utf-8">
  <title>Incident Report — ${inc.title}</title>
  <style>
    * { margin: 0; padding: 0; box-sizing: border-box; }
    body { font-family: Georgia, 'Times New Roman', serif; color: #1a1a1a; padding: 40px 50px; line-height: 1.6; }
    .header { border-bottom: 2px solid #0d9488; padding-bottom: 16px; margin-bottom: 24px; }
    .header h1 { font-size: 18px; color: #0d9488; letter-spacing: 1px; }
    .title { font-size: 22px; font-weight: bold; margin-bottom: 16px; }
    .meta { display: flex; gap: 24px; margin-bottom: 24px; font-size: 13px; color: #555; }
    .meta-item { display: flex; flex-direction: column; }
    .meta-label { font-weight: bold; text-transform: uppercase; font-size: 10px; letter-spacing: 0.5px; color: #888; margin-bottom: 2px; }
    .description { margin-bottom: 32px; white-space: pre-wrap; font-size: 14px; line-height: 1.8; }
    .timestamps { border-top: 1px solid #ddd; padding-top: 16px; margin-top: 32px; font-size: 12px; color: #777; }
    .timestamps p { margin-bottom: 4px; }
    .footer { margin-top: 40px; padding-top: 16px; border-top: 1px solid #ddd; font-size: 11px; color: #999; font-style: italic; }
    @media print { body { padding: 20px 30px; } }
  </style>
</head>
<body>
  <div class="header">
    <h1>&#9875; SeaSignal &mdash; Incident Report</h1>
  </div>
  <div class="title">${inc.title.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
  <div class="meta">
    <div class="meta-item">
      <span class="meta-label">Category</span>
      <span>${inc.category.charAt(0).toUpperCase() + inc.category.slice(1)}</span>
    </div>
    <div class="meta-item">
      <span class="meta-label">Incident Date</span>
      <span>${incidentDate}</span>
    </div>
  </div>
  <div class="description">${description.replace(/</g, "&lt;").replace(/>/g, "&gt;")}</div>
  <div class="timestamps">
    <p><strong>Recorded:</strong> ${recordedDate}</p>
    <p><strong>Exported:</strong> ${exportedDate}</p>
  </div>
  <div class="footer">
    This document was generated by SeaSignal for evidential purposes. Timestamp verified at time of creation.
  </div>
</body>
</html>`;

    const doc = iframe.contentDocument || iframe.contentWindow?.document;
    if (doc) {
      doc.open();
      doc.write(html);
      doc.close();
      // Allow a moment for rendering before printing
      setTimeout(() => {
        iframe.contentWindow?.print();
        // Clean up after print dialog closes
        setTimeout(() => {
          document.body.removeChild(iframe);
        }, 1000);
      }, 250);
    }
  }

  return (
    <div className="max-w-3xl mx-auto">
      <div className="flex items-center justify-between mb-6">
        <div>
          <h1 className="text-2xl font-bold">Incident Log</h1>
          <p className="text-slate-500 text-sm mt-1">Private — only visible to you</p>
        </div>
        <button onClick={() => { resetForm(); setShowForm(true); }}
          className="px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors">
          + Log Incident
        </button>
      </div>

      {showForm && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h2 className="font-semibold text-slate-100 mb-4">{editingId ? "Edit" : "New"} Incident</h2>
          <form onSubmit={handleSave} className="space-y-4">
            <div>
              <label htmlFor="incident-title" className="block text-sm text-slate-300 mb-1">Title *</label>
              <input id="incident-title" type="text" required value={form.title} onChange={(e) => setForm({ ...form, title: e.target.value })}
                className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
            </div>
            <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
              <div>
                <label htmlFor="incident-category" className="block text-sm text-slate-300 mb-1">Category</label>
                <select id="incident-category" value={form.category} onChange={(e) => setForm({ ...form, category: e.target.value as Enums<"incident_category"> })}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none">
                  {categories.map((c) => <option key={c.value} value={c.value}>{c.label}</option>)}
                </select>
              </div>
              <div>
                <label htmlFor="incident-date" className="block text-sm text-slate-300 mb-1">Incident Date</label>
                <input id="incident-date" type="date" value={form.incident_date} onChange={(e) => setForm({ ...form, incident_date: e.target.value })}
                  className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none" />
              </div>
            </div>
            <div>
              <label htmlFor="incident-description" className="block text-sm text-slate-300 mb-1">Description</label>
              <div className="bg-navy-800/50 border border-navy-700 rounded-lg p-3 mb-3">
                <p className="text-xs text-slate-400 font-medium mb-1">Document as much detail as possible:</p>
                <ul className="text-xs text-slate-500 space-y-0.5 list-disc list-inside">
                  <li>Date, time, and location of the incident</li>
                  <li>Names of any witnesses (optional)</li>
                  <li>What happened and who was involved</li>
                  <li>Any injuries or damage</li>
                  <li>Actions taken immediately after</li>
                </ul>
                <p className="text-[11px] text-slate-500 mt-2 italic">This log is private — only you can see it. It is timestamped for evidential use.</p>
              </div>
              <textarea id="incident-description" value={form.description_encrypted} onChange={(e) => setForm({ ...form, description_encrypted: e.target.value })} rows={5}
                placeholder="Describe what happened in detail..."
                className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none resize-none" />
            </div>
            {error && <p className="text-sm text-red-400">{error}</p>}
            <div className="flex gap-3">
              <button type="submit" disabled={saving}
                className="px-4 py-2 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors">
                {saving ? "Saving..." : editingId ? "Update" : "Log Incident"}
              </button>
              <button type="button" onClick={resetForm}
                className="px-4 py-2 bg-navy-800 border border-navy-600 rounded text-slate-300 text-sm hover:bg-navy-700 transition-colors">
                Cancel
              </button>
            </div>
          </form>
        </div>
      )}

      {loading ? (
        <p className="text-slate-400">Loading...</p>
      ) : incidents.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-10 text-center">
          <svg className="w-12 h-12 mx-auto mb-3 text-slate-600" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
            <path fillRule="evenodd" d="M5 9V7a5 5 0 0110 0v2a2 2 0 012 2v5a2 2 0 01-2 2H5a2 2 0 01-2-2v-5a2 2 0 012-2zm8-2v2H7V7a3 3 0 016 0z" clipRule="evenodd" />
          </svg>
          <p className="text-slate-300 font-medium">No incidents logged</p>
          <p className="text-slate-500 text-sm mt-1 mb-4">Your private evidence vault. Record incidents with timestamps for your protection.</p>
          <button
            onClick={() => { resetForm(); setShowForm(true); }}
            className="inline-flex items-center px-4 py-2 bg-teal-500 hover:bg-teal-400 text-navy-950 font-medium rounded text-sm transition-colors"
          >
            Log Your First Incident
          </button>
        </div>
      ) : (
        <div className="space-y-3">
          {incidents.map((inc) => (
            <div key={inc.id} className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <div className="flex items-start justify-between">
                <div>
                  <h3 className="font-semibold text-slate-100">{inc.title}</h3>
                  <div className="flex items-center gap-2 mt-1">
                    <span className={`text-xs px-2 py-0.5 border rounded ${categoryColors[inc.category] || categoryColors.other}`}>
                      {inc.category}
                    </span>
                    {inc.incident_date && <span className="text-xs text-slate-500">{new Date(inc.incident_date).toLocaleDateString()}</span>}
                  </div>
                </div>
                <p className="text-xs text-slate-500 shrink-0 ml-4">
                  {new Date(inc.created_at).toLocaleDateString()}
                </p>
              </div>
              {inc.description_encrypted && (
                <p className="text-sm text-slate-300 mt-3 leading-relaxed whitespace-pre-wrap">{inc.description_encrypted}</p>
              )}
              <div className="flex gap-2 mt-3 pt-3 border-t border-navy-700/50">
                <button onClick={() => startEdit(inc)} className="text-xs text-slate-400 hover:text-teal-400 transition-colors" aria-label={`Edit incident: ${inc.title}`}>Edit</button>
                <button onClick={() => handleDelete(inc.id)} className="text-xs text-slate-400 hover:text-red-400 transition-colors" aria-label={`Delete incident: ${inc.title}`}>Delete</button>
                <button onClick={() => handleExportPdf(inc)} className="text-xs text-slate-400 hover:text-teal-400 transition-colors inline-flex items-center gap-1" aria-label={`Export PDF: ${inc.title}`}>
                  <svg className="w-3.5 h-3.5" viewBox="0 0 20 20" fill="currentColor" aria-hidden="true">
                    <path fillRule="evenodd" d="M4 4a2 2 0 012-2h4.586A2 2 0 0112 2.586L15.414 6A2 2 0 0116 7.414V16a2 2 0 01-2 2H6a2 2 0 01-2-2V4z" clipRule="evenodd" />
                  </svg>
                  Export PDF
                </button>
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
