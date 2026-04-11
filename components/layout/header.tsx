import Image from "next/image";
import Link from "next/link";
import { ThemeToggle } from "./theme-toggle";
import { SearchButton } from "./search-button";

export function Header() {
  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Image
            src="/logo.png"
            alt="Tech Blog logo"
            width={28}
            height={28}
            priority
            className="h-7 w-7"
          />
          Tech Blog
        </Link>
        <div className="flex items-center gap-1">
          <SearchButton />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
