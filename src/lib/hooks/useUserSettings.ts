"use client";

import { useState, useEffect, useCallback, useRef } from "react";
import { createClient } from "@/lib/supabase/client";

export type FontSize = "small" | "medium" | "large";

export interface UserSettings {
  show_profile: boolean;
  allow_reconnect: boolean;
  show_online: boolean;
  email_messages: boolean;
  email_cert_expiry: boolean;
  push_notifications: boolean;
  font_size: FontSize;
}

const DEFAULTS: UserSettings = {
  show_profile: true,
  allow_reconnect: true,
  show_online: true,
  email_messages: false,
  email_cert_expiry: true,
  push_notifications: true,
  font_size: "medium",
};

export interface UseUserSettingsReturn extends UserSettings {
  loading: boolean;
  setShowProfile: (v: boolean) => void;
  setAllowReconnect: (v: boolean) => void;
  setShowOnline: (v: boolean) => void;
  setEmailMessages: (v: boolean) => void;
  setEmailCertExpiry: (v: boolean) => void;
  setPushNotifications: (v: boolean) => void;
  setFontSize: (v: FontSize) => void;
}

export function useUserSettings(): UseUserSettingsReturn {
  const [settings, setSettings] = useState<UserSettings>(DEFAULTS);
  const [loading, setLoading] = useState(true);
  const profileIdRef = useRef<string | null>(null);
  const debounceTimer = useRef<ReturnType<typeof setTimeout> | null>(null);
  const pendingWrite = useRef<Partial<UserSettings>>({});

  // Load settings on mount
  useEffect(() => {
    let cancelled = false;

    async function load() {
      try {
        const supabase = createClient();
        const { data: userData } = await supabase.auth.getUser();
        if (!userData.user || cancelled) return;

        const { data: profile } = await supabase
          .from("profiles")
          .select("id")
          .eq("auth_user_id", userData.user.id)
          .single();

        if (!profile || cancelled) return;
        profileIdRef.current = profile.id;

        // user_settings may not yet be in the generated DB types
        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- user_settings not yet in generated DB types
        const { data: row } = await (supabase as any)
          .from("user_settings")
          .select("*")
          .eq("profile_id", profile.id)
          .single();

        if (cancelled) return;

        if (row) {
          setSettings({
            show_profile: row.show_profile ?? DEFAULTS.show_profile,
            allow_reconnect: row.allow_reconnect ?? DEFAULTS.allow_reconnect,
            show_online: row.show_online ?? DEFAULTS.show_online,
            email_messages: row.email_messages ?? DEFAULTS.email_messages,
            email_cert_expiry: row.email_cert_expiry ?? DEFAULTS.email_cert_expiry,
            push_notifications: row.push_notifications ?? DEFAULTS.push_notifications,
            font_size: (row.font_size as FontSize) ?? DEFAULTS.font_size,
          });
        }
      } catch {
        // Silently use defaults on error
      } finally {
        if (!cancelled) setLoading(false);
      }
    }

    load();
    return () => {
      cancelled = true;
    };
  }, []);

  const debounceSave = useCallback(
    (updates: Partial<UserSettings>) => {
      // Merge into pending writes
      pendingWrite.current = { ...pendingWrite.current, ...updates };

      if (debounceTimer.current) {
        clearTimeout(debounceTimer.current);
      }

      debounceTimer.current = setTimeout(async () => {
        const pid = profileIdRef.current;
        if (!pid) return;
        const supabase = createClient();
        const payload = { ...pendingWrite.current };
        pendingWrite.current = {};

        // eslint-disable-next-line @typescript-eslint/no-explicit-any -- user_settings not yet in generated DB types
        await (supabase as any).from("user_settings").upsert(
          {
            profile_id: pid,
            ...payload,
            updated_at: new Date().toISOString(),
          },
          { onConflict: "profile_id" }
        );
      }, 500);
    },
    []
  );

  function makeSetter<K extends keyof UserSettings>(key: K) {
    return (value: UserSettings[K]) => {
      setSettings((prev) => ({ ...prev, [key]: value }));
      debounceSave({ [key]: value });
    };
  }

  return {
    ...settings,
    loading,
    setShowProfile: makeSetter("show_profile"),
    setAllowReconnect: makeSetter("allow_reconnect"),
    setShowOnline: makeSetter("show_online"),
    setEmailMessages: makeSetter("email_messages"),
    setEmailCertExpiry: makeSetter("email_cert_expiry"),
    setPushNotifications: makeSetter("push_notifications"),
    setFontSize: makeSetter("font_size"),
  };
}
