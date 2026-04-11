"use client";

import { useEffect, useState, useMemo } from "react";
import { cn } from "@/lib/utils";
import { useI18n } from "@/lib/i18n/context";

interface TocEntry {
  title: string;
  url: string;
  items: TocEntry[];
}

interface TocProps {
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

export function Toc({ items }: TocProps) {
  const [activeId, setActiveId] = useState("");
  const { t } = useI18n();
  const flat = useMemo(() => flattenToc(items), [items]);

  useEffect(() => {
    const headings = flat
      .map((item) => document.querySelector(item.url))
      .filter(Boolean) as Element[];

    if (headings.length === 0) return;

    const observer = new IntersectionObserver(
      (entries) => {
        for (const entry of entries) {
          if (entry.isIntersecting) {
            setActiveId(`#${entry.target.id}`);
          }
        }
      },
      { rootMargin: "-80px 0px -60% 0px", threshold: 0 }
    );

    for (const el of headings) observer.observe(el);
    return () => observer.disconnect();
  }, [flat]);

  if (flat.length === 0) return null;

  return (
    <nav className="hidden xl:block">
      <div className="fixed top-28 w-56">
        <p className="mb-3 text-xs font-semibold uppercase tracking-wider text-secondary">
          {t.post.toc}
        </p>
        <ul className="flex flex-col gap-1 border-l border-border">
          {flat.map((item) => (
            <li key={item.url}>
              <a
                href={item.url}
                onClick={(e) => {
                  e.preventDefault();
                  const el = document.querySelector(item.url);
                  if (el) {
                    el.scrollIntoView({ behavior: "smooth" });
                    setActiveId(item.url);
                  }
                }}
                className={cn(
                  "block border-l-2 py-1 text-sm transition-colors",
                  item.depth === 2 ? "pl-4" : "pl-7",
                  activeId === item.url
                    ? "border-accent font-medium text-accent"
                    : "border-transparent text-secondary hover:text-foreground"
                )}
              >
                {item.title}
              </a>
            </li>
          ))}
        </ul>
      </div>
    </nav>
  );
}
