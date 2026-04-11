import Link from "next/link";
import { formatCardDate } from "@/lib/utils";

interface RelatedPost {
  slug: string;
  title: string;
  description: string;
  date: string;
}

export function RelatedPosts({ posts }: { posts: RelatedPost[] }) {
  if (posts.length === 0) return null;

  return (
    <section className="mt-16 border-t border-border pt-10">
      <h3 className="mb-6 text-lg font-semibold tracking-tight">관련 글</h3>
      <div className="grid gap-4 sm:grid-cols-2">
        {posts.map((post) => (
          <Link
            key={post.slug}
            href={`/posts/${post.slug}`}
            className="group rounded-xl border border-border p-5 transition-colors hover:border-accent/30 hover:bg-card-hover"
          >
            <h4 className="font-medium tracking-tight group-hover:text-accent">{post.title}</h4>
            <p className="mt-1.5 text-sm text-secondary line-clamp-2">{post.description}</p>
            <time
              dateTime={post.date}
              className="mt-2 block whitespace-nowrap text-xs text-secondary"
            >
              {formatCardDate(post.date)}
            </time>
          </Link>
        ))}
      </div>
    </section>
  );
}
