# Blog Skills Family — Changelog

이 파일은 blog-rule-editor 가 자동으로 관리합니다. 직접 편집 가능하지만,
형식을 유지하세요.

---

## 2026-04-16 15:36

### SHARED.md §RULE-CITE · blog-validator Phase 4-2 · blog-writer Step 6

**변경**: `<Cite />` 가 JSX 컴포넌트 직후 단독 라인에 오는 패턴을 확정 위반으로
명시하고, validator 검출 로직 + writer 가이드를 보강.

- `SHARED.md` §RULE-CITE: "본문 단락의 문장 끝에 인라인" 명시 + "JSX 컴포넌트
  직후 단독 라인 금지" 조항 추가 + 올바른/잘못된 예시 mdx 블록 추가.
- `blog-validator` Phase 4-2: Callout/AnimatedStep/CodePlayground 닫힘 → 빈 줄
  → 단독 `<Cite />` 패턴을 awk 로 검출, 사용자 확인 카테고리로 분류 (자동 수정
  불가 — 어느 본문 단락 끝에 옮길지 의미 판단 필요).
- `blog-writer` Step 6: `<Cite>` 사용 가이드에 "JSX 컴포넌트 직후 단독 라인에
  두지 말 것" 항목 + ❌/✅ 예시 추가.

**이유**: writer 가 `content/posts/rendering-strategies-map.mdx` 작성 시 4개 섹션
(CSR/SSR/SSG/Hydration) 에서 모두 Callout 닫고 빈 줄 + `<Cite />` 단독 라인
패턴을 만듦. 렌더링 시 ⓘ 아이콘이 본문 텍스트 없이 외롭게 떠서 어색함. 기존
§RULE-CITE 의 "텍스트 바로 뒤 공백 없이" 표현이 모호해서 writer 가 "Callout
인용문 = 텍스트" 로 해석할 여지가 있었음. 본문 단락의 문장과 JSX 블록을 명확히
구분.

**수정 유형**: 기존 규칙 강화 (예시 mdx 블록 추가) + validator 검출 1건 추가 +
writer 가이드 1건 추가.

**영향 범위**:

- `SHARED.md` 참조하는 다른 skill 들은 자동 반영 (blog-validator, blog-writer 가
  각자 영역에서 새 규칙 인지).
- 기존 글 영향: `content/posts/rendering-strategies-map.mdx` L90, L157 두 곳
  (이번 세션에서 사용자가 글 수정 진행 중). 다른 글 7건은 정상 패턴 (텍스트 끝
  인라인) 사용 중이라 영향 없음.

**백업**: `.backups/SHARED-20260416-153614.md`,
`.backups/blog-validator-SKILL-20260416-153614.md`,
`.backups/blog-writer-SKILL-20260416-153614.md`

**재검증 결과**: rendering-strategies-map.mdx 의 단독 라인 Cite 2건 (L90, L157)
은 사용자가 직접 본문 단락 끝으로 이동 예정. 다른 글은 재검증 불필요 (기존 패턴
이미 정상).

---

## 2026-04-15 20:17

### SHARED.md §FRONTMATTER

**변경**: `tags` 배열에 약어 판단 기준 추가. 널리 통용되는 약어가 있으면
약어형(예: `"RSC"`, `"SSR"`)을 사용하도록 규정.

**이유**: 기존 98ba5aa 커밋에서 §META-TITLE·§META-DESCRIPTION 에 약어 판단 기준이
추가됐지만 `tags` 는 빠져 있었음. 태그는 식별 라벨이라 짧고 일관된 형태가
검색·중복 방지에 유리하다는 원칙을 명시. §META-TITLE 에서 "풀어쓰기 권장"으로
분류된 성능 지표 약어(LCP/CLS 등)도 tags 에서는 검색 키워드성이 우선이라 약어형 허용.

**수정 유형**: 기존 섹션에 불릿 추가 (§FRONTMATTER 필수 조건)

**영향 범위**:

- blog-writer: frontmatter 스키마 참조로 자동 반영
- blog-validator: §FRONTMATTER 참조로 자동 반영
- 기존 글 7건: "React Server Components" 태그를 "RSC" 로 이미 수정함
  - use-client-boundary-and-overuse.mdx
  - compound-pattern-rsc/{module-graph, three-costs, tradeoff-choice}.mdx
  - suspense-streaming-ssr/{suspense-boundary-where, streaming-html-chunks, loading-ux-web-vitals}.mdx

