"use client";

import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export function CorroborateButton({ flareId }: { flareId: string }) {
  const [state, setState] = useState<
    "idle" | "confirming" | "done" | "already"
  >("idle");
  const [submitting, setSubmitting] = useState(false);
  const [statement, setStatement] = useState("");
  const [error, setError] = useState("");

  async function handleCorroborate() {
    if (state === "idle") {
      setState("confirming");
      return;
    }

    setSubmitting(true);
    setError("");
    const supabase = createClient();

    const {
      data: { user },
    } = await supabase.auth.getUser();
    if (!user) {
      setError("Sign in to corroborate");
      setSubmitting(false);
      return;
    }

    const { data: profile } = await supabase
      .from("profiles")
      .select("id")
      .eq("auth_user_id", user.id)
      .single();
    if (!profile) {
      setError("Profile not found");
      setSubmitting(false);
      return;
    }

    const { error: insertError } = await (supabase as any)
      .from("signal_flare_corroborations")
      .insert({
        flare_id: flareId,
        profile_id: profile.id,
        statement: statement.trim() || null,
      });

    setSubmitting(false);
    if (insertError) {
      if (insertError.code === "23505") {
        setState("already");
      } else {
        setError(insertError.message);
      }
    } else {
      setState("done");
    }
  }

  if (state === "done") {
    return (
      <span className="text-xs text-teal-400">Corroborated</span>
    );
  }

  if (state === "already") {
    return (
      <span className="text-xs text-slate-500">Already corroborated</span>
    );
  }

  if (state === "confirming") {
    return (
      <div className="flex flex-col gap-2 w-full mt-2 pt-2 border-t border-navy-700">
        <p className="text-xs text-slate-400">
          I witnessed this too:
        </p>
        <input
          type="text"
          value={statement}
          onChange={(e) => setStatement(e.target.value)}
          placeholder="Optional: e.g. 'Same issue on MV Pacific Star, Feb 2026'"
          maxLength={200}
          className="w-full px-2 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-100 text-xs focus:border-teal-500 focus:outline-none"
        />
        {error && <p className="text-xs text-red-400">{error}</p>}
        <div className="flex gap-2">
          <button
            onClick={handleCorroborate}
            disabled={submitting}
            className="px-3 py-1.5 bg-amber-500 hover:bg-amber-400 disabled:opacity-50 text-navy-950 font-medium rounded text-xs transition-colors"
          >
            {submitting ? "Submitting..." : "Confirm"}
          </button>
          <button
            onClick={() => {
              setState("idle");
              setStatement("");
              setError("");
            }}
            className="px-3 py-1.5 bg-navy-800 border border-navy-600 text-slate-400 hover:text-slate-300 rounded text-xs transition-colors"
          >
            Cancel
          </button>
        </div>
      </div>
    );
  }

  return (
    <button
      onClick={handleCorroborate}
      className="text-xs text-slate-400 hover:text-amber-400 transition-colors"
    >
      I witnessed this too
    </button>
  );
}
