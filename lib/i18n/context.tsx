"use client";

import { createContext, useContext, useState, useEffect, type ReactNode } from "react";
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

export function I18nProvider({ children }: { children: ReactNode }) {
  const [locale, setLocaleState] = useState<Locale>(defaultLocale);

  useEffect(() => {
    const stored = localStorage.getItem("locale") as Locale | null;
    if (stored === "ko" || stored === "en") {
      setLocaleState(stored);
    }
  }, []);

  function setLocale(l: Locale) {
    setLocaleState(l);
    localStorage.setItem("locale", l);
  }

  return (
    <I18nContext.Provider value={{ locale, setLocale, t: getDictionary(locale) }}>
      {children}
    </I18nContext.Provider>
  );
}

export function useI18n() {
  return useContext(I18nContext);
}
