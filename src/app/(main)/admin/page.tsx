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
      ]);

      setStats({
        totalUsers: totalUsers ?? 0,
        newSignups: newSignups ?? 0,
        totalMessages: totalMessages ?? 0,
        activeConversations: activeConversations ?? 0,
        totalReviews: totalReviews ?? 0,
        pendingVerifications: pendingVerifications ?? 0,
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
            date: p.created_at,
          });
        }
      }
      if (recentReviews) {
        for (const r of recentReviews) {
          items.push({
            id: `review-${r.id}`,
            type: "review",
            label: r.review_type + " review",
            detail: r.status,
            date: r.created_at,
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
            date: inc.created_at,
          });
        }
      }

      items.sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());
      setActivity(items.slice(0, 20));
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
