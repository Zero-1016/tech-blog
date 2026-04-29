# Blog Skills Family — Changelog

이 파일은 blog-rule-editor 가 자동으로 관리합니다. 직접 편집 가능하지만,
형식을 유지하세요.

---

## 2026-04-25 23:21

### blog-write GATE 1 피드백 자동 로그 (`content/tmp/draft-feedback.md`)

**변경**: GATE 1 응답 (C/D/E) 직후 사용자 자유 텍스트 + 기획안 메타를
`content/tmp/draft-feedback.md` 에 append 하는 메커니즘 추가. Phase 0 시작 시
누적 로그를 읽어 `complexity` 태그 3건 이상이면 알림.

- `blog-write/SKILL.md`:
  - Phase 0: 누적 GATE 1 피드백 로그 확인 블록 추가 (`FEEDBACK_COUNT`,
    `COMPLEXITY_COUNT` 집계 → 임계치 알림)
  - 새 Step GATE-1-LOG 추가 (Phase 3 GATE 1 응답 처리 직후, C/D/E 모두 기록)
  - GATE 1 응답 분기 (C/D/E) 에 "**자동 로그 기록**: Step GATE-1-LOG" 표기
  - 제약 섹션: `writer-failures.md` 와 `draft-feedback.md` append 원칙 명시
- `AGENTS.md`: 빠른 참조 표에 "GATE 1 피드백 로그 확인 |
  `cat content/tmp/draft-feedback.md`" 한 줄 추가

**이유**: 사용자가 GATE 1 에서 "기획안이 복잡하다" 류 피드백을 반복하는 패턴을
감지해 `blog-rule-editor` 가 D2 (복잡도 판단) 또는 Phase 3 가이드 개선으로
라우팅할 수 있도록 데이터 축적. `writer-failures.md` 와 동일한 학습 루프 구조.

**기록 원칙**: 분류·해석 안 함, 자유 텍스트 원문 그대로 저장, 키워드 태깅은
검색 보조용 (자동 분류 X), A/B 응답은 기록 안 함, E (취소) 는 사유 패턴 분석을
위해 기록.

**수정 유형**: 기능 추가 (학습 루프, 사용자 인지 부담 변화 없음)

**영향 범위**:

- 사용자: 변경 없음 (백그라운드 로그)
- writer / 리뷰어 / revise: 변경 없음
- `content/tmp/` gitignored 유지

**후속**: 누적된 후 `/blog-rule-editor draft-feedback 분석해줘` 시나리오 추가
검토 가능.

---

## 2026-04-25 14:12

### SHARED.md §RULE-LINK-PATH 검출 전략 · blog-validator 4-3-a 접두사 필터

**변경**: negative lookahead `(?!...)` 패턴을 pipe 조합으로 교체

**이유**: `grep -E` (ERE)는 `(?!...)` (PCRE 전용)를 지원하지 않아 1번 패턴(접두사
위반 검출)이 실제로 동작하지 않는 버그. 표준 ERE pipe 조합으로 교체해 macOS/Linux
어디서나 동작하도록 수정.

**수정 파일**:

- `SHARED.md` L507: 패턴 설명을 pipe 조합 방식으로 변경
- `blog-validator/SKILL.md` L588: `grep -nE ... | grep -vE ...` pipe 조합으로 교체

**수정 유형**: 버그 수정 (검출 로직)

**영향 범위**:

- blog-writer: §RULE-LINK-PATH 참조만, grep 패턴 직접 미사용 (수정 불필요)
- 기존 글 영향: 없음 (검출 로직 수정, 규칙 자체 변경 아님)

**백업**: `.backups/SHARED-20260425-141212.md`, `.backups/blog-validator-SKILL-20260425-141212.md`

---

## 2026-04-25 13:30

### blog-write Phase 4.5 (신규 GATE 2) · blog-writer 입력 계약 · blog-draft-review D3 가제 모드

**변경**: 제목·설명을 본문 작성 후로 이동. 사용자가 GATE 1 에서 본문 없는 상태로 제목 후보를 판단해야 하는 부담 제거.

새 흐름:

