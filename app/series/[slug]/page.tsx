import { notFound } from "next/navigation";
import Link from "next/link";
import type { Metadata } from "next";
import { posts } from "#site/content";
import { formatCardDate } from "@/lib/utils";
import { siteConfig, SITE_URL } from "@/lib/site";

interface Props {
  params: Promise<{ slug: string }>;
}

function getSeriesPosts(series: string) {
  return posts
    .filter((p) => p.published && p.series === series)
    .sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
}

function getAllSeries() {
  const seriesSet = new Set<string>();
  for (const p of posts) {
    if (p.series && p.published) seriesSet.add(p.series);
  }
  return Array.from(seriesSet);
}

export function generateStaticParams() {
  return getAllSeries().map((s) => ({ slug: s }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const seriesPosts = getSeriesPosts(slug);
  if (seriesPosts.length === 0) return {};

  const title = `${slug} 시리즈`;
  const description = `${slug}에 관한 ${seriesPosts.length}편의 글 모음 — ${seriesPosts
    .slice(0, 3)
    .map((p) => p.title)
    .join(", ")}${seriesPosts.length > 3 ? " 외" : ""}.`;
  const canonical = `/series/${encodeURIComponent(slug)}`;
  const ogUrl = `/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;

  return {
    title,
    description,
    alternates: { canonical },
    openGraph: {
      type: "website",
      locale: siteConfig.locale,
      url: `${SITE_URL}${canonical}`,
      siteName: siteConfig.name,
      title,
      description,
      images: [{ url: ogUrl, width: 1200, height: 630, alt: title }],
    },
    twitter: {
      card: "summary_large_image",
      title,
      description,
      images: [ogUrl],
    },
  };
}

export default async function SeriesPage({ params }: Props) {
  const { slug } = await params;
  const seriesPosts = getSeriesPosts(slug);
  if (seriesPosts.length === 0) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-secondary">시리즈</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">{slug}</h1>
        <p className="mt-2 text-secondary">{seriesPosts.length}편</p>
      </header>
      <div className="flex flex-col gap-1">
        {seriesPosts.map((post, i) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group -mx-3 rounded-xl px-3 py-4 transition-colors hover:bg-card-hover"
          >
            <article className="flex gap-4">
              <span className="flex h-8 w-8 shrink-0 items-center justify-center rounded-full bg-code-bg text-sm font-semibold text-secondary">
                {i + 1}
              </span>
              <div>
                <h2 className="font-semibold tracking-tight group-hover:text-accent">
                  {post.title}
                </h2>
                <p className="mt-1 text-sm text-secondary line-clamp-2">{post.description}</p>
                <time
                  dateTime={post.date}
                  className="mt-1 block whitespace-nowrap text-xs text-secondary"
                >
                  {formatCardDate(post.date)}
                </time>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
