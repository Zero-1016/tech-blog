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
  cover?: string;
}

export function PostList({ posts }: { posts: PostItem[] }) {
  return (
    <motion.div
      initial="hidden"
      animate="visible"
      variants={{ visible: { transition: { staggerChildren: 0.06 } } }}
      className="grid gap-4 sm:grid-cols-2"
    >
      {posts.map((post, i) => (
        <motion.article
          key={post.slug}
          variants={{
            hidden: { opacity: 0, y: 12 },
            visible: { opacity: 1, y: 0, transition: { duration: 0.35 } },
          }}
          className={i === 0 ? "sm:col-span-2" : ""}
        >
          <Link
            href={`/posts/${post.slug}`}
            className="group block overflow-hidden rounded-xl border border-border bg-background transition-all hover:border-accent/30 hover:shadow-lg hover:shadow-accent/5 dark:bg-[#111113]"
          >
            {post.cover && (
              <div className="aspect-[2/1] overflow-hidden bg-code-bg">
                <img
                  src={post.cover}
                  alt={post.title}
                  className="h-full w-full object-cover transition-transform duration-300 group-hover:scale-105"
                  loading="lazy"
                />
              </div>
            )}
            <div className="p-5">
              <h2
                className={`font-semibold tracking-tight group-hover:text-accent ${
                  i === 0 ? "text-xl" : "text-base"
                }`}
              >
                {post.title}
              </h2>
              <p className="mt-1.5 text-sm text-secondary line-clamp-2">
                {post.description}
              </p>
              <div className="mt-3 flex items-center gap-3 text-xs text-secondary">
                <time dateTime={post.date}>{formatDate(post.date)}</time>
                {post.tags.length > 0 && (
                  <div className="flex gap-1.5">
                    {post.tags.slice(0, 3).map((tag) => (
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
            </div>
          </Link>
        </motion.article>
      ))}
    </motion.div>
  );
}
