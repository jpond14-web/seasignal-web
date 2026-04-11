"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDate } from "@/lib/format";

const CATEGORY_LABELS: Record<string, string> = {
  unsafe_water: "Unsafe Water",
  wage_theft: "Wage Theft",
  forced_overtime: "Forced Overtime",
  document_retention: "Document Retention",
  unsafe_conditions: "Unsafe Conditions",
  harassment_abuse: "Harassment",
  environmental_violation: "Environmental",
  food_safety: "Food Safety",
  medical_neglect: "Medical Neglect",
  other: "Other",
};

interface FlareRow {
  id: string;
  category: string;
  severity: string;
  title: string;
  description: string | null;
  status: string;
  is_anonymous: boolean;
  created_at: string;
  company_id: string;
  vessel_id: string | null;
  profile_id: string;
  admin_notes: string | null;
  companies: { name: string } | null;
  vessels: { name: string } | null;
  signal_flare_corroborations: { id: string }[];
}

export default function AdminFlaresPage() {
  const supabase = createClient();
  const [flares, setFlares] = useState<FlareRow[]>([]);
  const [loading, setLoading] = useState(true);
  const [actionLoading, setActionLoading] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState<string | null>(null);

  useEffect(() => {
    loadFlares();
  }, []);

  async function loadFlares() {
    const { data } = await (supabase as any)
      .from("signal_flares")
      .select(
        "*, companies (name), vessels (name), signal_flare_corroborations (id)"
      )
      .order("created_at", { ascending: false })
      .limit(100);
    setFlares((data as FlareRow[]) ?? []);
    setLoading(false);
  }

  async function updateStatus(id: string, newStatus: string) {
    setActionLoading(id);
    await (supabase as any)
      .from("signal_flares")
      .update({ status: newStatus })
      .eq("id", id);
    setFlares((prev) =>
      prev.map((f) => (f.id === id ? { ...f, status: newStatus } : f))
    );
    setActionLoading(null);
  }

  async function handleDelete(id: string) {
    setActionLoading(id);
    await (supabase as any).from("signal_flares").delete().eq("id", id);
    setFlares((prev) => prev.filter((f) => f.id !== id));
    setDeleteConfirm(null);
    setActionLoading(null);
  }

  function statusBadge(status: string) {
    const styles: Record<string, string> = {
      published: "bg-green-500/10 text-green-400 border-green-500/30",
      pending: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      flagged: "bg-red-500/10 text-red-400 border-red-500/30",
      removed: "bg-slate-500/10 text-slate-400 border-slate-500/30",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full border ${
          styles[status] ?? styles.pending
        }`}
      >
        {status}
      </span>
    );
  }

  function severityBadge(severity: string) {
    const styles: Record<string, string> = {
      concern: "bg-amber-500/10 text-amber-400 border-amber-500/30",
      violation: "bg-orange-500/10 text-orange-400 border-orange-500/30",
      critical: "bg-red-500/10 text-red-400 border-red-500/30",
    };
    return (
      <span
        className={`text-xs px-2 py-0.5 rounded-full border ${
          styles[severity] ?? styles.concern
        }`}
      >
        {severity}
      </span>
    );
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Signal Flare Moderation</h1>

      {loading ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
          <p className="text-slate-400">Loading flares...</p>
        </div>
      ) : flares.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No signal flares found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {flares.map((flare) => {
            const corroborations =
              flare.signal_flare_corroborations?.length || 0;

            return (
              <div
                key={flare.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-4"
              >
                <div className="flex items-start justify-between gap-4">
                  <div className="min-w-0 flex-1">
                    <div className="flex items-center gap-2 mb-1 flex-wrap">
                      <span className="text-xs px-2 py-0.5 bg-navy-800 border border-navy-600 rounded text-slate-400">
                        {CATEGORY_LABELS[flare.category] || flare.category}
                      </span>
                      {severityBadge(flare.severity)}
                      {statusBadge(flare.status)}
                      {flare.is_anonymous && (
                        <span className="text-xs text-slate-500 italic">
                          anonymous
                        </span>
                      )}
                      {corroborations > 0 && (
                        <span className="text-xs text-teal-400">
                          {corroborations} corroboration
                          {corroborations !== 1 ? "s" : ""}
                        </span>
                      )}
                    </div>

                    <p className="text-sm font-medium text-slate-100 mt-1">
                      {flare.title}
                    </p>

                    <div className="flex items-center gap-2 text-xs text-slate-500 mt-1">
                      {flare.companies && <span>{flare.companies.name}</span>}
                      {flare.vessels && (
                        <>
                          <span>&middot;</span>
                          <span>{flare.vessels.name}</span>
                        </>
                      )}
                    </div>

                    {flare.description && (
                      <p className="text-sm text-slate-300 mt-2 line-clamp-3">
                        {flare.description}
                      </p>
                    )}

                    <p className="text-xs text-slate-500 mt-2">
                      {formatDate(new Date(flare.created_at))} &mdash; ID:{" "}
                      {flare.id.slice(0, 8)}...
                    </p>
                  </div>

                  <div className="flex flex-col items-end gap-2 shrink-0">
                    {flare.status === "pending" && (
                      <button
                        onClick={() => updateStatus(flare.id, "published")}
                        disabled={actionLoading === flare.id}
                        className="text-xs px-2.5 py-1 rounded bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20 transition-colors disabled:opacity-50"
                      >
                        {actionLoading === flare.id ? "..." : "Publish"}
                      </button>
                    )}
                    <button
                      onClick={() =>
                        updateStatus(
                          flare.id,
                          flare.status === "flagged" ? "published" : "flagged"
                        )
                      }
                      disabled={actionLoading === flare.id}
                      className={`text-xs px-2.5 py-1 rounded transition-colors disabled:opacity-50 ${
                        flare.status === "flagged"
                          ? "bg-green-500/10 border border-green-500/30 text-green-400 hover:bg-green-500/20"
                          : "bg-amber-500/10 border border-amber-500/30 text-amber-400 hover:bg-amber-500/20"
                      }`}
                    >
                      {actionLoading === flare.id
                        ? "..."
                        : flare.status === "flagged"
                        ? "Unflag"
                        : "Flag"}
                    </button>
                    {deleteConfirm === flare.id ? (
                      <div className="flex items-center gap-1">
                        <button
                          onClick={() => handleDelete(flare.id)}
                          disabled={actionLoading === flare.id}
                          className="text-xs px-2.5 py-1 rounded bg-red-500/20 border border-red-500/30 text-red-400 hover:bg-red-500/30 transition-colors disabled:opacity-50"
                        >
                          {actionLoading === flare.id ? "..." : "Confirm"}
                        </button>
                        <button
                          onClick={() => setDeleteConfirm(null)}
                          className="text-xs px-2.5 py-1 rounded bg-navy-800 border border-navy-600 text-slate-400 hover:text-slate-100 transition-colors"
                        >
                          Cancel
                        </button>
                      </div>
                    ) : (
                      <button
                        onClick={() => setDeleteConfirm(flare.id)}
                        className="text-xs px-2.5 py-1 rounded bg-red-500/10 border border-red-500/30 text-red-400 hover:bg-red-500/20 transition-colors"
                      >
                        Delete
                      </button>
                    )}
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
