"use client";

import Link from "next/link";
import Image from "next/image";
import { motion } from "framer-motion";
import { useEffect, useRef, useState } from "react";
import { formatCardDate } from "@/lib/utils";
import { readingTime } from "@/lib/reading-time";

interface PostItem {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  cover?: string;
  charCount: number;
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

export function PostList({ posts }: { posts: PostItem[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="grid gap-4 sm:grid-cols-2"
    >
      {posts.map((post, i) => (
        <motion.article
          key={post.slug}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
          }}
          className={i === 0 ? "sm:col-span-2" : ""}
        >
          <Link
            href={`/posts/${post.slug}`}
            className="group block overflow-hidden rounded-xl border border-border bg-background transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 dark:bg-[#111113]"
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
            <div className="p-5">
              <h2
                className={`font-semibold tracking-tight group-hover:text-accent ${
                  i === 0 ? "text-xl" : "text-base"
                }`}
              >
                {post.title}
              </h2>
              <p className="mt-1.5 text-sm text-secondary line-clamp-2">{post.description}</p>
              <div className="mt-3 flex items-center gap-3 text-xs text-secondary">
                <time dateTime={post.date} className="whitespace-nowrap">
                  {formatCardDate(post.date)}
                </time>
                <span aria-hidden>·</span>
                <span>{readingTime(post.charCount)}</span>
                {post.tags.length > 0 && <TagChips tags={post.tags} />}
              </div>
            </div>
          </Link>
        </motion.article>
      ))}
    </motion.div>
  );
}
