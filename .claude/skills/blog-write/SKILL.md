---
name: blog-write
description: |
  블로그 글 작성 전체 파이프라인을 조율한다. 주제와 참고 URL을 받아
  자료 수집(blog-research) → 기획안 작성 → 사용자 승인 게이트 → 본문 작성(blog-writer)
  → 정합성 검증(blog-validator) 순서로 실행한다. 각 단계는 별도 skill 파일을
  Read로 주입해 처리하며, 오케스트레이터 컨텍스트는 구조화된 결과만 주고받는다.

  v0.1: 자료 수집 + 기획 + 집필 + 검증 (최소 파이프라인)
  v0.2 (TODO): draft-review, expression-review, coherence-review 추가

  사용 트리거: "블로그 글 써줘", "이 주제로 포스트 만들어줘", "/blog-write",
  또는 주제 + URL 붙여넣기.

argument-hint: <주제> [참고 URL ...]
tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - Agent
  - WebFetch
---

# blog-write

블로그 글 작성 전체 파이프라인. 하위 skill 파일들을 Read로 주입하면서 Phase를
순차 실행합니다. 사용자 승인 게이트는 **기획안 단계 한 번만**.

**이 skill은 SHARED.md 대부분을 전제**합니다. 시작 시 다음 섹션을 로드하세요:

- `§SOURCE-PRIORITY` — 출처 우선순위
- `§META-TITLE`, `§META-DESCRIPTION` — 제목/설명 품질 기준
- `§COMPLEXITY` — 복잡도/분량 판단
- `§FILE-LAYOUT` — 저장 경로
- `§UI-USER-CHOICE` — 사용자 선택지 제시 규칙 (모든 Gate/에스컬레이션에서 필수)

나머지 규칙(em-dash, `**`, 어조 등)은 writer/validator가 담당하므로 오케스트레이터
레벨에서는 로드할 필요 없어요.

---

## 입력 파싱

### 인자 받기

```
$ARGUMENTS 파싱:
- 공백으로 분리된 토큰
- http:// 또는 https:// 로 시작하는 것 → 참고 URL
- 나머지 전부 → 주제 (공백 포함 가능)
```

**예시**:

- `/blog-write CSS word-break 한국어 줄바꿈 https://developer.mozilla.org/en-US/docs/Web/CSS/word-break`
  - 주제: "CSS word-break 한국어 줄바꿈"
  - URL: `["https://developer.mozilla.org/en-US/docs/Web/CSS/word-break"]`

- `/blog-write React Suspense 동작 원리`
  - 주제: "React Suspense 동작 원리"
  - URL: 없음

- 주제 없이 URL만 주면: "주제를 알려주세요" 로 거부

### 환경 준비

오늘 날짜 확인:

```bash
TODAY=$(date +%Y-%m-%d)
```

`content/tmp/` 디렉토리 준비:

```bash
mkdir -p content/tmp
[ ! -f content/tmp/.gitkeep ] && touch content/tmp/.gitkeep

# .gitignore 확인 및 추가
if ! grep -q "^content/tmp/\*" .gitignore 2>/dev/null; then
  cat >> .gitignore <<'EOF'

# blog-write 로컬 로그
content/tmp/*
!content/tmp/.gitkeep
EOF
fi
```

누적 실패 로그 확인:

```bash
if [ -f content/tmp/writer-failures.md ]; then
  FAILURE_COUNT=$(grep -c '^## ' content/tmp/writer-failures.md)
  echo "누적 writer 실패: ${FAILURE_COUNT}건"
else
  FAILURE_COUNT=0
fi
```

`FAILURE_COUNT` 가 3 이상이면 Phase 0 끝에 알림:

```
⚠️ writer 실패 누적 ${FAILURE_COUNT}건
content/tmp/writer-failures.md 를 확인해보세요. 패턴이 반복된다면
Layer 2 (스킬/규칙 수정) 로 올리는 걸 추천해요. /blog-rule-editor 로 처리 가능.

일단 이번 글은 정상 진행할게요.
```

---

## Phase 1: 내부 링크 후보 스캔

주제와 관련된 기존 글을 찾습니다. 오케스트레이터가 직접 처리.

### Step 1-1: 키워드 기반 필터

주제에서 핵심 명사 추출 (예: "CSS word-break 한국어 줄바꿈" → `["word-break", "한국어", "줄바꿈"]`).

각 키워드로 `content/posts/` 훑기:

```bash
# 각 키워드로 grep
for keyword in $KEYWORDS; do
  grep -l -r --include="*.mdx" "$keyword" content/posts/ 2>/dev/null
done | sort -u
```

### Step 1-2: 후보 필터

매칭된 파일들 중 3~5개로 추림:

- 여러 키워드가 매칭된 파일 우선
- 최근 작성된 것 우선 (`date` frontmatter 기준)
- 완전히 같은 주제를 다룬 글은 제외 (중복 주제 경고)

**같은 주제 감지**: 매칭된 파일의 title이 주제와 거의 동일하면 사용자에게 알림.

**같은 주제 감지**: 매칭된 파일의 title 이 주제와 거의 동일하면 사용자에게 알림.

먼저 상황을 텍스트로 설명:

```
⚠️ 이 주제로 이미 작성된 글이 있어요:
  - content/posts/css-word-break.mdx (2025-03-15, "한국어 줄바꿈의 함정")
```

