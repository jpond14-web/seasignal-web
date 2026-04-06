"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";

const DIMENSIONS = [
  { key: "sleep_quality", label: "Sleep Quality" },
  { key: "stress_level", label: "Stress Level" },
  { key: "workload_rating", label: "Workload" },
  { key: "safety_culture_rating", label: "Safety Culture" },
  { key: "food_quality_rating", label: "Food Quality" },
  { key: "connectivity_rating", label: "Connectivity" },
  { key: "shore_leave_access", label: "Shore Leave" },
  { key: "overall_morale", label: "Overall Morale" },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]["key"];

interface FatigueAssessment {
  id: string;
  fatigue_score: number;
  assessment_date: string;
}

interface WellnessCheckin {
  id: string;
  checkin_date: string;
  sleep_quality: number;
  stress_level: number;
  workload_rating: number;
  safety_culture_rating: number;
  food_quality_rating: number;
  connectivity_rating: number;
  shore_leave_access: number;
  overall_morale: number;
  contract_day_number: number | null;
}

function fatigueColor(score: number): string {
  if (score <= 2) return "bg-emerald-500";
  if (score <= 4) return "bg-amber-500";
  return "bg-red-500";
}

function barColor(value: number): string {
  if (value <= 2) return "bg-red-500";
  if (value === 3) return "bg-amber-500";
  return "bg-emerald-500";
}

function trendIndicator(
  recent: number[],
  previous: number[]
): { symbol: string; label: string; color: string } {
  if (recent.length === 0 || previous.length === 0)
    return { symbol: "\u2192", label: "Stable", color: "text-slate-400" };
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
  const diff = recentAvg - prevAvg;
  if (diff > 0.3)
    return { symbol: "\u2191", label: "Improving", color: "text-emerald-400" };
  if (diff < -0.3)
    return { symbol: "\u2193", label: "Worsening", color: "text-red-400" };
  return { symbol: "\u2192", label: "Stable", color: "text-slate-400" };
}

// For fatigue, lower is better, so invert the trend
function fatigueTrendIndicator(
  recent: number[],
  previous: number[]
): { symbol: string; label: string; color: string } {
  if (recent.length === 0 || previous.length === 0)
    return { symbol: "\u2192", label: "Stable", color: "text-slate-400" };
  const recentAvg = recent.reduce((a, b) => a + b, 0) / recent.length;
  const prevAvg = previous.reduce((a, b) => a + b, 0) / previous.length;
  const diff = recentAvg - prevAvg;
  // Lower fatigue score = better, so negative diff = improving
  if (diff < -0.3)
    return { symbol: "\u2191", label: "Improving", color: "text-emerald-400" };
  if (diff > 0.3)
    return { symbol: "\u2193", label: "Worsening", color: "text-red-400" };
  return { symbol: "\u2192", label: "Stable", color: "text-slate-400" };
}

