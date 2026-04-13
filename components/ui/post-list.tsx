"use client";

import Link from "next/link";
import Image from "next/image";
import { motion, AnimatePresence } from "framer-motion";
import { useEffect, useRef, useState, useCallback } from "react";
import { formatCardDate } from "@/lib/utils";
import { readingTime } from "@/lib/reading-time";

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
      {post.cover && (
        <div className="relative aspect-[2/1] overflow-hidden bg-code-bg">
          <Image
            src={post.cover}
            alt={post.title}
            fill
            className="object-cover transition-transform duration-300 group-hover:scale-105"
            sizes="(max-width: 768px) 100vw, 672px"
          />
        </div>
      )}
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

function SeriesCard({ group }: { group: SeriesGroup }) {
  const [open, setOpen] = useState(false);
  const latest = group.items[0];

  return (
    <div className="flex h-full flex-col overflow-hidden rounded-xl border border-border bg-background dark:bg-[#111113]">
      <button
        type="button"
        onClick={() => setOpen((v) => !v)}
        className="flex w-full items-start gap-4 p-5 text-left transition-colors hover:bg-card-hover"
      >
        {latest.cover && (
          <div className="relative hidden h-16 w-16 shrink-0 overflow-hidden rounded-lg bg-code-bg sm:block">
            <Image src={latest.cover} alt={group.name} fill className="object-cover" sizes="64px" />
          </div>
        )}
        <div className="min-w-0 flex-1">
          <div className="flex items-center gap-2">
            <span className="rounded-md bg-accent/10 px-1.5 py-0.5 text-[11px] font-medium text-accent">
              시리즈
            </span>
            <span className="text-xs text-secondary">{group.items.length}편</span>
          </div>
          <h2 className="mt-1.5 font-semibold tracking-tight">{group.name}</h2>
          <p className="mt-1 text-sm text-secondary line-clamp-2">{latest.description}</p>
        </div>
        <motion.svg
          xmlns="http://www.w3.org/2000/svg"
          width="16"
          height="16"
          viewBox="0 0 24 24"
          fill="none"
          stroke="currentColor"
          strokeWidth="2"
          strokeLinecap="round"
          strokeLinejoin="round"
          className="mt-1 shrink-0 text-secondary"
          animate={{ rotate: open ? 180 : 0 }}
          transition={{ duration: 0.2 }}
        >
          <polyline points="6 9 12 15 18 9" />
        </motion.svg>
      </button>
      <AnimatePresence initial={false}>
        {open && (
          <motion.div
            initial={{ height: 0, opacity: 0 }}
            animate={{ height: "auto", opacity: 1 }}
            exit={{ height: 0, opacity: 0 }}
            transition={{ duration: 0.25, ease: "easeInOut" }}
            className="overflow-hidden"
          >
            <div className="border-t border-border px-5 py-3">
              {group.items.map((post, i) => (
                <Link
                  key={post.slug}
                  href={`/posts/${post.slug}`}
                  className="group -mx-2 flex items-baseline gap-3 rounded-lg px-2 py-2.5 transition-colors hover:bg-card-hover"
                >
                  <span className="shrink-0 text-xs tabular-nums text-secondary">{i + 1}</span>
                  <div className="min-w-0">
                    <span className="text-sm font-medium group-hover:text-accent">
                      {post.title}
                    </span>
                    <div className="mt-1 flex flex-wrap items-center gap-1 text-xs text-secondary">
                      <time dateTime={post.date}>{formatCardDate(post.date)}</time>
                      <span aria-hidden>·</span>
                      <span>{readingTime(post.charCount)}</span>
                      {post.tags.length > 0 && (
                        <>
                          <span aria-hidden>·</span>
                          <div className="flex gap-1">
                            {post.tags.map((tag) => (
                              <span key={tag} className={CHIP_CLASS}>
                                {tag}
                              </span>
                            ))}
                          </div>
                        </>
                      )}
                    </div>
                  </div>
                </Link>
              ))}
            </div>
          </motion.div>
        )}
      </AnimatePresence>
    </div>
  );
}

const CARD_VARIANTS = {
  hidden: { opacity: 0, y: 12 },
  visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
};

function LazyCard({ children, className }: { children: React.ReactNode; className?: string }) {
  const ref = useRef<HTMLDivElement>(null);
  const [visible, setVisible] = useState(false);

  useEffect(() => {
    const el = ref.current;
    if (!el) return;

    const io = new IntersectionObserver(
      ([entry]) => {
        if (entry.isIntersecting) {
          setVisible(true);
          io.disconnect();
        }
      },
      { rootMargin: "200px" }
    );
    io.observe(el);
    return () => io.disconnect();
  }, []);

  return (
    <div ref={ref} className={className}>
      {visible ? (
        <motion.div className="h-full" variants={CARD_VARIANTS}>
          {children}
        </motion.div>
      ) : (
        <div className="h-40" />
      )}
    </div>
  );
}

export function PostList({ posts }: { posts: PostEntry[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="grid min-w-0 gap-4 sm:grid-cols-2"
    >
      {posts.map((entry, i) => {
        const key = isSeriesGroup(entry) ? `series:${entry.name}` : entry.slug;
        return (
          <LazyCard key={key} className={`min-w-0 ${i === 0 ? "sm:col-span-2" : ""}`}>
            {isSeriesGroup(entry) ? (
              <SeriesCard group={entry} />
            ) : (
              <PostCard post={entry} featured={i === 0} />
            )}
          </LazyCard>
        );
      })}
    </motion.div>
  );
}
