"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"password" | "magic">("magic");
  const [password, setPassword] = useState("");
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const supabase = createClient();

  async function handleMagicLink(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({
      email,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
      },
    });

    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({ type: "success", text: "Check your email for the magic link." });
    }
  }

  async function handlePasswordLogin(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithPassword({
      email,
      password,
    });

    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      window.location.href = "/dashboard";
    }
  }

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-slate-100">Sign in</h2>
      <p className="text-slate-500 text-sm mt-1 mb-6">Welcome back, sailor</p>

      {/* Mode toggle with bottom border indicator */}
      <div className="flex gap-0 mb-6 border-b border-navy-700">
        <button
          type="button"
          onClick={() => setMode("magic")}
          className={`flex-1 py-2.5 px-3 text-sm transition-colors relative ${
            mode === "magic"
              ? "text-teal-400 font-medium"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Magic Link
          {mode === "magic" && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-teal-500 rounded-full" />
          )}
        </button>
        <button
          type="button"
          onClick={() => setMode("password")}
          className={`flex-1 py-2.5 px-3 text-sm transition-colors relative ${
            mode === "password"
              ? "text-teal-400 font-medium"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Password
          {mode === "password" && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-teal-500 rounded-full" />
          )}
        </button>
      </div>

      <form onSubmit={mode === "magic" ? handleMagicLink : handlePasswordLogin}>
        <div className="space-y-4">
          <div>
            <label htmlFor="email" className="block text-sm text-slate-300 mb-1.5">
              Email
            </label>
            <input
              id="email"
              type="email"
              value={email}
              onChange={(e) => setEmail(e.target.value)}
              required
              placeholder="you@example.com"
              className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
            />
          </div>

          {mode === "password" && (
            <div>
              <label htmlFor="password" className="block text-sm text-slate-300 mb-1.5">
                Password
              </label>
              <input
                id="password"
                type="password"
                value={password}
                onChange={(e) => setPassword(e.target.value)}
                required
                placeholder="Your password"
                className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
              />
            </div>
          )}

          {message && (
            <p
              className={`text-sm ${
                message.type === "error" ? "text-red-400" : "text-green-400"
              }`}
            >
              {message.text}
            </p>
          )}

          <button
            type="submit"
            disabled={loading}
            className="w-full py-2.5 bg-teal-500 hover:bg-teal-400 disabled:opacity-50 text-navy-950 font-medium rounded text-sm transition-colors"
          >
            {loading
              ? "..."
              : mode === "magic"
              ? "Send Magic Link"
              : "Sign In"}
          </button>
        </div>
      </form>

      <p className="text-center text-sm text-slate-400 mt-6">
        No account?{" "}
        <Link href="/signup" className="text-teal-400 hover:text-teal-300">
          Create one
        </Link>
      </p>
    </div>
  );
}
