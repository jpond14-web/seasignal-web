"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";
import { useUserSettings, type FontSize } from "@/lib/hooks/useUserSettings";
import { useFontSize } from "@/components/layout/FontSizeProvider";

function Toggle({ checked, onChange, label }: { checked: boolean; onChange: (v: boolean) => void; label: string }) {
  return (
    <label className="flex items-center justify-between py-2 cursor-pointer group">
      <span className="text-sm text-slate-300 group-hover:text-slate-100 transition-colors">{label}</span>
      <button
        role="switch"
        aria-checked={checked}
        onClick={() => onChange(!checked)}
        className={`relative w-10 h-5 rounded-full transition-colors ${
          checked ? "bg-teal-500" : "bg-navy-700"
        }`}
      >
        <span
          className={`absolute top-0.5 left-0.5 w-4 h-4 rounded-full bg-white transition-transform ${
            checked ? "translate-x-5" : "translate-x-0"
          }`}
        />
      </button>
    </label>
  );
}

function Toast({ message, visible }: { message: string; visible: boolean }) {
  return (
    <div
      className={`fixed bottom-6 right-6 bg-navy-800 border border-navy-600 text-sm text-slate-200 px-4 py-2.5 rounded-lg shadow-lg transition-all duration-300 ${
        visible ? "opacity-100 translate-y-0" : "opacity-0 translate-y-2 pointer-events-none"
      }`}
    >
      {message}
    </div>
  );
}

