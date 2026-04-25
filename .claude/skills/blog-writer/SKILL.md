---
name: blog-writer
description: |
  승인된 블로그 포스트 기획안을 입력받아 `content/posts/` 아래 MDX 파일로 저장한다.
  SHARED.md의 전체 규칙(어조, em-dash/콜론/** 금지, MDX 컴포넌트, References,
  frontmatter 스키마)을 작성 단계에서 전부 준수한다. 자료 수집·기획 검토·정합성
  검증·표현 리뷰는 다른 skill이 담당한다. writer는 저장까지만.

  사용 트리거: 기획안이 승인된 뒤 오케스트레이터가 호출. 단독 실행 가능하지만
  드문 경우(사용자가 직접 승인된 기획안을 가지고 와서 저장을 요청).

tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
---

# blog-writer

승인된 블로그 기획안을 받아 MDX 파일로 저장합니다. Lydia Hallie / Josh Comeau
스타일의 인터랙티브하고 시각적인 한국어 기술 글을 씁니다.

**이 skill은 SHARED.md를 거의 전체 전제**합니다. 작성 시작 전에 아래 섹션을
Read로 로드하세요:

- `§BLOG-VOICE` — 어조, 어미 비율, 구어 접속사
- `§RULE-EMDASH` — em-dash 전면 금지
- `§RULE-COLON` (하위 §RULE-COLON-BODY, §RULE-COLON-HEADING)
- `§RULE-BOLD` (하위 §RULE-BOLD-WHERE, §RULE-BOLD-HOW, §RULE-BOLD-KOREAN)
- `§RULE-FORBIDDEN-PATTERNS` — 병렬 삼단, 과장 형용사, 메타 문장
- `§RULE-RHYTHM` — 호흡, 자기 목소리
- `§RULE-BARE-LIST` — 본문 bare 리스트 금지
- `§RULE-ENGLISH-QUOTE` — 영어 인용 한글 풀이
- `§RULE-LINK-PATH` — 내부 링크 경로
- `§RULE-EXTERNAL-MENTION` — 외부 라이브러리/도구/공식 문서 인라인 링크
- `§RULE-REFERENCES`, `§RULE-CITE` — References 컴포넌트
- `§META-TITLE`, `§META-DESCRIPTION` — 제목/설명 품질
- `§COMPLEXITY` — 분량, H2 개수
- `§FRONTMATTER` — 스키마
- `§MDX-COMPONENTS`, `§MDX-ANIMATEDSTEP`, `§MDX-CODEPLAYGROUND`, `§MDX-CHECKLIST`, `§MDX-JSX-BALANCE`
- `§FILE-LAYOUT` — 저장 경로

**규칙 내재화 원칙**: writer는 검증 단계가 아니라 **작성 단계에서** 이미 규칙을
지킵니다. validator는 최후의 안전망일 뿐이고, 깨끗한 초안을 넘기는 게 writer의
책임이에요. 작성 중에 규칙을 어긴 문장이 나오려고 하면 그 자리에서 고쳐 쓰세요.

---

## 입력 계약

### 오케스트레이터 호출 시

오케스트레이터가 프롬프트로 아래를 전달합니다:

- `mode`: `"single"` 또는 `"series"`
- `slug`: 영문 kebab-case (단편) 또는 시리즈 slug
- `series_name`: 시리즈일 때 완전한 시리즈 제목 (모든 편의 `series` frontmatter 값)
- `parts`: 시리즈일 때 편별 정보 배열
  - `{ order, title, description, tags, key_sections, core_message }`
- `plan`: 승인된 기획안 전문 (핵심 메시지, 주요 섹션, 설명)
- `sources`: 1순위 출처 URL 배열
  - `{ url, priority, notes, quote_candidates }`
- `internal_links`: 내부 링크 후보 배열
  - `{ path, context, natural_insertion_point }`
- `today`: `YYYY-MM-DD` 형식 오늘 날짜
- `via`: `"orchestrator"` 또는 `"blog-revise"`
- `output_override`: 선택적. 지정되면 이 경로에 저장 (slug 기반 자동 경로 무시).
  blog-revise 의 완전 재작성 패턴에서 사용.

### 단독 실행 시 (드문 경우)

사용자가 위 정보를 직접 구두로 주거나 파일로 붙여넣음. 누락된 필드가 있으면
writer가 "이 정보가 필요해요"라고 요청하고 받을 때까지 저장하지 않음.

**중요**: writer는 자료 수집을 하지 않습니다. `sources`가 비어있거나 1순위 출처가
0개이면 **거부**하고 오케스트레이터(또는 사용자)에게 돌려보냅니다. "1순위 출처 없이는
글을 쓸 수 없어요"라고 명시.

---

## 작성 순서

아래 순서를 건너뛰지 마세요. 각 단계마다 SHARED.md 규칙 준수를 확인합니다.

### Step 1: frontmatter 확정

`§FRONTMATTER` 스키마에 따라 frontmatter를 먼저 작성합니다.

**필수 필드**: `title`, `description`, `date`, `tags`, `published`
**시리즈 추가**: `series`, `seriesOrder`

**오케스트레이터 경유 시 (`via: orchestrator`)**: 입력으로 받은 `title` 은 **가제
(working title)** 일 수 있습니다. blog-write 가 본문 작성 후 Phase 4.5 에서 본문
기반으로 제목·설명을 다시 잡아 frontmatter Edit 으로 교체합니다. 따라서 writer 는
이 단계에서 가제 그대로 frontmatter 에 넣고, **콜론·em-dash·`**` 같은 표면 금지만\*\*
지키면 됩니다 (validator 통과용). §META-TITLE 의 더 엄격한 품질 (호기심 유발,
군더더기 제거) 은 Phase 4.5 가 책임집니다.

**단독 실행 시**: 입력 `title` 이 사용자가 직접 준 최종 제목이라 가정하고 §META-TITLE
의 모든 기준을 적용합니다.

**품질 체크 (단독 실행 또는 가제가 이미 충분히 다듬어진 경우)**:

- `title`: `§META-TITLE` 기준. 20자 이내, 호기심 유발, 군더더기 제거. **콜론 구조
  금지** (§RULE-COLON-HEADING), **em-dash 금지** (§RULE-EMDASH). 자연스러운 한국어 구.
- `description`: `§META-DESCRIPTION` 기준. 50자 내외, 독자가 막히는 지점을 구체적으로.
  **존댓말 구어체**, 반말 금지, 교과서 문체 금지. **콜론 구조 금지**, **em-dash 금지**,
  **`**` 금지\*\* (frontmatter는 JSX prop 값에 준함).
- `date`: 오케스트레이터가 전달한 `today` 값 사용. 단독 실행이면 `date +%Y-%m-%d`.
- `tags`: 3~5개 정도. 시리즈라면 편끼리 통일.

**시리즈 주의**:

- `series` 값은 **모든 편에 완전히 동일**. 오타·공백·접미사 차이 금지.
- `seriesOrder`는 1부터 시작, 중복/결번 없음.

### Step 2: 본문 뼈대 (H2 목록만)

frontmatter 아래에 H2 섹션 제목만 먼저 나열합니다. 내용은 아직 비워두고
구조만 잡아요.

- `§COMPLEXITY`: H2는 **3~6개**. 2개 이하면 얕고, 8개 이상이면 산만.
- 각 섹션이 하나의 명확한 역할
- 섹션 제목은 **§RULE-COLON-HEADING 준수**. "키워드: 요약" 구조 금지.

```mdx
## [오프닝 섹션 제목]

## [핵심 개념 1]

## [실전 적용]

## [함정 또는 주의사항]

## [마무리 또는 다음 편 예고]
```

### Step 3: 오프닝 단락 작성

첫 H2 **전에** 들어가는 도입 단락. 제일 중요한 부분이에요.

**해야 할 것**:

- **독자가 마주하는 실제 문제**에서 시작
- 1인칭 경험 또는 관찰 한 줄 ("처음엔 이게 왜 안 되나 싶었어요")
- 이 글이 해결하는 게 뭔지 암시만 (대놓고 예고 X)

**금지**:

- `§RULE-META`: "이번 글에서는 ~를 다뤄봅니다" 같은 메타 문장
- 이론 나열로 시작
- "~의 개요", "~이란 무엇인가" 식 교과서 오프닝

**길이**: 2~4문장. 너무 길면 독자가 본문 들어가기 전에 지침.

### Step 4: 각 섹션 내용 채우기

H2 하나씩 순차적으로 채웁니다.

각 섹션 작성 시 고려:

**MDX 컴포넌트 활용** (`§MDX-COMPONENTS` 참조):

- 개념 단계 분해 → `<AnimatedStep>`
- 실행 예제 → `<CodePlayground>`
- 팁/경고/주의사항 → `<Callout variant="tip|warning|info|error">`
- 외부 영상 참조 → `<VideoEmbed>`

**작성 규칙**:

- `§BLOG-VOICE`: 구어 존댓말 70% 이상. 반말(`~다`) 절대 금지.
- `§RULE-RHYTHM-VARIED`: 짧은 문장과 긴 문장 섞기. 같은 종결 어미 3번 이상 반복 금지.
- `§RULE-PARALLEL-THREE`: 3단 병렬 나열 반복 금지.
- `§RULE-HYPE`: "완벽한", "강력한" 등 과장 형용사 금지 → 구체적 동작·수치·예시.
- `§RULE-BARE-LIST`: 본문 bare `- 항목` 금지. 문단으로 풀어쓰거나 컴포넌트로.

**영어 원문 인용이 필요하면** (`§RULE-ENGLISH-QUOTE`):

```mdx
<Callout variant="warning">
"원문 영어 문장." - 출처

글쓴이 목소리로 풀어쓴 한국어 한 줄.

</Callout>
```

축자 번역 금지. 본문 톤으로 이어받기.

**코드 예제 작성 시** (`§MDX-CODEPLAYGROUND`):

- `template="react"`: `function PascalCase()` 형태, `export default` 금지
- `code` prop은 백틱 템플릿 리터럴로 감싸기
- **사용 식별자는 전부 import**: `ReactDOM.xxx` 금지, destructured import 사용
  - ❌ `ReactDOM.flushSync(() => setX(next))` (자동 주입 안 됨, 런타임 에러)
  - ✅ 상단에 `import { flushSync } from "react-dom";` 후 `flushSync(() => setX(next))`
- **인라인 스타일 덩어리 금지**: `style={{...}}` 대신 className + `css` prop 분리
- **prop 값 안에 `**`금지** (§RULE-BOLD-WHERE):`title`, `content`, `code` 등 전부 해당
- **prop 값 안에 em-dash 금지**

**강조 사용 시** (`§RULE-BOLD`):

- 본문 단락, Callout children → `**text**` 사용 가능 (한글 인접 시 공백 또는 `<strong>`)
- JSX prop 값 (AnimatedStep, References, CodePlayground prop 등) → `**` **사용 금지**
  (리터럴 노출). 강조가 필요하면 `"..."`로 감싸거나 그냥 빼기.

**체크리스트 필요하면** (`§MDX-CHECKLIST`):

```mdx
<Callout variant="info">
**반응형**

☐ 항목 1<br/>
☐ 항목 2<br/>

**접근성**

☐ 항목 3

</Callout>
```

`- [ ]` 마크다운 task list 금지. `☐` (U+2610) 문자.

### Step 4-뒤 미니 체크 (각 섹션 작성 직후 즉시 실행)

한 섹션(H2) 작성을 마칠 때마다 **기계적으로 치환 가능한 항목**만 그 자리에서
바로 확인하고 고칩니다. 의미 판단이 필요한 항목은 Step 8 일괄 체크로 미룹니다.

**즉시 체크할 항목 (5가지)**:

1. **em-dash** — 방금 쓴 섹션에 `—` 가 있는지. 있으면 **즉시 쉼표로 치환**.
   `§RULE-EMDASH` 적용 범위 전부 포함 (본문/주석/prop/코드 블록).

2. **JSX prop 값 안 `**`** — `<AnimatedStep>`, `<CodePlayground>`, `<References>`같은 컴포넌트의 prop 값 안에`**text**`를 쓰지 않았는지. 있으면 즉시 제거 또는`"..."` 로 감싸기. (§RULE-BOLD-WHERE, 확정 에러)

3. **bare 마크다운 리스트** — 본문 레벨에 `- 항목` / `1. 항목` 을 쓰지 않았는지.
   있으면 즉시 문단으로 풀거나 `<AnimatedStep>` / `<Callout>` 으로 변환.
   (§RULE-BARE-LIST)

4. **반말 문어체** — `~다`, `~이다`, `~한다`, `~된다`, `~있다` 종결이 있는지.
   있으면 즉시 구어 존댓말로 전수 교체. (§BLOG-VOICE, 블로커급)

5. **AnimatedStep title 번호** — `<AnimatedStep>`을 썼다면 title 값이 숫자로
   시작하는지(`"1. ..."`, `"1단계..."`, `"Step 1..."` 등). 있으면 **즉시 번호
   접두사 제거**. 컴포넌트가 자동 번호 뱃지를 렌더링함. (§MDX-ANIMATEDSTEP, 확정 에러)

**미루는 항목 (Step 8에서 일괄 체크)**:

- 콜론 구조 (문장 재작성 필요 — 미뤘다가 전체 톤 보면서 판단)
- `**` 한글 인접 (공백 하나 추가지만 본문 전체 리듬 보면서 판단하는 게 나음)
- 병렬 삼단 / 과장 형용사 / 메타 문장 (의미 판단 필요)
- 어미 비율 (`~입니다/~합니다`가 한 섹션 통째로 차지하는지는 섹션 다 쓰고 봐야 판단 가능)
- 호흡 다양성 (같은 종결 어미 반복, 긴 문장 연속)
- 자기 목소리 존재 (전체 글 톤 잡힌 후 판단)
- 내부 링크 실존 (저장 직전 마지막에 Glob 검증)
- References 1순위 출처 (Step 6에서 작성하므로 Step 8에서 재확인)
- References items 각 항목에 본문 Cite가 하나 이상 붙었는지 (§RULE-CITE, 권고)

**원칙**: Step 4 미니 체크는 **그 섹션 범위 안에서만** 봅니다. 글 전체를 다시
읽지 않아요. 섹션 작성 흐름을 끊지 않는 게 목적이에요.

### Step 5: 내부 링크 삽입

`internal_links` 로 받은 후보를 본문에 자연스럽게 녹입니다.

**원칙** (`§RULE-LINK-PATH`):

- 경로는 반드시 `/posts/<slug>` 또는 `/series/<seriesSlug>`
- 시리즈 편 간 링크도 **파일명 slug 만** 사용 (`/posts/<partSlug>`).
  디렉토리 경로 금지: `/posts/<seriesSlug>/<partSlug>` 는 404 (velite slug 는 파일명 단일 세그먼트).
- `.mdx` 확장자 금지, `/blog/`, `/post/` 등 임의 접두사 금지
- 한 글에 2~4개 정도. 남발 금지.
- 문장 안에 녹이기. "관련 글" 박스 금지.
  - 예: "쌓임 맥락이 어떻게 만들어지는지는 [지난 글](/posts/css-stacking-context)에서 다뤘어요"
- 억지 연결은 과감히 생략. 후보가 없으면 없는 대로.
- **`<References />` 섹션에 내부 글 넣지 마세요** (외부 출처 전용)

**slug 검증**: 저장 전에 Glob으로 실제 파일 존재 확인.

```bash
ls content/posts/<slug>.mdx 2>/dev/null || ls content/posts/*/<slug>.mdx 2>/dev/null
```

없으면 해당 링크 제거 또는 오케스트레이터에게 확인 요청.

### Step 6: `<References />` 작성

본문 맨 아래에 `<References items={[...]} />`를 배치합니다.

**필수 조건** (`§RULE-REFERENCES`):

- `sources` 로 받은 URL 전부 포함
- **1순위 공식 출처를 배열 맨 위**에 배치 (§SOURCE-PRIORITY)
- 각 항목: `{ id, title, href, description }`
  - `id`: kebab-case 짧은 식별자 (예: `mdn-word-break`)
  - `title`: "출처명 - 문서 제목" 형태. **em-dash 금지**, 짧은 하이픈 사용.
  - `href`: 캐노니컬 URL
  - `description`: 어떤 부분을 참고했는지 한 줄. **em-dash 금지**, **`**` 금지\*\* (JSX prop)
- `## 참고` 같은 마크다운 헤딩 **금지** (컴포넌트가 자체 헤딩 렌더)

**예시**:

```mdx
<References
  items={[
    {
      id: "mdn-word-break",
      title: "MDN - CSS `word-break`",
      href: "https://developer.mozilla.org/en-US/docs/Web/CSS/word-break",
      description: "`keep-all` 동작과 브라우저 지원 범위 확인",
    },
    {
      id: "w3c-css-text",
      title: "W3C CSS Text Module Level 3 - Line Breaking",
      href: "https://www.w3.org/TR/css-text-3/#line-breaking",
      description: "줄바꿈 알고리즘 원문",
    },
  ]}
/>
```

**`<Cite>` 사용** (`§RULE-CITE`):

- 본문 주장 뒤에 공백 없이: `...지원됩니다.<Cite id="mdn-word-break" />`
- **한 문단에 최대 1개**
- **JSX 컴포넌트 직후 단독 라인에 두지 말 것** (확정 위반, §RULE-CITE):
  Callout/AnimatedStep/CodePlayground 같은 JSX 블록을 인용 근거로 쓸 때,
  Cite 는 그 JSX 블록 **앞 본문 단락의 문장 끝**에 인라인으로 붙입니다.
  JSX 닫는 태그 + 빈 줄 + `<Cite />` 단독 라인 패턴은 렌더링 시 ⓘ 아이콘이
  외롭게 떠서 시각적으로 끊겨요.
  - ❌ `</Callout>` + 빈 줄 + `<Cite id="..." />` (단독 라인, 확정 위반)
  - ✅ `본문 문장.<Cite id="..." />` + 빈 줄 + `<Callout>...</Callout>`
- **기본 원칙 (권고)**: References items 각 항목마다 본문에 대응 Cite를 하나 이상 붙이는 것을 기본으로 합니다. 해당 사실·인용을 처음 언급하는 지점에 배치. 자연스러운 문장 흐름을 깨뜨리면 생략 가능 (SHOULD, §RULE-CITE).

### Step 7: 마무리

- **단편**: 핵심 요약 한두 줄 + "한 걸음 더" 힌트 (선택)
- **시리즈 중간 편**: 다음 편 예고 한 줄
- **시리즈 마지막 편**: 시리즈 전체 회고 두세 줄

마무리에 메타 문장 금지. "이번 글에서는 ~를 다뤘습니다" 같은 것.

---

## Step 8: 자가 체크리스트 (저장 전 필수)

**저장하기 직전에** 작성한 내용을 전체 읽으며 SHARED.md 위반을 체크합니다.
Step 4 미니 체크에서 이미 기계적 항목(em-dash, JSX prop `**`, bare 리스트,
반말)은 고쳐두었으므로, 여기서는 **글 전체를 봐야 판단 가능한 항목**에 집중합니다.

**Step 4에서 이미 본 것 (여기서는 최종 재확인만)**:

- em-dash 전수 검사
- JSX prop 값 안 `**`
- bare 리스트
- 반말 문어체

**Step 8에서 처음 보는 것 (의미 판단 필요)**:

- 콜론 구조
- `**` 한글 인접
- 금지 패턴 (삼단/과장/메타)
- 어미 비율 균형
- 자기 목소리 존재
- 내부 링크 실존
- References 1순위 출처
- CodePlayground import 매칭
- JSX 태그 균형

각 항목을 하나씩 확인하세요:

### 8-1. em-dash 전수 검사 (§RULE-EMDASH)

작성한 본문 전체에서 `—` (U+2014) 가 있는지 검사. **한 건이라도 있으면 제거**.

적용 범위:

- 본문 단락
- 헤딩
- frontmatter
- `<References>` title/description
- `<Callout>` 내부
- `<CodePlayground>` code/css prop
- `<AnimatedStep>` title/content/code
- 코드 블록 주석
- 인라인 코드
- JSX prop 전부
- 내부 링크 텍스트

치환: 쉼표(`,`) 우선. 문맥상 어색하면 마침표나 괄호.

### 8-2. 콜론 구조 (§RULE-COLON-HEADING)

- 헤딩(H1~H6)에 "키워드: 요약" 구조 있는지
- frontmatter `title`, `description`에 콜론 구조 있는지
- 예외: 백틱 안에 **완전히** 갇힌 CSS 식별자·의사요소

있으면 자연스러운 한국어 구로 재작성.

### 8-3. `**` JSX prop 값 안 (§RULE-BOLD-WHERE)

확정 에러 항목이에요. JSX prop 값 안의 `**`는 리터럴로 노출됩니다.

체크할 자리:

- `<AnimatedStep steps={[{ title: "...", content: "..." }]}>` 의 title/content/code
- `<References items={[{ title: "...", description: "..." }]}>` 의 title/description
- `<CodePlayground code={`...`} css={`...`}>` 의 code/css
- `<VideoEmbed title="..." />`
- frontmatter `title`, `description`

있으면 `"..."`로 감싸거나 그냥 빼기.

### 8-4. `**` 한글 인접 (§RULE-BOLD-KOREAN)

본문 단락의 `**text**` 뒤에 한글 음절이 바로 붙어 있는지. 있으면 공백 추가 또는
`<strong>` 태그로 교체.

- ❌ `**word-break**에서는`
- ✅ `**word-break** 에서는` 또는 `<strong>word-break</strong>에서는`

### 8-5. bare 리스트 (§RULE-BARE-LIST)

본문 레벨에 `- 항목` / `1. 항목` 시작 라인이 있는지. 있으면 문단으로 풀거나
컴포넌트(`<AnimatedStep>`, `<Callout>`)로 변환.

예외: `<Callout>` 내부 마커 포함 리스트(`• 항목`), `<References>` 배열, 코드 블록.

### 8-6. 금지 패턴 (§RULE-FORBIDDEN-PATTERNS)

- 병렬 삼단 구조가 2번 이상 반복되는지 (§RULE-PARALLEL-THREE)
- 과장 형용사 ("완벽한", "강력한" 등) 있는지 (§RULE-HYPE)
- 메타 문장 ("이번 글에서는 ~를 다뤄봅니다" 등) 있는지 (§RULE-META)

### 8-7. 어미 비율 (§BLOG-VOICE)

- 반말 문어체(`~다`, `~이다`, `~한다`, `~된다`, `~있다`) 있는지. 있으면 **전수 교체**.
- `~입니다/~합니다`가 한 섹션을 통째로 차지하는지. 그러면 한두 곳을
  `~에요/~죠/~거든요`로 바꾸기.
- 구어 접속사 우선: "그런데" → "근데", "하지만" → "다만", "따라서" → "그래서".

### 8-8. 자기 목소리 (§RULE-SELF-VOICE)

긴 글(3000자 이상)이면 1인칭 경험 또는 혼잣말이 한 줄이라도 있는지. 없으면
한두 줄 추가.

### 8-9. 내부 링크 실존

삽입한 내부 링크의 slug가 실제 파일과 매칭되는지 Glob으로 확인.

### 8-10. References 1순위 출처

`<References items>`에 1순위 공식 출처가 최소 1개 있는지. 없으면 **저장 중단**하고
오케스트레이터에게 알림.

### 8-11. CodePlayground import 매칭

code prop 안에서 `ReactDOM.xxx` 네임스페이스 호출이 있는지. 있으면 destructured
import로 변환. 외부 라이브러리 import 선언이 code 상단에 존재하는지.

### 8-12. JSX 태그 균형

각 컴포넌트의 여닫기 짝이 맞는지. self-closing(`/>`)이 올바른지.

---

## Step 9: 파일 저장

작성한 본문을 §FILE-LAYOUT 규칙에 따라 저장.

- 단편: `content/posts/<slug>.mdx`
- 시리즈: `content/posts/<seriesSlug>/<partSlug>.mdx`

### output_override 처리

입력에 `output_override` 가 있으면 위 자동 경로를 무시하고 `output_override` 의
경로에 저장:

```
저장 경로 = output_override (있으면) 또는 자동 경로 (없으면)
```

`output_override` 의 디렉토리가 없으면 먼저 생성:

```bash
mkdir -p $(dirname "$OUTPUT_OVERRIDE")
```

저장 후 반환할 경로는 실제 저장 경로 (override 또는 자동).

### 충돌 확인

```bash
ls content/posts/<slug>.mdx 2>/dev/null
# 또는
ls content/posts/<seriesSlug>/<partSlug>.mdx 2>/dev/null
```

파일이 이미 존재하면 **덮어쓰기 금지**. 오케스트레이터(또는 사용자)에게 경로 충돌을
알리고 중단. writer가 임의로 덮어쓰지 않아요.

### Write 툴 사용

Write 툴로 파일 생성:

```
Write(
  path="content/posts/<slug>.mdx",
  content="<전체 MDX 내용>"
)
```

시리즈의 경우 디렉토리가 없으면 `mkdir -p content/posts/<seriesSlug>` 먼저
실행 후 한 편씩 저장.

### 시리즈 진행 보고

시리즈 작성 중에는 매 편 저장 후 한 줄 알림:

```
1/3 저장 완료: content/posts/<seriesSlug>/part-1-slug.mdx
2/3 저장 완료: content/posts/<seriesSlug>/part-2-slug.mdx
3/3 저장 완료: content/posts/<seriesSlug>/part-3-slug.mdx
```

---

### 시리즈 중간 실패 처리

시리즈 N편 중 k번째 편에서 자가 체크리스트 통과 실패가 3회 반복되거나 구조적
오류가 발생하면, **1 ~ (k-1) 편은 저장 상태 그대로 유지**하고 k번째 편에서
작업을 중단합니다.

**유지 원칙**:

- 이미 저장된 편(1 ~ k-1)은 건드리지 않음. 롤백 없음.
- `published: true` 상태도 그대로 유지. writer가 임의로 `false`로 바꾸지 않음.
- 시리즈 frontmatter의 `series` 값도 유지.

**중단 시 보고**:

```
⚠️ 시리즈 작성 중단

저장 완료:
  - 1/3 content/posts/<seriesSlug>/part-1-slug.mdx
  - 2/3 content/posts/<seriesSlug>/part-2-slug.mdx

중단 위치: 3/3 part-3-slug
중단 사유: <구체적 사유>
  예: "Step 8 체크에서 §RULE-EMDASH 위반이 3회 반복 수정 후에도 남음"
  예: "1순위 공식 출처가 0개로 확인됨"

권장 조치:
  - 사용자가 수동으로 3편 이어쓰기
  - 또는 오케스트레이터에게 기획안 재검토 요청
  - 1~2편은 건드리지 말 것 (이미 저장됨)
```

**시리즈 일관성 경고**: k-1편까지는 저장되었지만 `seriesOrder: 3` 편이 누락된
상태가 됩니다. 독자가 시리즈 페이지에 들어갔을 때 "미완"으로 보일 수 있어요.
중단 보고에 이 점을 명시하세요:

> "시리즈 페이지에서는 '1/3, 2/3 완료, 3편 준비 중'처럼 보입니다. 3편을 마저
> 쓰기 전까지 독자에게는 미완 상태로 노출돼요. 급하다면 1~2편의 `published`를
> 임시로 `false`로 바꿔 숨길 수 있지만, 그건 사용자 판단입니다."

---

## 출력 계약

작업이 끝나면 저장한 파일 경로 목록만 반환하세요. 본문 내용을 다시 출력하거나
작성 과정을 설명하지 마세요 (오케스트레이터 컨텍스트 절약).

### 성공 케이스

```
저장 완료:
  - content/posts/<slug>.mdx
```

또는 시리즈:

```
저장 완료:
  - content/posts/<seriesSlug>/part-1-slug.mdx
  - content/posts/<seriesSlug>/part-2-slug.mdx
  - content/posts/<seriesSlug>/part-3-slug.mdx
```

### 거부 케이스

다음 경우 저장하지 않고 거부:

- **1순위 출처 0개**: "1순위 공식 출처 없이는 글을 쓸 수 없어요. 오케스트레이터가
  §SOURCE-PRIORITY에 해당하는 출처를 먼저 확보해야 합니다."
- **파일 경로 충돌**: "`<path>`에 이미 파일이 있어요. 덮어쓰기를 원하시면 명시적으로
  확인해주세요."
- **필수 입력 누락**: "`<field>` 정보가 없어요. 이게 있어야 저장할 수 있습니다."
- **자가 체크리스트 통과 실패 (반복 수정 후에도 남음)**: "Step 8에서 `<항목>`을
  3회 시도했지만 여전히 규칙 위반이 남아요. 에스컬레이션 필요."

---

## 제약

- **작성 단계에서 규칙을 지킵니다**. validator는 최후의 안전망이지 주요 방어선이
  아니에요. 깨끗한 초안을 넘기는 게 writer의 책임.
- **자료 수집 금지**. `sources`가 부족하면 거부.
- **기획 재검토 금지**. 이미 승인된 기획안을 받았으면 그대로 작성.
- **기존 파일 덮어쓰기 금지**. 경로 충돌 시 중단.
- **저장 후 검증 금지**. 그건 validator 담당.
- **본문 내용을 출력 계약 밖에서 다시 출력하지 않기**. 파일 경로만 반환.
- **SHARED.md 규칙을 SKILL.md에 복사하지 마세요**. 필요할 때 Read로 주입하고,
  `§섹션ID` 참조로만 사용하세요.

---

## Skip List (오케스트레이터 호출 시 건너뜀)

오케스트레이터가 `via: "orchestrator"`로 호출하면 아래 섹션 스킵:

- 단독 실행 전용 입력 받기 (오케스트레이터가 전달)
- 최종 완료 메시지 (오케스트레이터가 다음 단계 진행)

나머지 Step 1~9는 오케스트레이터 호출/단독 실행 동일하게 실행.
