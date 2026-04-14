"use client";

import Link from "next/link";
import Image from "next/image";
import { useEffect, useRef, useState } from "react";
import { formatCardDate } from "@/lib/utils";
import { readingTime } from "@/lib/reading-time";
import { Banner } from "@/components/ui/banner";

export interface PostItem {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  cover?: string;
  charCount: number;
}

export interface SeriesGroup {
  kind: "series";
  name: string;
  items: PostItem[];
}

export type PostEntry = PostItem | SeriesGroup;

function isSeriesGroup(entry: PostEntry): entry is SeriesGroup {
  return "kind" in entry && entry.kind === "series";
}

const CHIP_CLASS = "whitespace-nowrap rounded-md bg-code-bg px-1.5 py-0.5";
const CHIP_GAP = 6;

function TagChips({ tags }: { tags: string[] }) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tags.length);

  useEffect(() => {
    const container = containerRef.current;
    const measureEl = measureRef.current;
    if (!container || !measureEl) return;

    const measure = () => {
      const containerWidth = container.clientWidth;
      if (containerWidth === 0) return;

      const children = Array.from(measureEl.children) as HTMLElement[];
      const tagEls = children.slice(0, tags.length);
      const badgeEl = children[tags.length];
      const badgeWidth = badgeEl?.offsetWidth ?? 0;

      let totalWidth = 0;
      for (let i = 0; i < tagEls.length; i++) {
        totalWidth += tagEls[i].offsetWidth + (i > 0 ? CHIP_GAP : 0);
      }
      if (totalWidth <= containerWidth) {
        setVisibleCount(tags.length);
        return;
      }

      let used = 0;
      let fit = 0;
      for (let i = 0; i < tagEls.length; i++) {
        const chipWidth = tagEls[i].offsetWidth;
        const next = used + (i > 0 ? CHIP_GAP : 0) + chipWidth + CHIP_GAP + badgeWidth;
        if (next <= containerWidth) {
          used += (i > 0 ? CHIP_GAP : 0) + chipWidth;
          fit = i + 1;
        } else {
          break;
        }
      }
      setVisibleCount(fit);
    };

    measure();
    const ro = new ResizeObserver(measure);
    ro.observe(container);
    return () => ro.disconnect();
  }, [tags]);

  const hiddenCount = tags.length - visibleCount;

  return (
    <div ref={containerRef} className="relative flex min-w-0 flex-1 gap-1.5 overflow-hidden">
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute left-0 top-0 flex gap-1.5"
      >
        {tags.map((tag) => (
          <span key={tag} className={CHIP_CLASS}>
            {tag}
          </span>
        ))}
        <span className={CHIP_CLASS}>+{tags.length}</span>
      </div>
      {tags.slice(0, visibleCount).map((tag) => (
        <span key={tag} className={CHIP_CLASS}>
          {tag}
        </span>
      ))}
      {hiddenCount > 0 && <span className={CHIP_CLASS}>+{hiddenCount}</span>}
    </div>
  );
}

function PostCard({ post, featured = false }: { post: PostItem; featured?: boolean }) {
  return (
    <Link
      href={`/posts/${post.slug}`}
      className="group flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 dark:bg-[#111113]"
    >
      <div className="relative aspect-[2/1] overflow-hidden bg-code-bg">
        {post.cover ? (
          <Image
            src={post.cover}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 672px"
            priority={featured}
          />
        ) : (
          <Banner
            title={post.title}
            slug={post.slug}
            tags={post.tags}
            className="h-full w-full transition-transform duration-300 group-hover:scale-105"
            priority={featured}
          />
        )}
      </div>
      <div className="flex flex-1 flex-col p-5">
        <h2
          className={`font-semibold tracking-tight group-hover:text-accent ${
            featured ? "text-xl" : "text-base"
          }`}
        >
          {post.title}
        </h2>
        <p className="mt-1.5 flex-1 text-sm text-secondary line-clamp-2">{post.description}</p>
        <div className="mt-3 flex items-center gap-1 text-xs text-secondary">
          <time dateTime={post.date} className="whitespace-nowrap">
            {formatCardDate(post.date)}
          </time>
          <span aria-hidden>·</span>
          <span>{readingTime(post.charCount)}</span>
          {post.tags.length > 0 && (
            <>
              <span aria-hidden>·</span>
              <TagChips tags={post.tags} />
            </>
          )}
        </div>
      </div>
    </Link>
  );
}

