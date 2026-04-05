"use client";

import { useCallback, useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

type AlertSeverity = "info" | "warning" | "critical";
type AlertCategory = "safety" | "regulatory" | "weather" | "piracy" | "port" | "industry" | "labor" | "other";

type Alert = {
  id: string;
  author_id: string;
  title: string;
  body: string;
  severity: AlertSeverity;
  category: AlertCategory;
  region_tag: string | null;
  source_url: string | null;
  is_verified: boolean;
  expires_at: string | null;
  created_at: string;
  profiles: { display_name: string } | null;
};

const SEVERITY_STYLES: Record<AlertSeverity, string> = {
  critical: "bg-red-500/15 border-red-500/40 text-red-400",
  warning: "bg-amber-500/15 border-amber-500/40 text-amber-400",
  info: "bg-blue-500/15 border-blue-500/40 text-blue-400",
};

const SEVERITY_BORDER: Record<AlertSeverity, string> = {
  critical: "border-l-red-500",
  warning: "border-l-amber-500",
  info: "border-l-blue-500",
};

const CATEGORIES: AlertCategory[] = ["safety", "regulatory", "weather", "piracy", "port", "industry", "labor", "other"];
type FilterTab = "all" | AlertCategory;

export default function AlertsPage() {
  const supabase = createClient();

  const [alerts, setAlerts] = useState<Alert[]>([]);
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");

  // Form state
  const [showForm, setShowForm] = useState(false);
  const [formTitle, setFormTitle] = useState("");
  const [formBody, setFormBody] = useState("");
  const [formSeverity, setFormSeverity] = useState<AlertSeverity>("info");
  const [formCategory, setFormCategory] = useState<AlertCategory>("other");
  const [formRegion, setFormRegion] = useState("");
  const [formSourceUrl, setFormSourceUrl] = useState("");
  const [submitting, setSubmitting] = useState(false);
  const [error, setError] = useState<string | null>(null);

  const fetchAlerts = useCallback(async () => {
    const { data } = await supabase
      .from("industry_alerts")
      .select("id, author_id, title, body, severity, category, region_tag, source_url, is_verified, expires_at, created_at, profiles(display_name)")
      .order("created_at", { ascending: false })
      .limit(50);
    if (data) setAlerts(data as unknown as Alert[]);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    (async () => {
      const { data: { user } } = await supabase.auth.getUser();
      if (user) {
        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", user.id)
          .single();
        if (profile) setProfileId(profile.id);
      }
      await fetchAlerts();
    })();
  }, [supabase, fetchAlerts]);

  const filtered = activeTab === "all" ? alerts : alerts.filter((a) => a.category === activeTab);

  const handleSubmit = async () => {
    if (!profileId) return;
    if (formTitle.length < 3 || formBody.length < 10) {
      setError("Title must be at least 3 characters and description at least 10.");
      return;
    }
    setSubmitting(true);
    setError(null);
    const { error: insertErr } = await supabase.from("industry_alerts").insert({
      author_id: profileId,
      title: formTitle,
      body: formBody,
      severity: formSeverity,
      category: formCategory,
      region_tag: formRegion || null,
      source_url: formSourceUrl || null,
    });
    if (insertErr) {
      setError(insertErr.message);
    } else {
      setFormTitle("");
      setFormBody("");
      setFormSeverity("info");
      setFormCategory("other");
      setFormRegion("");
      setFormSourceUrl("");
      setShowForm(false);
      await fetchAlerts();
    }
    setSubmitting(false);
  };

  const handleDelete = async (id: string) => {
    await supabase.from("industry_alerts").delete().eq("id", id);
    setAlerts((prev) => prev.filter((a) => a.id !== id));
  };

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-12 text-center">
        <div className="animate-pulse text-slate-500 text-sm">Loading alerts...</div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="flex flex-col sm:flex-row sm:items-center sm:justify-between gap-3 mb-5">
        <p className="text-slate-400 text-sm">
          PSC detentions, regulatory changes, safety bulletins, and company warnings.
        </p>
        {profileId && (
          <button
            onClick={() => setShowForm(!showForm)}
            className="bg-teal-500 hover:bg-teal-400 text-navy-950 font-semibold px-4 py-2 rounded-lg transition-colors text-sm whitespace-nowrap"
          >
            Submit Alert
          </button>
        )}
      </div>

      {/* Submit form */}
      {showForm && (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-5 mb-6">
          <h3 className="text-slate-100 font-semibold mb-3">Submit an Alert</h3>
          {error && <p className="text-red-400 text-sm mb-3">{error}</p>}
          <div className="space-y-3">
            <input
              type="text"
              placeholder="Alert title..."
              value={formTitle}
              onChange={(e) => setFormTitle(e.target.value)}
              maxLength={300}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
            />
            <textarea
              placeholder="Describe the alert — include sources, dates, and any evidence..."
              value={formBody}
              onChange={(e) => setFormBody(e.target.value)}
              rows={4}
              className="w-full bg-navy-800 border border-navy-600 rounded-lg px-4 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm resize-none"
            />
            <div className="grid grid-cols-2 sm:grid-cols-4 gap-3">
              <select
                value={formSeverity}
                onChange={(e) => setFormSeverity(e.target.value as AlertSeverity)}
                className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2.5 text-slate-300 focus:border-teal-500 focus:outline-none text-sm"
              >
                <option value="info">Info</option>
                <option value="warning">Warning</option>
                <option value="critical">Critical</option>
              </select>
              <select
                value={formCategory}
                onChange={(e) => setFormCategory(e.target.value as AlertCategory)}
                className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2.5 text-slate-300 focus:border-teal-500 focus:outline-none text-sm"
              >
                {CATEGORIES.map((c) => (
                  <option key={c} value={c}>{c.charAt(0).toUpperCase() + c.slice(1)}</option>
                ))}
              </select>
              <input
                type="text"
                placeholder="Region (optional)"
                value={formRegion}
                onChange={(e) => setFormRegion(e.target.value)}
                className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
              />
              <input
                type="url"
                placeholder="Source URL (optional)"
                value={formSourceUrl}
                onChange={(e) => setFormSourceUrl(e.target.value)}
                className="bg-navy-800 border border-navy-600 rounded-lg px-3 py-2.5 text-slate-100 placeholder-slate-500 focus:border-teal-500 focus:outline-none text-sm"
              />
            </div>
            <button
              onClick={handleSubmit}
              disabled={submitting}
              className="bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-semibold px-5 py-2.5 rounded-lg transition-colors text-sm"
            >
              {submitting ? "Submitting..." : "Submit Alert"}
            </button>
          </div>
        </div>
      )}

      {/* Filter tabs */}
      <div className="flex gap-2 mb-5 flex-wrap">
        {(["all", ...CATEGORIES] as FilterTab[]).map((tab) => (
          <button
            key={tab}
            onClick={() => setActiveTab(tab)}
            className={`text-xs px-3 py-2 rounded-lg border transition-colors font-medium capitalize ${
              activeTab === tab
                ? "bg-teal-500/15 border-teal-500/40 text-teal-400"
                : "bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500"
            }`}
          >
            {tab}
          </button>
        ))}
      </div>

      {/* Alerts feed */}
      {filtered.length === 0 ? (
        <div className="text-center py-12">
          <p className="text-slate-500 text-sm">No alerts yet.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filtered.map((alert) => {
            const isOwner = alert.author_id === profileId;
            return (
              <article
                key={alert.id}
                className={`bg-navy-900 border border-navy-700 border-l-4 ${SEVERITY_BORDER[alert.severity]} rounded-lg p-4`}
              >
                <div className="flex items-start gap-3">
                  <div className="flex-1 min-w-0">
                    <div className="flex items-center gap-2 mb-1.5 flex-wrap">
                      <span
                        className={`text-xs px-2 py-0.5 rounded border font-medium capitalize ${SEVERITY_STYLES[alert.severity]}`}
                      >
                        {alert.severity}
                      </span>
                      {alert.is_verified && (
                        <span className="text-xs px-2 py-0.5 rounded bg-emerald-500/15 border border-emerald-500/40 text-emerald-400">
                          Verified
                        </span>
                      )}
                      <span className="text-xs text-slate-500 capitalize">{alert.category}</span>
                      <span className="text-xs text-slate-500">
                        {new Date(alert.created_at).toLocaleDateString("en-GB", {
                          day: "numeric",
                          month: "short",
                          year: "numeric",
                        })}
                      </span>
                    </div>
                    <h3 className="text-slate-100 font-semibold text-sm mb-1">
                      {alert.title}
                    </h3>
                    <p className="text-slate-400 text-sm leading-relaxed mb-2 whitespace-pre-wrap">
                      {alert.body}
                    </p>
                    <div className="flex items-center gap-3 flex-wrap">
                      <span className="text-xs text-slate-500">
                        by {alert.profiles?.display_name ?? "Anonymous"}
                      </span>
                      {alert.region_tag && (
                        <span className="text-xs px-2 py-0.5 rounded bg-navy-800 border border-navy-600 text-slate-400">
                          {alert.region_tag}
                        </span>
                      )}
                      {alert.source_url && (
                        <a
                          href={alert.source_url}
                          target="_blank"
                          rel="noopener noreferrer"
                          className="text-xs text-teal-400 hover:underline"
                        >
                          Source
                        </a>
                      )}
                      {isOwner && (
                        <button
                          onClick={() => handleDelete(alert.id)}
                          className="text-xs text-slate-500 hover:text-red-400 transition-colors"
                        >
                          Delete
                        </button>
                      )}
                    </div>
                  </div>
                </div>
              </article>
            );
          })}
        </div>
      )}
    </div>
  );
}
