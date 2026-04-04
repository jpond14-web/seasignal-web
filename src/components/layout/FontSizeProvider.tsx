"use client";

import { createContext, useContext, useState, useEffect, useCallback, type ReactNode } from "react";

type FontSize = "small" | "medium" | "large";

interface FontSizeContextValue {
  fontSize: FontSize;
  setFontSize: (size: FontSize) => void;
}

const FontSizeContext = createContext<FontSizeContextValue>({
  fontSize: "medium",
  setFontSize: () => {},
});

function getCookie(name: string): string | null {
  if (typeof document === "undefined") return null;
  const match = document.cookie.match(new RegExp(`(?:^|; )${name}=([^;]*)`));
  return match ? decodeURIComponent(match[1]) : null;
}

function setCookie(name: string, value: string, days = 365) {
  const expires = new Date(Date.now() + days * 864e5).toUTCString();
  document.cookie = `${name}=${encodeURIComponent(value)};expires=${expires};path=/;SameSite=Lax`;
}

const VALID_SIZES: FontSize[] = ["small", "medium", "large"];

function applyBodyClass(size: FontSize) {
  document.body.classList.remove("font-small", "font-medium", "font-large");
  document.body.classList.add(`font-${size}`);
}

export function FontSizeProvider({ children }: { children: ReactNode }) {
  const [fontSize, setFontSizeState] = useState<FontSize>("medium");

  useEffect(() => {
    const saved = getCookie("seasignal_font_size") as FontSize | null;
    const size = saved && VALID_SIZES.includes(saved) ? saved : "medium";
    setFontSizeState(size);
    applyBodyClass(size);
  }, []);

  const setFontSize = useCallback((size: FontSize) => {
    setFontSizeState(size);
    applyBodyClass(size);
    setCookie("seasignal_font_size", size);
  }, []);

  return (
    <FontSizeContext.Provider value={{ fontSize, setFontSize }}>
      {children}
    </FontSizeContext.Provider>
  );
}

export function useFontSize() {
  return useContext(FontSizeContext);
}
