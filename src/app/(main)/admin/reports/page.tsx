"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";

type Report = {
  id: string;
  content_id: string;
  content_type: string;
  reason: string;
  details: string | null;
  status: string | null;
  reporter_id: string;
  reviewed_by: string | null;
  created_at: string;
  updated_at: string;
  reporter_name: string;
  message_content: string | null;
  message_sender_id: string | null;
};

type FilterTab = "all" | "pending" | "resolved" | "dismissed";

export default function AdminReportsPage() {
  const supabase = createClient();
  const [reports, setReports] = useState<Report[]>([]);
  const [loading, setLoading] = useState(true);
  const [activeTab, setActiveTab] = useState<FilterTab>("all");
  const [acting, setActing] = useState<string | null>(null);
  const [adminProfileId, setAdminProfileId] = useState<string | null>(null);

  const loadReports = useCallback(async () => {
    setLoading(true);

    // Get admin profile ID
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (user) {
      const { data: profile } = await supabase
        .from("profiles")
        .select("id")
        .eq("auth_user_id", user.id)
        .single();
      if (profile) setAdminProfileId(profile.id);
    }

    // Fetch all reported content
    const { data: rawReports } = await supabase
      .from("reported_content")
      .select("*")
      .order("created_at", { ascending: false });

    if (!rawReports) {
      setReports([]);
      setLoading(false);
      return;
    }

    // Enrich with reporter names and message content
    const reporterIds = [...new Set(rawReports.map((r) => r.reporter_id))];
    const contentIds = [
      ...new Set(
        rawReports
          .filter((r) => r.content_type === "message")
          .map((r) => r.content_id)
      ),
    ];

    const [{ data: reporters }, { data: messages }] = await Promise.all([
      supabase
        .from("profiles")
        .select("id, display_name")
        .in("id", reporterIds.length > 0 ? reporterIds : ["__none__"]),
      supabase
        .from("messages")
        .select("id, plaintext, sender_id")
        .in("id", contentIds.length > 0 ? contentIds : ["__none__"]),
    ]);

    const reporterMap = new Map(
      (reporters || []).map((p) => [p.id, p.display_name])
    );
    const messageMap = new Map(
      (messages || []).map((m) => [m.id, { plaintext: m.plaintext, sender_id: m.sender_id }])
    );

    const enriched: Report[] = rawReports.map((r) => {
      const msg = messageMap.get(r.content_id);
      return {
        ...r,
        reporter_name: reporterMap.get(r.reporter_id) || "Unknown",
        message_content: msg?.plaintext || null,
        message_sender_id: msg?.sender_id || null,
      };
    });

    setReports(enriched);
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadReports();
  }, []);

  const filteredReports = reports.filter((r) => {
    if (activeTab === "all") return true;
    if (activeTab === "pending") return !r.status || r.status === "pending";
    return r.status === activeTab;
  });

  async function dismissReport(reportId: string) {
    setActing(reportId);
    await supabase
      .from("reported_content")
      .update({ status: "dismissed", reviewed_by: adminProfileId, updated_at: new Date().toISOString() })
      .eq("id", reportId);
    await loadReports();
    setActing(null);
  }

  async function deleteContent(report: Report) {
    const confirmed = window.confirm(
      "Delete the reported message and resolve this report?"
    );
    if (!confirmed) return;

    setActing(report.id);

    // Delete the message
    if (report.content_type === "message") {
      await supabase.from("messages").delete().eq("id", report.content_id);
    }

    // Resolve the report
    await supabase
      .from("reported_content")
      .update({ status: "resolved", reviewed_by: adminProfileId, updated_at: new Date().toISOString() })
      .eq("id", report.id);

    await loadReports();
    setActing(null);
  }

  async function banUser(report: Report) {
    if (!report.message_sender_id) return;
    const confirmed = window.confirm(
      "Ban the message sender (set is_verified to false) and resolve this report?"
    );
    if (!confirmed) return;

    setActing(report.id);

    // Set sender's is_verified to false
    await supabase
      .from("profiles")
      .update({ is_verified: false })
      .eq("id", report.message_sender_id);

    // Resolve the report
    await supabase
      .from("reported_content")
      .update({ status: "resolved", reviewed_by: adminProfileId, updated_at: new Date().toISOString() })
      .eq("id", report.id);

    await loadReports();
    setActing(null);
  }

  const tabs: { key: FilterTab; label: string }[] = [
    { key: "all", label: "All" },
    { key: "pending", label: "Pending" },
    { key: "resolved", label: "Resolved" },
    { key: "dismissed", label: "Dismissed" },
  ];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Reported Content</h1>

      {/* Filter Tabs */}
      <div className="flex gap-1 mb-6 bg-navy-900 border border-navy-700 rounded-lg p-1 w-fit">
        {tabs.map((tab) => (
          <button
            key={tab.key}
            onClick={() => setActiveTab(tab.key)}
            className={`px-4 py-1.5 text-sm rounded-md transition-colors ${
              activeTab === tab.key
                ? "bg-navy-700 text-teal-400 font-medium"
                : "text-slate-400 hover:text-slate-200"
            }`}
          >
            {tab.label}
            {tab.key === "pending" && (
              <span className="ml-1.5 text-xs font-mono">
                ({reports.filter((r) => !r.status || r.status === "pending").length})
              </span>
            )}
          </button>
        ))}
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4"
            >
              <div className="h-4 w-48 bg-navy-800 animate-pulse rounded mb-2" />
              <div className="h-3 w-64 bg-navy-800 animate-pulse rounded mb-2" />
              <div className="h-3 w-32 bg-navy-800 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : filteredReports.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No reports found.</p>
        </div>
      ) : (
        <div className="space-y-3">
          {filteredReports.map((report) => (
            <div
              key={report.id}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4"
            >
              <div className="flex items-start justify-between gap-4">
                <div className="min-w-0 flex-1">
                  {/* Status badge */}
                  <div className="flex items-center gap-2 mb-2">
                    <span
                      className={`inline-block px-2 py-0.5 text-xs rounded-full font-medium ${
                        !report.status || report.status === "pending"
                          ? "bg-amber-500/10 text-amber-400 border border-amber-500/20"
                          : report.status === "resolved"
                          ? "bg-green-500/10 text-green-400 border border-green-500/20"
                          : "bg-slate-500/10 text-slate-400 border border-slate-500/20"
                      }`}
                    >
                      {report.status || "pending"}
                    </span>
                    <span className="text-xs text-slate-500">
                      {report.content_type}
                    </span>
                  </div>

                  {/* Reporter info */}
                  <p className="text-sm text-slate-200 mb-1">
                    <span className="text-slate-500">Reported by:</span>{" "}
                    {report.reporter_name}
                  </p>

                  {/* Reason */}
                  <p className="text-sm text-slate-200 mb-1">
                    <span className="text-slate-500">Reason:</span>{" "}
                    {report.reason}
                  </p>

                  {/* Details */}
                  {report.details && (
                    <p className="text-sm text-slate-400 mb-2">
                      {report.details}
                    </p>
                  )}

                  {/* Content preview */}
                  {report.message_content && (
                    <div className="bg-navy-800 border border-navy-600 rounded p-3 mt-2">
                      <p className="text-xs text-slate-500 mb-1">
                        Message content:
                      </p>
                      <p className="text-sm text-slate-300 line-clamp-3">
                        {report.message_content}
                      </p>
                    </div>
                  )}

                  {/* Date */}
                  <p className="text-xs text-slate-500 mt-2">
                    {new Date(report.created_at).toLocaleString()}
                  </p>
                </div>

                {/* Actions */}
                {(!report.status || report.status === "pending") && (
                  <div className="flex flex-col gap-2 shrink-0">
                    <button
                      onClick={() => dismissReport(report.id)}
                      disabled={acting === report.id}
                      className="px-3 py-1.5 text-xs font-medium bg-navy-800 border border-navy-600 text-slate-300 rounded hover:bg-navy-700 transition-colors disabled:opacity-50"
                    >
                      Dismiss
                    </button>
                    <button
                      onClick={() => deleteContent(report)}
                      disabled={acting === report.id}
                      className="px-3 py-1.5 text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
                    >
                      Delete Content
                    </button>
                    {report.message_sender_id && (
                      <button
                        onClick={() => banUser(report)}
                        disabled={acting === report.id}
                        className="px-3 py-1.5 text-xs font-medium bg-red-500/10 border border-red-500/20 text-red-400 rounded hover:bg-red-500/20 transition-colors disabled:opacity-50"
                      >
                        Ban User
                      </button>
                    )}
                  </div>
                )}
              </div>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
