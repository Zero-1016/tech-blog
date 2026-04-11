"use client";

import { useState, type ReactNode } from "react";

export function CodeBlock({ children }: { children: ReactNode }) {
  const [copied, setCopied] = useState(false);

  async function handleCopy(e: React.MouseEvent<HTMLButtonElement>) {
    const code = e.currentTarget.closest(".group")?.querySelector("code");
    if (code) {
      await navigator.clipboard.writeText(code.textContent ?? "");
      setCopied(true);
      setTimeout(() => setCopied(false), 2000);
    }
  }

  return (
    <div className="group relative">
      {children}
      <button
        onClick={handleCopy}
        className="absolute right-2 top-2 rounded-md border border-border bg-background/80 px-2 py-1 text-xs text-secondary opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:text-foreground"
        aria-label="Copy code"
      >
        {copied ? "복사됨!" : "복사"}
      </button>
    </div>
  );
}
