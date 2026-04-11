import { notFound } from "next/navigation";
import { posts } from "#site/content";
import { formatDate } from "@/lib/utils";
import { MDXContent } from "@/components/mdx/mdx-content";

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
  return {
    title: post.title,
    description: post.description,
  };
}

export default async function PostPage({ params }: Props) {
  const { slug } = await params;
  const post = getPost(slug);
  if (!post) notFound();

  return (
    <article className="mx-auto max-w-3xl px-6 py-16">
      <header className="mb-10">
        <h1 className="text-3xl font-bold tracking-tight leading-tight">
          {post.title}
        </h1>
        <p className="mt-3 text-lg text-secondary">{post.description}</p>
        <div className="mt-4 flex items-center gap-3 text-sm text-secondary">
          <time dateTime={post.date}>{formatDate(post.date)}</time>
          {post.tags.length > 0 && (
            <div className="flex gap-1.5">
              {post.tags.map((tag) => (
                <span
                  key={tag}
                  className="rounded-md bg-code-bg px-2 py-0.5 text-xs"
                >
                  {tag}
                </span>
              ))}
            </div>
          )}
        </div>
      </header>
      <div className="prose">
        <MDXContent code={post.body} />
      </div>
    </article>
  );
}
