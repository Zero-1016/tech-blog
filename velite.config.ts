import { defineConfig, defineCollection, s } from "velite";

const posts = defineCollection({
  name: "Post",
  pattern: "posts/**/*.mdx",
  schema: s.object({
    title: s.string().max(120),
    description: s.string().max(300),
    date: s.isodate(),
    tags: s.array(s.string()).default([]),
    series: s.string().optional(),
    seriesOrder: s.number().optional(),
    published: s.boolean().default(true),
    slug: s.path().transform((p) => p.replace(/^posts\//, "")),
    body: s.mdx(),
  }),
});

export default defineConfig({
  root: "content",
  output: {
    data: ".velite",
    assets: "public/static",
    base: "/static/",
    name: "[name]-[hash:6].[ext]",
    clean: true,
  },
  collections: { posts },
});
