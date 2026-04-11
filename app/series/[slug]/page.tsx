import { notFound } from "next/navigation";
import Link from "next/link";
import { posts } from "#site/content";
import { formatDate } from "@/lib/utils";

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

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const seriesPosts = getSeriesPosts(slug);
  if (seriesPosts.length === 0) return {};
  return { title: `${slug} 시리즈` };
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
                <time dateTime={post.date} className="mt-1 block text-xs text-secondary">
                  {formatDate(post.date)}
                </time>
              </div>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