그 다음 **반드시 `AskUserQuestion` 툴 호출** (§UI-USER-CHOICE 준수):

```
AskUserQuestion(
  questions=[{
    "question": "이미 비슷한 주제의 글이 있어요. 어떻게 할까요?",
    "options": [
      "계속 진행 — 다른 각도로 접근",
      "취소 — 기존 글과 중복 방지",
      "기존 글 수정 권장 — 내가 직접 편집"
    ]
  }]
)
```

### Step 1-3: 후보 구조 확인

각 후보에 대해:

```bash
head -20 content/posts/<slug>.mdx  # frontmatter + 오프닝만
```

frontmatter와 첫 단락만 읽고 "어떤 맥락에서 연결할지" 메모 작성.

**결과 형식**:

```markdown
내부 링크 후보:

1. /posts/css-stacking-context
   - 제목: "쌓임 맥락이 만들어지는 순간"
   - 날짜: 2025-02-20
   - 연결 맥락: 이 글의 "선행 개념" 으로 연결. 본문 초반 배경 설명 자리.

2. /posts/flexbox-gap-history
   - 제목: "flex의 gap이 늦게 온 이유"
   - 날짜: 2025-01-12
   - 연결 맥락: 이 글의 "한 걸음 더" 섹션. 관련 주제로 유도.

3. 후보 없음 (기존 글 없음)
```

후보가 0개면 "내부 링크 없음" 으로 기록하고 Phase 2로 진행. 억지 연결 금지.

---

## Phase 2: 자료 수집 (blog-research 호출)

### Agent 툴로 blog-research sub-agent 호출

오케스트레이터 컨텍스트에 자료 원문이 쌓이지 않도록 **별도 컨텍스트** 에서 실행.

호출 프롬프트:

```
.claude/skills/blog-research/SKILL.md 의 지침을 따라
아래 주제에 대한 자료를 수집해줘.

topic: <주제 문자열>
user_urls: <URL 배열 또는 빈 배열>
depth: basic
via: orchestrator

결과는 SKILL.md 의 "출력 형식" 섹션에 정의된 구조화된 마크다운으로 반환해줘.
원문 복사 금지. 요약만.
```

**중요**: Agent 툴로 sub-agent 세션을 만들고, 해당 세션에서 blog-research SKILL.md 를 Read로 읽고 그 지침대로 수집/반환하게 해요. 오케스트레이터는 반환된 요약만 받아요.

### 결과 처리

반환된 결과 분기:

**성공 (1순위 1개 이상)**:

- 결과 파싱해서 다음 Phase에서 사용할 구조로 정리
- `sources_summary` 변수에 저장 (Phase 3, 4 에서 사용)

**거부 (1순위 0개)**:

**거부 (1순위 0개)**:

먼저 상황을 텍스트로 설명:

```
⚠️ 자료 수집 실패

1순위 공식 출처를 찾지 못했어요. blog-research 가 거부했어요.

거부 사유:
<blog-research 반환 메시지 그대로>
```

그 다음 **반드시 `AskUserQuestion` 툴 호출** (§UI-USER-CHOICE 준수):

```
AskUserQuestion(
  questions=[{
    "question": "자료 수집이 실패했어요. 어떻게 할까요?",
    "options": [
      "주제를 더 구체적으로 수정해서 재시도",
      "1순위 출처 URL 을 직접 제공 (이후 프롬프트로 URL 전달)",
      "이 주제 취소"
    ]
  }]
)
```

**한도 초과**:

blog-research 가 WebFetch 6회 / context7 3회 한도 넘긴 경우. 상황 설명 후
**`AskUserQuestion` 툴 호출**:

```
AskUserQuestion(
  questions=[{
    "question": "자료가 너무 분산되어 있어서 수집 한도에 걸렸어요. 어떻게 할까요?",
    "options": [
      "주제를 하위 주제로 분할해서 재시도",
      "주제 범위를 좁혀서 재시도",
      "핵심 URL 을 직접 제공",
      "취소"
    ]
  }]
)
```

**부분 성공 (1순위 있지만 depth 미달)**:

- 예: basic depth 기준 3개 필요한데 2개만 수집
- 경고하고 진행 가능:

```
  ⚠️ 자료 수집 부분 성공
  1순위 2개 (basic depth 기준 3개 권장)

  진행할게요. 기획 시 범위를 약간 좁게 잡을게요.
```

---

## Phase 3: 기획안 초안 작성

오케스트레이터가 직접 처리. draft-review 가 나오기 전까지는 여기서 담당.

**<!-- TODO v0.2: draft-review skill 이 생기면 이 Phase 끝에 Read 로 호출 -->**

### Step 3-1: 복잡도 판단

`§COMPLEXITY` 참조하면서:

- **단편**: 하나의 개념/문제/패턴. 1500~3000자에 담길 크기.
- **시리즈 (2~5편)**: 여러 하위 개념이 순차 심화. 3000자 크게 초과 예상.

판단 기준:

1. 수집된 자료의 핵심 포인트 개수
2. 자료가 다루는 주제의 층위
3. 사용자 주제 자체의 스케일

**단순화 원칙**: 애매하면 단편. 시리즈는 명확히 여러 편이 필요할 때만.

### Step 3-2: 제목과 설명

`§META-TITLE`, `§META-DESCRIPTION` 기준 적용:

