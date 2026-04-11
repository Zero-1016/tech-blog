import { posts } from "#site/content";
import { PostList } from "@/components/ui/post-list";

export default function Home() {
  const published = posts
    .filter((p) => p.published)
    .sort((a, b) => new Date(b.date).getTime() - new Date(a.date).getTime())
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      date: p.date,
      tags: p.tags,
    }));

  return (
    <div className="mx-auto max-w-3xl px-6 py-16">
      <section className="mb-16">
        <h1 className="text-3xl font-bold tracking-tight">Tech Blog</h1>
        <p className="mt-3 text-lg text-secondary">
          AI가 쓰고, 개발자가 다듬는 테크 블로그
        </p>
      </section>

      <section>
        {published.length > 0 ? (
          <PostList posts={published} />
        ) : (
          <p className="text-secondary">아직 글이 없습니다.</p>
        )}
      </section>
    </div>
  );
}
