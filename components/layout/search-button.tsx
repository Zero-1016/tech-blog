"use client";

import { useState, useMemo, useEffect, useRef } from "react";
import { createPortal } from "react-dom";
import Link from "next/link";
import Fuse from "fuse.js";

const searchData = import("#site/content").then((m) =>
  m.posts
    .filter((p: { published: boolean }) => p.published)
    .map((p: { slug: string; title: string; description: string; tags: string[] }) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      tags: p.tags,
    }))
);

interface SearchItem {
  slug: string;
  title: string;
  description: string;
  tags: string[];
}

export function SearchButton({ isMac, isMobile }: { isMac: boolean; isMobile: boolean }) {
  const [open, setOpen] = useState(false);
  const [visible, setVisible] = useState(false);
  const [closing, setClosing] = useState(false);
  const [query, setQuery] = useState("");
  const [items, setItems] = useState<SearchItem[]>([]);
  const inputRef = useRef<HTMLInputElement>(null);
  const lastFocusRef = useRef<HTMLElement | null>(null);

  const handleOpen = () => {
    lastFocusRef.current = document.activeElement as HTMLElement | null;
    setQuery("");
    setOpen(true);
    setVisible(true);
    setClosing(false);
  };

  const handleClose = () => {
    setClosing(true);
    setTimeout(() => {
      setOpen(false);
      setVisible(false);
      setClosing(false);
      lastFocusRef.current?.focus();
    }, 150);
  };

  useEffect(() => {
    searchData.then(setItems);
  }, []);

  const fuse = useMemo(
    () => new Fuse(items, { keys: ["title", "description", "tags"], threshold: 0.3 }),
    [items]
  );

  const results = query.length > 0 ? fuse.search(query, { limit: 5 }) : [];

  useEffect(() => {
    function onKey(e: KeyboardEvent) {
      if ((e.metaKey || e.ctrlKey) && e.key === "k") {
        e.preventDefault();
        if (visible) handleClose();
        else handleOpen();
      }
      if (e.key === "Escape" && visible) handleClose();
    }
    window.addEventListener("keydown", onKey);
    return () => window.removeEventListener("keydown", onKey);
  }, [visible]);

  useEffect(() => {
    if (open && !closing) {
      requestAnimationFrame(() => inputRef.current?.focus());
    }
  }, [open, closing]);

  const overlayAnim = closing ? "search-overlay-out" : "search-overlay-in";
  const panelAnim = closing ? "search-panel-out" : "search-panel-in";

  const modal =
    open && typeof window !== "undefined"
      ? createPortal(
          <>
            <div
              aria-hidden
              className={`${overlayAnim} fixed inset-0 z-[100] bg-black/30`}
              onClick={handleClose}
            />
            <div
              role="dialog"
              aria-modal="true"
              aria-label="사이트 검색"
              className={`${panelAnim} fixed inset-x-0 top-24 z-[100] mx-auto w-full max-w-lg px-4`}
            >
              <div className="overflow-hidden rounded-xl border border-border bg-background shadow-2xl">
                <div className="flex items-center gap-3 border-b border-border px-4">
                  <svg
                    width="16"
                    height="16"
                    viewBox="0 0 24 24"
                    fill="none"
                    stroke="currentColor"
                    strokeWidth="2"
                    className="shrink-0 text-secondary"
                  >
                    <circle cx="11" cy="11" r="8" />
                    <path d="m21 21-4.35-4.35" />
                  </svg>
                  <input
                    ref={inputRef}
                    type="text"
                    placeholder="글 제목, 설명, 태그로 검색..."
                    value={query}
                    onChange={(e) => setQuery(e.target.value)}
                    className="flex-1 bg-transparent py-4 text-base outline-none placeholder:text-secondary"
                  />
                  <button
                    type="button"
                    onClick={handleClose}
                    aria-label="검색 닫기"
                    className="cursor-pointer rounded border border-border px-1.5 py-0.5 font-mono text-[10px] text-secondary hover:border-accent/50"
                  >
                    ESC
                  </button>
                </div>
                {results.length > 0 && (
                  <ul className="max-h-72 overflow-y-auto p-2">
                    {results.map(({ item }) => (
                      <li key={item.slug}>
                        <Link
                          href={`/posts/${item.slug}`}
                          onClick={handleClose}
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
          </>,
          document.body
        )
      : null;

  return (
    <>
      <button
        onClick={handleOpen}
        className="flex items-center gap-2 rounded-lg border border-border px-3 py-1.5 text-sm text-secondary transition-colors hover:border-accent/50"
      >
        <svg
          width="14"
          height="14"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
        >
          <circle cx="11" cy="11" r="8" />
          <path d="m21 21-4.35-4.35" />
        </svg>
        <span className="hidden sm:inline">검색</span>
        {!isMobile && (
          <kbd className="hidden rounded border border-border px-1.5 py-0.5 text-[10px] font-medium sm:inline">
            {isMac ? "⌘K" : "Ctrl K"}
          </kbd>
        )}
      </button>
      {modal}
    </>
  );
}
