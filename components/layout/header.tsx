import Link from "next/link";
import { posts } from "#site/content";
import { ThemeToggle } from "./theme-toggle";
import { Search } from "@/components/ui/search";

export function Header() {
  const searchItems = posts
    .filter((p) => p.published)
    .map((p) => ({
      slug: p.slug,
      title: p.title,
      description: p.description,
      tags: p.tags,
    }));

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <Link href="/" className="text-lg font-bold tracking-tight">
          Tech Blog
        </Link>
        <div className="flex items-center gap-2">
          <Search items={searchItems} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
