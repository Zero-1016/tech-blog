import { posts } from "#site/content";
import { Hero } from "@/components/ui/hero";
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
      cover: p.cover,
    }));

  return (
    <>
      <Hero />
      <div id="posts" className="mx-auto max-w-3xl px-6 py-16">
        <section>
          {published.length > 0 ? (
            <PostList posts={published} />
          ) : (
            <p className="text-secondary">아직 글이 없습니다.</p>
          )}
        </section>
      </div>
    </>
  );
}
