"use client";

import { useState } from "react";

interface TocEntry {
  title: string;
  url: string;
  items: TocEntry[];
}

interface MobileTocProps {
  items: TocEntry[];
}

function flattenToc(entries: TocEntry[], depth = 2): { title: string; url: string; depth: number }[] {
  const result: { title: string; url: string; depth: number }[] = [];
  for (const entry of entries) {
    result.push({ title: entry.title, url: entry.url, depth });
    if (entry.items.length > 0) {
      result.push(...flattenToc(entry.items, depth + 1));
    }
  }
  return result;
}

export function MobileToc({ items }: MobileTocProps) {
  const [open, setOpen] = useState(false);
  const flat = flattenToc(items);

  if (flat.length === 0) return null;

  return (
    <div className="mb-8 xl:hidden">
      <button
        onClick={() => setOpen(!open)}
        aria-expanded={open}
        aria-label="Toggle table of contents"
        className="flex w-full items-center justify-between rounded-lg border border-border px-4 py-3 text-sm font-medium transition-colors hover:bg-card-hover"
      >
        <span>목차 ({flat.length})</span>
        <svg
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          className={`transition-transform ${open ? "rotate-180" : ""}`}
        >
          <path d="m6 9 6 6 6-6" />
        </svg>
      </button>
      {open && (
        <nav className="mt-2 rounded-lg border border-border p-4">
          <ul className="flex flex-col gap-1.5">
            {flat.map((item) => (
              <li key={item.url}>
                <a
                  href={item.url}
                  onClick={() => setOpen(false)}
                  className="block text-sm text-secondary transition-colors hover:text-accent"
                  style={{ paddingLeft: item.depth === 2 ? 0 : "1rem" }}
                >
                  {item.title}
                </a>
              </li>
            ))}
          </ul>
        </nav>
      )}
    </div>
  );
}
