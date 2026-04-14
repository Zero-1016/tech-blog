"use client";

import { useSyncExternalStore, useCallback } from "react";

function getSnapshot() {
  return (
    localStorage.getItem("theme") === "dark" ||
    (!localStorage.getItem("theme") && window.matchMedia("(prefers-color-scheme: dark)").matches)
  );
}

function getServerSnapshot() {
  return false;
}

function subscribe(callback: () => void) {
  const mq = window.matchMedia("(prefers-color-scheme: dark)");
  mq.addEventListener("change", callback);
  window.addEventListener("storage", callback);
  return () => {
    mq.removeEventListener("change", callback);
    window.removeEventListener("storage", callback);
  };
}

export function ThemeToggle() {
  const dark = useSyncExternalStore(subscribe, getSnapshot, getServerSnapshot);

  // keep <html> class in sync
  if (typeof document !== "undefined") {
    document.documentElement.classList.toggle("dark", dark);
  }

  const toggle = useCallback(() => {
    const next = !dark;
    localStorage.setItem("theme", next ? "dark" : "light");
    document.documentElement.classList.toggle("dark", next);
    // trigger useSyncExternalStore subscribers
    window.dispatchEvent(new StorageEvent("storage"));
  }, [dark]);

  return (
    <button
      onClick={toggle}
      className="group rounded-lg p-2 text-secondary transition-colors hover:bg-card-hover"
      aria-label={dark ? "라이트 모드로 전환" : "다크 모드로 전환"}
      aria-pressed={dark}
      data-theme={dark ? "dark" : "light"}
    >
      <svg width="20" height="20" viewBox="0 0 24 24" className="theme-icon overflow-visible">
        <mask id="theme-toggle-mask">
          <rect x="0" y="0" width="24" height="24" fill="white" />
          <circle className="theme-icon__mask-circle" cx="24" cy="10" r="6" fill="black" />
        </mask>
        <circle
          className="theme-icon__core"
          cx="12"
          cy="12"
          r="5"
          fill="currentColor"
          mask="url(#theme-toggle-mask)"
        />
        <g className="theme-icon__rays" stroke="currentColor" strokeWidth="2" strokeLinecap="round">
          <line x1="12" y1="1" x2="12" y2="3" />
          <line x1="12" y1="21" x2="12" y2="23" />
          <line x1="4.22" y1="4.22" x2="5.64" y2="5.64" />
          <line x1="18.36" y1="18.36" x2="19.78" y2="19.78" />
          <line x1="1" y1="12" x2="3" y2="12" />
          <line x1="21" y1="12" x2="23" y2="12" />
          <line x1="4.22" y1="19.78" x2="5.64" y2="18.36" />
          <line x1="18.36" y1="5.64" x2="19.78" y2="4.22" />
        </g>
      </svg>
    </button>
  );
}
