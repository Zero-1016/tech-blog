---
name: blog-banner
description: |
  블로그 포스트 자동 배너 모티프를 추천하고, 필요 시 새 모티프 SVG를 생성한다.
  태그→모티프 매핑(lib/banner/spec.ts)과 SVG 라이브러리(public/banners/motifs/)를
  관리하며, frontmatter `banner` 필드로 수동 override도 지원한다.

  사용 트리거: `/blog-banner <파일>` 독립 실행.
  blog-write 파이프라인에는 자동 연결하지 않는다.

tools:
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Bash
  - AskUserQuestion
---

# blog-banner

입력 MDX 파일의 태그/본문을 분석해 기존 모티프 라이브러리에서 최적 매칭을 결정하고,
부적합하면 새 모티프 SVG를 자동 생성한다. 모티프 라이브러리는 `lib/banner/spec.ts`의
`MotifKey`·`TAG_TO_MOTIF`·`MOTIF_PRIORITY`·`PALETTES`와 `public/banners/motifs/*.svg`로 구성.

---

## Phase 1: 입력 파일 및 라이브러리 읽기

### Step 1-1: 입력 파일 파싱

- `Read` MDX 파일 → frontmatter(title, tags, description, series, banner?) + 본문 처음 800자
- `banner` 필드가 이미 있으면 override 확인 모드로 분기 (Phase 5)

### Step 1-2: 현재 모티프 라이브러리 스캔

- `Read lib/banner/spec.ts` → 현재 `MotifKey`, `TAG_TO_MOTIF`, `MOTIF_PRIORITY`, `PALETTES` 파악
- `Glob public/banners/motifs/*.svg` → 존재하는 모티프 파일 목록

---

## Phase 2: 매칭 평가

### Step 2-1: 예측 모티프 도출

`spec.ts`의 `pickMotif` 로직을 손으로 시뮬레이션:

- 태그별로 `TAG_TO_MOTIF` 정규식 매칭 → 후보 모티프 집합
- `MOTIF_PRIORITY` 순서로 첫 매칭 선택

### Step 2-2: 품질 등급

| 등급   | 조건                                                                                       |
| ------ | ------------------------------------------------------------------------------------------ |
| high   | 전용 모티프(typescript, react, css, design-system, accessibility 등) 매칭 + 본문 주제 일치 |
| medium | 일반 모티프(layout, selector, performance 등) 매칭 + 본문이 그 주제에 집중                 |
| low    | default fallback 또는 매칭 모티프와 본문 괴리                                              |

본문 일치 판단은 처음 800자의 주제 키워드로. 예: 매칭은 `performance`인데 본문이
"useMemo 언제 쓸지"라면 일치, "compound pattern RSC"라면 괴리.

---

## Phase 3: 결과 리포트 및 분기

| 등급   | 다음 행동                                                                           |
| ------ | ----------------------------------------------------------------------------------- |
| high   | "X 모티프로 충분해 보입니다" + frontmatter override 필요 여부 질문(§UI-USER-CHOICE) |
| medium | 위와 동일하되, 더 나은 대안이 있을지 사용자 의견 수렴                               |
| low    | Phase 4 (자동 생성) 진입                                                            |

---

## Phase 4: 새 모티프 자동 생성 (low 등급 시)

### Step 4-1: 설계

- 새 모티프 키 제안 (kebab-case, 기존 키 중복 없음)
- 팔레트: `bg`/`bgAccent` navy 계열, `primary`/`accent`는 주제색
- SVG 모티프: viewBox `0 0 400 400`, 투명 배경, 기하학 아이콘.
  primary `#3b82f6`·accent `#f87171` 팔레트 호환 색 사용

### Step 4-2: 자동 실행

사용자 답변("자동 생성 + 사후 확인")에 따라 먼저 생성:

1. `Write public/banners/motifs/<key>.svg`
2. `Edit lib/banner/spec.ts`:
   - `MotifKey` 유니온에 추가
   - `TAG_TO_MOTIF`에 이 글 대표 태그 → 새 키 매핑 추가 (우선순위 위치 고민 후 삽입)
   - `MOTIF_PRIORITY`에 추가
   - `PALETTES`에 엔트리 추가

### Step 4-3: 사후 확인 (§UI-USER-CHOICE)

생성 결과를 사용자에게 알리고 AskUserQuestion:

- "좋아요, 이대로 사용" → Phase 5
- "다른 방향으로 다시" → 사용자 의견 받아 Step 4-1부터 재시도 (SVG 재작성)
- "롤백" → 생성 파일 삭제 + spec.ts 변경 되돌리기

재시도 시 이전 시안은 백업에 보관하지 않는다. 최종 승인된 것만 남긴다.

---

## Phase 5: frontmatter override 지원

### Step 5-1: velite 스키마 확인·확장

`velite.config.ts`의 posts schema에 `banner: s.string().optional()`이 없으면
추가한다 (최초 1회).

### Step 5-2: BannerInput·buildBannerSpec 확장

`lib/banner/spec.ts`의 `BannerInput`에 `banner?: MotifKey`, `buildBannerSpec`에서
override 값이 있고 유효한 키면 그 키를 사용하도록 조건 추가 (최초 1회).

### Step 5-3: MDX frontmatter 쓰기

사용자가 override를 원하면 대상 MDX의 frontmatter에 `banner: <key>` 추가
(기존 줄 유지, 한 줄 삽입만).

---

## Phase 6: 완료 보고

- 선택된/생성된 모티프 키
- 변경된 파일 목록
- 다음 단계 안내 (`pnpm dev`로 미리보기 권장)

---

## 금지

- content/posts/\*\*/\*.mdx 본문(frontmatter 제외) 수정 금지
- blog-write 파이프라인 자동 호출 금지 (독립 실행만)
- 기존 모티프 SVG 함부로 덮어쓰기 금지 (사용자가 "이 모티프 다시 그려줘"라고 명시할 때만)
- 한 실행에서 2개 이상의 새 모티프 생성 금지 (한 번에 하나, 복잡도 제어)

---

## 제약

- SHARED.md 전역 규칙(em-dash, 콜론 등)은 이 스킬이 건드리는 범위(frontmatter 한 줄)에서는
  해당 없음
- 새 모티프 생성은 사용자 요청당 1회로 제한 (무한 재시도 방지는 사용자 판단)
- 스킬은 lib/banner/spec.ts의 타입·시그니처 구조를 준수해야 함 — 구조가 바뀌었으면
  blog-rule-editor 재호출로 스킬 업데이트