```
Phase 3 (기획안)
  Step 3-2 (변경): "가제(working title) 1개" 만 (품질 바 낮춤)
  Step 3-7 (변경): 기획안 포맷의 "제목 후보 1/2/3" → "가제" + 안내문
Phase 3.5 (draft-review): D3 가제 모드 (표면 금지만 체크)
GATE 1: 기획안 + 가제 검토 (가벼움)
Phase 4 (writer): 가제로 frontmatter 작성, 본문 작성
Phase 4.5 (NEW): 제목/설명 확정 (GATE 2)
  Step 4.5-1: 본문 통독
  Step 4.5-2: 제목 후보 3개 자동 생성 (§META-TITLE 적용)
  Step 4.5-3: 설명 후보 3개 자동 생성 (§META-DESCRIPTION 적용)
  Step 4.5-4: AskUserQuestion (제목 선택)
  Step 4.5-5: AskUserQuestion (설명 선택)
  Step 4.5-6: frontmatter Edit
  Step 4.5-7: slug 변경 검토 (선택, 기본 유지)
Phase 5+ (validator/review): 그대로
```

- `blog-write/SKILL.md`:
  - Step 3-2: "후보 2~3개" → "가제 1개" 로 단순화
  - Step 3-7 기획안 포맷: "## 제목 후보 1/2/3" → "## 가제 (working title)" + 안내문
  - 새 Phase 4.5 추가 (Phase 4 성공 후 Phase 5 진입 전)
  - Phase 4 성공 시 진입점 변경: "Phase 5 진입" → "Phase 4.5 진입"
  - 시리즈 모드: 시리즈 제목은 가제 그대로 유지, 편 제목만 본문 기반 갱신
- `blog-writer/SKILL.md` Step 1:
  - 오케스트레이터 경유 시 입력 `title` 이 가제일 수 있음 명시
  - 가제 모드에서는 표면 금지 (콜론·em-dash·`**`) 만 지키고, §META-TITLE 의 호기심·군더더기 등 품질은 Phase 4.5 책임
  - 단독 실행 시는 기존대로 §META-TITLE 전체 기준 적용
- `blog-draft-review/SKILL.md` D3:
  - 제목/설명 품질 검사를 가제 모드로 변경
  - 검사: 가제 존재 + 표면 금지 (콜론·em-dash·`**`) + 임시 설명 존재 (가벼움)
  - 호기심 유발·군더더기·약어 풀어쓰기 등은 Phase 4.5 위임

**이유**: 사용자 페인 포인트 — "주제, 설명에 대해서 내가 다시 수정하는 경우가 많은데" / "글이랑 설명에 대한게 어렵게 보여서 수정하는 경우가 많았자나". 본문 없이 제목·설명을 결정하는 게 어려워서 GATE 1 에서 자주 수정. 본문이 있어야 호기심 유발 포인트 / 막히는 지점이 명확해지므로, 본문 작성 후 본문 기반으로 후보 생성하는 게 자연스러움.

**수정 유형**: blog-write 파이프라인 구조 변경 (큰 변경 — 새 Phase + 새 GATE)

**영향 범위**:

- 사용자 인지 부담: 1회 무거운 GATE 1 → 2회 가벼운 GATE (가제 + 제목/설명 선택)
- writer: 가제 모드 입력 받아도 정상 동작 (frontmatter 표면 금지만 지키면 됨)
- draft-review: D3 가벼워짐 (Phase 4.5 가 무거운 검사 담당)
- validator: 변경 없음 (Phase 4.5 후에 호출되니 최종 제목 검사 그대로)
- expression-review/coherence-review: 변경 없음
- blog-revise: 변경 없음 (Phase 4 wrapper 형태로만 blog-write 호출)
- 기존 글: 영향 없음 (이미 작성된 글의 제목·설명 그대로)

**slug 처리**: 기본은 가제 기반 slug 유지. 가제와 최종 제목이 크게 달라진 경우만 사용자에게 확인 (Step 4.5-7). 묻지 않고 넘어가는 게 디폴트 (한 번 더 물으면 짜증 — Rail 5 회피 원칙).

**시리즈 처리**: 시리즈 제목 (`series` 필드) 은 Phase 3 가제 그대로 유지 (시리즈 통일성 우선). 편 제목 (`title`) 만 각 편 본문 기반으로 후보 3개 → GATE 2 진행.

**백업**: `.backups/blog-write-SKILL-20260425-125901.md` (요청 1 백업과 동일 — 추가 백업 생략, 같은 세션 내 변경)

**재검증 결과**: 새 글 작성 시 통합 테스트 필요 — 사용자가 다음 `/blog-write` 호출 시 새 흐름 검증 권장.

---

## 2026-04-25 13:13

### SHARED.md 신규 §META-FEEDBACK-HANDOFF · blog-validator · blog-expression-review · blog-coherence-review · AGENTS.md

