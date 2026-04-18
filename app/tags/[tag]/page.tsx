import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { posts } from "#site/content";
import { siteConfig, SITE_URL } from "@/lib/site";
import { PostList } from "@/components/ui/post-list";

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

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { tag } = await params;
  const decoded = decodeURIComponent(tag);
  const count = posts.filter((p) => p.published && p.tags.includes(decoded)).length;

  if (count === 0) return {};

  const title = `#${decoded}`;
  const description = `${decoded} 태그가 붙은 ${count}개의 글 — ${siteConfig.name}`;
  const canonical = `/tags/${encodeURIComponent(decoded)}`;
  const ogUrl = `/og?title=${encodeURIComponent(title)}&description=${encodeURIComponent(description)}`;

  return {
    title,
    description,
    keywords: [decoded],
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
      <PostList
        posts={filtered.map((post) => ({
          slug: post.slug,
          title: post.title,
          description: post.description,
          date: post.date,
          tags: post.tags,
          cover: post.cover,
          banner: post.banner,
          charCount: post.charCount,
        }))}
      />
    </div>
  );
}
