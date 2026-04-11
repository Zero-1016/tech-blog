"use client";

import { useI18n } from "@/lib/i18n/context";

export function LocaleToggle() {
  const { locale, setLocale } = useI18n();

  return (
    <button
      onClick={() => setLocale(locale === "ko" ? "en" : "ko")}
      className="rounded-lg px-2 py-1.5 text-xs font-medium text-secondary transition-colors hover:bg-card-hover"
      aria-label="Toggle language"
    >
      {locale === "ko" ? "EN" : "KO"}
    </button>
  );
}
