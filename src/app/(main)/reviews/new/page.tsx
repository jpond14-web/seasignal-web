"use client";

import { Suspense, useEffect, useState } from "react";
import { useRouter, useSearchParams } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/types";

const ratingFields = [
  { key: "pay_reliability", label: "Pay Reliability", help: "Were you paid on time and in full per your contract?" },
  { key: "contract_accuracy", label: "Contract Accuracy", help: "Did the actual job match what was promised in your contract?" },
  { key: "safety_culture", label: "Safety Culture", help: "Were safety procedures followed? Was safety equipment provided?" },
  { key: "food_quality", label: "Food Quality", help: "Was food nutritious, varied, and were dietary needs met?" },
  { key: "shore_leave", label: "Shore Leave", help: "Were you given reasonable shore leave when in port?" },
  { key: "management", label: "Management", help: "Were officers fair, professional, and approachable?" },
  { key: "equipment_condition", label: "Equipment Condition", help: "Was equipment properly maintained and in safe working order?" },
];

const RATING_LABELS: Record<number, { label: string; color: string }> = {
  1: { label: "Very Poor", color: "text-red-400" },
  2: { label: "Poor", color: "text-orange-400" },
  3: { label: "Average", color: "text-amber-400" },
  4: { label: "Good", color: "text-teal-400" },
  5: { label: "Excellent", color: "text-green-400" },
};

export default function NewReviewPage() {
  return (
    <Suspense fallback={<div className="max-w-lg mx-auto"><p className="text-slate-400">Loading...</p></div>}>
      <NewReviewForm />
    </Suspense>
  );
}

