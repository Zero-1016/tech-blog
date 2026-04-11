"use client";

import { useState } from "react";

export function CopyButton({ code }: { code: string }) {
  const [copied, setCopied] = useState(false);

  async function copy() {
    await navigator.clipboard.writeText(code);
    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }

  return (
    <button
      onClick={copy}
      className="absolute right-2 top-2 rounded-md border border-border bg-background/80 px-2 py-1 text-xs text-secondary opacity-0 backdrop-blur transition-opacity group-hover:opacity-100 hover:text-foreground"
      aria-label="Copy code"
    >
      {copied ? "복사됨!" : "복사"}
    </button>
  );
}
