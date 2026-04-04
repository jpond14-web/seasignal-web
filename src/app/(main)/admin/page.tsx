"use client";

import { useEffect, useState } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

interface Stats {
  totalUsers: number;
  newSignups: number;
  totalMessages: number;
  activeConversations: number;
  totalReviews: number;
  pendingVerifications: number;
  pendingReports: number;
}

interface SearchTrends {
  topTerms: { query: string; count: number }[];
  byType: { type: string; count: number }[];
  last24h: number;
  last7d: number;
  last30d: number;
}

interface ActivityItem {
  id: string;
  type: "signup" | "review" | "incident";
  label: string;
  detail: string;
  date: string;
}

export default function AdminDashboardPage() {
  const supabase = createClient();
  const [stats, setStats] = useState<Stats | null>(null);
  const [activity, setActivity] = useState<ActivityItem[]>([]);
  const [searchTrends, setSearchTrends] = useState<SearchTrends | null>(null);
  const [loading, setLoading] = useState(true);

  useEffect(() => {
    async function load() {
      const sevenDaysAgo = new Date();
      sevenDaysAgo.setDate(sevenDaysAgo.getDate() - 7);
      const sevenDaysAgoISO = sevenDaysAgo.toISOString();

      // Fetch stats
      const [
        { count: totalUsers },
        { count: newSignups },
        { count: totalMessages },
        { count: activeConversations },
        { count: totalReviews },
        { count: pendingVerifications },
        { count: pendingReports },
      ] = await Promise.all([
        supabase.from("profiles").select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .gte("created_at", sevenDaysAgoISO),
        supabase.from("messages").select("*", { count: "exact", head: true }),
        supabase.from("conversations").select("*", { count: "exact", head: true }),
        supabase.from("reviews").select("*", { count: "exact", head: true }),
        supabase
          .from("profiles")
          .select("*", { count: "exact", head: true })
          .eq("is_verified", false),
        supabase
          .from("reported_content")
          .select("*", { count: "exact", head: true })
          .or("status.is.null,status.eq.pending"),
      ]);

      setStats({
        totalUsers: totalUsers ?? 0,
        newSignups: newSignups ?? 0,
        totalMessages: totalMessages ?? 0,
        activeConversations: activeConversations ?? 0,
        totalReviews: totalReviews ?? 0,
        pendingVerifications: pendingVerifications ?? 0,
        pendingReports: pendingReports ?? 0,
      });

      // Fetch recent activity
      const [
        { data: recentSignups },
        { data: recentReviews },
        { data: recentIncidents },
      ] = await Promise.all([
        supabase
          .from("profiles")
          .select("id, display_name, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("reviews")
          .select("id, review_type, status, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
        supabase
          .from("incident_logs")
          .select("id, title, category, created_at")
          .order("created_at", { ascending: false })
          .limit(10),
      ]);

      const items: ActivityItem[] = [];

      if (recentSignups) {
        for (const p of recentSignups) {
          items.push({
            id: `signup-${p.id}`,
            type: "signup",
            label: p.display_name,
            detail: "New signup",
            date: p.created_at || new Date().toISOString(),
          });
        }
      }
      if (recentReviews) {
        for (const r of recentReviews) {
          items.push({
            id: `review-${r.id}`,
            type: "review",
            label: r.review_type + " review",
            detail: r.status || "pending",
            date: r.created_at || new Date().toISOString(),
          });
        }
      }
      if (recentIncidents) {
        for (const inc of recentIncidents) {
          items.push({
            id: `incident-${inc.id}`,
            type: "incident",
            label: inc.title,
            detail: inc.category,
            date: inc.created_at || new Date().toISOString(),
          });
        }
      }

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivity(items.slice(0, 20));

      // Fetch search analytics
      const now = new Date();
      const d24h = new Date(now.getTime() - 24 * 60 * 60 * 1000).toISOString();
      const d7d = new Date(now.getTime() - 7 * 24 * 60 * 60 * 1000).toISOString();
      const d30d = new Date(now.getTime() - 30 * 24 * 60 * 60 * 1000).toISOString();

      const [
        { data: allSearches },
        { count: count24h },
        { count: count7d },
        { count: count30d },
      ] = await Promise.all([
        supabase
          .from("search_analytics")
          .select("search_type, search_query")
          .order("created_at", { ascending: false })
          .limit(1000),
        supabase
          .from("search_analytics")
          .select("*", { count: "exact", head: true })
          .gte("created_at", d24h),
        supabase
          .from("search_analytics")
          .select("*", { count: "exact", head: true })
          .gte("created_at", d7d),
        supabase
          .from("search_analytics")
          .select("*", { count: "exact", head: true })
          .gte("created_at", d30d),
      ]);

      if (allSearches) {
        // Top terms
        const termCounts = new Map<string, number>();
        const typeCounts = new Map<string, number>();
        for (const s of allSearches) {
          const q = s.search_query.toLowerCase().trim();
          termCounts.set(q, (termCounts.get(q) || 0) + 1);
          typeCounts.set(s.search_type, (typeCounts.get(s.search_type) || 0) + 1);
        }
        const topTerms = [...termCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .slice(0, 10)
          .map(([query, count]) => ({ query, count }));
        const byType = [...typeCounts.entries()]
          .sort((a, b) => b[1] - a[1])
          .map(([type, count]) => ({ type, count }));

        setSearchTrends({
          topTerms,
          byType,
          last24h: count24h ?? 0,
          last7d: count7d ?? 0,
          last30d: count30d ?? 0,
        });
      }

      setLoading(false);
    }

    load();
  }, []);

  const statCards = stats
    ? [
        { label: "Total Users", value: stats.totalUsers, color: "text-teal-400" },
        { label: "New Signups (7d)", value: stats.newSignups, color: "text-green-400" },
        { label: "Total Messages", value: stats.totalMessages, color: "text-blue-400" },
        { label: "Conversations", value: stats.activeConversations, color: "text-purple-400" },
        { label: "Total Reviews", value: stats.totalReviews, color: "text-amber-400" },
        { label: "Pending Verifications", value: stats.pendingVerifications, color: "text-red-400", href: "/admin/verify" },
        { label: "Pending Reports", value: stats.pendingReports, color: "text-orange-400", href: "/admin/reports" },
        { label: "Channels", value: stats.activeConversations, color: "text-cyan-400", href: "/admin/channels" },
      ]
    : [];

  return (
    <div>
      <h1 className="text-2xl font-bold mb-6">Admin Dashboard</h1>

      {loading ? (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {[...Array(6)].map((_, i) => (
            <div key={i} className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <div className="h-4 w-24 bg-navy-800 animate-pulse rounded mb-2" />
              <div className="h-8 w-16 bg-navy-800 animate-pulse rounded" />
            </div>
          ))}
        </div>
      ) : (
        <div className="grid grid-cols-2 md:grid-cols-3 gap-4 mb-8">
          {statCards.map((card) => {
            const inner = (
              <>
                <p className="text-xs text-slate-400 mb-1">{card.label}</p>
                <p className={`text-2xl font-bold font-mono ${card.color}`}>
                  {card.value.toLocaleString()}
                </p>
              </>
            );
            return card.href ? (
              <Link
                key={card.label}
                href={card.href}
                className="bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-navy-600 transition-colors"
              >
                {inner}
              </Link>
            ) : (
              <div
                key={card.label}
                className="bg-navy-900 border border-navy-700 rounded-lg p-4"
              >
                {inner}
              </div>
            );
          })}
        </div>
      )}

      {/* Search Trends */}
      <h2 className="text-lg font-semibold mb-4">Search Trends</h2>
      {!searchTrends && !loading ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 text-center mb-8">
          <p className="text-slate-400">No search data yet.</p>
        </div>
      ) : searchTrends ? (
        <div className="mb-8 space-y-4">
          {/* Volume cards */}
          <div className="grid grid-cols-3 gap-4">
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Last 24h</p>
              <p className="text-2xl font-bold font-mono text-teal-400">
                {searchTrends.last24h.toLocaleString()}
              </p>
            </div>
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Last 7 days</p>
              <p className="text-2xl font-bold font-mono text-cyan-400">
                {searchTrends.last7d.toLocaleString()}
              </p>
            </div>
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <p className="text-xs text-slate-400 mb-1">Last 30 days</p>
              <p className="text-2xl font-bold font-mono text-blue-400">
                {searchTrends.last30d.toLocaleString()}
              </p>
            </div>
          </div>

          <div className="grid grid-cols-1 md:grid-cols-2 gap-4">
            {/* Top searched terms */}
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Top Searched Terms</h3>
              {searchTrends.topTerms.length === 0 ? (
                <p className="text-sm text-slate-500">No searches recorded.</p>
              ) : (
                <div className="space-y-2">
                  {searchTrends.topTerms.map((t, i) => (
                    <div key={t.query} className="flex items-center justify-between">
                      <div className="flex items-center gap-2 min-w-0">
                        <span className="text-xs text-slate-500 w-5 text-right shrink-0">
                          {i + 1}.
                        </span>
                        <span className="text-sm text-slate-200 truncate">{t.query}</span>
                      </div>
                      <span className="text-xs font-mono text-teal-400 shrink-0 ml-2">
                        {t.count}
                      </span>
                    </div>
                  ))}
                </div>
              )}
            </div>

            {/* Search volume by type */}
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
              <h3 className="text-sm font-semibold text-slate-200 mb-3">Searches by Type</h3>
              {searchTrends.byType.length === 0 ? (
                <p className="text-sm text-slate-500">No searches recorded.</p>
              ) : (
                <div className="space-y-2">
                  {searchTrends.byType.map((t) => {
                    const total = searchTrends.byType.reduce((s, x) => s + x.count, 0);
                    const pct = total > 0 ? (t.count / total) * 100 : 0;
                    return (
                      <div key={t.type}>
                        <div className="flex items-center justify-between mb-1">
                          <span className="text-sm text-slate-200 capitalize">{t.type}</span>
                          <span className="text-xs font-mono text-slate-400">
                            {t.count} ({pct.toFixed(0)}%)
                          </span>
                        </div>
                        <div className="h-1.5 bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className="h-full bg-teal-500 rounded-full"
                            style={{ width: `${pct}%` }}
                          />
                        </div>
                      </div>
                    );
                  })}
                </div>
              )}
            </div>
          </div>
        </div>
      ) : null}

      <h2 className="text-lg font-semibold mb-4">Recent Activity</h2>
      {activity.length === 0 && !loading ? (
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 text-center">
          <p className="text-slate-400">No recent activity.</p>
        </div>
      ) : (
        <div className="space-y-2">
          {activity.map((item) => (
            <div
              key={item.id}
              className="bg-navy-900 border border-navy-700 rounded-lg px-4 py-3 flex items-center justify-between"
            >
              <div className="flex items-center gap-3 min-w-0">
                <span
                  className={`w-2 h-2 rounded-full shrink-0 ${
                    item.type === "signup"
                      ? "bg-green-400"
                      : item.type === "review"
                      ? "bg-amber-400"
                      : "bg-red-400"
                  }`}
                />
                <div className="min-w-0">
                  <p className="text-sm text-slate-100 truncate">{item.label}</p>
                  <p className="text-xs text-slate-500">{item.detail}</p>
                </div>
              </div>
              <p className="text-xs text-slate-500 shrink-0 ml-4">
                {new Date(item.date).toLocaleDateString()}
              </p>
            </div>
          ))}
        </div>
      )}
    </div>
  );
}
