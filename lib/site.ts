export const siteConfig = {
  name: "Tech Blog",
  description: "© Copyright All Developers",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tech-blog-six-phi.vercel.app").replace(
    /\/$/,
    ""
  ),
  locale: "ko_KR",
  author: "Zero-1016",
} as const;

export const SITE_URL = siteConfig.url;
