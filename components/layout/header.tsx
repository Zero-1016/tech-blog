import Image from "next/image";
import Link from "next/link";
import { headers } from "next/headers";
import { ThemeToggle } from "./theme-toggle";
import { SearchButton } from "./search-button";

export async function Header() {
  const ua = (await headers()).get("user-agent") ?? "";
  const isMac = /mac/i.test(ua);
  const isMobile = /android|iphone|ipad|ipod/i.test(ua);

  return (
    <header className="sticky top-0 z-40 border-b border-border bg-background/80 backdrop-blur-sm">
      <div className="mx-auto flex h-16 max-w-3xl items-center justify-between px-6">
        <Link href="/" className="flex items-center gap-2 text-lg font-bold tracking-tight">
          <Image src="/logo.png" alt="Logo" width={28} height={28} className="h-7 w-7" />
          Tech Blog
        </Link>
        <div className="flex items-center gap-1">
          <SearchButton isMac={isMac} isMobile={isMobile} />
          <ThemeToggle />
        </div>
      </div>
    </header>
  );
}
