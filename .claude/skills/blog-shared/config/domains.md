# 공식 도메인 화이트리스트 / 블랙리스트

blog 스킬 패밀리에서 출처의 권위를 판정할 때 사용하는 도메인 목록입니다.

**이 파일은 SHARED.md의 `§DOMAIN-WHITELIST` 섹션에서 참조됩니다.**
수정은 자유롭게 하되, 각 섹션의 구조(우선순위 분류)를 유지하세요.

섹션 ID: `§DOMAIN-PRIORITY-1` ~ `§DOMAIN-BLACKLIST`

---

## §DOMAIN-PRIORITY-1 — 1순위 도메인 (공식 문서/명세/표준)

이 도메인에서 온 URL은 자동으로 1순위 출처로 분류됩니다.

### 웹 표준

- `developer.mozilla.org` (MDN Web Docs)
- `www.w3.org`, `w3c.github.io` (W3C)
- `whatwg.org`, `html.spec.whatwg.org`, `dom.spec.whatwg.org`, `fetch.spec.whatwg.org` (WHATWG)
- `tc39.es`, `github.com/tc39` (TC39 / ECMAScript)
- `datatracker.ietf.org`, `www.rfc-editor.org` (IETF / RFC)

### 런타임/언어

- `nodejs.org` (Node.js)
- `bun.sh` (Bun)
- `deno.com`, `docs.deno.com` (Deno)
- `www.typescriptlang.org` (TypeScript)
- `docs.python.org` (Python)
- `doc.rust-lang.org` (Rust)
- `go.dev` (Go)

### 프론트엔드 프레임워크

- `react.dev` (React)
- `vuejs.org` (Vue)
- `svelte.dev`, `kit.svelte.dev` (Svelte / SvelteKit)
- `nextjs.org` (Next.js)
- `nuxt.com` (Nuxt)
- `solidjs.com` (Solid)
- `qwik.dev` (Qwik)
- `angular.dev`, `angular.io` (Angular)
- `remix.run` (Remix)
- `astro.build` (Astro)

### CSS / 스타일링

- `tailwindcss.com` (Tailwind)
- `sass-lang.com` (Sass)
- `styled-components.com` (styled-components)
- `emotion.sh` (Emotion)
- `unocss.dev` (UnoCSS)

### 상태 관리 / 데이터

- `redux.js.org`, `redux-toolkit.js.org` (Redux)
- `docs.pmnd.rs/zustand` (Zustand)
- `jotai.org` (Jotai)
- `valtio.pmnd.rs` (Valtio)
- `tanstack.com` (TanStack - Query, Router, Form)
- `swr.vercel.app` (SWR)
- `trpc.io` (tRPC)
- `graphql.org` (GraphQL)
- `apollographql.com/docs` (Apollo)

### 데이터베이스 / ORM

- `www.prisma.io/docs` (Prisma)
- `orm.drizzle.team` (Drizzle)
- `kysely.dev` (Kysely)
- `www.postgresql.org/docs` (PostgreSQL)
- `dev.mysql.com/doc` (MySQL)
- `redis.io/docs` (Redis)
- `www.mongodb.com/docs` (MongoDB)
- `www.sqlite.org/docs.html` (SQLite)

### 빌드 도구 / 번들러

- `vitejs.dev`, `vite.dev` (Vite)
- `webpack.js.org` (Webpack)
- `rollupjs.org` (Rollup)
- `esbuild.github.io` (esbuild)
- `turbo.build` (Turbo)
- `rspack.dev` (Rspack)
- `swc.rs` (SWC)

### 테스트

- `vitest.dev` (Vitest)
- `jestjs.io` (Jest)
- `playwright.dev` (Playwright)
- `testing-library.com` (Testing Library)
- `cypress.io` (Cypress)

### 클라우드/인프라

- `developer.apple.com` (Apple)
- `learn.microsoft.com`, `docs.microsoft.com` (Microsoft)
- `docs.aws.amazon.com` (AWS)
- `cloud.google.com/docs` (GCP)
- `docs.cloudflare.com` (Cloudflare)
- `vercel.com/docs` (Vercel)
- `www.netlify.com/docs` (Netlify)

### 자동 인식

- **context7 MCP가 반환하는 모든 라이브러리 공식 문서**는 자동으로 1순위로 분류

---

## §DOMAIN-PRIORITY-2 — 2순위 도메인 (원저자/구현체 블로그)

- `v8.dev` (V8 엔진)
- `webkit.org` (WebKit / Safari)
- `developer.chrome.com` (Chrome 개발자 문서)
- `hacks.mozilla.org` (Mozilla Hacks)
- `web.dev` (Google web.dev)
- `html5rocks.com` (HTML5 Rocks)
- `blog.chromium.org` (Chromium Blog)
- `engineering.fb.com` (Meta Engineering)
- `netflixtechblog.com` (Netflix Tech)
- GitHub의 메인테이너 공식 계정 블로그 (case-by-case 판단)

---

## §DOMAIN-PRIORITY-3 — 3순위 도메인 (컨퍼런스/논문/학술)

- `arxiv.org` (논문)
- `dl.acm.org` (ACM 논문)
- `www.youtube.com` 중 공식 컨퍼런스 채널:
  - `@ReactConf`, `@VueConf_US`, `@JSConfEU`, `@CSSDay`
  - `@GoogleChromeDevelopers`, `@MozillaDeveloper`
- `speakerdeck.com` (컨퍼런스 슬라이드)

---

## §DOMAIN-BLACKLIST — 블랙리스트 (참고 금지)

이 도메인의 내용은 **어떤 우선순위에도 포함하지 않고**, blog-research가 수집
중에 발견하면 무시합니다.

- `www.w3schools.com` (오래된 정보 다수, 잘못된 예제)
- `www.tutorialspoint.com` (낮은 품질)
- `geeksforgeeks.org` (품질 편차 큼, 비공식)

---

## §DOMAIN-UNCLASSIFIED — 미분류 (4순위 보조로 처리)

위 섹션에 없는 모든 도메인은 **4순위 (개인 블로그, 보조용)** 로 분류됩니다.
개인 블로그, 기업 마케팅 블로그, 문서화되지 않은 중급 사이트 등.

4순위 자료는 글의 **근거**로 쓰지 않고, 개념 설명 보조나 사용자 경험담 참조
용도로만 사용합니다.

---

## 수정 가이드

이 파일은 `blog-rule-editor` 스킬로 수정할 수 있어요. 또는 직접 편집.

### 추가할 때

1. 해당 우선순위 섹션 찾기
2. 도메인 추가 (서브도메인 정확히)
3. 짧은 설명 (제품/조직 이름)
4. CHANGELOG.md 에 변경 기록

### 제거할 때

1. 제거 사유가 정당한지 확인 (예: 서비스 종료, 품질 문제)
2. 해당 라인 삭제
3. CHANGELOG.md 에 변경 기록

### 블랙리스트 추가

품질 문제가 반복적으로 발견되는 도메인만 추가. 한두 번 잘못된 정보를 본 것만으로
블랙리스트 추가하지 마세요. 패턴이 반복되어야 함.
