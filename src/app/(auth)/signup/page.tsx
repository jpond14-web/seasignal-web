"use client";

import Link from "next/link";
import { useState } from "react";
import { createClient } from "@/lib/supabase/client";

export default function SignupPage() {
  const [mode, setMode] = useState<"email" | "phone">("email");
  const [email, setEmail] = useState("");
  const [password, setPassword] = useState("");
  const [displayName, setDisplayName] = useState("");
  const [phone, setPhone] = useState("");
  const [otp, setOtp] = useState("");
  const [otpSent, setOtpSent] = useState(false);
  const [loading, setLoading] = useState(false);
  const [message, setMessage] = useState<{ type: "error" | "success"; text: string } | null>(null);

  const supabase = createClient();

  async function handleSignup(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (displayName.trim().length < 2) {
      setLoading(false);
      setMessage({ type: "error", text: "Display name must be at least 2 characters." });
      return;
    }

    const { error } = await supabase.auth.signUp({
      email,
      password,
      options: {
        emailRedirectTo: `${window.location.origin}/callback`,
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setMessage({
        type: "success",
        text: "Check your email to confirm your account.",
      });
    }
  }

  async function handlePhoneSendOtp(e: React.FormEvent) {
    e.preventDefault();
    setLoading(true);
    setMessage(null);

    if (displayName.trim().length < 2) {
      setLoading(false);
      setMessage({ type: "error", text: "Display name must be at least 2 characters." });
      return;
    }

    const { error } = await supabase.auth.signInWithOtp({
      phone,
      options: {
        data: {
          display_name: displayName.trim(),
        },
      },
    });

    setLoading(false);
    if (error) {
      setMessage({ type: "error", text: error.message });
    } else {
      setOtpSent(true);
      setMessage({ type: "success", text: "Verification code sent to your phone." });
    }
  }

  async function handlePhoneVerifyOtp(e: React.FormEvent) {
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
      window.location.href = "/dashboard";
    }
  }

  function getFormHandler() {
    if (mode === "email") return handleSignup;
    if (otpSent) return handlePhoneVerifyOtp;
    return handlePhoneSendOtp;
  }

  return (
    <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
      <h2 className="text-xl font-semibold text-slate-100">
        Create your account
      </h2>
      <p className="text-slate-500 text-sm mt-1">Join the crew</p>
      <p className="text-slate-500 text-xs mt-2 mb-6">
        Free forever. Anonymous by default. No employer access.
      </p>

      {/* Mode toggle */}
      <div className="flex gap-0 mb-6 border-b border-navy-700">
        <button
          type="button"
          onClick={() => { setMode("email"); setMessage(null); }}
          className={`flex-1 py-2.5 px-3 text-sm transition-colors relative ${
            mode === "email"
              ? "text-teal-400 font-medium"
              : "text-slate-500 hover:text-slate-300"
          }`}
        >
          Email
          {mode === "email" && (
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

      <form onSubmit={getFormHandler()}>
        <div className="space-y-4">
          <div>
            <label htmlFor="displayName" className="block text-sm text-slate-300 mb-1.5">
              Display Name (pseudonym)
            </label>
            <input
              id="displayName"
              type="text"
              value={displayName}
              onChange={(e) => setDisplayName(e.target.value)}
              required
              placeholder="Your callsign"
              className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
            />
            <p className="text-xs text-slate-500 mt-1">
              This is your public identity. Use a pseudonym to stay anonymous.
            </p>
          </div>

          {mode === "email" && (
            <>
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
                  minLength={6}
                  placeholder="At least 6 characters"
                  className="w-full px-3 py-2.5 bg-navy-800 border border-navy-600 rounded text-slate-100 placeholder:text-slate-500 text-sm focus:border-teal-500 focus:outline-none"
                />
              </div>
            </>
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
              ? "Creating account..."
              : mode === "email"
              ? "Create Account"
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

      {/* Divider */}
      <div className="flex items-center gap-3 my-6">
        <div className="flex-1 h-px bg-navy-700" />
        <span className="text-xs text-slate-600">or</span>
        <div className="flex-1 h-px bg-navy-700" />
      </div>

      <p className="text-center text-sm text-slate-400">
        Already have an account?{" "}
        <Link href="/login" className="text-teal-400 hover:text-teal-300">
          Sign in
        </Link>
      </p>
    </div>
  );
}
