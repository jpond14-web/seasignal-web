"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

const SCALE_LEVELS = [
  { score: 1, label: "Fully alert, wide awake", color: "bg-emerald-500" },
  { score: 2, label: "Very lively, responsive but not at peak", color: "bg-emerald-500" },
  { score: 3, label: "Okay, somewhat fresh", color: "bg-amber-500" },
  { score: 4, label: "A little tired, less than fresh", color: "bg-amber-500" },
  { score: 5, label: "Moderately tired, let down", color: "bg-red-500" },
  { score: 6, label: "Extremely tired, very difficult to concentrate", color: "bg-red-500" },
  { score: 7, label: "Completely exhausted, unable to function effectively", color: "bg-red-500" },
];

function scoreColor(score: number): string {
  if (score <= 2) return "bg-emerald-500";
  if (score <= 4) return "bg-amber-500";
  return "bg-red-500";
}

function scoreTextColor(score: number): string {
  if (score <= 2) return "text-emerald-400";
  if (score <= 4) return "text-amber-400";
  return "text-red-400";
}

interface FatigueAssessment {
  id: string;
  fatigue_score: number;
  hours_of_rest_last_24h: number | null;
  watch_schedule: string | null;
  notes: string | null;
  assessment_date: string;
  created_at: string;
}

