"use client";

import { useEffect, useState } from "react";
import { createClient } from "@/lib/supabase/client";
import { useToast } from "@/components/ui/toast";

const DIMENSIONS = [
  { key: "sleep_quality", label: "Sleep Quality", description: "How well are you sleeping?" },
  { key: "stress_level", label: "Stress Level", description: "How stressed do you feel? (1 = low, 5 = high)" },
  { key: "workload_rating", label: "Workload", description: "Is your workload manageable?" },
  { key: "safety_culture_rating", label: "Safety Culture", description: "How's the safety culture aboard?" },
  { key: "food_quality_rating", label: "Food Quality", description: "How's the food?" },
  { key: "connectivity_rating", label: "Connectivity", description: "Can you reach family/friends?" },
  { key: "shore_leave_access", label: "Shore Leave", description: "Getting adequate shore leave?" },
  { key: "overall_morale", label: "Overall Morale", description: "How's your overall morale?" },
] as const;

type DimensionKey = (typeof DIMENSIONS)[number]["key"];

type Ratings = Record<DimensionKey, number | null>;

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
  free_text: string | null;
}

function ratingColor(value: number): string {
  if (value <= 2) return "bg-red-500";
  if (value === 3) return "bg-amber-500";
  return "bg-emerald-500";
}

