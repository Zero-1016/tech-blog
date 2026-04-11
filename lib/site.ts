export const siteConfig = {
  name: "Tech Blog",
  description: "AI가 쓰고, 개발자가 다듬는 테크 블로그",
  url: (process.env.NEXT_PUBLIC_SITE_URL ?? "https://tech-blog-six-phi.vercel.app").replace(
    /\/$/,
    ""
  ),
  locale: "ko_KR",
  author: "Zero-1016",
} as const;

export const SITE_URL = siteConfig.url;