**백업**: `.backups/SHARED-20260415-201713.md`

---

## 2026-04-14 16:28

### SHARED.md §RULE-CITE · blog-writer Step 6 · Step 8

**변경**: Cite 권고 수준 상향. "선택 사항" → "References items 각 항목에
본문 Cite를 하나 이상 붙이는 것을 기본으로 한다 (SHOULD)".

- `SHARED.md` §RULE-CITE: "선택 사항. 안 써도 되고…" 항목을 삭제하고 "기본 원칙
  (권고, SHOULD)" 항목으로 치환. 자연스러운 문장 흐름을 깨뜨리면 생략 가능 단서 포함.
- `blog-writer/SKILL.md` Step 6 `<Cite>` 사용: "선택 사항, 핵심 주장 한두 군데에만"
  → "References items 각 항목마다 본문 대응 Cite 하나 이상 (권고)".
- `blog-writer/SKILL.md` Step 8 미루는 항목: "References items 각 항목에 본문 Cite가
  하나 이상 붙었는지 (§RULE-CITE, 권고)" 체크 추가.

**이유**: 최근 두 글(use-client-boundary-and-overuse, virtual-list-dom-cost)에서
writer 가 하단 References 블록만 만들고 본문 Cite 를 0개 배치. 기존 §RULE-CITE 는
"선택 사항" 으로 쓰여 있어 writer 가 합법적으로 생략 가능. 필수까지는 아니고,
자연스러우면 붙이도록 SHOULD 수준으로 끌어올림.

**수정 유형**: 기존 규칙 강화 (완전 재작성 아님, 권고 조항 추가)

**영향 범위**:

- blog-writer: 명시적으로 Step 6, Step 8 수정 반영
- blog-validator / blog-expression-review: 손대지 않음 (강제 아니므로 검증 규칙 추가 없음)
- 기존 글: 사용자가 수동으로 use-client-boundary-and-overuse, virtual-list-dom-cost
  두 글에 Cite 인라인을 이미 추가함 (blog-rule-editor 호출 전 처리). 나머지
  기존 글은 기 작성분 기준이므로 소급 적용 대상 아님.

**백업**:

- `.backups/SHARED-20260414-162819.md`
- `.backups/blog-writer-SKILL-20260414-162819.md`

**재검증 결과**: 해당 없음 (validator 규칙 변경 아님).

---

## 2026-04-14 16:17

### SHARED.md §RULE-LINK-PATH · blog-validator 4-3 · blog-writer Step 5

**변경**: 내부 링크 URL 형식에서 `/posts/<seriesSlug>/<partSlug>` 제거. slug 는
**파일명 단일 세그먼트**임을 명시.

- `SHARED.md` §RULE-LINK-PATH: "시리즈 편: `/posts/<partSlug>`" 로 수정. 금지 패턴에
  `/posts/<folder>/<slug>` 추가. 검출 전략 5번 `\]\(/posts/[^)/]+/[^)]+\)` 추가.
- `blog-validator/SKILL.md` 4-3-a: 폴더 경로 URL 검출 grep 추가, 자동 수정
  (마지막 세그먼트만 유지) 추가. 4-3-b 선행 조건 명시.
- `blog-writer/SKILL.md` Step 5 원칙: "시리즈 편 간 링크도 파일명 slug 만" 명시.

**이유**: compound-pattern-rsc 시리즈 3편 간 링크 5개 + use-client-boundary 1개가
전부 404. 원인은 velite.config.ts 의 slug 가 `parts[parts.length - 1]` 로 파일명만
추출하는데, SHARED.md L485 가 `/posts/<seriesSlug>/<partSlug>` 를 유효 URL 로
명시해 writer 가 폴더 경로 URL 을 생성. validator 의 실존 체크는 디스크 파일
경로(`content/posts/*/<slug>.mdx`)로만 매칭돼서 오탐 없이 통과됨.

**수정 유형**: 기존 규칙 수정 (버그 픽스)

**영향 범위**:

- blog-writer: SHARED.md 참조 + Step 5 원칙 명시 추가 (즉시 반영)
- blog-validator: 4-3-a 에 확정 에러 grep 추가, 4-3-b 선행 조건 추가 (즉시 반영)
- 기존 글: 6건 수정 완료 (`compound-pattern-three-costs`, `compound-pattern-module-graph`,
  `compound-pattern-tradeoff-choice`, `use-client-boundary-and-overuse`)

**백업**:

- `.backups/SHARED-20260414-161734.md`
- `.backups/blog-validator-SKILL-20260414-161734.md`
- `.backups/blog-writer-SKILL-20260414-161734.md`

**재검증 결과**: 링크 수정 직접 완료. 추가 validator 호출 불필요.

---

## 2026-04-14 17:15

### AGENTS.md · README.md (blog-banner 반영)

**변경**: 이전 세션에서 추가한 `blog-banner` 스킬을 프로젝트 문서에 반영.

- `AGENTS.md`: 빠른 참조 표에 `/blog-banner` 행 추가, 스킬 개수 8 → 9, 호출 관계 다이어그램에 blog-banner 독립 실행 블록 추가.
- `README.md`: 스킬 개수 8 → 9, 핵심 원칙 목록에 "배너 자동화" 항목 추가.

**수정 유형**: 문서 업데이트 (스코프 외 파일 수정, 일회성 예외)

**영향 범위**:

- 스킬 동작 영향 없음 (문서만 수정)
- 기존 글 영향 없음 → 재검증 불필요

**백업**:

- `.backups/AGENTS-20260414-151537.md`
- `.backups/README-20260414-151537.md`

**참고**: blog-rule-editor의 "관리 대상"에는 프로젝트 루트 문서가 포함돼 있지 않으나, 사용자 승인 후 일회성 예외로 처리. 장기적으로 관리 대상 확장 검토가 필요함.

---

## 2026-04-14 16:30

### blog-banner (신규 skill)

**변경**: 포스트 자동 배너 모티프를 추천하고, 부적합 시 새 모티프 SVG를 자동 생성하는 skill 추가. `lib/banner/spec.ts` 매핑/팔레트와 `public/banners/motifs/` SVG 라이브러리를 관리하며, frontmatter `banner` 필드로 수동 override도 지원.

**역할 경계**:

- blog-write 파이프라인에는 자동 연결하지 않음 (독립 실행만: `/blog-banner <파일>`)
- MDX 본문 수정 금지, frontmatter의 `banner` 한 줄 추가만 허용
- 한 실행에 새 모티프 1개 생성 제한

**수정 유형**: 신규 skill 파일 생성

**파일**: `.claude/skills/blog-banner/SKILL.md`

**영향 범위**:

- 기존 blog-\* skill: 없음 (독립 실행)
- 프로젝트 코드: skill 실행 시 `lib/banner/spec.ts`, `public/banners/motifs/*.svg`, `velite.config.ts`, MDX frontmatter 편집 가능

---

## 2026-04-14 14:57

### SHARED.md §RULE-EXTERNAL-MENTION (신규 섹션)

**변경**: 본문에서 공식 라이브러리·도구·공식 문서를 처음 언급할 때 해당 공식 사이트로 인라인 마크다운 링크를 달도록 하는 규칙 추가. §RULE-LINK-PATH 뒤, §RULE-REFERENCES 앞에 배치.

**함께 수정한 파일**:

- `blog-writer/SKILL.md` — 참조 섹션 목록에 §RULE-EXTERNAL-MENTION 등록

**이유**: compound-pattern-rsc 시리즈 작성 시 Chakra UI v3, Radix, Base UI, Ark UI, seed-design, shadcn/ui 같은 라이브러리 이름에 링크가 빠져 있어 사용자가 후속 요청으로 보강함. 앞으로 같은 누락이 재발하지 않도록 규칙화. References(자료 출처)와의 차이도 명시.

**수정 유형**: 신규 섹션 추가 + 참조 목록 등록

**영향 범위**:

- blog-writer: 참조 목록에 추가됨 (작성 단계에서 내재화)
- blog-validator: 자동 검증 대상 아님 (의미 판단 필요) → 수정 없음
- 기존 글: 라이브러리/도구 첫 언급에 링크 누락이 있을 수 있으나, 일괄 재검증 대상 아님 (앞으로 작성하는 글부터 적용)

**백업**: `.backups/SHARED-20260414-145756.md`, `.backups/blog-writer-SKILL-20260414-145756.md`

---

## 2026-04-14 00:47

### SHARED.md §MDX-ANIMATEDSTEP (신규 섹션)

**변경**: AnimatedStep title 번호 금지 규칙을 JSX 주석 한 줄에서 독립 소절(§MDX-ANIMATEDSTEP)로 승격. 금지 패턴, 검출 전략, 자동 수정 방법 명시.

**함께 수정한 파일**:

- `blog-writer/SKILL.md` — Step 4 미니체크에 5번째 항목(AnimatedStep title 번호) 추가, Read 목록에 §MDX-ANIMATEDSTEP 추가
- `blog-validator/SKILL.md` — Phase 2에 2-5 검출 단계(AnimatedStep title 번호) 추가, Read 목록에 §MDX-ANIMATEDSTEP 추가

**이유**: 기존 규칙이 코드블록 안 JSX 주석 한 줄이라 writer/validator가 인식하지 못하고 반복 위반 발생. §RULE 수준 소절로 올려서 검출-자동수정 파이프라인에 편입.

**수정 유형**: 규칙 강화 (새 소절 추가 + 검증 파이프라인 연결)

**영향 범위**:

- blog-writer: Step 4 미니체크 참조 (즉시 방어)
- blog-validator: Phase 2 검출 (사후 확정 에러 자동 수정)
- 기존 글: 3건 위반 발견 (npm-vs-npx, white-space-property-mastery, team-design-system-guide)

**백업**:

- `.backups/SHARED-20260414-004751.md`
- `.backups/blog-writer-SKILL-20260414-004751.md`
- `.backups/blog-validator-SKILL-20260414-004751.md`

---

## 2026-04-15 17:14

### SHARED.md §META-TITLE, §META-DESCRIPTION + blog-draft-review D3

**변경**: 제목/설명에서 약어/전문용어 전면 배치 판단 기준 추가. blog-draft-review D3 체크리스트에 해당 항목 연결.

**이유**: 사용자 피드백에서 "LCP와 CLS가 나빠지는 두 범인" 같은 제목이 대중 독자에게 어렵게 느껴진다는 지적. 동시에 RSC, SSR처럼 대상 독자가 통상 아는 약어는 허용되어야 한다는 방향성. 따라서 "일괄 금지"가 아니라 "대상 독자 기준 판단"으로 규칙을 정리.

**수정 유형**: 기존 규칙에 판단 기준 불릿 추가 + draft-review 체크리스트 항목 추가

**핵심 원칙**:

- 기본: 현상·결과·체감을 한국어로 풀어 제시
- 허용 1: 글의 핵심 기술 식별자 (`Object.assign`, `useMemo` 등)
- 허용 2: 대상 독자가 통상 아는 약어 (대중: `npm`/`CSS`, 생태계: `RSC`/`SSR`)
- 풀어 쓰기 권장: 성능 지표 약어 (`LCP`/`CLS`/`TTI`) — 대중 독자 기준. 지표 정의 글은 예외
- 판단 기준: 대상 독자가 제목만 보고 주제를 감 잡을 수 있는가

**영향 범위**:

- blog-writer: §META-TITLE/DESCRIPTION 참조 (자동 반영)
- blog-write: 제목 후보 재생성 로직 (자동 반영)
- blog-draft-review: D3 체크리스트에 직접 명시 추가
- 기존 글: `content/posts/compound-pattern-rsc/compound-pattern-module-graph.mdx` L2 "Object.assign compound가 RSC에서 안 보이는 이유" — 핵심 식별자(Object.assign compound) 전면 + RSC는 맥락 보조 + 생태계 약어 허용 조항 — 통과

**백업**:

- `.backups/SHARED-20260415-171402.md`
- `.backups/blog-draft-review-SKILL-20260415-171402.md`

**재검증**: 규칙 강화 방향이지만 기존 글 영향 없음 (허용 조항 충분). 재검증 생략.

---
