import Link from "next/link";
import { notFound } from "next/navigation";
import { posts } from "#site/content";
import { formatDate } from "@/lib/utils";
import { readingTime } from "@/lib/reading-time";
import { MDXContent } from "@/components/mdx/mdx-content";
import { SeriesNav } from "@/components/ui/series-nav";
import { Toc } from "@/components/ui/toc";
import { MobileToc } from "@/components/ui/mobile-toc";
import { PostHeader } from "@/components/ui/post-header";
import { ScrollProgress } from "@/components/ui/scroll-progress";

interface Props {
  params: Promise<{ slug: string }>;
}

function getPost(slug: string) {
  return posts.find((p) => p.slug === slug && p.published);
}

export function generateStaticParams() {
  return posts
    .filter((p) => p.published)
    .map((p) => ({ slug: p.slug }));
}

export async function generateMetadata({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) return {};
  const ogUrl = `/og?title=${encodeURIComponent(post.title)}&description=${encodeURIComponent(post.description)}`;
  return {
    title: post.title,
    description: post.description,
    openGraph: {
      title: post.title,
      description: post.description,
      type: "article",
      images: [{ url: ogUrl, width: 1200, height: 630 }],
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

  return (
    <>
      <ScrollProgress />
      <div className="relative mx-auto max-w-5xl px-6 py-16">
        <div className="xl:flex xl:gap-16">
          <article className="min-w-0 max-w-3xl flex-1">
            <PostHeader>
              <h1 className="text-3xl font-bold tracking-tight leading-tight">
                {post.title}
              </h1>
              <p className="mt-3 text-lg text-secondary">{post.description}</p>
              <div className="mt-4 flex flex-wrap items-center gap-3 text-sm text-secondary">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                <span>·</span>
                <span>{readingTime(post.metadata.wordCount)}</span>
                {post.tags.length > 0 && (
                  <>
                    <span>·</span>
                    <div className="flex gap-1.5">
                      {post.tags.map((tag) => (
                        <Link
                          key={tag}
                          href={`/tags/${tag}`}
                          className="rounded-md bg-code-bg px-2 py-0.5 text-xs transition-colors hover:bg-accent/10 hover:text-accent"
                        >
                          {tag}
                        </Link>
                      ))}
                    </div>
                  </>
                )}
              </div>
            </PostHeader>
            {post.toc.length > 0 && <MobileToc items={post.toc} />}
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
          </article>
          {post.toc.length > 0 && <Toc items={post.toc} />}
        </div>
      </div>
    </>
  );
}
