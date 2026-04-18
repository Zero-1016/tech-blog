"use client";

import { useMemo, useState } from "react";
import {
  PostCard,
  SeriesCard,
  entryKey,
  isSeriesGroup,
  type PostEntry,
  type PostItem,
} from "@/components/ui/post-list";

const PAGE_SIZE = 16;

type ViewMode = "grouped" | "flat";

interface PostGridProps {
  grouped: PostEntry[];
  flat: PostItem[];
  defaultView?: ViewMode;
}

export function PostGrid({ grouped, flat, defaultView = "flat" }: PostGridProps) {
  const [view, setView] = useState<ViewMode>(defaultView);
  const [page, setPage] = useState(1);

  const entries: PostEntry[] = view === "grouped" ? grouped : flat;
  const totalPages = Math.max(1, Math.ceil(entries.length / PAGE_SIZE));
  const safePage = Math.min(page, totalPages);
  const start = (safePage - 1) * PAGE_SIZE;
  const visible = useMemo(() => entries.slice(start, start + PAGE_SIZE), [entries, start]);

  const onChangeView = (next: ViewMode) => {
    if (next === view) return;
    setView(next);
    setPage(1);
  };

  const onChangePage = (next: number) => {
    if (next < 1 || next > totalPages || next === safePage) return;
    setPage(next);
    if (typeof window !== "undefined") {
      const target = document.getElementById("posts");
      target?.scrollIntoView({ behavior: "smooth", block: "start" });
    }
  };

  return (
    <div className="flex flex-col gap-6">
      <div className="flex items-center justify-between gap-4">
        <p className="text-xs text-secondary">
          총 <span className="tabular-nums">{entries.length}</span>
          {view === "grouped" ? " 항목" : " 편"}
        </p>
        <div className="flex items-center gap-2">
          <span className="text-xs text-secondary">보기 방식</span>
          <ViewToggle value={view} onChange={onChangeView} />
        </div>
      </div>

      <div className="grid grid-cols-1 gap-4 sm:grid-cols-2 lg:grid-cols-4">
        {visible.map((entry) => (
          <div key={entryKey(entry)} className="relative min-w-0">
            {isSeriesGroup(entry) ? (
              <SeriesCard group={entry} floatingPanel />
            ) : (
              <PostCard post={entry} />
            )}
          </div>
        ))}
      </div>

      {totalPages > 1 && (
        <Pagination current={safePage} total={totalPages} onChange={onChangePage} />
      )}
    </div>
  );
}

function ViewToggle({ value, onChange }: { value: ViewMode; onChange: (next: ViewMode) => void }) {
  return (
    <div
      role="radiogroup"
      aria-label="보기 방식"
      className="inline-flex items-center rounded-full border border-border bg-background p-0.5 text-xs dark:bg-[#111113]"
    >
      <ToggleButton
        active={value === "grouped"}
        onClick={() => onChange("grouped")}
        label="시리즈 별"
      />
      <ToggleButton active={value === "flat"} onClick={() => onChange("flat")} label="전체 보기" />
    </div>
  );
}

function ToggleButton({
  active,
  onClick,
  label,
}: {
  active: boolean;
  onClick: () => void;
  label: string;
}) {
  return (
    <button
      type="button"
      role="radio"
      aria-checked={active}
      onClick={onClick}
      className={`rounded-full px-3 py-1 transition-colors ${
        active ? "bg-accent/10 text-accent" : "text-secondary hover:text-foreground"
      }`}
    >
      {label}
    </button>
  );
}

function Pagination({
  current,
  total,
  onChange,
}: {
  current: number;
  total: number;
  onChange: (next: number) => void;
}) {
  const pages = pageNumbers(current, total);

  return (
    <nav aria-label="페이지" className="flex items-center justify-center gap-1 text-sm">
      <PageButton
        disabled={current === 1}
        onClick={() => onChange(current - 1)}
        ariaLabel="이전 페이지"
      >
        ‹
      </PageButton>
      {pages.map((p, i) =>
        p === "ellipsis" ? (
          <span key={`ellipsis-${i}`} className="px-2 text-secondary" aria-hidden>
            …
          </span>
        ) : (
          <PageButton
            key={p}
            active={p === current}
            onClick={() => onChange(p)}
            ariaLabel={`${p} 페이지`}
            ariaCurrent={p === current ? "page" : undefined}
          >
            {p}
          </PageButton>
        )
      )}
      <PageButton
        disabled={current === total}
        onClick={() => onChange(current + 1)}
        ariaLabel="다음 페이지"
      >
        ›
      </PageButton>
    </nav>
  );
}

function PageButton({
  children,
  onClick,
  disabled,
  active,
  ariaLabel,
  ariaCurrent,
}: {
  children: React.ReactNode;
  onClick: () => void;
  disabled?: boolean;
  active?: boolean;
  ariaLabel: string;
  ariaCurrent?: "page";
}) {
  return (
    <button
      type="button"
      onClick={onClick}
      disabled={disabled}
      aria-label={ariaLabel}
      aria-current={ariaCurrent}
      className={`inline-flex h-8 min-w-8 items-center justify-center rounded-md border px-2 tabular-nums transition-colors ${
        active
          ? "border-accent/40 bg-accent/10 text-accent"
          : "border-border bg-background text-secondary hover:border-accent/30 hover:text-accent dark:bg-[#111113]"
      } disabled:cursor-not-allowed disabled:opacity-40 disabled:hover:border-border disabled:hover:text-secondary`}
    >
      {children}
    </button>
  );
}

function pageNumbers(current: number, total: number): (number | "ellipsis")[] {
  if (total <= 7) return Array.from({ length: total }, (_, i) => i + 1);

  const pages: (number | "ellipsis")[] = [1];
  const leftBound = Math.max(2, current - 1);
  const rightBound = Math.min(total - 1, current + 1);

  if (leftBound > 2) pages.push("ellipsis");
  for (let i = leftBound; i <= rightBound; i++) pages.push(i);
  if (rightBound < total - 1) pages.push("ellipsis");
  pages.push(total);

  return pages;
}
