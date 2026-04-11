import Link from "next/link";
import { posts } from "#site/content";
import { formatDate } from "@/lib/utils";

export default function Home() {
  const published = posts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime());

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <section className="mb-16">
        <h1 className="text-3xl font-bold tracking-tight">Tech Blog</h1>
        <p className="mt-3 text-lg text-secondary">
          AI가 쓰고, 개발자가 다듬는 테크 블로그
        </p>
      </section>

      <section>
        <div className="flex flex-col gap-1">
          {published.map((post) => (
            <Link
              key={post.slug}
              href={`/posts/${post.slug}`}
              className="group -mx-3 rounded-xl px-3 py-4 transition-colors hover:bg-card-hover"
            >
              <article>
                <h2 className="text-lg font-semibold tracking-tight group-hover:text-accent">
                  {post.title}
                </h2>
                <p className="mt-1 text-sm text-secondary line-clamp-2">
                  {post.description}
                </p>
                <div className="mt-2 flex items-center gap-3 text-xs text-secondary">
                  <time dateTime={post.date}>{formatDate(post.date)}</time>
                  {post.tags.length > 0 && (
                    <div className="flex gap-1.5">
                      {post.tags.map((tag) => (
                        <span
                          key={tag}
                          className="rounded-md bg-code-bg px-1.5 py-0.5"
                        >
                          {tag}
                        </span>
                      ))}
                    </div>
                  )}
                </div>
              </article>
            </Link>
          ))}
        </div>

        {published.length === 0 && (
          <p className="text-secondary">아직 글이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