- **제목**: 한국어 20자 이내, 호기심 유발, 군더더기 제거, 콜론 구조 금지
- **설명**: 50자 내외, 존댓말, 독자가 막히는 지점 구체적

**후보 2~3개** 생성해서 기획안에 포함. 사용자가 GATE 1 에서 선택 가능.

### Step 3-3: 섹션 구조

H2 3~6개 정도. 각 섹션에:

- 섹션 제목
- 핵심 메시지 한 줄
- 이 섹션을 뒷받침할 자료 (Phase 2 에서 수집한 것 중 어느 출처의 어느 포인트)

**섹션 구조 원칙**:

- 오프닝: 독자가 마주하는 실제 문제에서 시작
- 중간: 핵심 개념 → 실전 적용 → 엣지 케이스
- 마무리: 단편이면 요약, 시리즈 중간이면 다음 편 예고, 시리즈 마지막이면 회고

### Step 3-4: 자료-섹션 매핑

Phase 2 결과의 각 출처가 어느 섹션에서 쓰일지 명시:

```markdown
자료 매핑:

- MDN word-break (1순위):
  → 섹션 1 "왜 한국어 줄바꿈이 깨지나"
  → 섹션 3 "브라우저 지원 범위"

- W3C CSS Text (1순위):
  → 섹션 2 "줄바꿈 알고리즘"

- 사용자 제공 Chrome 이슈 (4순위):
  → 섹션 3 "실전 함정" 보조 참조만
```

### Step 3-5: 내부 링크 배치

Phase 1 에서 찾은 후보를 기획안의 어느 섹션에 넣을지 제안:

```markdown
내부 링크 배치:

- /posts/css-stacking-context (선행 개념)
  → 섹션 1 "왜 한국어 줄바꿈이 깨지나" 도입부

- /posts/flexbox-gap-history (관련 주제)
  → 마무리 "한 걸음 더" 링크
```

### Step 3-6: 기획안 완성

모든 요소를 종합해서 기획안 마크다운 생성. 구조는 원본 오케스트레이터의 포맷 따라:

**단편 기획안**:

```markdown
📋 기획안: <제목 후보 1>

slug: <kebab-case>
예상 분량: 2000자 (약 4분 읽기)

## 제목 후보

1. <후보 1> (추천)
2. <후보 2>
3. <후보 3>

## 설명 (50자)

<설명 문장>

## 핵심 메시지 (한 줄)

<글의 핵심 주장>

## 섹션 구조

### 1. <섹션 제목>

- 역할: <섹션이 하는 일>
- 뒷받침 자료: <매핑된 출처>

### 2. <섹션 제목>

- ...

## 자료 요약 (Phase 2 결과)

- 1순위: N개
- 2순위: M개
- 4순위: K개 (보조)

## 내부 링크 후보

<Phase 1 에서 찾은 후보>
```

**시리즈 기획안**: 시리즈 제목 + 편별 정보 + 편 간 흐름 설명.

---

## Phase 3.5: draft-review 호출 (.claude/skills/blog-draft-review/SKILL.md 주입)

기획안을 GATE 1 로 보내기 전에 draft-review 가 검토. 자료 부족, 복잡도 오판,
제목 약함 같은 결함을 미리 잡아서 writer 헛수고 방지.

### 호출 조건

Phase 3 가 기획안 작성을 완료한 직후, GATE 1 직전.

### blog-draft-review SKILL.md 로드

```
Read .claude/skills/blog-draft-review/SKILL.md
```

지침 따라 행동. skip list 준수:

- 단독 실행 전용 입력 받기
- 최종 완료 보고

### 입력 전달

```
plan: <Phase 3 에서 작성된 기획안 마크다운 전문>
sources: <Phase 2 blog-research 결과>
internal_link_candidates: <Phase 1 결과>
topic: <원본 주제>
mode: <"single" 또는 "series">
via: "orchestrator"
```

### draft-review 실행

skill 지침의 Step 1~6 을 따름. 결과 카테고리:

- 블로커 (있으면 처리 필수)
- 경고 (사용자 알림)
- 취향 (선택적 개선)
- 자동 수정 액션 (오케스트레이터 처리 가능)
- 사용자 확인 항목 (큰 구조 변경)

### 결과 처리

#### Case A: 블로커 0건, 경고 0건, 취향 0건

기획안 통과. 바로 GATE 1 진입.

#### Case B: 자동 수정 액션만 (블로커 / 경고 일부)

오케스트레이터가 자동 수정 액션을 순차 실행:

**액션 카테고리 1: blog-research 보강 호출**

```
Agent(
  description="blog-research 보강 호출",
  prompt="""
.claude/skills/blog-research/SKILL.md 의 지침을 따라 추가 자료를 수집해줘.

topic: <기존 topic>
user_urls: []
depth: basic
focus: <부족한 섹션 키워드>
via: orchestrator-supplement

기존 자료 외에 보강해서 반환해줘.
"""
)
```

반환된 자료를 Phase 2 결과에 병합, 기획안의 자료 매핑 갱신.

**액션 카테고리 2: 복잡도 전환**

자동 처리 안 함 — 사용자 확인 필요. 항목으로 분류.

**액션 카테고리 3: 제목 후보 추가 생성**

오케스트레이터가 §META-TITLE 기준으로 새 후보 N개 생성. 기획안 갱신.

**액션 카테고리 4: 내부 링크 재검색**

