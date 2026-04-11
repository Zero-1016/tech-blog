# tech-blog

AI가 글을 쓰고 개발자가 방향을 잡는 한국어 기술 블로그. Next.js App Router + MDX + Velite 기반 정적 사이트.

## 기술 스택

- **Next.js 16** (App Router, Webpack 빌드, SSG)
- **React 19**
- **TypeScript** (strict)
- **MDX + Velite** — `content/posts/**/*.mdx`를 빌드 시 `.velite/`로 컴파일, `#site/content`로 import
- **Tailwind CSS v4** (PostCSS)
- **rehype-pretty-code + Shiki** (코드 하이라이팅)
- **Sandpack** (인터랙티브 코드 플레이그라운드)
- **Framer Motion** (애니메이션)
- **Fuse.js** (검색)
- **Playwright** (E2E)

## 디렉토리 구조

```
app/                 # Next.js App Router
  posts/[slug]/      # 글 상세
  series/[slug]/     # 시리즈 목록
  tags/[tag]/        # 태그별 목록
  og/                # OG 이미지 동적 생성
  feed.xml, sitemap.ts
components/
  layout/            # header, footer, search-button, theme-toggle
  mdx/               # MDX 컴포넌트, code-block
  ui/                # callout, toc, series-nav, code-playground 등
content/posts/       # MDX 원본
lib/                 # utils(cn, formatDate), reading-time
scripts/format-post.ts  # MDX 포스트 포매터
e2e/                 # Playwright 테스트
velite.config.ts     # 콘텐츠 스키마 정의
```

## 주요 명령어

```bash
pnpm dev              # 개발 서버 (webpack)
pnpm build            # 프로덕션 빌드
pnpm lint             # ESLint
pnpm format           # Prettier
pnpm format:posts     # MDX 포스트 전용 포매터
pnpm test:e2e         # Playwright
```

## 컨벤션

- **경로 alias**: `@/*` (루트), `#site/content` (velite 빌드 결과)
- **포스트 frontmatter**: `title`, `description`, `date`(ISO), `tags`, `series`, `seriesOrder`, `cover`, `published` — 스키마는 `velite.config.ts` 참고
- **Prettier**: `semi: true`, `singleQuote: false`, `printWidth: 100`
- **언어**: UI와 콘텐츠 모두 한국어
- **주석**: 복잡한 로직에만 최소한으로
- **스타일**: Tailwind 우선, 유틸은 `cn()`(lib/utils.ts)으로 합성

## 글 작성 워크플로우

`.claude/commands/write-post.md` 기반의 `/write-post` 커스텀 커맨드로 새 포스트를 인터랙티브하게 기획·작성한다. 포스트는 `content/posts/`에 MDX로 저장되며 Velite가 빌드 시 타입세이프한 데이터로 변환한다.

## 작업 시 주의사항

- 콘텐츠 스키마를 바꾸면 `velite.config.ts`와 사용처(`app/posts/[slug]/page.tsx` 등)를 함께 업데이트
- MDX 컴포넌트 추가는 `components/mdx/mdx-components.tsx`에 등록
- 빌드는 webpack 플래그 필수 (`next dev --webpack`, `next build --webpack`) — Velite 플러그인이 webpack에 연결되어 있음
