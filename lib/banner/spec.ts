export type MotifKey =
  | "typescript"
  | "nextjs"
  | "react-native"
  | "react"
  | "css"
  | "design-system"
  | "layout"
  | "selector"
  | "performance"
  | "typography"
  | "methodology"
  | "accessibility"
  | "transition"
  | "module"
  | "refactor"
  | "styling"
  | "rendering"
  | "default";

export interface BannerPalette {
  bg: string;
  bgAccent: string;
  primary: string;
  accent: string;
  text: string;
}

export interface BannerSpec {
  motif: MotifKey;
  palette: BannerPalette;
  seed: number;
  initials: string;
  title: string;
}

export interface BannerInput {
  title: string;
  slug: string;
  tags?: string[];
  series?: string;
}

const TAG_TO_MOTIF: Array<[RegExp, MotifKey]> = [
  [/^TypeScript$/i, "typescript"],
  [/^(Next\.js|App Router|React Server Components|RSC)$/i, "nextjs"],
  [/^React Native$/i, "react-native"],
  [/^React$/i, "react"],
  [/^(디자인 시스템|디자인 토큰|Atomic Design|Design System)$/i, "design-system"],
  [/^(CSS-in-JS|Emotion|Vanilla Extract|Panda CSS|Linaria|Tailwind|CSS Modules)$/i, "styling"],
  [/^(BEM|CSS 방법론|네이밍|프론트엔드 아키텍처)$/i, "methodology"],
  [/^(접근성|웹 표준|시맨틱 HTML)$/i, "accessibility"],
  [/^View Transitions$/i, "transition"],
  [/^(Node\.js|npm|npx|CLI|모듈 시스템|ESM)$/i, "module"],
  [/^(AST|codemod|리팩토링)$/i, "refactor"],
  [/^(텍스트|제어)$/i, "typography"],
  [/^(브라우저|렌더링|렌더링 파이프라인|Critical Rendering Path|CRP)$/i, "rendering"],
  [/^(성능|애니메이션|Hooks)$/i, "performance"],
  [/^(Flexbox|Grid|레이아웃|박스 모델|aspect-ratio)$/i, "layout"],
  [/^(has|선택자|Cascade|z-index|stacking-context)$/i, "selector"],
  [/^CSS$/i, "css"],
];

const MOTIF_PRIORITY: MotifKey[] = [
  "typescript",
  "nextjs",
  "react-native",
  "react",
  "design-system",
  "accessibility",
  "transition",
  "refactor",
  "styling",
  "methodology",
  "module",
  "typography",
  "rendering",
  "performance",
  "layout",
  "selector",
  "css",
];

const PALETTES: Record<MotifKey, BannerPalette> = {
  typescript: {
    bg: "#0a1a33",
    bgAccent: "#1e3a6b",
    primary: "#3178c6",
    accent: "#60a5fa",
    text: "#dbeafe",
  },
  react: {
    bg: "#0a1722",
    bgAccent: "#13293d",
    primary: "#61dafb",
    accent: "#f87171",
    text: "#e0f2fe",
  },
  "react-native": {
    bg: "#0f1a2e",
    bgAccent: "#1e3555",
    primary: "#61dafb",
    accent: "#fbbf24",
    text: "#e0f2fe",
  },
  nextjs: {
    bg: "#08090d",
    bgAccent: "#1a1d29",
    primary: "#ededed",
    accent: "#3b82f6",
    text: "#e5e7eb",
  },
  css: {
    bg: "#0f1a33",
    bgAccent: "#1e3a6b",
    primary: "#3b82f6",
    accent: "#f87171",
    text: "#dbeafe",
  },
  "design-system": {
    bg: "#10182e",
    bgAccent: "#1f2d52",
    primary: "#60a5fa",
    accent: "#fbbf24",
    text: "#e0e7ff",
  },
  layout: {
    bg: "#0f1e3d",
    bgAccent: "#1e3a6b",
    primary: "#60a5fa",
    accent: "#f87171",
    text: "#e0e7ff",
  },
  selector: {
    bg: "#10192f",
    bgAccent: "#1e2f57",
    primary: "#818cf8",
    accent: "#fbbf24",
    text: "#e0e7ff",
  },
  performance: {
    bg: "#1a0f2e",
    bgAccent: "#3b1e5a",
    primary: "#a78bfa",
    accent: "#f472b6",
    text: "#ede9fe",
  },
  typography: {
    bg: "#0f1b2d",
    bgAccent: "#1e3558",
    primary: "#38bdf8",
    accent: "#facc15",
    text: "#e0f2fe",
  },
  methodology: {
    bg: "#0c2030",
    bgAccent: "#174059",
    primary: "#22d3ee",
    accent: "#fb923c",
    text: "#cffafe",
  },
  accessibility: {
    bg: "#0f2a1f",
    bgAccent: "#1e4d38",
    primary: "#34d399",
    accent: "#fbbf24",
    text: "#d1fae5",
  },
  transition: {
    bg: "#1a1040",
    bgAccent: "#312e81",
    primary: "#a5b4fc",
    accent: "#fb7185",
    text: "#e0e7ff",
  },
  module: {
    bg: "#111827",
    bgAccent: "#1f2f4d",
    primary: "#60a5fa",
    accent: "#fbbf24",
    text: "#dbeafe",
  },
  refactor: {
    bg: "#1f1533",
    bgAccent: "#3d2a5e",
    primary: "#c084fc",
    accent: "#fb923c",
    text: "#ede9fe",
  },
  styling: {
    bg: "#0f1e3d",
    bgAccent: "#2a1e5a",
    primary: "#f472b6",
    accent: "#60a5fa",
    text: "#fce7f3",
  },
  rendering: {
    bg: "#0a1f2e",
    bgAccent: "#133248",
    primary: "#22d3ee",
    accent: "#fb7185",
    text: "#cffafe",
  },
  default: {
    bg: "#0a1428",
    bgAccent: "#1e3555",
    primary: "#3b82f6",
    accent: "#f87171",
    text: "#e2e8f0",
  },
};

function pickMotif(tags: string[]): MotifKey {
  const hits = new Set<MotifKey>();
  for (const tag of tags) {
    for (const [re, motif] of TAG_TO_MOTIF) {
      if (re.test(tag)) hits.add(motif);
    }
  }
  for (const m of MOTIF_PRIORITY) if (hits.has(m)) return m;
  return "default";
}

function hashSeed(input: string): number {
  let h = 2166136261;
  for (let i = 0; i < input.length; i++) {
    h ^= input.charCodeAt(i);
    h = Math.imul(h, 16777619);
  }
  return h >>> 0;
}

function extractInitials(title: string): string {
  const cleaned = title.replace(/[^\p{L}\p{N}\s]/gu, " ").trim();
  const words = cleaned.split(/\s+/).filter(Boolean);
  if (words.length === 0) return "??";
  if (words.length === 1) return words[0].slice(0, 2).toUpperCase();
  return (words[0][0] + words[1][0]).toUpperCase();
}

export function buildBannerSpec(input: BannerInput): BannerSpec {
  const motif = pickMotif(input.tags ?? []);
  return {
    motif,
    palette: PALETTES[motif],
    seed: hashSeed(input.slug || input.title),
    initials: extractInitials(input.title),
    title: input.title,
  };
}

export function seededRandom(seed: number) {
  let state = seed || 1;
  return () => {
    state = (state * 1664525 + 1013904223) >>> 0;
    return state / 4294967296;
  };
}
