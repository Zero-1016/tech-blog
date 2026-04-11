export type Locale = "ko" | "en";

const dictionaries = {
  ko: {
    site: {
      title: "Tech Blog",
      description: "AI가 쓰고, 개발자가 다듬는 테크 블로그",
      footer: "AI가 쓰고, 개발자가 다듬는 테크 블로그",
    },
    nav: {
      search: "검색",
      searchPlaceholder: "글 제목, 설명, 태그로 검색...",
      noResults: "검색 결과가 없습니다.",
    },
    post: {
      toc: "목차",
      readingTime: (min: number) => `${min}분`,
      relatedPosts: "관련 글",
      series: "시리즈",
      prev: "← 이전",
      next: "다음 →",
    },
    tag: {
      label: "태그",
      count: (n: number) => `${n}개의 글`,
    },
    notFound: {
      title: "페이지를 찾을 수 없습니다",
      description: "요청하신 페이지가 존재하지 않거나 이동되었습니다.",
      home: "홈으로 돌아가기",
    },
    hero: {
      badge: "AI-Powered",
      heading: "궁금한 건 AI에게,\n글은 자동으로.",
      sub: "주제를 던지면 인터랙티브 기술 글이 생성됩니다. 코드 플레이그라운드, 단계별 시각화, 시리즈 자동 기획까지.",
      cta: "글 둘러보기",
    },
  },
  en: {
    site: {
      title: "Tech Blog",
      description: "Written by AI, curated by developers",
      footer: "Written by AI, curated by developers",
    },
    nav: {
      search: "Search",
      searchPlaceholder: "Search by title, description, tags...",
      noResults: "No results found.",
    },
    post: {
      toc: "Contents",
      readingTime: (min: number) => `${min} min read`,
      relatedPosts: "Related Posts",
      series: "Series",
      prev: "← Previous",
      next: "Next →",
    },
    tag: {
      label: "Tag",
      count: (n: number) => `${n} posts`,
    },
    notFound: {
      title: "Page not found",
      description: "The page you're looking for doesn't exist or has been moved.",
      home: "Go home",
    },
    hero: {
      badge: "AI-Powered",
      heading: "Ask AI anything,\narticles write themselves.",
      sub: "Drop a topic, get interactive tech articles. Code playgrounds, animated walkthroughs, auto-planned series.",
      cta: "Browse articles",
    },
  },
};

export interface Dictionary {
  site: { title: string; description: string; footer: string };
  nav: { search: string; searchPlaceholder: string; noResults: string };
  post: {
    toc: string;
    readingTime: (min: number) => string;
    relatedPosts: string;
    series: string;
    prev: string;
    next: string;
  };
  tag: { label: string; count: (n: number) => string };
  notFound: { title: string; description: string; home: string };
  hero: { badge: string; heading: string; sub: string; cta: string };
}

export function getDictionary(locale: Locale): Dictionary {
  return dictionaries[locale];
}

export const defaultLocale: Locale = "ko";
export const locales: Locale[] = ["ko", "en"];
