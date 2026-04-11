declare module "#site/content" {
  interface Post {
    title: string;
    description: string;
    date: string;
    tags: string[];
    series?: string;
    seriesOrder?: number;
    cover?: string;
    published: boolean;
    slug: string;
    toc: { title: string; url: string; items: { title: string; url: string; items: never[] }[] }[];
    metadata: { wordCount: number; readingTime: number };
    body: string;
  }

  export const posts: Post[];
}