export default function TrendsPage() {
  const supabase = createClient();
  const [loading, setLoading] = useState(true);
  const [fatigueData, setFatigueData] = useState<FatigueAssessment[]>([]);
  const [wellnessData, setWellnessData] = useState<WellnessCheckin[]>([]);

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
    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!profile) {
      setLoading(false);
      return;
    }

    const [fatigueResult, wellnessResult] = await Promise.all([
      supabase
        .from("fatigue_assessments")
        .select("id, fatigue_score, assessment_date")
        .eq("profile_id", profile.id)
        .order("assessment_date", { ascending: false })
        .limit(90),
      supabase
        .from("wellness_checkins")
        .select(
          "id, checkin_date, sleep_quality, stress_level, workload_rating, safety_culture_rating, food_quality_rating, connectivity_rating, shore_leave_access, overall_morale, contract_day_number"
        )
        .eq("profile_id", profile.id)
        .order("checkin_date", { ascending: false })
        .limit(52),
    ]);

    setFatigueData((fatigueResult.data as FatigueAssessment[]) || []);
    setWellnessData((wellnessResult.data as WellnessCheckin[]) || []);
    setLoading(false);
  }

  // Fatigue trend calculations
  const fatigueAvg =
    fatigueData.length > 0
      ? fatigueData.reduce((sum, f) => sum + f.fatigue_score, 0) /
        fatigueData.length
      : 0;

  const last30Fatigue = fatigueData.slice(0, 30);
  const recentFatigue7 = fatigueData.slice(0, 7).map((f) => f.fatigue_score);
  const prevFatigue7 = fatigueData.slice(7, 14).map((f) => f.fatigue_score);
  const fatigueTrend = fatigueTrendIndicator(recentFatigue7, prevFatigue7);

  // Wellness trend calculations
  const recentWellness4 = wellnessData.slice(0, 4);
  const prevWellness4 = wellnessData.slice(4, 8);

  // Contract strain detection
  const latestCheckin = wellnessData.length > 0 ? wellnessData[0] : null;
  const hasContractDay =
    latestCheckin && latestCheckin.contract_day_number !== null;

  function detectContractStrain(): boolean {
    if (!latestCheckin || !latestCheckin.contract_day_number) return false;
    if (latestCheckin.contract_day_number <= 120) return false;
    if (recentWellness4.length < 2 || prevWellness4.length < 2) return false;

    const recentStress =
      recentWellness4.reduce((s, c) => s + c.stress_level, 0) /
      recentWellness4.length;
    const prevStress =
      prevWellness4.reduce((s, c) => s + c.stress_level, 0) /
      prevWellness4.length;
    const recentWorkload =
      recentWellness4.reduce((s, c) => s + c.workload_rating, 0) /
      recentWellness4.length;
    const prevWorkload =
      prevWellness4.reduce((s, c) => s + c.workload_rating, 0) /
      prevWellness4.length;
    const recentMorale =
      recentWellness4.reduce((s, c) => s + c.overall_morale, 0) /
      recentWellness4.length;
    const prevMorale =
      prevWellness4.reduce((s, c) => s + c.overall_morale, 0) /
      prevWellness4.length;

    // Stress trending up (higher = more stressed) AND workload trending down (lower = worse)
    // OR stress up AND morale down
    const stressUp = recentStress > prevStress + 0.3;
    const workloadDown = recentWorkload < prevWorkload - 0.3;
    const moraleDown = recentMorale < prevMorale - 0.3;

    return (stressUp || workloadDown) && moraleDown;
  }

  const contractStrain = detectContractStrain();

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-64 bg-navy-800 rounded animate-pulse" />
        <div className="h-4 w-96 bg-navy-800 rounded animate-pulse" />
        <div className="h-32 bg-navy-800 rounded animate-pulse mt-6" />
        <div className="h-64 bg-navy-800 rounded animate-pulse" />
      </div>
    );
  }

  return (
    <div className="max-w-3xl mx-auto">
      {/* Header */}
      <div className="bg-navy-900 border border-navy-700 rounded-lg p-6 mb-8">
        <h2 className="text-slate-100 font-semibold text-lg mb-2">
          Wellness Trends
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          Your personal wellness data over time. Only you can see this.
        </p>
      </div>

      {/* Fatigue Trend */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Fatigue Trend
        </h2>
        {fatigueData.length < 3 ? (
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
            <p className="text-slate-400 text-sm">
              Log at least 3 fatigue assessments to see trends.
            </p>
            <p className="text-slate-500 text-xs mt-1">
              You have {fatigueData.length} so far.
            </p>
          </div>
        ) : (
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
            {/* Dot visualization */}
            <div className="mb-4">
              <p className="text-xs text-slate-500 mb-2">
                Last {last30Fatigue.length} assessments (newest first)
              </p>
              <div className="flex flex-wrap gap-1.5">
                {last30Fatigue.map((f) => (
                  <div
                    key={f.id}
                    className={`w-4 h-4 rounded-full ${fatigueColor(f.fatigue_score)}`}
                    title={`${new Date(f.assessment_date).toLocaleDateString("en-GB", { day: "numeric", month: "short" })}: Score ${f.fatigue_score}`}
                  />
                ))}
              </div>
              <div className="flex items-center gap-4 mt-2">
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-emerald-500 inline-block" />{" "}
                  1-2 Alert
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-amber-500 inline-block" />{" "}
                  3-4 Tired
                </span>
                <span className="flex items-center gap-1 text-xs text-slate-500">
                  <span className="w-2.5 h-2.5 rounded-full bg-red-500 inline-block" />{" "}
                  5-7 Exhausted
                </span>
              </div>
            </div>

            {/* Stats */}
            <div className="flex items-center gap-6 pt-4 border-t border-navy-700">
              <div>
                <p className="text-xs text-slate-500">Average</p>
                <p className="text-lg font-semibold text-slate-100">
                  {fatigueAvg.toFixed(1)}
                </p>
              </div>
              <div>
                <p className="text-xs text-slate-500">Trend</p>
                <p
                  className={`text-lg font-semibold ${fatigueTrend.color}`}
                >
                  {fatigueTrend.symbol} {fatigueTrend.label}
                </p>
              </div>
            </div>
          </div>
        )}
      </section>

      {/* Wellness Dimensions */}
      <section className="mb-10">
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Wellness Dimensions
        </h2>
        {wellnessData.length < 3 ? (
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
            <p className="text-slate-400 text-sm">
              Complete at least 3 wellness check-ins to see dimension trends.
            </p>
            <p className="text-slate-500 text-xs mt-1">
              You have {wellnessData.length} so far.
            </p>
          </div>
        ) : (
          <div className="space-y-3">
            {DIMENSIONS.map((dim) => {
              const latest = wellnessData[0][dim.key] as number;
              const avg =
                wellnessData.reduce(
                  (sum, c) => sum + (c[dim.key] as number),
                  0
                ) / wellnessData.length;
              const recentVals = recentWellness4.map(
                (c) => c[dim.key] as number
              );
              const prevVals = prevWellness4.map(
                (c) => c[dim.key] as number
              );

              // For stress, invert the trend (lower is better)
              const trend =
                dim.key === "stress_level"
                  ? fatigueTrendIndicator(recentVals, prevVals)
                  : trendIndicator(recentVals, prevVals);

              return (
                <div
                  key={dim.key}
                  className="bg-navy-900 border border-navy-700 rounded-lg p-4"
                >
                  <div className="flex items-center justify-between mb-2">
                    <h3 className="text-sm font-medium text-slate-200">
                      {dim.label}
                    </h3>
                    <div className="flex items-center gap-3">
                      <span className="text-xs text-slate-500">
                        Current:{" "}
                        <span className="text-slate-300 font-medium">
                          {latest}
                        </span>
                      </span>
                      <span className="text-xs text-slate-500">
                        Avg:{" "}
                        <span className="text-slate-300 font-medium">
                          {avg.toFixed(1)}
                        </span>
                      </span>
                      <span
                        className={`text-sm font-semibold ${trend.color}`}
                        title={trend.label}
                      >
                        {trend.symbol}
                      </span>
                    </div>
                  </div>
                  <div className="h-2.5 bg-navy-800 rounded-full overflow-hidden">
                    <div
                      className={`h-full rounded-full transition-all ${barColor(Math.round(avg))}`}
                      style={{ width: `${(avg / 5) * 100}%` }}
                    />
                  </div>
                </div>
              );
            })}
          </div>
        )}
      </section>

      {/* Contract Strain Monitor */}
      {hasContractDay && (
        <section className="mb-10">
          <h2 className="text-lg font-semibold text-slate-100 mb-4">
            Contract Strain Monitor
          </h2>
          {contractStrain ? (
            <div className="bg-navy-900 border border-amber-500/30 border-l-4 border-l-amber-500 rounded-lg p-5">
              <p className="text-amber-400 font-medium text-sm mb-2">
                Possible contract fatigue detected
              </p>
              <p className="text-slate-300 text-sm leading-relaxed">
                Your wellness indicators suggest contract fatigue may be setting
                in. Consider discussing with your welfare officer.
              </p>
              <p className="text-xs text-slate-500 mt-2">
                Day {latestCheckin?.contract_day_number} of contract
              </p>
            </div>
          ) : (
            <div className="bg-navy-900 border border-navy-700 rounded-lg p-5">
              <p className="text-emerald-400 font-medium text-sm mb-1">
                No contract strain indicators detected
              </p>
              <p className="text-xs text-slate-500">
                Day {latestCheckin?.contract_day_number} of contract
              </p>
            </div>
          )}
        </section>
      )}
    </div>
  );
}
