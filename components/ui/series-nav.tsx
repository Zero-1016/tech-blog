import Link from "next/link";
import { cn } from "@/lib/utils";

interface SeriesNavProps {
  series: string;
  posts: { slug: string; title: string; seriesOrder?: number }[];
  currentSlug: string;
}

export function SeriesNav({ series, posts, currentSlug }: SeriesNavProps) {
  const sorted = [...posts].sort(
    (a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0)
  );
  const currentIdx = sorted.findIndex((p) => p.slug === currentSlug);
  const prev = currentIdx > 0 ? sorted[currentIdx - 1] : null;
  const next = currentIdx < sorted.length - 1 ? sorted[currentIdx + 1] : null;

  return (
    <nav className="my-10 rounded-lg border border-border p-5">
      <p className="mb-3 text-xs font-medium uppercase tracking-wider text-secondary">
        {series} 시리즈
      </p>
      <ol className="mb-4 flex flex-col gap-1.5">
        {sorted.map((post, i) => (
          <li key={post.slug}>
            <Link
              href={`/posts/${post.slug}`}
              className={cn(
                "block rounded-md px-3 py-1.5 text-sm transition-colors",
                post.slug === currentSlug
                  ? "bg-accent/10 font-medium text-accent"
                  : "text-secondary hover:text-foreground"
              )}
            >
              {i + 1}. {post.title}
            </Link>
          </li>
        ))}
      </ol>
      <div className="flex justify-between gap-4">
        {prev ? (
          <Link
            href={`/posts/${prev.slug}`}
            className="text-sm text-secondary hover:text-accent"
          >
            &larr; 이전
          </Link>
        ) : (
          <span />
        )}
        {next ? (
          <Link
            href={`/posts/${next.slug}`}
            className="text-sm text-secondary hover:text-accent"
          >
            다음 &rarr;
          </Link>
        ) : (
          <span />
        )}
      </div>
    </nav>
  );
}
