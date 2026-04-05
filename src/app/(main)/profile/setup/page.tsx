"use client";

import { useState } from "react";
import { useRouter } from "next/navigation";
import { createClient } from "@/lib/supabase/client";
import type { Enums } from "@/lib/supabase/types";

const departments: { value: Enums<"department_type">; label: string }[] = [
  { value: "deck", label: "Deck" },
  { value: "engine", label: "Engine" },
  { value: "electro", label: "Electro-Technical" },
  { value: "catering", label: "Catering" },
];

const rankCategories: { value: Enums<"rank_category">; label: string }[] = [
  { value: "cadet", label: "Cadet" },
  { value: "rating", label: "Rating" },
  { value: "officer", label: "Officer" },
];

const experienceBands: { value: Enums<"experience_band">; label: string }[] = [
  { value: "0_2y", label: "0–2 years" },
  { value: "3_5y", label: "3–5 years" },
  { value: "6_10y", label: "6–10 years" },
  { value: "10y_plus", label: "10+ years" },
];

export default function ProfileSetupPage() {
  const router = useRouter();
  const supabase = createClient();

  const [displayName, setDisplayName] = useState("");
  const [department, setDepartment] = useState<Enums<"department_type"> | "">("");
  const [rankRange, setRankRange] = useState<Enums<"rank_category"> | "">("");
  const [experienceBand, setExperienceBand] = useState<Enums<"experience_band"> | "">("");
  const [bio, setBio] = useState("");
  const [loading, setLoading] = useState(false);
  const [error, setError] = useState("");

  async function handleSubmit(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setError("");

    const {
      data: { user },
    } = await supabase.auth.getUser();

    if (!user) {
      setError("Not authenticated");
      setLoading(false);
      return;
    }

    // Use display_name from auth metadata if not provided
    const name =
      displayName.trim() ||
      (user.user_metadata?.display_name as string) ||
      "Seafarer";

    const { error: insertError } = await supabase.from("profiles").insert({
      auth_user_id: user.id,
      display_name: name,
      department_tag: department || null,
      rank_range: rankRange || null,
      experience_band: experienceBand || null,
      bio: bio.trim() || null,
    });

    setLoading(false);
    if (insertError) {
      if (insertError.code === "23505") {
        // Profile already exists, just redirect
        router.push("/home");
      } else {
        setError(insertError.message);
      }
    } else {
      router.push("/home");
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold text-slate-100 mb-2">
        Set up your profile
      </h1>
      <p className="text-slate-400 text-sm mb-6">
        Choose a pseudonym and optional tags. You can change these later.
      </p>

      <form onSubmit={handleSubmit} className="space-y-5">
        <div>
          <label htmlFor="displayName" className="block text-sm text-slate-300 mb-1.5">
            Display Name *
          </label>
          <input
            id="displayName"
            type="text"
            value={displayName}
            onChange={(e) => setDisplayName(e.target.value)}
            required
            minLength={2}
            placeholder="Your callsign"
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
          />
        </div>

        <div>
          <label htmlFor="department" className="block text-sm text-slate-300 mb-1.5">
            Department
          </label>
          <select
            id="department"
            value={department}
            onChange={(e) => setDepartment(e.target.value as Enums<"department_type">)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Select department</option>
            {departments.map((d) => (
              <option key={d.value} value={d.value}>
                {d.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="rankRange" className="block text-sm text-slate-300 mb-1.5">
            Rank Range
          </label>
          <select
            id="rankRange"
            value={rankRange}
            onChange={(e) => setRankRange(e.target.value as Enums<"rank_category">)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Select rank range</option>
            {rankCategories.map((r) => (
              <option key={r.value} value={r.value}>
                {r.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="experience" className="block text-sm text-slate-300 mb-1.5">
            Sea Experience
          </label>
          <select
            id="experience"
            value={experienceBand}
            onChange={(e) => setExperienceBand(e.target.value as Enums<"experience_band">)}
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-sm focus:border-teal-500 focus:outline-none"
          >
            <option value="">Select experience</option>
            {experienceBands.map((eb) => (
              <option key={eb.value} value={eb.value}>
                {eb.label}
              </option>
            ))}
          </select>
        </div>

        <div>
          <label htmlFor="bio" className="block text-sm text-slate-300 mb-1.5">
            Bio
          </label>
          <textarea
            id="bio"
            value={bio}
            onChange={(e) => setBio(e.target.value)}
            rows={3}
            placeholder="A few words about yourself (optional)"
            className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none resize-none"
          />
        </div>

        {error && <p className="text-sm text-red-400">{error}</p>}

        <button
          type="submit"
          disabled={loading}
          className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
        >
          {loading ? "Creating profile..." : "Continue"}
        </button>
      </form>
    </div>
  );
}
