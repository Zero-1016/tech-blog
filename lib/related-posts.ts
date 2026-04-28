interface CandidatePost {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  series?: string;
  published: boolean;
}

interface RelatedPost {
  slug: string;
  title: string;
  description: string;
  date: string;
}

function buildTagWeights(posts: CandidatePost[]): Map<string, number> {
  const docFreq = new Map<string, number>();
  const totalDocs = posts.filter((p) => p.published).length;

  for (const post of posts) {
    if (!post.published) continue;
    for (const tag of new Set(post.tags)) {
      docFreq.set(tag, (docFreq.get(tag) ?? 0) + 1);
    }
  }

  const weights = new Map<string, number>();
  for (const [tag, freq] of docFreq) {
    weights.set(tag, Math.log((totalDocs + 1) / (freq + 1)) + 1);
  }
  return weights;
}

export function pickRelatedPosts(
  current: Pick<CandidatePost, "slug" | "tags" | "series">,
  all: CandidatePost[],
  limit = 4
): RelatedPost[] {
  const currentTags = new Set(current.tags);
  const weights = buildTagWeights(all);

  const scored = all
    .filter(
      (p) =>
        p.published &&
        p.slug !== current.slug &&
        (current.series ? p.series !== current.series : true)
    )
    .map((p) => {
      let score = 0;
      for (const tag of p.tags) {
        if (currentTags.has(tag)) score += weights.get(tag) ?? 1;
      }
      return { post: p, score };
    })
    .filter((entry) => entry.score > 0);

  scored.sort((a, b) => {
    if (b.score !== a.score) return b.score - a.score;
    return b.post.date.localeCompare(a.post.date);
  });

  return scored.slice(0, limit).map(({ post }) => ({
    slug: post.slug,
    title: post.title,
    description: post.description,
    date: post.date,
  }));
}