Phase 1 의 내부 링크 스캔 로직을 다시 실행. 후보 갱신.

자동 수정 액션 처리 후, **draft-review 를 한 번 더 호출**해서 결과 확인. 두 번째 호출에서도 블로커 남으면 사용자 확인.

#### Case C: 사용자 확인 필요 항목

draft-review 가 반환한 사용자 확인 항목을 §UI-USER-CHOICE 에 따라 처리.

**복잡도 전환** 같은 큰 결정:

```
AskUserQuestion(
  questions=[{
    "question": "draft-review 가 시리즈 전환을 권장해요. 단편 자료가 많아서 한 글에 담기 어려울 수 있어요. 어떻게 할까요?",
    "options": [
      "시리즈 (2편) 으로 전환 — 기획 재작성",
      "단편 유지하되 자료 일부 정리",
      "주제 축소해서 단편 유지",
      "블로커 무시하고 그대로 진행 (writer 가 알아서)"
    ]
  }]
)
```

선택에 따라 Phase 3 (기획안 작성) 으로 부분 롤백 또는 그대로 GATE 1 진입.

#### Case D: 블로커 + 사용자 확인 필요

블로커가 있고 자동 수정으로 해결 안 되면 GATE 1 진입 금지. 사용자 확인 필수.

```
AskUserQuestion(
  questions=[{
    "question": "draft-review 가 블로커 결함을 발견했어요: <문제 요약>. 어떻게 할까요?",
    "options": [
      "권장 액션 적용 (Phase 2~3 부분 재실행)",
      "기획안을 직접 수정할게요",
      "그래도 진행 (writer 가 처리)",
      "취소"
    ]
  }]
)
```

### draft-review 결과를 사용자에게 보고 (선택)

블로커가 없고 경고만 있을 때, GATE 1 직전에 사용자에게 알림:

```markdown
## draft-review 검토 결과

기획안 검토 완료. 진행 가능한 상태입니다.

### 경고 (참고용)

- D2: 단편치고 자료가 약간 많음. 시리즈 검토 가능.
- D3: 설명을 좀 더 구체적으로 다듬으면 좋음.

### 통과

- D1 자료 충분성
- D4 섹션 구조
- D5 내부 링크

이 상태로 GATE 1 으로 진입할게요.
```

이건 텍스트 출력만, AskUserQuestion 호출 안 함. GATE 1 의 AskUserQuestion 에서 사용자가 종합적으로 판단.

---

## ⚠️ GATE 1: 기획안 승인

**여기서 멈추고 사용자에게 물어봐요**. 이 게이트 전에는 어떤 파일도 저장하지 않아요.

### 제시 형식

먼저 기획안 본문을 텍스트로 제시 (Phase 3 에서 이미 생성한 내용):

```
## 기획안 검토

[Phase 3 기획안 전문]

검토해주세요. 지금까지 어떤 파일도 저장되지 않았어요. 글 작성 중에도 자동 수정이
진행되고, 문제가 생기면 다시 물어볼게요.
```

그 다음 **반드시 `AskUserQuestion` 툴을 호출** (§UI-USER-CHOICE 준수).
마크다운 리스트로 선택지를 나열하면 안 됩니다:

```
AskUserQuestion(
  questions=[{
    "question": "기획안 검토 — 어떻게 진행할까요?",
    "options": [
      "진행 — 이 기획안으로 글 작성 시작",
      "수정 — 어느 부분을 수정할지 알려주세요",
      "주제 재검토 — 자료 수집부터 다시",
      "취소"
    ]
  }]
)
```

**절대 금지**: 번호 리스트 (`1. 진행 ...`) 또는 bullet (`- A) 진행 ...`) 로
선택지를 텍스트 출력하는 것. §UI-USER-CHOICE 위반.

### 응답 처리

- **A (진행)**: 기획안을 `approved_plan` 으로 저장하고 Phase 4 진입
- **B (수정)**: 사용자가 어느 부분 수정할지 알려줌. 해당 부분 수정 후 GATE 1 재제시. 최대 3회.
- **C (재검토)**: Phase 2 (자료 수집) 부터 재시작. `user_urls` 추가 가능.
- **D (취소)**: 종료. `content/tmp/` 에는 아무것도 쓰지 않음.

**B가 3회 반복되면**: "기획안에 근본 문제가 있는 것 같아요. C (주제 재검토) 를 추천해요." 알림.

---

## Phase 4: writer 호출 (blog-writer SKILL.md 주입)

### blog-writer SKILL.md 로드

```
Read .claude/skills/blog-writer/SKILL.md
```

이 파일의 지침을 따라 행동. 단, skip list 에 있는 섹션은 건너뛰기:

- 단독 실행 전용 입력 받기
- 최종 완료 메시지

### 입력 전달

writer 에게 전달할 구조화된 입력 (SKILL.md 의 "입력 계약" 섹션 참조):

```
mode: <"single" 또는 "series">
slug: <영문 kebab-case>
series_name: <시리즈일 때만>
parts: <시리즈일 때 편별 배열>
plan: <approved_plan 전문>
sources: <Phase 2 결과의 구조화된 배열>
internal_links: <Phase 1 후보 + 배치 힌트>
today: <YYYY-MM-DD>
via: "orchestrator"
```

### writer 실행

