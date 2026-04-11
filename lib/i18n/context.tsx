"use client";

import { createContext, useContext, useSyncExternalStore, useCallback, type ReactNode } from "react";
import { getDictionary, defaultLocale, type Locale, type Dictionary } from "./dictionaries";

interface I18nContextValue {
  locale: Locale;
  setLocale: (locale: Locale) => void;
  t: Dictionary;
}

const I18nContext = createContext<I18nContextValue>({
  locale: defaultLocale,
  setLocale: () => {},
  t: getDictionary(defaultLocale),
});

function getLocaleSnapshot(): Locale {
  const stored = localStorage.getItem("locale");
  return stored === "ko" || stored === "en" ? stored : defaultLocale;
}

function getServerSnapshot(): Locale {
  return defaultLocale;
}

function subscribe(callback: () => void) {
  window.addEventListener("storage", callback);
  return () => window.removeEventListener("storage", callback);
}

export function I18nProvider({ children }: { children: ReactNode }) {
  const locale = useSyncExternalStore(subscribe, getLocaleSnapshot, getServerSnapshot);

  const setLocale = useCallback((l: Locale) => {
    localStorage.setItem("locale", l);
    window.dispatchEvent(new StorageEvent("storage"));
  }, []);

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: getDictionary(locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
