"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

type StoryPreviewData = {
  id: string;
  title: string;
  tags: string[];
  like_count: number;
  created_at: string;
  profiles: { display_name: string } | null;
};

type AlertPreviewData = {
  id: string;
  title: string;
  severity: "info" | "warning" | "critical";
  category: string;
  created_at: string;
};

type GuidePreviewData = {
  id: string;
  title: string;
  category: string;
  vote_count: number;
  profiles: { display_name: string } | null;
};

type CertWarning = {
  id: string;
  cert_type: string;
  expiry_date: string;
  days_left: number;
};

type ForumPostPreview = {
  id: string;
  title: string;
  created_at: string;
  profiles: { display_name: string } | null;
};

export default function HomePage() {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);
  const [profileId, setProfileId] = useState<string | null>(null);

  // Feed data
  const [stories, setStories] = useState<StoryPreviewData[]>([]);
  const [alerts, setAlerts] = useState<AlertPreviewData[]>([]);
  const [guides, setGuides] = useState<GuidePreviewData[]>([]);
  const [certWarnings, setCertWarnings] = useState<CertWarning[]>([]);
  const [forumPosts, setForumPosts] = useState<ForumPostPreview[]>([]);
  const [unreadCount, setUnreadCount] = useState(0);

  // Stats
  const [storyCount, setStoryCount] = useState(0);
  const [mentorCount, setMentorCount] = useState(0);
  const [alertCount, setAlertCount] = useState(0);

  const loadData = useCallback(async () => {
    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id, display_name")
      .eq("auth_user_id", user.id)
      .single();
    if (profile?.display_name) setDisplayName(profile.display_name);
    if (profile) setProfileId(profile.id);

    // Fetch all feed data in parallel
    const [storiesRes, alertsRes, guidesRes, forumRes, storyCountRes, mentorCountRes, alertCountRes] = await Promise.all([
      supabase
        .from("sea_stories")
        .select("id, title, tags, like_count, created_at, profiles(display_name)")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase
        .from("industry_alerts")
        .select("id, title, severity, category, created_at")
        .order("created_at", { ascending: false })
        .limit(4),
      supabase
        .from("guides")
        .select("id, title, category, vote_count, profiles(display_name)")
        .order("vote_count", { ascending: false })
        .limit(3),
      supabase
        .from("forum_posts")
        .select("id, title, created_at, profiles(display_name)")
        .order("created_at", { ascending: false })
        .limit(3),
      supabase.from("sea_stories").select("id", { count: "exact", head: true }),
      supabase.from("mentors").select("id", { count: "exact", head: true }).eq("is_active", true),
      supabase.from("industry_alerts").select("id", { count: "exact", head: true }),
    ]);

    if (storiesRes.data) setStories(storiesRes.data as unknown as StoryPreviewData[]);
    if (alertsRes.data) setAlerts(alertsRes.data as unknown as AlertPreviewData[]);
    if (guidesRes.data) setGuides(guidesRes.data as unknown as GuidePreviewData[]);
    if (forumRes.data) setForumPosts(forumRes.data as unknown as ForumPostPreview[]);
    setStoryCount(storyCountRes.count ?? 0);
    setMentorCount(mentorCountRes.count ?? 0);
    setAlertCount(alertCountRes.count ?? 0);

    // Cert warnings (expiring within 90 days)
    if (profile) {
      const now = new Date();
      const in90 = new Date(now.getTime() + 90 * 24 * 60 * 60 * 1000).toISOString().split("T")[0];
      const { data: certs } = await supabase
        .from("certificates")
        .select("id, cert_type, expiry_date")
        .eq("profile_id", profile.id)
        .not("expiry_date", "is", null)
        .lte("expiry_date", in90)
        .gte("expiry_date", now.toISOString().split("T")[0])
        .order("expiry_date", { ascending: true })
        .limit(3);
      if (certs) {
        setCertWarnings(
          certs.map((c) => ({
            id: c.id,
            cert_type: c.cert_type,
            expiry_date: c.expiry_date!,
            days_left: Math.ceil(
              (new Date(c.expiry_date!).getTime() - now.getTime()) / (1000 * 60 * 60 * 24)
            ),
          }))
        );
      }

      // Unread messages count
      const { data: memberships } = await supabase
        .from("conversation_members")
        .select("conversation_id, last_read_at")
        .eq("profile_id", profile.id);
      if (memberships) {
        let unread = 0;
        for (const m of memberships) {
          if (!m.last_read_at) { unread++; continue; }
          const { count } = await supabase
            .from("messages")
            .select("id", { count: "exact", head: true })
            .eq("conversation_id", m.conversation_id)
            .gt("created_at", m.last_read_at);
          if (count && count > 0) unread++;
        }
        setUnreadCount(unread);
      }
    }

    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadData();
  }, [loadData]);

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto py-8">
        <div className="h-8 w-64 bg-navy-800/50 rounded-lg animate-pulse mb-6" />
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          {[0, 1, 2, 3, 4, 5].map((i) => (
            <div
              key={i}
              className="h-20 bg-navy-800/50 rounded-lg animate-pulse"
              style={{ animationDelay: `${i * 100}ms` }}
            />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Welcome */}
      <div className="mb-6">
        <h2 className="text-2xl font-bold text-slate-100 mb-1">
          Welcome back, {displayName || "sailor"} &#9875;
        </h2>
        <p className="text-slate-400 text-sm">
          Here&apos;s what&apos;s happening across SeaSignal.
        </p>
      </div>

      {/* Activity Cards */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Your Activity
        </h3>
        <div className="space-y-2">
          {unreadCount > 0 && (
            <ActivityCard
              icon={"\u2709"}
              text={`${unreadCount} channel${unreadCount !== 1 ? "s" : ""} with unread messages`}
              href="/messages"
              accent="border-l-teal-500"
            />
          )}
          {certWarnings.map((cert) => (
            <ActivityCard
              key={cert.id}
              icon={"\u26A0"}
              text={`${cert.cert_type} expires in ${cert.days_left} day${cert.days_left !== 1 ? "s" : ""} (${cert.expiry_date})`}
              href="/career/certs"
              accent={cert.days_left <= 7 ? "border-l-red-500" : cert.days_left <= 30 ? "border-l-amber-500" : "border-l-blue-500"}
            />
          ))}
          {unreadCount === 0 && certWarnings.length === 0 && (
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-4 text-center">
              <p className="text-slate-500 text-sm">You&apos;re all caught up. Smooth sailing.</p>
            </div>
          )}
        </div>
      </section>

      {/* Industry Alerts */}
      {alerts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Industry Alerts
            </h3>
            <Link href="/intel/alerts" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {alerts.map((alert) => {
              const styles: Record<string, string> = {
                critical: "bg-red-500/15 border-red-500/40 text-red-400",
                warning: "bg-amber-500/15 border-amber-500/40 text-amber-400",
                info: "bg-blue-500/15 border-blue-500/40 text-blue-400",
              };
              return (
                <Link
                  key={alert.id}
                  href="/intel/alerts"
                  className="block bg-navy-900 border border-navy-700 rounded-lg p-3.5 hover:border-teal-500/30 transition-colors"
                >
                  <div className="flex items-center gap-2">
                    <span className={`text-xs px-2 py-0.5 rounded border font-medium flex-shrink-0 capitalize ${styles[alert.severity]}`}>
                      {alert.severity}
                    </span>
                    <span className="text-slate-300 text-sm truncate">{alert.title}</span>
                  </div>
                </Link>
              );
            })}
          </div>
        </section>
      )}

      {/* Sea Stories */}
      {stories.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Sea Stories
            </h3>
            <Link href="/community/stories" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-3">
            {stories.map((story) => (
              <Link
                key={story.id}
                href="/community/stories"
                className="block bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-teal-500/30 transition-colors"
              >
                <div className="flex items-start gap-3">
                  <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-teal-400 font-bold text-xs flex-shrink-0">
                    {(story.profiles?.display_name ?? "?").charAt(0)}
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-slate-100 text-sm font-semibold leading-snug">
                      {story.title}
                    </h4>
                    <div className="flex items-center gap-2 mt-1 flex-wrap">
                      <span className="text-xs text-slate-500">
                        {story.profiles?.display_name ?? "Anonymous"}
                      </span>
                      {story.tags.slice(0, 2).map((tag) => (
                        <span key={tag} className="text-xs px-2 py-0.5 rounded bg-navy-800 border border-navy-600 text-slate-400">
                          {tag}
                        </span>
                      ))}
                      <span className="text-xs text-slate-500 ml-auto">{story.like_count} likes</span>
                    </div>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Top Guides */}
      {guides.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Top Guides
            </h3>
            <Link href="/intel/guides" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {guides.map((guide) => (
              <Link
                key={guide.id}
                href="/intel/guides"
                className="block bg-navy-900 border border-navy-700 rounded-lg p-3.5 hover:border-teal-500/30 transition-colors"
              >
                <div className="flex items-center gap-3">
                  <div className="flex flex-col items-center min-w-[2rem]">
                    <svg className="w-3.5 h-3.5 text-teal-400" fill="none" viewBox="0 0 24 24" stroke="currentColor" strokeWidth={2}>
                      <path strokeLinecap="round" strokeLinejoin="round" d="M5 15l7-7 7 7" />
                    </svg>
                    <span className="text-xs font-semibold text-teal-400">{guide.vote_count}</span>
                  </div>
                  <div className="min-w-0 flex-1">
                    <h4 className="text-slate-200 text-sm font-medium truncate">{guide.title}</h4>
                    <span className="text-xs text-slate-500">
                      by {guide.profiles?.display_name ?? "Anonymous"} &middot; {guide.category}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Forum Activity */}
      {forumPosts.length > 0 && (
        <section className="mb-8">
          <div className="flex items-center justify-between mb-3">
            <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
              Forum Activity
            </h3>
            <Link href="/community/forums" className="text-xs text-teal-400 hover:text-teal-300 transition-colors">
              View all &rarr;
            </Link>
          </div>
          <div className="space-y-2">
            {forumPosts.map((post) => (
              <Link
                key={post.id}
                href="/community/forums"
                className="block bg-navy-900 border border-navy-700 rounded-lg p-3.5 hover:border-teal-500/30 transition-colors"
              >
                <div className="flex items-center gap-2">
                  <span className="text-lg flex-shrink-0">{"\uD83D\uDCAC"}</span>
                  <div className="min-w-0 flex-1">
                    <span className="text-slate-300 text-sm truncate block">{post.title}</span>
                    <span className="text-xs text-slate-500">
                      {post.profiles?.display_name ?? "Anonymous"} &middot;{" "}
                      {new Date(post.created_at ?? "").toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </section>
      )}

      {/* Quick Actions */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <QuickAction href="/career/sea-time" label="Log Sea Time" icon={"\uD83D\uDDD3"} />
          <QuickAction href="/career/certs" label="Check Certs" icon={"\uD83D\uDCDC"} />
          <QuickAction href="/career/jobs" label="Browse Jobs" icon={"\uD83D\uDD0D"} />
          <QuickAction href="/community/mentors" label="Find a Mentor" icon={"\uD83E\uDDD1\u200D\uD83C\uDFEB"} />
          <QuickAction href="/welfare/incidents" label="Report Incident" icon={"\uD83D\uDEA8"} />
          <QuickAction href="/welfare/mlc" label="Know Your Rights" icon={"\u2696"} />
        </div>
      </section>

      {/* Community Pulse */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Community Pulse
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <PulseStat number={String(storyCount)} label="Sea stories shared" />
          <PulseStat number={String(alertCount)} label="Active alerts" />
          <PulseStat number={String(mentorCount)} label="Mentors available" />
        </div>
      </section>
    </div>
  );
}

function ActivityCard({
  icon,
  text,
  href,
  accent,
}: {
  icon: string;
  text: string;
  href: string;
  accent: string;
}) {
  return (
    <Link
      href={href}
      className={`block bg-navy-900 border border-navy-700 border-l-4 ${accent} rounded-lg p-3.5 hover:border-teal-500/30 transition-colors`}
    >
      <div className="flex items-center gap-3">
        <span className="text-lg flex-shrink-0">{icon}</span>
        <span className="text-slate-300 text-sm">{text}</span>
        <svg
          className="w-4 h-4 text-slate-500 flex-shrink-0 ml-auto"
          fill="none"
          viewBox="0 0 24 24"
          stroke="currentColor"
          strokeWidth={2}
        >
          <path strokeLinecap="round" strokeLinejoin="round" d="M9 5l7 7-7 7" />
        </svg>
      </div>
    </Link>
  );
}

function QuickAction({
  href,
  label,
  icon,
}: {
  href: string;
  label: string;
  icon: string;
}) {
  return (
    <Link
      href={href}
      className="flex flex-col items-center justify-center gap-1.5 px-3 py-4 bg-navy-900 border border-navy-700 rounded-lg text-center hover:border-teal-500/30 hover:text-teal-400 transition-colors group"
    >
      <span className="text-xl">{icon}</span>
      <span className="text-xs text-slate-300 group-hover:text-teal-400 transition-colors font-medium">
        {label}
      </span>
    </Link>
  );
}

function PulseStat({ number, label }: { number: string; label: string }) {
  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-4 text-center">
      <div className="text-xl font-bold text-teal-400">{number}</div>
      <div className="text-xs text-slate-500 mt-1">{label}</div>
    </div>
  );
}