writer 지침의 Step 1~9 를 그대로 따름. Step 8 자가 체크리스트 통과 후 Step 9 에서 파일 저장.

### 성공

writer 가 저장 완료 보고 시:

```
저장 완료:
  - content/posts/<slug>.mdx
```

경로를 `saved_files` 에 저장하고 Phase 5 진입.

### 실패 → Phase 4-F

writer 가 거부하거나 반복 실패 시 Phase 4-F (실패 분석) 로 이동.

---

## Phase 4-F: writer 실패 분석

writer 가 자가 체크리스트 통과에 반복 실패하거나 입력 거부 시 실행.

### Step 4-F-1: 실패 사유 추출

writer 반환 메시지에서:

- 어떤 Step 에서 실패했는가
- 어떤 규칙이 반복 위반되었는가
- writer 가 쓴 문제 문장들은 무엇인가
- 몇 회 시도했는가

### Step 4-F-2: 휴리스틱 분석

**고정 카탈로그 없이** 로그를 보고 자유롭게 진단하세요. 아래는 관찰 포인트이지
고정 분류가 아닙니다.

**관찰 포인트**:

1. **반복 위반 규칙이 무엇인가?** (em-dash, 병렬 삼단, 과장 형용사, 메타 문장, 어미...)
2. **writer 가 억지로 채우려는 흔적이 보이는가?**
   - 병렬 삼단이 반복된다 → 자료 부족으로 공허한 문장 메우려는 신호
   - 메타 문장이 나온다 → 주제 범위가 너무 커서 제한을 설명하려는 신호
   - 과장 형용사가 반복된다 → 주제 범위가 너무 작아서 수식으로 분량 채우려는 신호
3. **제공된 자료와 기획안 섹션의 균형은?**
   - 특정 섹션에 대응하는 자료가 빈약한가?
   - 자료 하나로 여러 섹션을 커버하려 했나?
4. **주제 범위와 분량 목표가 맞는가?**
5. **영어 인용을 축자 번역하고 있는가?** (§RULE-ENGLISH-QUOTE 실패 신호)
6. **섹션 간 논리 연결이 꼬였는가?** (H2 순서가 자연스럽지 않은가)

각 관찰을 **구체적 근거와 함께** 서술:

```
관찰:
- §RULE-PARALLEL-THREE 위반 2건 (L34, L78)
- 두 위반 모두 섹션 3 "실전 적용" 에서 발생
- 섹션 3 에 매핑된 자료는 MDN word-break 1개뿐
- MDN 페이지에 구체 코드 예시가 없음 → writer 가 추상적으로 채움

추정 원인: 섹션 3 자료 부족
```

### Step 4-F-3: content/tmp/writer-failures.md 기록

첫 실패면 파일 생성, 있으면 append:

```bash
cat >> content/tmp/writer-failures.md <<EOF

## $(date +%Y-%m-%d) content/posts/<slug>.mdx (시도 N/M 실패)

실패 사유:
<writer 반환 메시지 요약>

writer 가 쓴 문제 문장:
<구체 문장들, L번호 포함>

관찰 (휴리스틱):
<Step 4-F-2 결과>

추정 원인:
<한 줄 진단>

시도 복구 조치:
(이어서 기록)

EOF
```

### Step 4-F-4: 누적 실패 확인 + Layer 판단

```bash
TOTAL_FAILURES=$(grep -c '^## ' content/tmp/writer-failures.md)
```

- **TOTAL_FAILURES < 3**: **Layer 1** (이번 글 복구 시도)
- **TOTAL_FAILURES >= 3**: **Layer 2 전환 권장** (스킬/규칙 수정)

### Step 4-F-5: 사용자 에스컬레이션

먼저 리포트를 텍스트로 제시:

```markdown
## writer 실패 분석 리포트 (Layer 1)

현재 글: content/posts/<slug>.mdx
시도: N/3 실패 (누적 TOTAL건)

### 관찰

<Step 4-F-2 결과>

### 추정 원인

<한 줄 진단>

### 복구 옵션 요약

- A) 자료 보강 — 부족한 섹션에 구체적 예시/수치 추가
- B) 기획안 축소 — 문제 섹션 제거 또는 전체 분량 축소
- C) 주제 전환 — 시리즈로 전환 또는 주제 축소
- D) 이번 글 취소
```

그 다음 **반드시 `AskUserQuestion` 툴 호출** (§UI-USER-CHOICE 준수):

```
AskUserQuestion(
  questions=[{
    "question": "writer 가 규칙 위반 없는 초안을 만드는 데 실패했어요. 어떻게 복구할까요?",
    "options": [
      "자료 보강 — 부족한 섹션용 URL 또는 예시 추가",
      "기획안 축소 — GATE 1 으로 돌아가 기획 수정",
      "주제 전환 — 시리즈로 전환 또는 주제 축소",
      "이번 글 취소"
    ]
  }]
)
```

**Layer 2 전환 권장 리포트 형식**:

리포트를 텍스트로 제시:

```markdown
## writer 실패 분석 리포트 (Layer 2 전환 권장)

누적 실패: TOTAL건

### 반복 패턴

<content/tmp/writer-failures.md 최근 3~N건 분석>

### 권장

이건 "이번 글만의 문제" 가 아니라 **스킬 또는 규칙 자체를 다듬어야 할 신호** 일
수 있어요. `/blog-rule-editor` 로 SHARED.md 또는 blog-writer SKILL.md 수정을
고려해보세요.

### 지금 이 글은?

Layer 2 전환은 장기 개선용이고, 이번 글을 지금 당장 살리는 건 별개예요.
Layer 1 복구 옵션도 함께 제공됩니다.
```

