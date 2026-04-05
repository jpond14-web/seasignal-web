"use client";

import { useEffect, useState, useCallback } from "react";
import Link from "next/link";
import { createClient } from "@/lib/supabase/client";

export default function HomePage() {
  const supabase = createClient();
  const [displayName, setDisplayName] = useState("");
  const [loading, setLoading] = useState(true);

  const loadProfile = useCallback(async () => {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: profile } = await supabase
      .from("profiles")
      .select("display_name")
      .eq("auth_user_id", user.id)
      .single();

    if (profile?.display_name) {
      setDisplayName(profile.display_name);
    }
    setLoading(false);
  }, [supabase]);

  useEffect(() => {
    loadProfile();
  }, [loadProfile]);

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

      {/* Recent Activity */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Recent Activity
        </h3>
        <div className="space-y-2">
          <ActivityCard
            icon={"\u2709"}
            text="3 new messages in your channels"
            href="/messages"
            accent="border-l-teal-500"
          />
          <ActivityCard
            icon={"\u26A0"}
            text="Your STCW BST certificate expires in 47 days"
            href="/career/certs"
            accent="border-l-amber-500"
          />
          <ActivityCard
            icon={"\uD83D\uDCAC"}
            text="New reply in 'Bridge Equipment Failures' thread"
            href="/community/forums"
            accent="border-l-blue-500"
          />
        </div>
      </section>

      {/* Sea Stories preview */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
            Sea Stories
          </h3>
          <Link
            href="/community/stories"
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="space-y-3">
          <StoryPreview
            author="ChiefMate_K"
            title="The Night the Anchor Chain Parted in Typhoon Season"
            sector="Bulk Carrier"
          />
          <StoryPreview
            author="EngCadet_Sara"
            title="My First Watch Alone in the Engine Room"
            sector="Container"
          />
          <StoryPreview
            author="Bosun_Pete"
            title="Rescued a Fisherman 200nm Off West Africa"
            sector="Tanker"
          />
        </div>
      </section>

      {/* Industry Alerts preview */}
      <section className="mb-8">
        <div className="flex items-center justify-between mb-3">
          <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide">
            Industry Alerts
          </h3>
          <Link
            href="/intel/alerts"
            className="text-xs text-teal-400 hover:text-teal-300 transition-colors"
          >
            View all &rarr;
          </Link>
        </div>
        <div className="space-y-2">
          <AlertPreview
            severity="Critical"
            title="PSC Detention: MV Ocean Fortune — Busan"
          />
          <AlertPreview
            severity="Warning"
            title="STCW Amendment: New ECDIS Familiarization Requirements"
          />
        </div>
      </section>

      {/* Quick Actions */}
      <section className="mb-8">
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Quick Actions
        </h3>
        <div className="grid grid-cols-2 md:grid-cols-3 gap-3">
          <QuickAction href="/career/sea-time" label="Log Sea Time" icon={"\uD83D\uDDD3"} />
          <QuickAction href="/career/certs" label="Check Certs" icon={"\uD83D\uDCDC"} />
          <QuickAction href="/career/jobs" label="Browse Jobs" icon={"\uD83D\uDD0D"} />
          <QuickAction
            href="/community/mentors"
            label="Find a Mentor"
            icon={"\uD83E\uDDD1\u200D\uD83C\uDFEB"}
          />
          <QuickAction
            href="/welfare/incidents"
            label="Report Incident"
            icon={"\uD83D\uDEA8"}
          />
          <QuickAction
            href="/welfare/mlc"
            label="Know Your Rights"
            icon={"\u2696"}
          />
        </div>
      </section>

      {/* Community Pulse */}
      <section>
        <h3 className="text-sm font-semibold text-slate-400 uppercase tracking-wide mb-3">
          Community Pulse
        </h3>
        <div className="grid grid-cols-3 gap-3">
          <PulseStat number="1,247" label="Seafarers online" />
          <PulseStat number="38" label="Active forum threads" />
          <PulseStat number="12" label="Mentor matches this week" />
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

function StoryPreview({
  author,
  title,
  sector,
}: {
  author: string;
  title: string;
  sector: string;
}) {
  return (
    <Link
      href="/community/stories"
      className="block bg-navy-900 border border-navy-700 rounded-lg p-4 hover:border-teal-500/30 transition-colors"
    >
      <div className="flex items-start gap-3">
        <div className="w-8 h-8 rounded-full bg-navy-700 flex items-center justify-center text-teal-400 font-bold text-xs flex-shrink-0">
          {author.charAt(0)}
        </div>
        <div className="min-w-0 flex-1">
          <h4 className="text-slate-100 text-sm font-semibold leading-snug">
            {title}
          </h4>
          <div className="flex items-center gap-2 mt-1">
            <span className="text-xs text-slate-500">{author}</span>
            <span className="text-xs px-2 py-0.5 rounded bg-navy-800 border border-navy-600 text-slate-400">
              {sector}
            </span>
          </div>
        </div>
      </div>
    </Link>
  );
}

function AlertPreview({
  severity,
  title,
}: {
  severity: "Critical" | "Warning" | "Info";
  title: string;
}) {
  const styles: Record<string, string> = {
    Critical: "bg-red-500/15 border-red-500/40 text-red-400",
    Warning: "bg-amber-500/15 border-amber-500/40 text-amber-400",
    Info: "bg-blue-500/15 border-blue-500/40 text-blue-400",
  };

  return (
    <Link
      href="/intel/alerts"
      className="block bg-navy-900 border border-navy-700 rounded-lg p-3.5 hover:border-teal-500/30 transition-colors"
    >
      <div className="flex items-center gap-2">
        <span
          className={`text-xs px-2 py-0.5 rounded border font-medium flex-shrink-0 ${styles[severity]}`}
        >
          {severity}
        </span>
        <span className="text-slate-300 text-sm truncate">{title}</span>
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
