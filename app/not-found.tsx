"use client";

import Link from "next/link";
import { useI18n } from "@/lib/i18n/context";

export default function NotFound() {
  const { t } = useI18n();

  return (
    <div className="mx-auto flex max-w-3xl flex-col items-center justify-center px-6 py-32 text-center">
      <p className="text-6xl font-bold text-accent">404</p>
      <h1 className="mt-4 text-2xl font-bold tracking-tight">
        {t.notFound.title}
      </h1>
      <p className="mt-3 text-secondary">
        {t.notFound.description}
      </p>
      <Link
        href="/"
        className="mt-8 rounded-lg bg-accent px-5 py-2.5 text-sm font-medium text-white transition-colors hover:bg-accent-hover"
      >
        {t.notFound.home}
      </Link>
    </div>
  );
}