그 다음 **반드시 `AskUserQuestion` 툴 호출** (§UI-USER-CHOICE 준수):

```
AskUserQuestion(
  questions=[{
    "question": "writer 실패가 누적 TOTAL건이에요. 장기 개선과 이번 글 복구를 어떻게 할까요?",
    "options": [
      "이번 글 복구 (Layer 1) — 자료 보강",
      "이번 글 복구 (Layer 1) — 기획안 축소",
      "이번 글 복구 (Layer 1) — 주제 전환",
      "이번 글 취소, 나중에 /blog-rule-editor 로 규칙 다듬기"
    ]
  }]
)
```

### Step 4-F-6: 사용자 응답 처리

- **A (자료 보강)**: 추가 자료 받아서 Phase 2 부분 재실행 → Phase 3 재생성 → Phase 4 재시도
- **B (기획 축소)**: GATE 1 로 돌아가 기획 수정
- **C (주제 전환)**: Phase 1 부터 재시작
- **D (취소)**: 종료

writer 재시도는 **최대 2회 추가** (원래 Phase 4 에서 3회 + Phase 4-F 복구 후 추가 2회). 그 이후 실패는 강제 취소.

---

## Phase 5: validator 호출 (blog-validator SKILL.md 주입)

### blog-validator SKILL.md 로드

```
Read .claude/skills/blog-validator/SKILL.md
```

지침 따라 행동. skip list 준수:

- 단독 실행 전용 입력 확인
- 최종 완료 보고

### 입력 전달

```
files: <Phase 4 에서 저장된 파일 경로 배열>
mode: <"single" 또는 "series">
series_name: <시리즈일 때>
via: "orchestrator"
```

### validator 실행

Phase 1~5 검증 + 자동 수정 (확정 에러) + 사용자 확인 필요한 것 제시.

validator 가 직접 Edit 하므로 오케스트레이터는 중간 개입 없음. **단, 사용자
선택지 제시 시에는 validator 가 사용자와 직접 대화하는 게 아니라 오케스트레이터
경로를 거침** (validator 는 skill 이라 사용자 직접 대화 불가).

즉, validator 가 "선택지 필요한 항목" 을 반환하면 오케스트레이터가 받아서
사용자에게 `AskUserQuestion` 으로 전달하고, 응답을 다시 validator 에게 넘겨서
Edit 반영.

### 결과 분기

**전부 통과 (자동 수정만)**:

- validator 리포트 전체 저장
- Phase 6 진입

**사용자 확인 필요**:

validator 가 "판단 여지 있는 에러" 항목을 반환하면 오케스트레이터가 중계자 역할:

1. validator 리포트의 "사용자 확인 필요" 섹션을 텍스트로 제시
2. 각 항목에 대해 **`AskUserQuestion` 툴 호출** (§UI-USER-CHOICE 준수)
3. 한 항목씩 순차 처리 (한 번에 여러 질문은 사용자가 헷갈림)
4. 사용자 선택을 모아서 validator 에게 재전달
5. validator 재호출 시 "이전 결과 + 사용자 선택" 전달
6. validator 가 선택을 Edit 으로 반영 후 재검증

예: §RULE-COLON-HEADING 재작성 선택지가 3개 있으면:

```
AskUserQuestion(
  questions=[{
    "question": "L5 title 콜론 구조 — 어느 버전으로 재작성할까요?",
    "options": [
      "제안 1: \"페이지 전환을 브라우저에 맡기기\"",
      "제안 2: \"브라우저에 맡기는 페이지 전환\"",
      "제안 3: \"페이지 전환, 브라우저에게\"",
      "유지 (수정 안 함)"
    ]
  }]
)
```

**절대 금지**: validator 리포트의 선택지를 마크다운 리스트로 그대로 출력하고
사용자에게 "1, 2, 3 중 선택해주세요" 유도하는 것.

**수정 불가 (writer 재실행 필요)**:

validator 가 "구조적 결함 — writer 재실행 필요" 카테고리를 반환한 경우:

1. Phase 4 로 롤백
2. writer 에게 "validator 가 이런 에러를 냈다. 수정해서 다시 써줘" 전달
3. **최대 2회 재시도**

2회 재시도 후에도 실패하면 사용자 에스컬레이션. 상황 설명 후
**`AskUserQuestion` 툴 호출**:

```
AskUserQuestion(
  questions=[{
    "question": "writer 재실행을 2회 시도했지만 validator 에러가 계속 나와요. 어떻게 할까요?",
    "options": [
      "이번 글 취소 (저장된 파일 삭제)",
      "저장된 파일 유지하고 수동 수정하겠어요",
      "기획안을 다시 만들고 처음부터 (Phase 3 로)"
    ]
  }]
)
```

**velite 스키마 에러**:

validator 가 자동 수정 안 함. 에러 원문을 텍스트로 제시하고 **`AskUserQuestion`
툴 호출** (§UI-USER-CHOICE 준수):

```
velite 실행 결과:
<velite 에러 메시지 원문>

위 에러는 Phase 1~4 에서 놓친 엣지 케이스거나 velite 쪽 스키마 이슈일 수 있어요.
validator 가 자동 수정하지 않고 사용자 판단을 기다립니다.
```

