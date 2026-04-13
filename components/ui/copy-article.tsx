"use client";

import { useCallback, useState } from "react";

export function CopyArticle() {
  const [copied, setCopied] = useState(false);

  const handleCopy = useCallback(async () => {
    const article = document.querySelector("article");
    if (!article) return;

    const title = article.querySelector("h1")?.textContent ?? "";
    const desc = article.querySelector("h1 + p")?.textContent ?? "";
    const prose = article.querySelector(".prose");
    if (!prose) return;

    const text = `# ${title}\n\n${desc}\n\n${(prose as HTMLElement).innerText}`;
    await navigator.clipboard.writeText(text);

    setCopied(true);
    setTimeout(() => setCopied(false), 2000);
  }, []);

  return (
    <div className="relative">
      <button
        onClick={handleCopy}
        aria-label={copied ? "복사 완료" : "글 전체 복사"}
        title="글 전체 복사"
        className="mt-1.5 flex h-8 w-8 shrink-0 items-center justify-center rounded-md border border-border text-secondary transition-colors hover:border-accent/50 hover:text-primary cursor-pointer"
      >
        {copied ? (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <path
              d="M3 8.5l3.5 3.5L13 4"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
              strokeLinejoin="round"
            />
          </svg>
        ) : (
          <svg width="16" height="16" viewBox="0 0 16 16" fill="none">
            <rect
              x="5"
              y="5"
              width="8"
              height="8"
              rx="1.5"
              stroke="currentColor"
              strokeWidth="1.5"
            />
            <path
              d="M3 11V3.5A1.5 1.5 0 014.5 2H11"
              stroke="currentColor"
              strokeWidth="1.5"
              strokeLinecap="round"
            />
          </svg>
        )}
      </button>
      <span
        className="pointer-events-none absolute top-full right-0 mt-2 whitespace-nowrap rounded-md bg-foreground px-3 py-1.5 text-xs text-background shadow-lg transition-all duration-200"
        style={{
          opacity: copied ? 1 : 0,
          transform: copied ? "translateY(0)" : "translateY(-4px)",
        }}
        role="status"
      >
        글 복사 완료!
      </span>
    </div>
  );
}
