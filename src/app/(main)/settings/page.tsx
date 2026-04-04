"use client";

import { useState, useEffect, useCallback } from "react";
import { createClient } from "@/lib/supabase/client";
import { useRouter } from "next/navigation";
import Link from "next/link";

// TODO: persist to user_settings table
function useSettingsState(key: string, defaultValue: boolean): [boolean, (v: boolean) => void] {
  const [value, setValue] = useState(defaultValue);
  return [value, setValue];
}

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

export default function SettingsPage() {
  const router = useRouter();
  const supabase = createClient();
  const [email, setEmail] = useState<string | null>(null);
  const [displayName, setDisplayName] = useState<string | null>(null);
  const [toastVisible, setToastVisible] = useState(false);
  const [changingPassword, setChangingPassword] = useState(false);
  const [passwordMessage, setPasswordMessage] = useState<string | null>(null);
  const [deleteConfirm, setDeleteConfirm] = useState(false);

  // Privacy toggles — TODO: persist to user_settings table
  const [showProfile, setShowProfile] = useSettingsState("show_profile", true);
  const [allowReconnect, setAllowReconnect] = useSettingsState("allow_reconnect", true);
  const [showOnline, setShowOnline] = useSettingsState("show_online", true);

  // Notification toggles — TODO: persist to user_settings table
  const [emailMessages, setEmailMessages] = useSettingsState("email_messages", false);
  const [emailCertExpiry, setEmailCertExpiry] = useSettingsState("email_cert_expiry", true);
  const [pushNotifications, setPushNotifications] = useSettingsState("push_notifications", true);

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

  return (
    <div className="max-w-lg mx-auto">
      <h1 className="text-2xl font-bold mb-6">Settings</h1>

      <div className="bg-amber-500/10 border border-amber-500/20 rounded-lg p-3 mb-6">
        <p className="text-xs text-amber-400">
          Settings are saved locally on this device. Cross-device sync coming soon.
        </p>
      </div>

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
              checked={showProfile}
              onChange={handleToggle(setShowProfile)}
              label="Show my profile in Seafarer Directory"
            />
            <Toggle
              checked={allowReconnect}
              onChange={handleToggle(setAllowReconnect)}
              label="Allow crew reconnect suggestions"
            />
            <Toggle
              checked={showOnline}
              onChange={handleToggle(setShowOnline)}
              label="Show online status"
            />
          </div>
        </div>

        {/* Notifications */}
        <div className="bg-navy-900 border border-navy-700 rounded-lg p-6">
          <h2 className="text-sm font-semibold text-slate-100 uppercase tracking-wider mb-4">Notifications</h2>
          <div className="divide-y divide-navy-700">
            <Toggle
              checked={emailMessages}
              onChange={handleToggle(setEmailMessages)}
              label="Email notifications for messages"
            />
            <Toggle
              checked={emailCertExpiry}
              onChange={handleToggle(setEmailCertExpiry)}
              label="Email notifications for cert expiry"
            />
            <Toggle
              checked={pushNotifications}
              onChange={handleToggle(setPushNotifications)}
              label="Push notifications"
            />
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
