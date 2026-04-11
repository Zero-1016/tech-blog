import type { MetadataRoute } from "next";
import { posts } from "#site/content";

const BASE_URL = process.env.NEXT_PUBLIC_SITE_URL || "https://tech-blog.vercel.app";

export default function sitemap(): MetadataRoute.Sitemap {
  const postEntries = posts
    .filter((p) => p.published)
    .map((post) => ({
      url: `${BASE_URL}/posts/${post.slug}`,
      lastModified: new Date(post.date),
    }));

  return [
    { url: BASE_URL, lastModified: new Date() },
    ...postEntries,
  ];
}
