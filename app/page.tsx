import Link from "next/link";
import { posts } from "#site/content";
import { Hero } from "@/components/ui/hero";
import { type PostEntry, type PostItem, type SeriesGroup } from "@/components/ui/post-list";
import { PostGrid } from "@/components/ui/post-grid";
import { siteConfig, SITE_URL } from "@/lib/site";

const POPULAR_TAG_MIN_COUNT = 3;
const POPULAR_TAG_LIMIT = 8;

type Group =
  | { kind: "single"; date: number; post: (typeof posts)[number] }
  | {
      kind: "series";
      date: number;
      name: string;
      items: (typeof posts)[number][];
    };

export default function Home() {
  const groups = new Map<string, Group>();

  for (const post of posts.filter((p) => p.published)) {
    const postTime = new Date(post.date).getTime();
    if (post.series) {
      const existing = groups.get(post.series);
      if (existing && existing.kind === "series") {
        existing.items.push(post);
        existing.date = Math.max(existing.date, postTime);
      } else {
        groups.set(post.series, {
          kind: "series",
          date: postTime,
          name: post.series,
          items: [post],
        });
      }
    } else {
      groups.set(`__single__:${post.slug}`, {
        kind: "single",
        date: postTime,
        post,
      });
    }
  }

  const tagCounts = new Map<string, number>();
  for (const post of posts) {
    if (!post.published) continue;
    for (const tag of post.tags) {
      tagCounts.set(tag, (tagCounts.get(tag) ?? 0) + 1);
    }
  }
  const popularTags = [...tagCounts.entries()]
    .filter(([, count]) => count >= POPULAR_TAG_MIN_COUNT)
    .sort((a, b) => b[1] - a[1] || a[0].localeCompare(b[0]))
    .slice(0, POPULAR_TAG_LIMIT);

  const toPostItem = (p: (typeof posts)[number]): PostItem => ({
    slug: p.slug,
    title: p.title,
    description: p.description,
    date: p.date,
    tags: p.tags,
    cover: p.cover,
    banner: p.banner,
    charCount: p.charCount,
  });

  const published: PostEntry[] = [...groups.values()]
    .sort((a, b) => b.date - a.date)
    .map((group): PostEntry => {
      if (group.kind === "single") return toPostItem(group.post);
      const sorted = [...group.items].sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
      return {
        kind: "series",
        name: group.name,
        items: sorted.map(toPostItem),
      } satisfies SeriesGroup;
    });

  const publishedFlat: PostItem[] = posts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map(toPostItem);

  const websiteJsonLd = {
    "@context": "https://schema.org",
    "@type": "WebSite",
    name: siteConfig.name,
    url: SITE_URL,
    description: siteConfig.description,
    inLanguage: "ko-KR",
    publisher: {
      "@type": "Person",
      name: siteConfig.author,
    },
  };

  const blogJsonLd = {
    "@context": "https://schema.org",
    "@type": "Blog",
    name: siteConfig.name,
    url: SITE_URL,
    description: siteConfig.description,
    inLanguage: "ko-KR",
    blogPost: published
      .flatMap((entry) => ("kind" in entry ? entry.items : [entry]))
      .slice(0, 10)
      .map((p) => ({
        "@type": "BlogPosting",
        headline: p.title,
        description: p.description,
        datePublished: new Date(p.date).toISOString(),
        url: `${SITE_URL}/posts/${p.slug}`,
        keywords: p.tags.join(", "),
      })),
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(websiteJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogJsonLd) }}
      />
      <Hero />
      <div id="posts" className="mx-auto max-w-7xl px-6 py-16">
        {popularTags.length > 0 && (
          <section className="mb-10">
            <h2 className="text-xs font-medium uppercase tracking-wider text-secondary">
              자주 쓰인 태그
            </h2>
            <div className="mt-3 flex flex-wrap gap-2">
              {popularTags.map(([tag, count]) => (
                <Link
                  key={tag}
                  href={`/tags/${encodeURIComponent(tag)}`}
                  className="inline-flex items-center gap-1.5 rounded-full border border-border bg-background px-3 py-1 text-xs leading-none text-secondary transition-colors hover:border-accent/30 hover:text-accent dark:bg-[#111113] dark:text-white"
                >
                  <span className="leading-none">#{tag}</span>
                  <span className="text-[10px] leading-none tabular-nums">{count}</span>
                </Link>
              ))}
            </div>
          </section>
        )}
        <section>
          {published.length > 0 ? (
            <PostGrid grouped={published} flat={publishedFlat} />
          ) : (
            <p className="text-secondary">아직 글이 없습니다.</p>
          )}
        </section>
      </div>
    </>
  );
}