**변경**: validator / expression-review / coherence-review 가 메인 작업 종료 후 사용자 메시지에서 **메타 피드백** (규칙·스킬 자체에 대한 변경 요청) 을 자동 감지해 `blog-rule-editor` 로 라우팅하는 핸드오프 메커니즘 추가.

- `SHARED.md`: 신규 섹션 §META-FEEDBACK-HANDOFF 추가 (감지 패턴, 핸드오프 흐름, 적용 범위, 안전 장치 정의)
- `blog-validator/SKILL.md`: 새 Phase 5 추가 (검증 후 메타 피드백 핸드오프, dry_run 무관)
- `blog-expression-review/SKILL.md`: 새 Phase X 추가 (제약 섹션 직전)
- `blog-coherence-review/SKILL.md`: 새 Phase X 추가 (제약 섹션 직전)
- `AGENTS.md`: 참조 관계 표 업데이트 (3개 reviewer 의 §META-FEEDBACK-HANDOFF 참조 추가)

핸드오프 흐름:

```
스킬 메인 작업 종료
  → 실행 중 사용자 메시지 스캔 (감지 패턴 기준)
  → 발견 시 한 문장씩 요약
  → AskUserQuestion: "blog-rule-editor 로 넘길까요?"
  → 승인 시 Skill(skill="blog-rule-editor", args="[META-FEEDBACK from <스킬>] ...")
  → blog-rule-editor 가 자체 Rails 로 처리
발견 없으면 조용히 skip
```

**이유**: 사용자 요청 — "각 스킬 실행이 끝났을 때, 메타 작업 (스킬·규칙 자체 변경) 의견을 자동으로 적용". 기존엔 매번 `/blog-rule-editor` 수동 호출 필요. 자동 라우팅으로 마찰 제거. 단, blog-rule-editor 의 Rail 1 (사용자 승인 없는 수정 금지) 은 보존 — "자동" 의 범위는 라우팅까지만.

**수정 유형**: 신규 SHARED.md 섹션 추가 + 3개 SKILL.md final step 추가 + AGENTS.md 표 업데이트

**영향 범위**:

- 패턴 감지 false positive 가능 → AskUserQuestion 1회 확인으로 완화
- 메타 피드백 없는 일반 실행 시 동작 변경 없음 (조용히 skip)
- blog-research / blog-writer / blog-rule-editor 자체에는 미적용 (의도적)
- blog-revise 는 향후 확장 가능 (현재는 미적용)

**백업**: `.backups/SHARED-20260425-131252.md`, `.backups/blog-validator-SKILL-20260425-131252.md`, `.backups/blog-expression-review-SKILL-20260425-131252-r2.md`, `.backups/blog-coherence-review-SKILL-20260425-131252-r2.md`, `.backups/AGENTS-20260425-131252.md`

**재검증 결과**: 기존 글 영향 없음. validator/reviewer 의 메인 동작 변경 없음 (Phase 추가만).

---

## 2026-04-25 12:59

### blog-write · blog-revise · blog-coherence-review · blog-expression-review SKILL.md

**변경**: AskUserQuestion 코드 블록 (`questions=[{...}]` JSON wrapper) 을 한 줄 헤더 + bullet 형식으로 압축. boilerplate 도입문 ("그 다음 **반드시 `AskUserQuestion` 툴 호출** (§UI-USER-CHOICE 준수):") 과 SHARED.md 와 중복되는 "**절대 금지**: 번호 리스트..." 경고문 제거.

- `blog-write/SKILL.md`: 13개 코드블록 변환 + 4개 boilerplate 제거
- `blog-revise/SKILL.md`: 8개 코드블록 변환 + 3개 boilerplate 제거
- `blog-coherence-review/SKILL.md`: 2개 코드블록 변환
- `blog-expression-review/SKILL.md`: 1개 코드블록 변환
- `blog-banner/SKILL.md`: 변경 없음 (이미 압축 형식)

변환 패턴:

```
# 변경 전
AskUserQuestion(
  questions=[{
    "question": "...",
    "options": ["A", "B", "C"]
  }]
)

# 변경 후
AskUserQuestion("..."):
- A
- B
- C
```

**이유**: SKILL.md 파일들이 너무 길어져서 SSOT 원칙 (SHARED.md §UI-USER-CHOICE 가 단일 정의처) 위반 없이 길이 절감 필요. 옵션 wording 은 100% 보존, JSON wrapper + 중복 경고문만 제거.

**수정 유형**: 4개 SKILL.md 일괄 boilerplate 압축 (옵션 B — 적극적 압축)

**영향 범위**:

- SHARED.md 자체는 변경 없음 (SSOT 보존)
- §UI-USER-CHOICE 의 의미 변경 없음 (writer 가 여전히 AskUserQuestion 호출하도록 SHARED.md 가 강제)
- 옵션 wording 100% 보존 → writer 출력 결과 동일
- blog-rule-editor/SKILL.md 는 Rail 5 (자기 자신 수정 금지) 로 별도 처리 필요 (8개 코드블록 잔존)

**Line count 변화**:

| 파일                   | 변경 전  | 변경 후  | 절감     |
| ---------------------- | -------- | -------- | -------- |
| blog-write             | 1323     | 1235     | -88      |
| blog-revise            | 885      | 831      | -54      |
| blog-coherence-review  | 604      | 592      | -12      |
| blog-expression-review | 664      | 658      | -6       |
| **합계**               | **3476** | **3316** | **-160** |

**백업**: `.backups/blog-{write,revise,coherence-review,expression-review,banner}-SKILL-20260425-125901.md`

**재검증 결과**: 기존 글 영향 없음 (SKILL.md 만 수정, content/posts/\* 변경 없음). validator/writer 동작 변경 없음.

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

## 2026-04-29 17:21

### blog-research/SKILL.md — Step 6 (URL 도달성 최종 확인) 추가

**변경**: Step 5 (종료 조건) 와 핵심 포인트 추출 규칙 사이에 새 Step 6 추가.
출력 형식의 "## 요약" 에 도달성 검증 통계 한 줄, "## 수집 메모" 에 특이 케이스
가이드 한 줄 추가.

**이유**: zustand-jotai-top-down-bottom-up 글 작성 중 References href 두 개가
404 URL 로 저장된 사고. 도메인 (zustand.docs.pmnd.rs) 은 §DOMAIN-PRIORITY-1
화이트리스트에 있어서 validator Phase 4-1 통과. 그러나 경로 (`/learn/` prefix
누락) 는 잘못됨. context7 의 zustand_pmnd_rs 페이지 일부 redirect 루프로
sub-agent 가 본문을 받지 못한 채 메타에서 추정한 URL 이 그대로 결과에 포함됐음.

**수정 유형**: 새 Step 추가 (검증 강화) + 출력 형식 보강

**핵심 변경 의도**:
- context7 응답에서만 추출된 URL, 본문을 직접 받지 못한 URL 은 반환 직전 한 번 더
  WebFetch 로 200 OK 확인 의무화
- 4xx/5xx/redirect 루프 시 WebSearch 로 재탐색 1회 시도, 못 찾으면 결과에서 제외
- Step 1~4 에서 본문을 직접 받은 URL 은 자동 통과 (중복 호출 방지)
- WebFetch 한도 (6회) 소진 시 도달성 미확인 URL 은 1순위로 포함 안 함
- 출력 메모에 "통과 P / 교체 Q / 제외 R / 미확인 S" 통계 명시

**영향 범위**:
- blog-write (오케스트레이터): blog-research 결과의 출력 형식만 사용하므로 별도
  수정 불필요. 도달성 미확인 URL 처리 정책은 현재 변경에서 "1순위 포함 안 함" 으로
  명시했으므로 오케스트레이터가 추가 처리 불필요
- blog-validator: 변경 없음 (의도 2 는 보류)
- SHARED.md: 변경 없음 (의도 3 은 보류)
- 기존 글: 영향 없음 (앞으로 작성될 글에만 적용)

**보류된 의도**:
- 의도 2 (blog-validator Phase 4-1 도달성 검사 추가) — 사용자 선택으로 이번 라운드
  제외. 의도 1 만으로 충분히 막힌다는 판단. 추후 필요 시 별도 라운드.
- 의도 3 (SHARED.md §RULE-REFERENCES 한 줄 명문화) — 의도 1 에서 검증 로직이
  실효 강제하므로 명문화는 보류. 추후 필요 시 별도 라운드.

**백업**: `.backups/blog-research-SKILL-20260429-172105.md` (500 라인)

**수정 후**: 531 라인 (31 라인 증가)

**재검증**: 다음 글 작성 시 자연스럽게 검증됨. 기존 글 영향 없음이라 별도 재검증 불필요.

**근거 메시지**: 사용자 원문 (zustand-jotai 글 작성 직후)
> "참조문서 잘못되었는데, 해당 부분 확인해줘, 레퍼런스 글 잘못되어있어.
>  https://zustand.docs.pmnd.rs/guides/flux-inspired-practice
>  https://zustand.docs.pmnd.rs/getting-started/comparison
>  여기 링크 없어, 기존 스킬이 문제일까"

---
