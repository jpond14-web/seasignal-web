"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function LoginPage() {
  const [email, setEmail] = useState("");
  const [mode, setMode] = useState<"magic" | "password" | "phone">("magic");
  const [password, setPassword] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
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
      window.location.assign("/dashboard");
    }
  }

  async function handleSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.signInWithOtp({ phone });

    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setOtpSent(true);
      setMessage({ type: "success", text: "Verification code sent to your phone." });
    }
  }

  async function handleVerifyOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    const { error } = await supabase.auth.verifyOtp({
      phone,
      token: otp,
      type: "sms",
    });

    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      window.location.assign("/dashboard");
    }
  }

  function getFormHandler() {
    if (mode === "magic") return handleMagicLink;
    if (mode === "password") return handlePasswordLogin;
    if (otpSent) return handleVerifyOtp;
    return handleSendOtp;
  }

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-slate-100">Sign in</h2>
      <p className="text-slate-500 text-sm mt-1 mb-6">Welcome back, sailor</p>

      {/* Mode toggle with bottom border indicator */}
      <div className="flex gap-0 mb-6 border-b border-navy-700">
        <button
          type="button"
          onClick={() => { setMode("magic"); setMessage(null); }}
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
          onClick={() => { setMode("password"); setMessage(null); }}
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
        <button
          type="button"
          onClick={() => { setMode("phone"); setMessage(null); setOtpSent(false); setOtp(""); }}
          className={`flex-1 py-2.5 px-3 text-sm transition-colors relative ${
            mode === "phone"
              ? "text-teal-400 font-medium"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Phone
          {mode === "phone" && (
            <span className="absolute bottom-0 left-2 right-2 h-0.5 bg-teal-500 rounded-full" />
          )}
        </button>
      </div>

      <p className="text-xs text-slate-500 mb-4 -mt-2">
        {mode === "magic" && "We\u2019ll email you a one-click login link. No password needed."}
        {mode === "password" && "Sign in with your email and password."}
        {mode === "phone" && "We\u2019ll text you a verification code."}
      </p>

      <form onSubmit={getFormHandler()}>
        <div className="space-y-4">
          {mode !== "phone" && (
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
          )}

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

          {mode === "phone" && (
            <>
              <div>
                <label htmlFor="phone" className="block text-sm text-slate-300 mb-1.5">
                  Phone Number
                </label>
                <input
                  id="phone"
                  type="tel"
                  value={phone}
                  onChange={(e) => setPhone(e.target.value)}
                  required
                  placeholder="+1234567890"
                  disabled={otpSent}
                  className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none disabled:opacity-50"
                />
                <p className="text-xs text-slate-500 mt-1">
                  Include country code (e.g. +1 for US, +44 for UK, +63 for PH)
                </p>
              </div>

              {otpSent && (
                <div>
                  <label htmlFor="otp" className="block text-sm text-slate-300 mb-1.5">
                    Verification Code
                  </label>
                  <input
                    id="otp"
                    type="text"
                    inputMode="numeric"
                    maxLength={6}
                    value={otp}
                    onChange={(e) => setOtp(e.target.value.replace(/\D/g, ""))}
                    required
                    placeholder="6-digit code"
                    className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none tracking-widest text-center text-lg"
                  />
                </div>
              )}

              <p className="text-xs text-slate-500">
                Standard SMS rates may apply. WhatsApp delivery coming soon.
              </p>
            </>
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
              : mode === "password"
              ? "Sign In"
              : otpSent
              ? "Verify"
              : "Send Code"}
          </button>

          {mode === "phone" && otpSent && (
            <button
              type="button"
              onClick={() => { setOtpSent(false); setOtp(""); setMessage(null); }}
              className="w-full py-2 text-sm text-slate-400 hover:text-slate-300 transition-colors"
            >
              Change phone number
            </button>
          )}
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
