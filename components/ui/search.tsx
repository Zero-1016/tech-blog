"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import Link from "next/link";
import Fuse from "fuse.js";

interface SearchItem {
  slug: string;
  title: string;
  description: string;
  tags: string[];
}

interface SearchProps {
  items: SearchItem[];
}

export function Search({ items }: SearchProps) {
  const [open, setOpen] = useState(false);
  const [query, setQuery] = useState("");
  const inputRef = useRef<HTMLInputElement>(null);

  const fuse = useMemo(
    () =>
      new Fuse(items, {
        keys: ["title", "description", "tags"],
        threshold: 0.3,
      }),
    [items]
  );

  const results = query.length > 0 ? fuse.search(query, { limit: 5 }) : [];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        setOpen((prev) => !prev);
      }
      if (e.key === "Escape") setOpen(false);
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, []);

  useEffect(() => {
    if (open) {
      inputRef.current?.focus();
      setQuery("");
    }
  }, [open]);

  if (!open) {
    return (
      <button
        onClick={() => setOpen(true)}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-secondary transition-colors hover:border-accent/50"
      >
        <svg width="14" height="14" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2">
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span className="hidden sm:inline">검색</span>
        <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium sm:inline">
          ⌘K
        </kbd>
      </button>
    );
  }

  return (
    <>
      <div
        className="fixed inset-0 z-50 bg-black/50 backdrop-blur-sm"
        onClick={() => setOpen(false)}
      />
      <div className="fixed inset-x-0 top-24 z-50 mx-auto w-full max-w-lg px-4">
        <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
          <div className="flex items-center gap-3 border-b border-border px-4">
            <svg width="16" height="16" viewBox="0 0 24 24" fill="none" stroke="currentColor" strokeWidth="2" className="shrink-0 text-secondary">
              <circle cx="11" cy="11" r="8" />
              <path d="m21 21-4.35-4.35" />
            </svg>
            <input
              ref={inputRef}
              type="text"
              placeholder="글 제목, 설명, 태그로 검색..."
              value={query}
              onChange={(e) => setQuery(e.target.value)}
              className="flex-1 bg-transparent py-4 text-sm outline-none placeholder:text-secondary"
            />
            <kbd
              onClick={() => setOpen(false)}
              className="cursor-pointer rounded border border-border px-1.5 py-0.5 text-[10px] text-secondary"
            >
              ESC
            </kbd>
          </div>
          {results.length > 0 && (
            <ul className="max-h-72 overflow-y-auto p-2">
              {results.map(({ item }) => (
                <li key={item.slug}>
                  <Link
                    href={`/posts/${item.slug}`}
                    onClick={() => setOpen(false)}
                    className="block rounded-lg px-3 py-2.5 transition-colors hover:bg-card-hover"
                  >
                    <p className="text-sm font-medium">{item.title}</p>
                    <p className="mt-0.5 text-xs text-secondary line-clamp-1">
                      {item.description}
                    </p>
                  </Link>
                </li>
              ))}
            </ul>
          )}
          {query.length > 0 && results.length === 0 && (
            <div className="px-4 py-8 text-center text-sm text-secondary">
              검색 결과가 없습니다.
            </div>
          )}
        </div>
      </div>
    </>
  );
}
