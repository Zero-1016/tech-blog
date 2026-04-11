import { posts } from "#site/content";
import { Hero } from "@/components/ui/hero";
import { PostList } from "@/components/ui/post-list";

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

  const published = [...groups.values()]
    .sort((a, b) => b.date - a.date)
    .flatMap((group) => {
      const list =
        group.kind === "single"
          ? [group.post]
          : [...group.items].sort((a, b) => (a.seriesOrder ?? 0) - (b.seriesOrder ?? 0));
      return list.map((p) => ({
        slug: p.slug,
        title: p.title,
        description: p.description,
        date: p.date,
        tags: p.tags,
        cover: p.cover,
        charCount: p.charCount,
      }));
    });

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