export default function WellnessPage() {
  const supabase = createClient();
  const { showToast } = useToast();
  const [profileId, setProfileId] = useState<string | null>(null);
  const [loading, setLoading] = useState(true);
  const [saving, setSaving] = useState(false);
  const [recentCheckins, setRecentCheckins] = useState<WellnessCheckin[]>([]);

  const [ratings, setRatings] = useState<Ratings>({
    sleep_quality: null,
    stress_level: null,
    workload_rating: null,
    safety_culture_rating: null,
    food_quality_rating: null,
    connectivity_rating: null,
    shore_leave_access: null,
    overall_morale: null,
  });
  const [contractDay, setContractDay] = useState("");
  const [freeText, setFreeText] = useState("");

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
    setProfileId(profile.id);

    const { data } = await supabase
      .from("wellness_checkins")
      .select("*")
      .eq("profile_id", profile.id)
      .order("checkin_date", { ascending: false })
      .limit(4);

    setRecentCheckins((data as WellnessCheckin[]) || []);
    setLoading(false);
  }

  function setRating(key: DimensionKey, value: number) {
    setRatings((prev) => ({ ...prev, [key]: value }));
  }

  const allRated = DIMENSIONS.every((d) => ratings[d.key] !== null);

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    if (!profileId || !allRated) return;
    setSaving(true);

    // Try to get current vessel/company from crew_history
    let vesselId: string | null = null;
    let companyId: string | null = null;

    const { data: crewHistory } = await supabase
      .from("crew_history")
      .select("vessel_id, company_id")
      .eq("profile_id", profileId)
      .eq("is_current", true)
      .single();

    if (crewHistory) {
      vesselId = crewHistory.vessel_id;
      companyId = crewHistory.company_id;
    }

    const { error } = await supabase.from("wellness_checkins").insert({
      profile_id: profileId,
      sleep_quality: ratings.sleep_quality,
      stress_level: ratings.stress_level,
      workload_rating: ratings.workload_rating,
      safety_culture_rating: ratings.safety_culture_rating,
      food_quality_rating: ratings.food_quality_rating,
      connectivity_rating: ratings.connectivity_rating,
      shore_leave_access: ratings.shore_leave_access,
      overall_morale: ratings.overall_morale,
      contract_day_number: contractDay ? parseInt(contractDay, 10) : null,
      free_text: freeText.trim() || null,
      vessel_id: vesselId,
      company_id: companyId,
    });

    if (error) {
      showToast(error.message, "error");
      setSaving(false);
      return;
    }

    showToast("Wellness check-in saved", "success");
    setRatings({
      sleep_quality: null,
      stress_level: null,
      workload_rating: null,
      safety_culture_rating: null,
      food_quality_rating: null,
      connectivity_rating: null,
      shore_leave_access: null,
      overall_morale: null,
    });
    setContractDay("");
    setFreeText("");
    setSaving(false);
    load();
  }

  if (loading) {
    return (
      <div className="max-w-3xl mx-auto space-y-4">
        <div className="h-8 w-64 bg-navy-800 rounded animate-pulse" />
        <div className="h-4 w-96 bg-navy-800 rounded animate-pulse" />
        <div className="space-y-3 mt-6">
          {Array.from({ length: 8 }).map((_, i) => (
            <div key={i} className="h-16 bg-navy-800 rounded animate-pulse" />
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
          Weekly Wellness Check-in
        </h2>
        <p className="text-slate-300 text-sm leading-relaxed">
          Rate each dimension from 1 (poor) to 5 (excellent). This takes about
          a minute and helps you track your wellbeing over time.
        </p>
      </div>

      {/* Form */}
      <form onSubmit={handleSubmit} className="space-y-5 mb-10">
        {DIMENSIONS.map((dim) => (
          <div
            key={dim.key}
            className="bg-navy-900 border border-navy-700 rounded-lg p-4"
          >
            <div className="flex items-start justify-between mb-3">
              <div>
                <h3 className="text-sm font-medium text-slate-100">
                  {dim.label}
                </h3>
                <p className="text-xs text-slate-400 mt-0.5">
                  {dim.description}
                </p>
              </div>
            </div>
            <div className="flex items-center gap-2">
              {[1, 2, 3, 4, 5].map((value) => (
                <button
                  key={value}
                  type="button"
                  onClick={() => setRating(dim.key, value)}
                  className={`w-10 h-10 rounded-lg flex items-center justify-center text-sm font-semibold transition-colors ${
                    ratings[dim.key] === value
                      ? `${ratingColor(value)} text-white`
                      : "bg-navy-800 border border-navy-600 text-slate-400 hover:border-navy-500"
                  }`}
                >
                  {value}
                </button>
              ))}
              <span className="text-xs text-slate-500 ml-2">
                {ratings[dim.key] !== null && (
                  <span>
                    {ratings[dim.key] === 1
                      ? "Poor"
                      : ratings[dim.key] === 2
                        ? "Below avg"
                        : ratings[dim.key] === 3
                          ? "Average"
                          : ratings[dim.key] === 4
                            ? "Good"
                            : "Excellent"}
                  </span>
                )}
              </span>
            </div>
          </div>
        ))}

        {/* Optional fields */}
        <div className="grid grid-cols-1 sm:grid-cols-2 gap-4">
          <div>
            <label
              htmlFor="contract-day"
              className="block text-sm text-slate-300 mb-1"
            >
              Contract day number (optional)
            </label>
            <input
              id="contract-day"
              type="number"
              min="1"
              value={contractDay}
              onChange={(e) => setContractDay(e.target.value)}
              placeholder="e.g. 45"
              className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>
        </div>

        <div>
          <label
            htmlFor="free-text"
            className="block text-sm text-slate-300 mb-1"
          >
            Anything else on your mind? (optional)
          </label>
          <textarea
            id="free-text"
            value={freeText}
            onChange={(e) => setFreeText(e.target.value)}
            rows={3}
            placeholder="How are things going generally..."
            className="w-full px-3 py-2 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none resize-none"
          />
        </div>

        <button
          type="submit"
          disabled={saving || !allRated}
          className="px-5 py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
        >
          {saving ? "Saving..." : "Submit Check-in"}
        </button>
      </form>

      {/* Privacy Note */}
      <div className="bg-navy-900/50 border border-navy-700 rounded-lg p-4 mb-8">
        <p className="text-xs text-slate-500">
          Check-in data is aggregated anonymously. Individual responses are never
          shared.
        </p>
      </div>

      {/* Recent Check-ins */}
      <section>
        <h2 className="text-lg font-semibold text-slate-100 mb-4">
          Recent Check-ins
        </h2>
        {recentCheckins.length === 0 ? (
          <div className="bg-navy-900 border border-navy-700 rounded-lg p-8 text-center">
            <p className="text-slate-400 text-sm">
              No check-ins yet. Complete your first one above.
            </p>
          </div>
        ) : (
          <div className="grid grid-cols-1 sm:grid-cols-2 gap-3">
            {recentCheckins.map((checkin) => (
              <div
                key={checkin.id}
                className="bg-navy-900 border border-navy-700 rounded-lg p-4"
              >
                <p className="text-xs text-slate-500 mb-3">
                  {new Date(checkin.checkin_date).toLocaleDateString("en-GB", {
                    day: "numeric",
                    month: "short",
                    year: "numeric",
                  })}
                </p>
                <div className="space-y-1.5">
                  {DIMENSIONS.map((dim) => {
                    const val = checkin[dim.key] as number;
                    return (
                      <div key={dim.key} className="flex items-center gap-2">
                        <span className="text-xs text-slate-400 w-20 flex-shrink-0 truncate">
                          {dim.label}
                        </span>
                        <div className="flex-1 h-2 bg-navy-800 rounded-full overflow-hidden">
                          <div
                            className={`h-full rounded-full ${ratingColor(val)}`}
                            style={{ width: `${(val / 5) * 100}%` }}
                          />
                        </div>
                        <span className="text-xs text-slate-500 w-4 text-right">
                          {val}
                        </span>
                      </div>
                    );
                  })}
                </div>
              </div>
            ))}
          </div>
        )}
      </section>
    </div>
  );
}
