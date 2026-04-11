"use client";

import Link from "next/link";
import { motion } from "framer-motion";
import { formatDate } from "@/lib/utils";

interface PostItem {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
}

export function PostList({ posts }: { posts: PostItem[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="flex flex-col gap-1"
    >
      {posts.map((post) => (
        <motion.article
          key={post.slug}
          variants={{
            hidden: { opacity: 0, y: 10 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.3 } },
          }}
          className="-mx-3 rounded-xl px-3 py-4 transition-colors hover:bg-card-hover"
        >
          <Link href={`/posts/${post.slug}`}>
            <h2 className="text-lg font-semibold tracking-tight hover:text-accent">
              {post.title}
            </h2>
            <p className="mt-1 text-sm text-secondary line-clamp-2">
              {post.description}
            </p>
          </Link>
          <div className="mt-2 flex items-center gap-3 text-xs text-secondary">
            <time dateTime={post.date}>{formatDate(post.date)}</time>
            {post.tags.length > 0 && (
              <div className="flex gap-1.5">
                {post.tags.map((tag) => (
                  <Link
                    key={tag}
                    href={`/tags/${tag}`}
                    className="rounded-md bg-code-bg px-1.5 py-0.5 transition-colors hover:bg-accent/10 hover:text-accent"
                  >
                    {tag}
                  </Link>
                ))}
              </div>
            )}
          </div>
        </motion.article>
      ))}
    </motion.div>
  );
}
