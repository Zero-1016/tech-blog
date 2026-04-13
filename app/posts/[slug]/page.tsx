import Link from "next/link";
import { notFound } from "next/navigation";
import type { Metadata } from "next";
import { posts } from "#site/content";
import { formatCardDate } from "@/lib/utils";
import { readingTime } from "@/lib/reading-time";
import { siteConfig, SITE_URL } from "@/lib/site";
import { MDXContent } from "@/components/mdx/mdx-content";
import { SeriesNav } from "@/components/ui/series-nav";
import { Toc } from "@/components/ui/toc";
import { MobileToc } from "@/components/ui/mobile-toc";
import { PostHeader } from "@/components/ui/post-header";
import { ScrollProgress } from "@/components/ui/scroll-progress";
import { RelatedPosts } from "@/components/ui/related-posts";
import { Comments } from "@/components/ui/comments";

interface Props {
  params: Promise<{ slug: string }>;
}

function getPost(slug: string) {
  return posts.find((p) => p.slug === slug && p.published);
}

export function generateStaticParams() {
  return posts.filter((p) => p.published).map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props): Promise<Metadata> {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};

  const ogUrl = `/og?title=${encodeURIComponent(post.title)}&description=${encodeURIComponent(post.description)}`;
  const canonical = `/posts/${post.slug}`;
  const publishedTime = new Date(post.date).toISOString();

  return {
    title: post.title,
    description: post.description,
    keywords: post.tags,
    authors: [{ name: siteConfig.author }],
    alternates: {
      canonical,
    },
    openGraph: {
      type: "article",
      locale: siteConfig.locale,
      url: `${SITE_URL}${canonical}`,
      siteName: siteConfig.name,
      title: post.title,
      description: post.description,
      publishedTime,
      modifiedTime: publishedTime,
      authors: [siteConfig.author],
      tags: post.tags,
      section: post.series ?? (post.tags[0] || "Tech"),
      images: [{ url: ogUrl, width: 1200, height: 630, alt: post.title }],
    },
    twitter: {
      card: "summary_large_image",
      title: post.title,
      description: post.description,
      images: [ogUrl],
    },
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  const toc = post.hasReferences
    ? [...post.toc, { title: "참고 자료", url: "#references", items: [] }]
    : post.toc;

  const postUrl = `${SITE_URL}/posts/${post.slug}`;
  const publishedIso = new Date(post.date).toISOString();
  const ogImageUrl = `${SITE_URL}/og?title=${encodeURIComponent(post.title)}&description=${encodeURIComponent(post.description)}`;

  const blogPostingJsonLd = {
    "@context": "https://schema.org",
    "@type": "BlogPosting",
    headline: post.title,
    description: post.description,
    image: [ogImageUrl],
    datePublished: publishedIso,
    dateModified: publishedIso,
    author: {
      "@type": "Person",
      name: siteConfig.author,
      url: SITE_URL,
    },
    publisher: {
      "@type": "Organization",
      name: siteConfig.name,
      logo: {
        "@type": "ImageObject",
        url: `${SITE_URL}/android-chrome-512x512.png`,
      },
    },
    mainEntityOfPage: {
      "@type": "WebPage",
      "@id": postUrl,
    },
    keywords: post.tags.join(", "),
    inLanguage: "ko-KR",
    articleSection: post.series ?? post.tags[0] ?? "Tech",
  };

  const breadcrumbJsonLd = {
    "@context": "https://schema.org",
    "@type": "BreadcrumbList",
    itemListElement: [
      { "@type": "ListItem", position: 1, name: "홈", item: SITE_URL },
      { "@type": "ListItem", position: 2, name: "글", item: `${SITE_URL}/#posts` },
      { "@type": "ListItem", position: 3, name: post.title, item: postUrl },
    ],
  };

  return (
    <>
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(blogPostingJsonLd) }}
      />
      <script
        type="application/ld+json"
        dangerouslySetInnerHTML={{ __html: JSON.stringify(breadcrumbJsonLd) }}
      />
      <ScrollProgress />
      <div className="relative mx-auto max-w-5xl px-6 py-16">
        <div className="xl:flex xl:gap-16">
          <article className="mx-auto min-w-0 max-w-3xl flex-1 xl:mx-0">
            <PostHeader>
              <h1 className="text-3xl font-bold tracking-tight leading-tight">{post.title}</h1>
              <p className="mt-3 text-lg text-secondary">{post.description}</p>
              <div className="mt-4 flex items-center gap-3 text-sm text-secondary">
                <time dateTime={post.date} className="whitespace-nowrap">
                  {formatCardDate(post.date)}
                </time>
                <span>·</span>
                <span className="whitespace-nowrap">{readingTime(post.charCount)}</span>
                {post.tags.length > 0 && (
                  <>
                    <span>·</span>
                    <div className="flex min-w-0 gap-1.5 overflow-x-auto">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/tags/${tag}`}
                          className="whitespace-nowrap rounded-md bg-code-bg px-2 py-0.5 text-xs transition-colors hover:bg-accent/10 hover:text-accent"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </PostHeader>
            {toc.length > 0 && <MobileToc items={toc} />}
            <div className="prose">
              <MDXContent code={post.body} />
            </div>
            {post.series && (
              <SeriesNav
                series={post.series}
                posts={posts
                  .filter((p) => p.published && p.series === post.series)
                  .map((p) => ({
                    slug: p.slug,
                    title: p.title,
                    seriesOrder: p.seriesOrder,
                  }))}
                currentSlug={post.slug}
              />
            )}
            <Comments />
            <RelatedPosts
              posts={posts
                .filter(
                  (p) =>
                    p.published &&
                    p.slug !== post.slug &&
                    (p.series === post.series || p.tags.some((t) => post.tags.includes(t)))
                )
                .slice(0, 4)
                .map((p) => ({
                  slug: p.slug,
                  title: p.title,
                  description: p.description,
                  date: p.date,
                }))}
            />
          </article>
          {toc.length > 0 && <Toc items={toc} />}
        </div>
      </div>
    </>
  );
}
