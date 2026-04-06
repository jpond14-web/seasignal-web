"use client";

import { useEffect, useState, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { formatDateTime } from "@/lib/format";

type AuditEntry = {
  id: string;
  admin_id: string | null;
  action: string;
  target_type: string;
  target_id: string | null;
  details: Record<string, unknown> | null;
  created_at: string | null;
  admin_name: string;
};

const PAGE_SIZE = 25;

const ACTION_OPTIONS = [
  { value: "", label: "All Actions" },
  { value: "dismiss_report", label: "Dismiss Report" },
  { value: "delete_content", label: "Delete Content" },
  { value: "ban_user", label: "Ban User" },
  { value: "delete_channel", label: "Delete Channel" },
  { value: "edit_channel", label: "Edit Channel" },
  { value: "kick_member", label: "Kick Member" },
  { value: "delete_message", label: "Delete Message" },
  { value: "make_admin", label: "Make Admin" },
  { value: "remove_admin", label: "Remove Admin" },
];

export default function AdminAuditPage() {
  const supabase = createClient();
  const [entries, setEntries] = useState<AuditEntry[]>([]);
  const [loading, setLoading] = useState(true);
  const [page, setPage] = useState(0);
  const [hasMore, setHasMore] = useState(true);
  const [actionFilter, setActionFilter] = useState("");

  const loadEntries = useCallback(
    async (pageNum: number, action: string) => {
      setLoading(true);

      let query = supabase
        .from("admin_audit_log")
        .select("*")
        .order("created_at", { ascending: false })
        .range(pageNum * PAGE_SIZE, (pageNum + 1) * PAGE_SIZE - 1);

      if (action) {
        query = query.eq("action", action);
      }

      const { data: rows } = await query;

      if (!rows) {
        setEntries([]);
        setHasMore(false);
        setLoading(false);
        return;
      }

      setHasMore(rows.length === PAGE_SIZE);

      // Fetch admin names
      const adminIds = [...new Set(rows.map((r) => r.admin_id).filter(Boolean))] as string[];
      let nameMap = new Map<string, string>();
      if (adminIds.length > 0) {
        const { data: profiles } = await supabase
          .from("profiles")
          .select("id, display_name")
          .in("id", adminIds);
        if (profiles) {
          nameMap = new Map(profiles.map((p) => [p.id, p.display_name]));
        }
      }

      const enriched: AuditEntry[] = rows.map((r) => ({
        ...r,
        details: r.details as Record<string, unknown> | null,
        admin_name: r.admin_id ? nameMap.get(r.admin_id) || "Unknown" : "System",
      }));

      setEntries(enriched);
      setLoading(false);
    },
    [supabase]
  );

  useEffect(() => {
    loadEntries(page, actionFilter);
  }, [page, actionFilter, loadEntries]);

  function handleFilterChange(action: string) {
    setActionFilter(action);
    setPage(0);
  }

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Audit Log</h1>

      {/* Filter */}
      <div className="mb-6">
        <select
          value={actionFilter}
          onChange={(e) => handleFilterChange(e.target.value)}
          className="px-3 py-2 bg-navy-900 border border-navy-700 rounded-lg text-sm text-slate-200 focus:outline-none focus:border-teal-500 transition-colors"
        >
          {ACTION_OPTIONS.map((opt) => (
            <option key={opt.value} value={opt.value}>
              {opt.label}
            </option>
          ))}
        </select>
      </div>

      {loading ? (
        <div className="space-y-3">
          {[...Array(5)].map((_, i) => (
            <div
              key={i}
              className="bg-navy-900 border border-navy-700 rounded-lg p-4"
            >
              <div className="h-4 w-48 bg-navy-800 animate-pulse rounded mb-2" />
              <div className="h-3 w-64 bg-navy-800 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : entries.length === 0 ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
          <p className="text-slate-400">No audit entries found.</p>
        </div>
      ) : (
        <>
          <div className="overflow-x-auto">
            <table className="w-full text-sm">
              <thead>
                <tr className="border-b border-navy-700 text-left">
                  <th className="px-4 py-3 text-slate-400 font-medium">Date</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Admin</th>
                  <th className="px-4 py-3 text-slate-400 font-medium">Action</th>
                  <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Target Type</th>
                  <th className="px-4 py-3 text-slate-400 font-medium hidden md:table-cell">Target ID</th>
                  <th className="px-4 py-3 text-slate-400 font-medium hidden lg:table-cell">Details</th>
                </tr>
              </thead>
              <tbody>
                {entries.map((entry) => (
                  <tr
                    key={entry.id}
                    className="border-b border-navy-700/50 bg-navy-900 hover:bg-navy-800/50 transition-colors"
                  >
                    <td className="px-4 py-3 text-slate-300 text-xs whitespace-nowrap">
                      {formatDateTime(new Date(entry.created_at ?? ""))}
                    </td>
                    <td className="px-4 py-3 text-slate-200 font-medium">
                      {entry.admin_name}
                    </td>
                    <td className="px-4 py-3">
                      <span className="inline-block px-2 py-0.5 text-xs rounded-full bg-navy-800 text-teal-400 border border-navy-600">
                        {entry.action.replace(/_/g, " ")}
                      </span>
                    </td>
                    <td className="px-4 py-3 text-slate-400 hidden md:table-cell">
                      {entry.target_type}
                    </td>
                    <td className="px-4 py-3 text-slate-500 font-mono text-xs hidden md:table-cell truncate max-w-[200px]">
                      {entry.target_id || "-"}
                    </td>
                    <td className="px-4 py-3 text-slate-500 text-xs hidden lg:table-cell truncate max-w-[300px]">
                      {entry.details ? JSON.stringify(entry.details) : "-"}
                    </td>
                  </tr>
                ))}
              </tbody>
            </table>
          </div>

          {/* Pagination */}
          <div className="flex items-center justify-between mt-4">
            <button
              onClick={() => setPage((p) => Math.max(0, p - 1))}
              disabled={page === 0}
              className="px-4 py-2 text-sm font-medium bg-navy-800 border border-navy-600 text-slate-300 rounded hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Previous
            </button>
            <span className="text-sm text-slate-400">
              Page {page + 1}
            </span>
            <button
              onClick={() => setPage((p) => p + 1)}
              disabled={!hasMore}
              className="px-4 py-2 text-sm font-medium bg-navy-800 border border-navy-600 text-slate-300 rounded hover:bg-navy-700 transition-colors disabled:opacity-50 disabled:cursor-not-allowed"
            >
              Next
            </button>
          </div>
        </>
      )}
    </div>
  );
}