```
AskUserQuestion(
  questions=[{
    "question": "velite 스키마 에러 — 어떻게 할까요?",
    "options": [
      "파일을 수동으로 열어 수정하겠어요 (여기서 멈춤)",
      "에러 메시지를 더 자세히 분석해주세요",
      "writer 에게 재작성 요청 (Phase 4 롤백)",
      "이번 글 취소"
    ]
  }]
)
```

---

## Phase 5.5: expression-review 호출 (.claude/skills/blog-expression-review/SKILL.md 주입)

validator 가 통과한 후 expression-review 를 호출해 의미 판단이 필요한 표현 규칙을
검토합니다.

### 호출 조건

Phase 5 (validator) 가 완전히 통과한 후에만 실행. validator 에서 "수정 불가
(writer 재실행)" 이나 사용자 확인 대기가 있으면 그것부터 처리한 후 진입.

### post-expression-review SKILL.md 로드

```
Read .claude/skills/blog-expression-review/SKILL.md
```

지침 따라 행동. skip list 준수:

- 단독 실행 전용 입력 확인
- 최종 완료 보고

### 입력 전달

```
files: <Phase 4 에서 저장된 파일 경로 배열>
mode: <"single" 또는 "series">
series_name: <시리즈일 때>
via: "orchestrator"
```

### expression-review 실행

skill 지침의 Step 1~5 를 그대로 따름. 자동 수정 가능한 것은 직접 Edit, 사용자
확인 필요한 것은 구조화된 데이터로 반환.

### 결과 처리

**전부 통과 또는 자동 수정만**:

- 리포트 저장
- Phase 6 진입

**사용자 확인 필요 항목**:

- expression-review 가 반환한 "사용자 확인 필요" 섹션을 받음
- 각 항목에 대해 §UI-USER-CHOICE 에 따라 `AskUserQuestion` 호출
- 한 항목씩 순차 처리
- 사용자 선택을 expression-review 에게 재전달
- expression-review 가 선택을 Edit 으로 반영

호출 예시 (각 사용자 확인 항목마다):

```
AskUserQuestion(
  questions=[{
    "question": "L34 병렬 삼단 — 어느 제안으로 수정할까요?",
    "options": [
      "제안 1: <expression-review 가 준 제안 1>",
      "제안 2: <expression-review 가 준 제안 2>",
      "제안 3: <expression-review 가 준 제안 3>",
      "유지 (수정 안 함)"
    ]
  }]
)
```

---

## Phase 5.6: coherence-review 호출 (.claude/skills/blog-coherence-review/SKILL.md 주입)

expression-review 가 통과한 후 coherence-review 를 호출해 글의 논리 완결성을 검토.

### 호출 조건

Phase 5.5 (expression-review) 가 완전히 통과한 후에만 실행. expression-review 에서
사용자 확인 대기가 있으면 그것부터 처리한 후 진입.

### blog-coherence-review SKILL.md 로드

```
Read .claude/skills/blog-coherence-review/SKILL.md
```

지침 따라 행동. skip list 준수:

- 단독 실행 전용 입력 확인
- 최종 완료 보고

### 입력 전달

```
files: <Phase 4 에서 저장된 파일 경로 배열>
mode: <"single" 또는 "series">
series_name: <시리즈일 때>
via: "orchestrator"
```

### coherence-review 실행

skill 지침의 Step 1~6 을 그대로 따름. 자동 수정 없음. 모든 항목이 사용자 확인 필요.

### 결과 처리

**전부 통과**:

- 리포트 저장
- Phase 6 진입

**사용자 확인 필요 항목**:

- coherence-review 가 반환한 "사용자 확인 필요" 섹션을 받음
- 각 항목에 대해 §UI-USER-CHOICE 에 따라 `AskUserQuestion` 호출
- 한 항목씩 순차 처리
- 사용자 선택을 coherence-review 에게 재전달

### 글 의미 변경 시 추가 안전장치

coherence-review 의 수정은 글의 메시지를 바꿀 수 있어요. 사용자가 옵션을 선택했을 때,
**LLM 이 임의로 새 문장을 생성하지 않고 사용자에게 직접 문장을 받는** 흐름을 우선:

```
AskUserQuestion(
  questions=[{
    "question": "도입-결론 불일치 (E1) — 마무리에 오프닝 답변을 어떻게 추가할까요?",
    "options": [
      "내가 직접 문장을 줄게요 (다음 메시지에서 입력)",
      "제안 1 그대로 적용",
      "유지 (수정 안 함)"
    ]
  }]
)
```

"내가 직접 문장을 줄게요" 선택 시 AskUserQuestion 종료 후 사용자 응답 대기, 응답 받은
문장을 coherence-review 에게 전달해 Edit 반영.

### 시리즈 총평 처리

`mode: "series"` 일 때 coherence-review 가 시리즈 총평도 함께 반환.

```
시리즈 총평을 사용자에게 텍스트로 그대로 제시 후, 시리즈 단위 수정 항목이 있으면
별도로 AskUserQuestion 으로 처리.
```

---

## Phase 6: 완료 보고

모든 검증이 통과한 후 최종 보고.

### 완료 메시지 형식

