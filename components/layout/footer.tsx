"use client";

import { useI18n } from "@/lib/i18n/context";

export function Footer() {
  const { t } = useI18n();

  return (
    <footer className="border-t border-border py-8">
      <div className="mx-auto max-w-3xl px-6 text-center text-sm text-secondary">
        <p>{t.site.footer}</p>
      </div>
    </footer>
  );
}