function NewReviewForm() {
  const router = useRouter();
  const searchParams = useSearchParams();
  const supabase = createClient();

  const [reviewType, setReviewType] = useState<Enums<"review_type">>("company");
  const [companyId, setCompanyId] = useState(searchParams.get("company") || "");
  const [vesselId, setVesselId] = useState(searchParams.get("vessel") || "");
  const [contractPeriod, setContractPeriod] = useState("");
  const [ratings, setRatings] = useState<Record<string, number>>({});
  const [narrative, setNarrative] = useState("");
  const [isAnonymous, setIsAnonymous] = useState(true);
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  const [companies, setCompanies] = useState<{ id: string; name: string }[]>([]);
  const [vessels, setVessels] = useState<{ id: string; name: string }[]>([]);

  useEffect(() => {
    supabase.from("companies").select("id, name").order("name").then(({ data }) => {
      setCompanies(data || []);
    });
    supabase.from("vessels").select("id, name").order("name").then(({ data }) => {
      setVessels(data || []);
    });
  }, []);

  function getNextSunday(): string {
    const now = new Date();
    const daysUntilSunday = (7 - now.getUTCDay()) % 7 || 7;
    const next = new Date(now);
    next.setUTCDate(now.getUTCDate() + daysUntilSunday);
    next.setUTCHours(0, 0, 0, 0);
    return next.toISOString();
  }

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const { data: { user } } = await supabase.auth.getUser();
    if (!user) { setError("Not authenticated"); setLoading(false); return; }

    const { data: profile } = await supabase
      .from("profiles").select("id").eq("auth_user_id", user.id).single();
    if (!profile) { setError("Profile not found"); setLoading(false); return; }

    const { error: insertError } = await supabase.from("reviews").insert({
      profile_id: profile.id,
      review_type: reviewType,
      company_id: companyId || null,
      vessel_id: vesselId || null,
      contract_period: contractPeriod || null,
      ratings,
      narrative: narrative.trim() || null,
      is_anonymous: isAnonymous,
      batch_release_at: getNextSunday(),
      status: "pending",
    });

    setLoading(false);
    if (insertError) {
      setError(insertError.message);
    } else {
      router.push("/home");
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Write a Review</h1>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Review Type</label>
          <div className="flex gap-2">
            {(["company", "vessel", "manning_agency"] as Enums<"review_type">[]).map((t) => (
              <button
                key={t}
                type="button"
                onClick={() => setReviewType(t)}
                className={`flex-1 py-2 px-3 text-sm rounded border transition-colors ${
                  reviewType === t
                    ? "bg-teal-500/20 text-teal-400 border-teal-500/30"
                    : "bg-navy-800 text-slate-400 border-navy-600"
                }`}
              >
                {t.replace(/_/g, " ").replace(/\b\w/g, (c) => c.toUpperCase())}
              </button>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Company</label>
          <select
            value={companyId}
            onChange={(e) => setCompanyId(e.target.value)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Select company</option>
            {companies.map((c) => (
              <option key={c.id} value={c.id}>{c.name}</option>
            ))}
          </select>
        </div>

        {(reviewType === "vessel") && (
          <div>
            <label className="block text-sm text-slate-300 mb-1.5">Vessel</label>
            <select
              value={vesselId}
              onChange={(e) => setVesselId(e.target.value)}
              className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
            >
              <option value="">Select vessel</option>
              {vessels.map((v) => (
                <option key={v.id} value={v.id}>{v.name}</option>
              ))}
            </select>
          </div>
        )}

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Contract Period</label>
          <input
            type="text"
            value={contractPeriod}
            onChange={(e) => setContractPeriod(e.target.value)}
            placeholder="e.g. Jan–Jun 2025"
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1">Ratings</label>
          <div className="flex gap-2 bg-navy-800 border border-navy-700 p-3 rounded mb-3">
            <svg className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <div className="text-xs text-slate-400">
              <p className="mb-1">Rate each area based on your personal experience:</p>
              <div className="flex flex-wrap gap-x-3 gap-y-0.5">
                <span><span className="text-red-400 font-mono">1</span> Very Poor</span>
                <span><span className="text-orange-400 font-mono">2</span> Poor</span>
                <span><span className="text-amber-400 font-mono">3</span> Average</span>
                <span><span className="text-teal-400 font-mono">4</span> Good</span>
                <span><span className="text-green-400 font-mono">5</span> Excellent</span>
              </div>
            </div>
          </div>
          <div className="space-y-3">
            {ratingFields.map((field) => (
              <div key={field.key}>
                <div className="flex items-center justify-between">
                  <div>
                    <span className="text-sm text-slate-400">{field.label}</span>
                    <p className="text-xs text-slate-600">{field.help}</p>
                  </div>
                  <div className="flex items-center gap-2">
                    {ratings[field.key] && (
                      <span className={`text-xs ${RATING_LABELS[ratings[field.key]].color}`}>
                        {RATING_LABELS[ratings[field.key]].label}
                      </span>
                    )}
                    <div className="flex gap-1">
                      {[1, 2, 3, 4, 5].map((n) => (
                        <button
                          key={n}
                          type="button"
                          onClick={() => setRatings((prev) => ({ ...prev, [field.key]: n }))}
                          className={`w-8 h-8 rounded text-sm font-mono transition-colors ${
                            (ratings[field.key] || 0) >= n
                              ? "bg-teal-500 text-navy-950"
                              : "bg-navy-800 text-slate-500 border border-navy-600"
                          }`}
                        >
                          {n}
                        </button>
                      ))}
                    </div>
                  </div>
                </div>
              </div>
            ))}
          </div>
        </div>

        <div>
          <label className="block text-sm text-slate-300 mb-1.5">Narrative</label>
          <div className="flex gap-2 bg-navy-800 border border-navy-700 p-3 rounded mb-2">
            <svg className="w-4 h-4 text-slate-500 shrink-0 mt-0.5" viewBox="0 0 20 20" fill="currentColor">
              <path fillRule="evenodd" d="M18 10a8 8 0 11-16 0 8 8 0 0116 0zm-7-4a1 1 0 11-2 0 1 1 0 012 0zM9 9a1 1 0 000 2v3a1 1 0 001 1h1a1 1 0 100-2v-3a1 1 0 00-1-1H9z" clipRule="evenodd" />
            </svg>
            <p className="text-sm text-slate-400">
              Share your personal experience. Use &ldquo;I experienced...&rdquo; or &ldquo;In my time on board...&rdquo; rather than making factual claims about the company.
            </p>
          </div>
          <textarea
            value={narrative}
            onChange={(e) => setNarrative(e.target.value)}
            rows={4}
            placeholder="Share your experience..."
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none resize-none"
          />
        </div>

        <label className="flex items-center gap-2 cursor-pointer">
          <input
            type="checkbox"
            checked={isAnonymous}
            onChange={(e) => setIsAnonymous(e.target.checked)}
            className="w-4 h-4 rounded border-navy-600 bg-navy-800 text-teal-500 focus:ring-teal-500"
          />
          <span className="text-sm text-slate-300">Submit anonymously</span>
        </label>

        <p className="text-xs text-slate-500">
          Reviews are batch-released every Sunday to protect anonymity.
        </p>

        <div className="bg-navy-800/50 border border-navy-700 rounded-lg p-3 mt-4">
          <p className="text-xs text-slate-300 leading-relaxed">
            <span className="text-teal-400 font-medium">Privacy guarantee:</span> Your identity is never shown publicly, even when posting non-anonymously (only your display name appears). Anonymous reviews are batch-released weekly to prevent identification by timing. Admins cannot see your real name on anonymous reviews.
          </p>
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
        >
          {loading ? "Submitting..." : "Submit Review"}
        </button>
      </form>
    </div>
  );
}
