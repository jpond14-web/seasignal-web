"use client";

import { createContext, useContext, useState, useEffect, useCallback } from "react";
import type { ReactNode } from "react";
import type { TranslationKeys } from "./locales/en";
import en from "./locales/en";

export type Locale = "en" | "fil" | "hi" | "zh" | "id" | "ru" | "uk" | "es" | "my";

export const SUPPORTED_LOCALES: { code: Locale; label: string; nativeLabel: string }[] = [
  { code: "en", label: "English", nativeLabel: "English" },
  { code: "fil", label: "Filipino", nativeLabel: "Filipino" },
  { code: "hi", label: "Hindi", nativeLabel: "हिन्दी" },
  { code: "zh", label: "Chinese (Simplified)", nativeLabel: "简体中文" },
  { code: "id", label: "Bahasa Indonesia", nativeLabel: "Bahasa Indonesia" },
  { code: "ru", label: "Russian", nativeLabel: "Русский" },
  { code: "uk", label: "Ukrainian", nativeLabel: "Українська" },
  { code: "es", label: "Spanish", nativeLabel: "Español" },
  { code: "my", label: "Burmese", nativeLabel: "မြန်မာ" },
];

type I18nContextType = {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: TranslationKeys;
};

const I18nContext = createContext<I18nContextType>({
  locale: "en",
  setLocale: () => {},
  t: en,
});

// Lazy-load translation files to avoid bundling all locales
const loaders: Record<Locale, () => Promise<{ default: TranslationKeys }>> = {
  en: () => import("./locales/en"),
  fil: () => import("./locales/fil"),
  hi: () => import("./locales/hi"),
  zh: () => import("./locales/zh"),
  id: () => import("./locales/id"),
  ru: () => import("./locales/ru"),
  uk: () => import("./locales/uk"),
  es: () => import("./locales/es"),
  my: () => import("./locales/my"),
};

const STORAGE_KEY = "seasignal-locale";

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>("en");
  const [translations, setTranslations] = useState<TranslationKeys>(en);

  // Load saved locale on mount
  useEffect(() => {
    const saved = localStorage.getItem(STORAGE_KEY) as Locale | null;
    if (saved && loaders[saved]) {
      setLocaleState(saved);
      loaders[saved]().then((mod) => setTranslations(mod.default));
    } else {
      // Try to detect from browser
      const browserLang = navigator.language.split("-")[0];
      const match = SUPPORTED_LOCALES.find((l) => l.code === browserLang);
      if (match) {
        setLocaleState(match.code);
        loaders[match.code]().then((mod) => setTranslations(mod.default));
      }
    }
  }, []);

  const setLocale = useCallback((newLocale: Locale) => {
    setLocaleState(newLocale);
    localStorage.setItem(STORAGE_KEY, newLocale);
    loaders[newLocale]().then((mod) => setTranslations(mod.default));
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: translations }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useTranslation() {
  return useContext(I18nContext);
}
