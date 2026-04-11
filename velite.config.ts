import { defineConfig, defineCollection, s } from "velite";
import rehypePrettyCode from "rehype-pretty-code";

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
    cover: s.string().optional(),
    published: s.boolean().default(true),
    slug: s.path().transform((p) => {
      const parts = p.split("/");
      return parts[parts.length - 1];
    }),
    toc: s.toc(),
    metadata: s.metadata(),
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
  mdx: {
    rehypePlugins: [
      [
        rehypePrettyCode as never,
        {
          theme: {
            dark: "github-dark",
            light: "github-light",
          },
          keepBackground: false,
        },
      ],
    ],
  },
});
