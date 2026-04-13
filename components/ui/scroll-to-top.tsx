"use client";

import { useEffect, useRef, useState } from "react";

const SHOW_THRESHOLD = 2;

export function ScrollToTop() {
  const [visible, setVisible] = useState(false);
  const rafRef = useRef<number>(0);

  useEffect(() => {
    const onScroll = () => {
      cancelAnimationFrame(rafRef.current);
      rafRef.current = requestAnimationFrame(() => {
        setVisible(window.scrollY > window.innerHeight * SHOW_THRESHOLD);
      });
    };

    window.addEventListener("scroll", onScroll, { passive: true });
    return () => {
      window.removeEventListener("scroll", onScroll);
      cancelAnimationFrame(rafRef.current);
    };
  }, []);

  return (
    <button
      onClick={() => window.scrollTo({ top: 0, behavior: "smooth" })}
      aria-label="맨 위로 스크롤"
      className="fixed right-6 bottom-6 z-50 flex h-10 w-10 cursor-pointer items-center justify-center rounded-full border border-border bg-background/80 backdrop-blur-sm transition-all duration-300 hover:border-accent/50 hover:bg-card-hover"
      style={{
        opacity: visible ? 1 : 0,
        pointerEvents: visible ? "auto" : "none",
        transform: visible ? "translateY(0)" : "translateY(12px)",
      }}
    >
      <svg width="16" height="16" viewBox="0 0 16 16" fill="none" className="text-secondary">
        <path
          d="M8 13V3M8 3L3 8M8 3l5 5"
          stroke="currentColor"
          strokeWidth="1.5"
          strokeLinecap="round"
          strokeLinejoin="round"
        />
      </svg>
    </button>
  );
}
