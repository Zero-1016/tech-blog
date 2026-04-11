import { notFound } from "next/navigation";
import Link from "next/link";
import { posts } from "#site/content";
import { formatCardDate } from "@/lib/utils";

interface Props {
  params: Promise<{ tag: string }>;
}

function getAllTags() {
  const tagSet = new Set<string>();
  for (const p of posts) {
    if (p.published) p.tags.forEach((t) => tagSet.add(t));
  }
  return Array.from(tagSet);
}

export function generateStaticParams() {
  return getAllTags().map((tag) => ({ tag }));
}

export async function generateMetadata({ params }: Props) {
  const { tag } = await params;
  return { title: `#${decodeURIComponent(tag)}` };
}

export default async function TagPage({ params }: Props) {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const filtered = posts
    .filter((p) => p.published && p.tags.includes(decoded))
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  if (filtered.length === 0) notFound();

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <p className="text-xs font-medium uppercase tracking-wider text-secondary">태그</p>
        <h1 className="mt-2 text-3xl font-bold tracking-tight">#{decoded}</h1>
        <p className="mt-2 text-secondary">{filtered.length}개의 글</p>
      </header>
      <div className="flex flex-col gap-1">
        {filtered.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group -mx-3 rounded-xl px-3 py-4 transition-colors hover:bg-card-hover"
          >
            <article>
              <h2 className="font-semibold tracking-tight group-hover:text-accent">{post.title}</h2>
              <p className="mt-1 text-sm text-secondary line-clamp-2">{post.description}</p>
              <time
                dateTime={post.date}
                className="mt-1 block whitespace-nowrap text-xs text-secondary"
              >
                {formatCardDate(post.date)}
              </time>
            </article>
          </Link>
        ))}
      </div>
    </div>
  );
}
