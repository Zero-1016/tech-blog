import { readFileSync, writeFileSync, readdirSync, statSync, mkdirSync } from "fs";
import { resolve, join, basename } from "path";

const SITE_URL = (
  process.env.NEXT_PUBLIC_SITE_URL ?? "https://tech-blog-six-phi.vercel.app"
).replace(/\/$/, "");

interface PostMeta {
  slug: string;
  title: string;
  description: string;
  date: string;
  tags: string[];
  series?: string;
  published: boolean;
}

function parseFrontmatter(source: string): Record<string, unknown> | null {
  if (!source.startsWith("---")) return null;
  const end = source.indexOf("\n---", 3);
  if (end === -1) return null;
  const block = source.slice(3, end).trim();
  const out: Record<string, unknown> = {};

  for (const rawLine of block.split("\n")) {
    const line = rawLine.replace(/\r$/, "");
    if (!line.trim() || line.trim().startsWith("#")) continue;

    const colon = line.indexOf(":");
    if (colon === -1) continue;
    const key = line.slice(0, colon).trim();
    const rawValue = line.slice(colon + 1).trim();

    if (!rawValue) {
      out[key] = "";
      continue;
    }

    if (rawValue.startsWith("[") && rawValue.endsWith("]")) {
      const inner = rawValue.slice(1, -1).trim();
      out[key] = inner ? inner.split(",").map((s) => s.trim().replace(/^["']|["']$/g, "")) : [];
      continue;
    }

    if (rawValue === "true" || rawValue === "false") {
      out[key] = rawValue === "true";
      continue;
    }

    if (/^-?\d+(\.\d+)?$/.test(rawValue)) {
      out[key] = Number(rawValue);
      continue;
    }

    out[key] = rawValue.replace(/^["']|["']$/g, "");
  }

  return out;
}

function walkMdx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkMdx(full));
    } else if (entry.endsWith(".mdx")) {
      out.push(full);
    }
  }
  return out;
}

function readPosts(): PostMeta[] {
  const dir = resolve(process.cwd(), "content/posts");
  const files = walkMdx(dir);
  const posts: PostMeta[] = [];

  for (const file of files) {
    const raw = readFileSync(file, "utf-8");
    const fm = parseFrontmatter(raw);
    if (!fm) continue;
    if (fm.published === false) continue;

    posts.push({
      slug: basename(file, ".mdx"),
      title: String(fm.title ?? ""),
      description: String(fm.description ?? ""),
      date: String(fm.date ?? ""),
      tags: Array.isArray(fm.tags) ? (fm.tags as string[]) : [],
      series: fm.series ? String(fm.series) : undefined,
      published: fm.published !== false,
    });
  }

  return posts;
}

function escapeXml(value: string): string {
  return value
    .replace(/&/g, "&amp;")
    .replace(/</g, "&lt;")
    .replace(/>/g, "&gt;")
    .replace(/"/g, "&quot;")
    .replace(/'/g, "&apos;");
}

function toIsoDate(value: string): string {
  if (!value) return new Date().toISOString();
  const d = new Date(value);
  if (Number.isNaN(d.getTime())) return new Date().toISOString();
  return d.toISOString();
}

function buildSitemap(posts: PostMeta[]): string {
  const now = new Date().toISOString();

  const urls: { loc: string; lastmod: string; changefreq: string; priority: string }[] = [
    { loc: `${SITE_URL}/`, lastmod: now, changefreq: "daily", priority: "1.0" },
  ];

  const latestPost = posts
    .map((p) => toIsoDate(p.date))
    .sort()
    .pop();

  for (const post of posts) {
    urls.push({
      loc: `${SITE_URL}/posts/${encodeURIComponent(post.slug)}`,
      lastmod: toIsoDate(post.date),
      changefreq: "monthly",
      priority: "0.8",
    });
  }

  const seriesSet = new Set<string>();
  for (const post of posts) if (post.series) seriesSet.add(post.series);
  for (const series of seriesSet) {
    urls.push({
      loc: `${SITE_URL}/series/${encodeURIComponent(series)}`,
      lastmod: latestPost ?? now,
      changefreq: "weekly",
      priority: "0.6",
    });
  }

  const tagSet = new Set<string>();
  for (const post of posts) post.tags.forEach((t) => tagSet.add(t));
  for (const tag of tagSet) {
    urls.push({
      loc: `${SITE_URL}/tags/${encodeURIComponent(tag)}`,
      lastmod: latestPost ?? now,
      changefreq: "weekly",
      priority: "0.5",
    });
  }

  const body = urls
    .map(
      (u) =>
        `  <url>\n    <loc>${escapeXml(u.loc)}</loc>\n    <lastmod>${u.lastmod}</lastmod>\n    <changefreq>${u.changefreq}</changefreq>\n    <priority>${u.priority}</priority>\n  </url>`
    )
    .join("\n");

  return `<?xml version="1.0" encoding="UTF-8"?>\n<urlset xmlns="http://www.sitemaps.org/schemas/sitemap/0.9">\n${body}\n</urlset>\n`;
}

function buildRobots(): string {
  return `User-agent: *\nAllow: /\n\nDisallow: /og\nDisallow: /api\n\nSitemap: ${SITE_URL}/sitemap.xml\nHost: ${SITE_URL}\n`;
}

function main() {
  const posts = readPosts();
  const publicDir = resolve(process.cwd(), "public");
  mkdirSync(publicDir, { recursive: true });

  const sitemapPath = join(publicDir, "sitemap.xml");
  const robotsPath = join(publicDir, "robots.txt");

  writeFileSync(sitemapPath, buildSitemap(posts), "utf-8");
  writeFileSync(robotsPath, buildRobots(), "utf-8");

  console.log(`✓ sitemap.xml (${posts.length} posts) → ${sitemapPath}`);
  console.log(`✓ robots.txt → ${robotsPath}`);
  console.log(`  site url: ${SITE_URL}`);
}

main();
