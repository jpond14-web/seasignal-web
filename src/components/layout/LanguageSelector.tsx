"use client";

import { useTranslation, SUPPORTED_LOCALES } from "@/lib/i18n";

export function LanguageSelector() {
  const { locale, setLocale } = useTranslation();

  return (
    <select
      value={locale}
      onChange={(e) => setLocale(e.target.value as any)}
      className="px-2 py-1.5 bg-navy-800 border border-navy-600 rounded text-slate-300 text-xs focus:border-teal-500 focus:outline-none"
      aria-label="Select language"
    >
      {SUPPORTED_LOCALES.map((l) => (
        <option key={l.code} value={l.code}>
          {l.nativeLabel}
        </option>
      ))}
    </select>
  );
}