```markdown
# ✅ 블로그 글 작성 완료

저장된 파일:

- content/posts/<slug>.mdx

(시리즈라면)

- content/posts/<seriesSlug>/part-1-slug.mdx
- content/posts/<seriesSlug>/part-2-slug.mdx
- ...

## validator 검증 결과

<validator 전체 리포트 그대로 붙여넣기>

## 다음 단계

- 로컬 확인: `pnpm dev`
- 로컬에서 렌더 확인 후 push
- 필요하면 수동으로 수정 (프론트매터 태그 등)

## 참고

- 자료 출처: N개 (1순위 X개, 2순위 Y개)
- 내부 링크: N개 배치
- draft-review: 블로커 N건 / 경고 M건 (GATE 1 전 처리됨)
- validator 자동 수정: N건
- validator 경고: M건
- expression-review 자동 수정: N건
- expression-review 사용자 확인 후 수정: M건
- coherence-review 사용자 확인 후 수정: N건
- coherence-review 통과: M건
```

### git status 힌트 (선택)

완료 후 사용자가 다음 단계로 뭘 해야 할지 알리는 짧은 힌트:

```bash
git status --short content/posts/ 2>/dev/null
```

새 파일이 `content/posts/` 에 생겼는지 확인 후:

```
생성된 파일을 확인한 뒤 커밋하면 돼요:

  git add content/posts/<slug>.mdx
  git commit -m "post: <제목>"
```

---

## Phase 간 컨텍스트 관리

각 Phase 는 이전 Phase 의 **구조화된 결과** 만 전달받아요. 원문은 버려요.

**오케스트레이터 변수**:

- `topic`: Phase 0 에서 파싱한 주제
- `user_urls`: Phase 0 에서 파싱한 URL 배열
- `today`: 오늘 날짜
- `internal_link_candidates`: Phase 1 결과 (후보 3~5개)
- `sources_summary`: Phase 2 blog-research 반환 결과 (500~1500 토큰)
- `approved_plan`: GATE 1 통과 후 기획안
- `saved_files`: Phase 4 writer 반환 파일 경로 배열
- `validator_report`: Phase 5 validator 전체 리포트

이 변수들만 Phase 간 넘겨요. 그 외 중간 계산, 원문, 디버그 로그는 각 Phase 내부에서 소진.

---

## 에스컬레이션 체크리스트

사용자 개입이 필요한 시점:

| Phase   | 조건                      | 처리                              |
| ------- | ------------------------- | --------------------------------- |
| Phase 1 | 같은 주제 기존 글 발견    | 사용자 확인 (B/C 선택)            |
| Phase 2 | 1순위 출처 0개 거부       | 에스컬레이션 (A/B/C)              |
| Phase 2 | 한도 초과                 | 에스컬레이션 (주제 축소 권장)     |
| Phase 3 | —                         | GATE 1 (기획안 승인)              |
| Phase 4 | writer 반복 실패          | Phase 4-F 실패 분석 + 사용자 선택 |
| Phase 5 | 사용자 선택지 필요        | validator 가 제시한 선택지 전달   |
| Phase 5 | 수정 불가 (writer 재실행) | Phase 4 롤백, 최대 2회            |
| Phase 5 | velite 에러               | 사용자 판단 요청                  |

---

## 주의 사항

- **각 Phase 는 이전 Phase 성공 후에만 실행**. 건너뛰기 금지.
- **사용자 승인 없이 writer 호출 금지**. GATE 1 통과 필수.
- **blog-research 결과를 오케스트레이터 컨텍스트에 원문으로 저장 금지**. sub-agent 반환 요약만.
- **writer 와 validator 에게 같은 정보를 전달할 때 입력 계약에 명시된 항목만**. 전체 대화 맥락 복사 금지.
- **content/tmp/writer-failures.md 는 덮어쓰지 말고 append**.
- **기존 파일 덮어쓰기 금지**. Phase 4 에서 writer 가 경로 충돌 감지 시 중단.
- **에이전트 실패나 블로커를 조용히 삼키지 말 것**. 전부 투명하게 사용자에게 알림.

---

### v0.2 (현재)

- Phase 3.5 draft-review 추가 ✅
- Phase 5.5 expression-review 추가 ✅
- Phase 5.6 coherence-review 추가 ✅
- Phase 6 완료 보고에 모든 리뷰어 결과 포함 ✅

v0.2 완성. 모든 리뷰어가 파이프라인에 통합됨.

### v0.3 (TODO, 미정)

- 실전 사용 후 발견되는 패턴에 따라 결정
- 후보:
  - blog-code-validator (코드 예시 실행 가능성 검증)
  - 시리즈 전용 도구

---

## 제약

- **SHARED.md 규칙을 SKILL.md 에 복사하지 마세요**. 필요할 때 Read 로 주입하고 참조만.
- **하위 skill 의 역할을 오케스트레이터가 대신하지 마세요**. writer 작업을 오케스트레이터가 하거나, validator 검증을 오케스트레이터가 하면 안 됨.
- **사용자 승인 없이 자동 수정이나 파일 생성 금지** (GATE 1 전).
- **blog-research 실패 시 오케스트레이터가 직접 WebFetch 하지 마세요**. sub-agent 거부를 그대로 사용자에게 전달.
- **완료 보고에 validator 리포트를 요약하지 마세요**. 전체를 그대로 보여줘야 사용자가 최종 판단 가능 (결정 4: A).