export default function FatiguePage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [assessments, setAssessments] = useState<FatigueAssessment[]>([]);

  const [selectedScore, setSelectedScore] = useState<number | null>(null);
  const [hoursOfRest, setHoursOfRest] = useState("");
  const [watchSchedule, setWatchSchedule] = useState("");
  const [notes, setNotes] = useState("");

  useEffect(() => {
    load();
  }, []);

  async function load() {
    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setLoading(false);
      return;
    }
    const { data: profile, error: profileError } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (profileError) {
      showToast(profileError.message, "error");
      setLoading(false);
      return;
    }
    if (!profile) {
      setLoading(false);
      return;
    }
    setProfileId(profile.id);

    const fourteenDaysAgo = new Date();
    fourteenDaysAgo.setDate(fourteenDaysAgo.getDate() - 14);

    const { data, error: assessmentsError } = await supabase
      .from("fatigue_assessments")
      .select("*")
      .eq("profile_id", profile.id)
      .gte("assessment_date", fourteenDaysAgo.toISOString().split("T")[0])
      .order("assessment_date", { ascending: false });

    if (assessmentsError) {
      showToast(assessmentsError.message, "error");
    }
    setAssessments((data as FatigueAssessment[]) || []);
    setLoading(false);
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId || selectedScore === null) return;
    setSaving(true);

    const today = new Date().toISOString().split("T")[0];

    const { error } = await supabase.from("fatigue_assessments").insert({
      profile_id: profileId,
      fatigue_score: selectedScore,
      hours_of_rest_last_24h: hoursOfRest ? parseFloat(hoursOfRest) : null,
      watch_schedule: watchSchedule.trim() || null,
      notes: notes.trim() || null,
      assessment_date: today,
    });

    if (error) {
      showToast(error.message, "error");
      setSaving(false);
      return;
    }

    showToast("Fatigue assessment saved", "success");
    setSelectedScore(null);
    setHoursOfRest("");
    setWatchSchedule("");
    setNotes("");
    setSaving(false);
    load();
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-64 bg-navy-800 rounded animate-pulse" />
        <div className="h-4 w-96 bg-navy-800 rounded animate-pulse" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 7 }).map((_, i) => (
            <div key={i} className="h-12 bg-navy-800 rounded animate-pulse" />
          ))}
        </div>
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 mb-8">
        <h2 className="text-slate-100 font-semibold text-lg mb-2">
          Fatigue Self-Assessment
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          Use the Samn-Perelli 7-point scale to assess your current fatigue
          level. Regular self-assessment helps you recognise patterns and protect
          your safety and wellbeing on board.
        </p>
      </div>

      {/* Assessment Form */}
      <form onSubmit={handleSubmit} className="space-y-6 mb-10">
        <div>
          <label className="block text-sm font-medium text-slate-200 mb-3">
            How do you feel right now?
          </label>
          <div className="space-y-2">
            {SCALE_LEVELS.map((level) => (
              <button
                key={level.score}
                type="button"
                onClick={() => setSelectedScore(level.score)}
                className={`w-full flex items-center gap-3 px-4 py-3 rounded-lg border text-left transition-colors ${
                  selectedScore === level.score
                    ? "bg-navy-800 border-teal-500"
                    : "bg-navy-900 border-navy-700 hover:border-navy-600"
                }`}
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white ${level.color}`}
                >
                  {level.score}
                </span>
                <span
                  className={`text-sm ${
                    selectedScore === level.score
                      ? "text-slate-100"
                      : "text-slate-300"
                  }`}
                >
                  {level.label}
                </span>
              </button>
            ))}
          </div>
        </div>

        {/* Optional fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="hours-rest"
              className="block text-sm text-slate-300 mb-1"
            >
              Hours of rest in last 24h
            </label>
            <input
              id="hours-rest"
              type="number"
              min="0"
              max="24"
              step="0.5"
              value={hoursOfRest}
              onChange={(e) => setHoursOfRest(e.target.value)}
              placeholder="e.g. 6.5"
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
          <div>
            <label
              htmlFor="watch-schedule"
              className="block text-sm text-slate-300 mb-1"
            >
              Watch schedule
            </label>
            <input
              id="watch-schedule"
              type="text"
              value={watchSchedule}
              onChange={(e) => setWatchSchedule(e.target.value)}
              placeholder="e.g. 0000-0600 / 1200-1800"
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label htmlFor="notes" className="block text-sm text-slate-300 mb-1">
            Notes (optional)
          </label>
          <textarea
            id="notes"
            value={notes}
            onChange={(e) => setNotes(e.target.value)}
            rows={3}
            placeholder="Any context — port ops, rough weather, interrupted rest..."
            className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving || selectedScore === null}
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
        >
          {saving ? "Saving..." : "Save Assessment"}
        </button>
      </form>

      {/* Privacy Note */}
      <div className="bg-navy-900/50 border border-navy-700 rounded-lg p-4 mb-8">
        <p className="text-xs text-slate-500">
          Your fatigue data is private and never shared with employers or
          companies.
        </p>
      </div>

      {/* Trend Chart */}
      {assessments.length >= 2 && (
        <section className="mb-8">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            14-Day Trend
          </h2>
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-4">
            <div className="flex items-end gap-1 h-32">
              {[...assessments].reverse().map((a) => {
                const pct = (a.fatigue_score / 7) * 100;
                return (
                  <div
                    key={a.id}
                    className="flex-1 flex flex-col items-center gap-1 min-w-0"
                  >
                    <span className={`text-[10px] font-mono ${scoreTextColor(a.fatigue_score)}`}>
                      {a.fatigue_score}
                    </span>
                    <div
                      className={`w-full rounded-t ${scoreColor(a.fatigue_score)}`}
                      style={{ height: `${pct}%` }}
                    />
                    <span className="text-[9px] text-slate-500 truncate w-full text-center">
                      {new Date(a.assessment_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}
                    </span>
                  </div>
                );
              })}
            </div>
          </div>
        </section>
      )}

      {/* Recent Assessments */}
      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Recent Assessments (Last 14 Days)
        </h2>
        {assessments.length === 0 ? (
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
            <p className="text-slate-400 text-sm">
              No assessments in the last 14 days. Log your first one above.
            </p>
          </div>
        ) : (
          <div className="space-y-2">
            {assessments.map((a) => (
              <div
                key={a.id}
                className="bg-navy-900 border border-navy-700 rounded-lg px-4 py-3 flex items-center gap-4"
              >
                <span
                  className={`w-8 h-8 rounded-full flex items-center justify-center text-sm font-bold text-white flex-shrink-0 ${scoreColor(a.fatigue_score)}`}
                >
                  {a.fatigue_score}
                </span>
                <div className="flex-1 min-w-0">
                  <p className={`text-sm font-medium ${scoreTextColor(a.fatigue_score)}`}>
                    {SCALE_LEVELS[a.fatigue_score - 1]?.label}
                  </p>
                  <div className="flex items-center gap-3 mt-0.5">
                    <span className="text-xs text-slate-500">
                      {new Date(a.assessment_date).toLocaleDateString("en-GB", {
                        day: "numeric",
                        month: "short",
                      })}
                    </span>
                    {a.hours_of_rest_last_24h !== null && (
                      <span className="text-xs text-slate-500">
                        {a.hours_of_rest_last_24h}h rest
                      </span>
                    )}
                    {a.watch_schedule && (
                      <span className="text-xs text-slate-500">
                        {a.watch_schedule}
                      </span>
                    )}
                  </div>
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
