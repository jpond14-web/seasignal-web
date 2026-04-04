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
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