function SeriesCard({ group, featured = false }: { group: SeriesGroup; featured?: boolean }) {
  const [open, setOpen] = useState(false);
  const latest = group.items[0];
  const panelId = `series-panel-${group.name.replace(/\s+/g, "-")}`;

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background dark:bg-[#111113]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        aria-expanded={open}
        aria-controls={panelId}
        aria-label={`${group.name} 시리즈 ${group.items.length}편 ${open ? "접기" : "펼치기"}`}
        className="flex w-full flex-col text-left transition-colors hover:bg-card-hover"
      >
        <div className="relative aspect-[2/1] w-full overflow-hidden bg-code-bg">
          {latest.cover ? (
            <Image
              src={latest.cover}
              alt={group.name}
              fill
              className="object-cover"
              sizes="(max-width: 768px) 100vw, 672px"
              priority={featured}
            />
          ) : (
            <Banner
              title={group.name}
              slug={latest.slug}
              tags={latest.tags}
              className="h-full w-full"
              priority={featured}
            />
          )}
        </div>
        <div className="flex items-start gap-4 p-5">
          <div className="min-w-0 flex-1">
            <div className="flex items-center gap-2">
              <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent">
                시리즈
              </span>
              <span className="text-xs text-secondary">{group.items.length}편</span>
            </div>
            <h2 className="mt-1.5 font-semibold tracking-tight">{group.name}</h2>
            <p className="mt-1 text-sm text-secondary">{latest.description}</p>
          </div>
          <svg
            xmlns="http://www.w3.org/2000/svg"
            width="16"
            height="16"
            viewBox="0 0 24 24"
            fill="none"
            stroke="currentColor"
            strokeWidth="2"
            strokeLinecap="round"
            strokeLinejoin="round"
            className={`mt-1 shrink-0 text-secondary transition-transform duration-200 ${open ? "rotate-180" : ""}`}
          >
            <polyline points="6 9 12 15 18 9" />
          </svg>
        </div>
      </button>
      {open && (
        <div id={panelId}>
          <div className="border-t border-border px-5 py-3">
            {group.items.map((post, i) => (
              <Link
                key={post.slug}
                href={`/posts/${post.slug}`}
                className="group -mx-2 flex items-baseline gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-card-hover"
              >
                <span className="shrink-0 text-xs tabular-nums text-secondary">{i + 1}</span>
                <div className="min-w-0 flex-1">
                  <span className="text-sm font-medium group-hover:text-accent">{post.title}</span>
                  <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-secondary">
                    <time dateTime={post.date}>{formatCardDate(post.date)}</time>
                    <span aria-hidden>·</span>
                    <span>{readingTime(post.charCount)}</span>
                    {post.tags.length > 0 && (
                      <>
                        <span aria-hidden>·</span>
                        <TagChips tags={post.tags} />
                      </>
                    )}
                  </div>
                </div>
              </Link>
            ))}
          </div>
        </div>
      )}
    </div>
  );
}

function renderEntry(entry: PostEntry, featured: boolean) {
  if (isSeriesGroup(entry)) return <SeriesCard group={entry} featured={featured} />;
  return <PostCard post={entry} featured={featured} />;
}

function entryKey(entry: PostEntry) {
  return isSeriesGroup(entry) ? `series:${entry.name}` : entry.slug;
}

export function PostList({ posts }: { posts: PostEntry[] }) {
  const [featured, ...rest] = posts;
  const left: PostEntry[] = [];
  const right: PostEntry[] = [];
  rest.forEach((entry, i) => (i % 2 === 0 ? left : right).push(entry));

  return (
    <div className="flex flex-col gap-4">
      {featured && <div key={entryKey(featured)}>{renderEntry(featured, true)}</div>}
      <div className="hidden gap-4 sm:flex">
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {left.map((entry) => (
            <div key={entryKey(entry)}>{renderEntry(entry, false)}</div>
          ))}
        </div>
        <div className="flex min-w-0 flex-1 flex-col gap-4">
          {right.map((entry) => (
            <div key={entryKey(entry)}>{renderEntry(entry, false)}</div>
          ))}
        </div>
      </div>
      <div className="flex flex-col gap-4 sm:hidden">
        {rest.map((entry) => (
          <div key={entryKey(entry)}>{renderEntry(entry, false)}</div>
        ))}
      </div>
    </div>
  );
}
