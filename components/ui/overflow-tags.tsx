"use client";

import Link from "next/link";
import { useRef, useState, useEffect, useCallback } from "react";

interface OverflowTagsProps {
  tags: string[];
}

export function OverflowTags({ tags }: OverflowTagsProps) {
  const containerRef = useRef<HTMLDivElement>(null);
  const measureRef = useRef<HTMLDivElement>(null);
  const [visibleCount, setVisibleCount] = useState(tags.length);

  const calculate = useCallback(() => {
    const container = containerRef.current;
    const measure = measureRef.current;
    if (!container || !measure) return;

    const containerWidth = container.offsetWidth;
    const children = Array.from(measure.children) as HTMLElement[];
    const gap = 6; // gap-1.5 = 6px
    const badgeWidth = 36;

    let usedWidth = 0;
    let count = 0;

    for (let i = 0; i < children.length; i++) {
      const childWidth = children[i].offsetWidth;
      const needsBadge = i < tags.length - 1;
      const totalNeeded = usedWidth + childWidth + (needsBadge ? gap + badgeWidth : 0);

      if (totalNeeded > containerWidth && count > 0) break;
      usedWidth += childWidth + (i > 0 ? gap : 0);
      count++;
    }

    setVisibleCount(Math.max(1, count));
  }, [tags]);

  useEffect(() => {
    calculate();
    const observer = new ResizeObserver(calculate);
    if (containerRef.current) observer.observe(containerRef.current);
    return () => observer.disconnect();
  }, [calculate]);

  const hiddenCount = tags.length - visibleCount;

  return (
    <div ref={containerRef} className="relative min-w-0 flex-1">
      {/* hidden measurement container */}
      <div
        ref={measureRef}
        aria-hidden
        className="pointer-events-none invisible absolute flex gap-1.5"
      >
        {tags.map((tag) => (
          <span key={tag} className="whitespace-nowrap rounded-md bg-code-bg px-2 py-0.5 text-xs">
            {tag}
          </span>
        ))}
      </div>
      {/* visible tags */}
      <div className="flex items-center gap-1.5">
        {tags.slice(0, visibleCount).map((tag) => (
          <Link
            key={tag}
            href={`/tags/${tag}`}
            className="whitespace-nowrap rounded-md bg-code-bg px-2 py-0.5 text-xs transition-colors hover:bg-accent/10 hover:text-accent"
          >
            {tag}
          </Link>
        ))}
        {hiddenCount > 0 && (
          <span className="whitespace-nowrap rounded-md bg-code-bg px-2 py-0.5 text-xs text-secondary">
            +{hiddenCount}
          </span>
        )}
      </div>
    </div>
  );
}