const FONT_SIZE_OPTIONS: { value: FontSize; label: string; desc: string }[] = [
  { value: "small", label: "Small", desc: "14px" },
  { value: "medium", label: "Medium", desc: "16px" },
  { value: "large", label: "Large", desc: "18px" },
];

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);
  const [exporting, setExporting] = useState(false);

  const userSettings = useUserSettings();
  const { setFontSize: applyFontSize } = useFontSize();

  useEffect(() => {
    supabase.auth.getUser().then(({ data }) => {
      setEmail(data.user?.email ?? null);
      setDisplayName(
        data.user?.user_metadata?.display_name ??
          data.user?.user_metadata?.full_name ??
          null
      );
    });
  }, [supabase]);

  const showToast = useCallback(() => {
    setToastVisible(true);
    setTimeout(() => setToastVisible(false), 2000);
  }, []);

  function handleToggle(setter: (v: boolean) => void) {
    return (v: boolean) => {
      setter(v);
      showToast();
    };
  }

  function handleFontSizeChange(size: FontSize) {
    userSettings.setFontSize(size);
    applyFontSize(size);
    showToast();
  }

  async function handleChangePassword() {
    setChangingPassword(true);
    setPasswordMessage(null);
    try {
      const { error } = await supabase.auth.resetPasswordForEmail(email ?? "");
      if (error) throw error;
      setPasswordMessage("Password reset email sent. Check your inbox.");
    } catch {
      setPasswordMessage("Failed to send reset email. Try again later.");
    } finally {
      setChangingPassword(false);
    }
  }

  async function handleSignOut() {
    await supabase.auth.signOut();
    router.push("/login");
  }

  async function handleExportData() {
    setExporting(true);
    try {
      const res = await fetch("/api/export");
      if (!res.ok) throw new Error("Export failed");
      const blob = await res.blob();
      const url = URL.createObjectURL(blob);
      const a = document.createElement("a");
      a.href = url;
      a.download = "seasignal-data.json";
      document.body.appendChild(a);
      a.click();
      a.remove();
      URL.revokeObjectURL(url);
    } catch {
      // Could show error toast here
    } finally {
      setExporting(false);
    }
  }

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      {!userSettings.loading && (
        <div className="bg-green-500/10 border border-green-500/20 rounded-lg p-3 mb-6">
          <p className="text-xs text-green-400">
            Settings synced to your account.
          </p>
        </div>
      )}

      <div className="space-y-4">
        {/* Account */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Account</h2>
          <div className="space-y-3">
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Email</span>
              <p className="text-sm text-slate-300 mt-0.5">{email ?? "Loading..."}</p>
            </div>
            <div>
              <span className="text-xs text-slate-500 uppercase tracking-wider">Display Name</span>
              <div className="flex items-center gap-2 mt-0.5">
                <p className="text-sm text-slate-300">{displayName ?? "Not set"}</p>
                <Link
                  href="/profile/edit"
                  className="text-xs text-teal-500 hover:text-teal-400 transition-colors"
                >
                  Edit in Profile
                </Link>
              </div>
            </div>
            <div className="pt-2">
              <button
                onClick={handleChangePassword}
                disabled={changingPassword}
                className="px-4 py-2 bg-navy-800 border border-navy-600 text-sm text-slate-300 rounded hover:bg-navy-700 hover:text-slate-100 transition-colors disabled:opacity-50"
              >
                {changingPassword ? "Sending..." : "Change Password"}
              </button>
              {passwordMessage && (
                <p className="text-xs text-slate-400 mt-2">{passwordMessage}</p>
              )}
            </div>
          </div>
        </div>

        {/* Privacy */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Privacy</h2>
          <div className="divide-y divide-navy-700">
            <Toggle
              checked={userSettings.show_profile}
              onChange={handleToggle(userSettings.setShowProfile)}
              label="Show my profile in Seafarer Directory"
            />
            <Toggle
              checked={userSettings.allow_reconnect}
              onChange={handleToggle(userSettings.setAllowReconnect)}
              label="Allow crew reconnect suggestions"
            />
            <Toggle
              checked={userSettings.show_online}
              onChange={handleToggle(userSettings.setShowOnline)}
              label="Show online status"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Notifications</h2>
          <div className="divide-y divide-navy-700">
            <Toggle
              checked={userSettings.email_messages}
              onChange={handleToggle(userSettings.setEmailMessages)}
              label="Email notifications for messages"
            />
            <Toggle
              checked={userSettings.email_cert_expiry}
              onChange={handleToggle(userSettings.setEmailCertExpiry)}
              label="Email notifications for cert expiry"
            />
            <Toggle
              checked={userSettings.push_notifications}
              onChange={handleToggle(userSettings.setPushNotifications)}
              label="Push notifications"
            />
          </div>
        </div>

        {/* Appearance */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Appearance</h2>
          <div>
            <p className="text-sm text-slate-400 mb-3">Font Size</p>
            <div className="flex gap-2">
              {FONT_SIZE_OPTIONS.map((opt) => (
                <button
                  key={opt.value}
                  onClick={() => handleFontSizeChange(opt.value)}
                  className={`flex-1 py-2.5 px-3 rounded border text-sm transition-colors ${
                    userSettings.font_size === opt.value
                      ? "bg-teal-500/15 border-teal-500/40 text-teal-400"
                      : "bg-navy-800 border-navy-600 text-slate-400 hover:border-navy-500 hover:text-slate-300"
                  }`}
                >
                  <span className="block font-medium">{opt.label}</span>
                  <span className="block text-xs mt-0.5 opacity-70">{opt.desc}</span>
                </button>
              ))}
            </div>
          </div>
        </div>

        {/* Data & Privacy */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Data & Privacy</h2>
          <div>
            <p className="text-sm text-slate-400 mb-3">
              Export all your SeaSignal data as a JSON file.
            </p>
            <button
              onClick={handleExportData}
              disabled={exporting}
              className="px-4 py-2 bg-navy-800 border border-navy-600 text-sm text-slate-300 rounded hover:bg-navy-700 hover:text-slate-100 transition-colors disabled:opacity-50"
            >
              {exporting ? "Downloading..." : "Download My Data"}
            </button>
          </div>
        </div>

        {/* Danger Zone */}
        <div className="bg-navy-900 border border-red-500/20 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-red-400 uppercase tracking-wider mb-4">Danger Zone</h2>
          <div className="space-y-3">
            <button
              onClick={handleSignOut}
              className="px-4 py-2.5 bg-red-500/10 border border-red-500/20 text-red-400 rounded text-sm hover:bg-red-500/20 transition-colors"
            >
              Sign Out
            </button>
            <div>
              {!deleteConfirm ? (
                <button
                  onClick={() => setDeleteConfirm(true)}
                  className="text-sm text-slate-500 hover:text-red-400 transition-colors"
                >
                  Delete my account
                </button>
              ) : (
                <p className="text-sm text-slate-400">
                  To delete your account, please contact support at{" "}
                  <span className="text-teal-400">support@seasignal.app</span>
                </p>
              )}
            </div>
          </div>
        </div>
      </div>

      <Toast message="Settings saved" visible={toastVisible} />
    </div>
  );
}
