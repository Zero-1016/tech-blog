# SHARED.md — 블로그 글쓰기 공통 규칙 SSOT

이 파일은 `blog` skill 패밀리의 모든 규칙을 한 곳에 모은 Single Source of Truth입니다.
각 skill(validator, expression-review, coherence-review, draft-review, writer, blog-write)은
필요한 섹션을 Read로 주입받아 사용합니다.

규칙을 고칠 때는 **반드시 이 파일만 수정**하세요. 각 skill 파일에 같은 규칙을
중복으로 쓰지 마세요. 중복을 발견하면 즉시 SHARED.md 참조로 바꾸세요.

섹션 ID 규칙: `§카테고리-이름` 형식. 다른 skill에서 참조할 때 이 ID를 사용합니다.

---

## §BLOG-VOICE — 블로그 어조 정의

이 블로그는 **구어 존댓말**이 기본입니다. 설명서가 아니라 카페에서 동료가 설명해주는
느낌이에요. Lydia Hallie / Josh Comeau 스타일로 인터랙티브하고 시각적인 한국어 기술 글.

### 어미 비율 (전체 종결 어미 기준)

- `~에요/~예요`, `~죠`, `~거든요`, `~고요`, `~어요` — **70% 이상** (주력)
- `~입니다/~합니다` — **30% 이하** (강조·전환·마무리에만)
- `~다`, `~이다`, `~한다`, `~된다`, `~있다` (반말 문어체) — **절대 금지**

반말 문어체는 블로커급 위반입니다. 교과서처럼 읽혀서 블로그 톤이 완전히 망가져요.

### 실제 블로그 톤 예시 (기존 글에서 추출, 이 톤을 따라해야 함)

- "셋 다 틀린 말이 아닙니다. 그래서 더 혼란스럽죠."
- "저도 몇 번을 겪었어요."
- "처음엔 'Flex만 알면 되지 않나' 싶은 게 당연해요. 저도 그랬거든요."
- "비유하자면 아파트예요."
- "여기가 진짜 함정입니다."
- "직접 한 번 지워보세요."
- "범인은 숫자가 아니에요."
- "어찌어찌 calc로 욱여넣고 나서 생각하죠. '이게 맞나?'"

### 구어 접속사 우선

- "그런데" → "근데"
- "하지만" → "다만"
- "따라서" → "그래서"

---

## §RULE-EMDASH — em-dash(`—`) 전면 금지

**규칙**: 파일의 **모든 위치**에서 em-dash(`—`, U+2014)를 쓰지 않습니다. 예외 없음.

### 적용 범위 (전부 해당, 예외 없음)

- 본문 단락
- 헤딩 (H1~H6)
- frontmatter (`title`, `description`, `tags` 등 모든 필드)
- `<References>` 컴포넌트의 `title`, `description`
- `<Callout>` 내부 인용문 및 풀이
- `<CodePlayground>` 의 `code` prop 내부 (코드, 주석, 문자열 리터럴 전부)
- `<CodePlayground>` 의 `css` prop 내부
- `<AnimatedStep>` 의 `title`, `content`, `code`
- `<VideoEmbed>` 의 `title` 등 모든 prop
- `<FlowDiagram>` 의 `caption`, `nodes` 배열 안 `title`/`description`, `edges` 배열 안 `label`
- 코드 블록(` ``` `) 내부 (주석, 문자열, 출력 예시 전부)
- 인라인 코드(`` ` ` ``) 내부
- JSX prop 값 전체
- 내부 링크 텍스트 및 링크 제목

**"모든 위치"의 의미**: grep으로 `—`(U+2014)를 검색했을 때 **단 한 건이라도 매칭되면
에러**. 파일 어디에 있든, 어떤 맥락이든, 주석이든 문자열이든, 무조건 수정 대상.

### 대체 방법

- 짧은 하이픈(`-`)으로 치환
- 길이가 길면 쉼표(`,`) · 마침표(`.`) · 괄호(`()`)로 끊기
- 문맥에 따라 "그리고", "또는", "즉" 같은 연결어로 풀어쓰기

### 왜 전수 검사인가

em-dash는 영어권 AI 글쓰기의 가장 강한 시그널입니다. 한국어 블로그에 남아 있으면
즉시 AI가 작성했다는 증거가 되거든요. 독자가 본문에서 발견하든, 코드 예시 주석에서
발견하든, 개발자 도구로 소스를 열어봤다가 발견하든, **한 번만 발견돼도 글 전체의
신뢰가 떨어집니다**.

"코드 블록 안은 예외로 둬도 되지 않나?" 싶을 수 있지만:

1. CSS/JS/React 코드에 em-dash가 정당하게 필요한 경우가 거의 없음
2. 예외를 두면 검출 로직이 복잡해지고, 그 틈으로 본문 em-dash가 섞여 들어올 가능성 생김
3. 전수 검사가 default면 빠뜨린 em-dash가 나올 확률이 0에 수렴

정말 드물게 **코드 예시에 em-dash 문자 자체가 필수인 경우**(예: Unicode 처리 예제,
타이포그래피 관련 데모)가 생기면 그때 개별 예외로 승인받으세요. default는 전수 금지.

### 검출 전략

**1단계: grep 전수 검사**

```bash
grep -n '—' <file>
```

이 명령이 **한 건이라도** 출력하면 에러. 각 매칭 라인과 라인 번호를 수정 대상으로
보고합니다.

**2단계: 보고 형식**

각 매칭 건에 대해:

- 라인 번호
- 원문 (앞뒤 10자 정도 맥락 포함)
- 맥락 분류 (본문 / 코드 블록 / JSX prop / frontmatter / References 등)
- 수정 제안 (짧은 하이픈 / 쉼표 / 괄호 중 어느 쪽이 자연스러운지)

**맥락 분류를 함께 보고하는 이유**: 수정 제안의 톤이 맥락마다 다르기 때문.
본문에서는 쉼표가 자연스러운데, 코드 주석에서는 콜론이나 짧은 하이픈이 더 어울릴 수
있어요. validator가 맥락을 함께 알려주면 오케스트레이터(또는 validator 본인이 직접
Edit할 때)가 더 나은 치환을 고를 수 있습니다.

### 예시

**본문**:

- ❌ `간단한 개념 — 쌓임 맥락 — 만 알면 끝나요`
- ✅ `간단한 개념, 쌓임 맥락만 알면 끝나요`
- ✅ `간단한 개념(쌓임 맥락)만 알면 끝나요`

**frontmatter**:

- ❌ `title: "Flexbox — 2D 레이아웃의 함정"`
- ✅ `title: "Flexbox로 2D 레이아웃을 만들 때의 함정"`

**References description**:

- ❌ ``description: "`flex` — 한 방향만 해결하는 도구"``
- ✅ ``description: "`flex`가 한 방향만 해결하는 이유"``

**코드 블록 주석**:

- ❌ `// flex-item — 고정 width 주의`
- ✅ `// flex-item, 고정 width 주의`
- ✅ `// flex-item: 고정 width 주의`

**CodePlayground code prop 내부**:

- ❌ ``code={`const items = [ /* header — nav — footer */ ];`}``
- ✅ ``code={`const items = [ /* header, nav, footer */ ];`}``

**AnimatedStep content**:

- ❌ `{ title: "1단계", content: "flex-direction 설정 — row가 기본값" }`
- ✅ `{ title: "1단계", content: "flex-direction 설정 (row가 기본값)" }`

**인라인 코드 인접**:

- ❌ `` `box-sizing` — 박스 계산 방식 ``
- ✅ `` `box-sizing`, 박스 계산 방식 ``

### 재발 방지

writer skill이 글을 저장할 때 이 규칙을 먼저 인지하고 있으면 애초에 em-dash가 파일에
들어가지 않습니다. validator는 최후의 안전망이지 주요 방어선이 아니에요. 그래서
§RULE-EMDASH는 **writer 프롬프트와 validator 프롬프트에 둘 다 주입**되어야 합니다.
(writer가 미리 막고, validator가 혹시 새어 나온 걸 잡음)

---

## §RULE-COLON — 콜론(`:`) 정의식 구조 금지

### §RULE-COLON-BODY — 본문 단락의 "키워드: 설명" 정의식

**규칙**: 본문 단락에서 "핵심은: ...", "이유: ...", "결론: ..." 같은 정의식 콜론 사용이
섹션마다 반복되면 안 됩니다. 문장 안에 자연스럽게 녹이거나, 필요하면 H3/구조로 분리하세요.

**검출**: 본문 단락에서 `[명사/짧은 구]: [설명]` 패턴이 반복되는 위치. 코드 블록 안이나
JSX prop의 콜론은 대상 아님.

### §RULE-COLON-HEADING — 헤딩/title/description의 "키워드: 요약" 구조 (확정 위반)

**규칙**: 헤딩(H1~H6), frontmatter `title`, `description`에 `## SPA: 한 줄이면 시작` 같은
"키워드: 요약 한 줄" 형태는 **확정 위반**입니다. 자연스러운 한국어 구로 풀어쓰세요.

**왜**: AI 티가 가장 강한 패턴 중 하나. 주관이 아니라 확정 위반이므로 반드시 수정합니다.

**예시**:

- ❌ `## SPA: 한 줄이면 시작` → ✅ `## SPA에서 한 줄로 시작하기`
- ❌ `## view-transition-name: 요소 이어주기` → ✅ `## view-transition-name으로 요소 짝짓기`
- ❌ `title: "페이지 전환: 브라우저에 맡기기"` → ✅ `title: "페이지 전환을 브라우저에 맡기기"`
- ❌ `description: "한 줄이면 끝: DOM 교체의 빈 틈을 브라우저가 채운다"`
  → ✅ 구 두 개를 자연스럽게 이어붙이기

**예외 (통과)**:

- **백틱 안의 CSS 식별자·의사요소**가 콜론을 포함하는 경우:
  - ``## `:has()` 셀렉터의 동작`` ✅
  - ``## `::view-transition` 트리 구조`` ✅
  - ``## `box-sizing: border-box` 이해하기`` ✅
- 콜론이 **완전히 백틱 안에 갇혀 있어야** 예외. 백틱 밖으로 나오면 위반.

**검출 전략**:

1. `grep -nE '^#{1,6} .+:.+' <file>`로 본문 헤딩 중 콜론 포함 라인 수집
2. 매칭된 라인에서 콜론이 백틱(`` ` ``) 안에 갇혀 있으면 스킵
3. 그 외는 전부 위반
4. frontmatter 영역(첫 `---` ~ 둘째 `---`)에서 `^title:` / `^description:` 줄의
   **따옴표 안 값**에 `: `(콜론+공백) 또는 영문자 뒤 `:`가 있으면 위반
5. YAML 구분자 `:`(키 뒤 첫 콜론)와 혼동 금지

---

## §RULE-BOLD — 강조(`**`) 사용 맥락 구분

**핵심 규칙**: `**bold**`는 **마크다운 문맥에서만 동작**합니다. JSX prop 값 안에서는
리터럴로 노출되므로 사용 금지입니다.

### §RULE-BOLD-WHERE — 어디서 `**`를 쓸 수 있는가

**✅ 동작함 (마크다운 문맥)**:

1. **본문 단락** — H2/H3 아래 평범한 문단
2. **`<Callout>` 내부의 본문 텍스트** — Callout은 children이 마크다운으로 파싱됨
3. **`<Callout>` 내부의 그룹 헤딩** (`**반응형**` 같은)

**❌ 동작 안 함 (JSX prop 값 / JS 문자열)**:

1. **`<AnimatedStep steps={[...]}>` 의 `title`, `content`** — 배열 안의 문자열은
   JSX prop 값이라 마크다운 파싱 안 됨
2. **`<References items={[...]}>` 의 `title`, `description`** — 동일
3. **`<CodePlayground>` 의 `code`, `css` prop** — 템플릿 리터럴 문자열
4. **`<VideoEmbed title="...">` 의 prop 값**
5. **`<FlowDiagram>` 의 `caption` 및 `nodes`/`edges` 배열 안 객체 값** (`title`, `description`, `label`)
6. **frontmatter의 `title`, `description`, `tags`** — YAML 문자열
7. **JSX 컴포넌트의 모든 prop 값** (문자열, 배열 안 객체의 값, 객체 prop)

### §RULE-BOLD-HOW — 어떻게 강조할 것인가

**마크다운 문맥**: `**text**` 사용 가능. 단 한글 인접 시 닫기 규칙 주의 (§RULE-BOLD-KOREAN).

- ❌ `**word-break**에서는` — 닫는 `**` 뒤가 한글이면 닫히지 않음
- ✅ `**word-break** 에서는` (공백 추가)
- ✅ `**word-break**.` (구두점 추가)
- ✅ `<strong>word-break</strong>에서는` (안전한 대안)

**JSX prop 값 안**: `**` 사용 **금지**. 강조가 꼭 필요하면 다음 중 선택:

- **그냥 빼기**: prop 값에서 강조는 대부분 불필요. 그냥 쓰기
- **따옴표 감싸기**: `content: '진짜 "함정"은 여기서 시작됩니다'`
- **분리**: 강조가 필요한 내용이면 JSX 컴포넌트 prop이 아니라 본문으로 빼기
- **JSX 문자열이 아닌 children인 경우**: `<Callout>` 내부처럼 children이 마크다운
  파싱되는 자리로 이동

### §RULE-BOLD-EXAMPLES — 실전 예시

**✅ 올바른 사용**:

```mdx
본문 단락에서 **word-break** 를 다룹니다.

<Callout variant="warning">
**주의사항**

이 동작은 **브라우저마다 다를 수 있어요**. 특히 사파리에서는...

</Callout>
```

**❌ 리터럴 노출 (AI 생성 티가 가장 강하게 나는 자리)**:

```mdx
<AnimatedStep
  steps={[
    {
      title: "1단계",
      content: "먼저 **flex-direction**을 설정합니다",
    },
  ]}
/>

<References
  items={[
    {
      id: "mdn-flex",
      title: "MDN - **Flexbox**",
      description: "**1차원** 레이아웃 설명",
    },
  ]}
/>
```

위 두 예시는 렌더 시 `**` 문자가 그대로 노출됩니다. 수정:

```mdx
<AnimatedStep
  steps={[
    {
      title: "1단계",
      content: "먼저 flex-direction을 설정합니다",
    },
  ]}
/>

<References
  items={[
    {
      id: "mdn-flex",
      title: "MDN - Flexbox",
      description: "1차원 레이아웃 설명",
    },
  ]}
/>
```

**프로 팁**: JSX prop 값의 텍스트는 **강조 자체가 필요하지 않도록** 문장을 구성하세요.
AnimatedStep의 `content`는 이미 "이 단계"에 주목하는 구조라서 내부에서 추가 강조를 할
이유가 거의 없고, References의 `title`/`description`도 글 자체가 "참고 자료"로 맥락이
잡혀 있어서 굳이 bold할 게 없어요.

### §RULE-BOLD-DETECTION — 검출

**검출 전략 1: JSX prop 값 안의 `**` 찾기 (확정 에러)\*\*

MDX 파일에서 JSX 컴포넌트 블록을 파싱해 prop 값 문자열 내부의 `**` 사용을 전부 에러로
보고합니다.

```bash
# 1차 스캔: 전체 ** 사용 위치
grep -nE '\*\*[^*]+\*\*' <file>

# 2차 판단: 해당 라인이 JSX 컴포넌트 블록 내부인지
# (여는 `<Component` 와 닫는 `/>` 또는 `</Component>` 사이)
```

판단 기준:

- 매칭 라인이 JSX 컴포넌트의 prop 값 안(특히 `steps={[...]}`, `items={[...]}`,
  `code={\`...\`}`, `title="..."`) → **확정 에러**
- 매칭 라인이 `<Callout>` children(여닫는 태그 사이의 본문) → 통과
- 매칭 라인이 본문 단락 → 통과 (단 §RULE-BOLD-KOREAN 한글 인접 체크는 별도)

**검출 전략 2: frontmatter의 `**` 찾기 (확정 에러)\*\*

```bash
# 첫 `---` 부터 둘째 `---` 사이에 ** 있으면 에러
awk '/^---$/{c++} c==1 && /\*\*/' <file>
```

### §RULE-BOLD-KOREAN — 한글 인접 함정 (마크다운 문맥 한정)

마크다운 문맥에서 `**`를 쓸 때는 한글 인접 문제가 있습니다. 이건 §RULE-BOLD-WHERE의
"동작함" 영역에만 해당하는 부가 규칙이에요.

**규칙**: 마크다운 문맥의 `**text**` 뒤에 **한글 음절이 바로 붙으면 안 됩니다**.
공백이나 구두점(`.`, `,`, `)`, `!`, `?`)이 와야 합니다.

- ❌ `**word-break**에서는`
- ✅ `**word-break** 에서는`
- ✅ `**word-break**.`
- ✅ 또는 `<strong>word-break</strong>에서는` (인접 상관없이 안전)

**인용부호 감싸기 주의**: `"..."`로 감싼 텍스트를 `**`로 한 번 더 감싸지 마세요.
CommonMark 파싱이 꼬입니다.

- ❌ `**"핵심 문제"**`
- ✅ `<strong>"핵심 문제"</strong>`
- ✅ 또는 `"**핵심 문제**"` (인용부호가 바깥)

### §RULE-BOLD-ITALIC — 이탤릭(`*text*`)도 동일 규칙

이탤릭도 마크다운 문맥에서만 동작하고 JSX prop 값 안에서는 리터럴로 노출됩니다. 한글
인접 시 닫기 규칙도 동일. `<em>` 태그가 안전한 대안입니다.

- ❌ `*stacking context*는` (한글 인접)
- ✅ `*stacking context* 는`
- ✅ `<em>stacking context</em>는`

---

## §RULE-FORBIDDEN-PATTERNS — AI 티 나는 표현 패턴

### §RULE-PARALLEL-THREE — 병렬 삼단 구조

**규칙**: "빠르고, 안전하고, 쉽습니다" 같은 3단 병렬 나열이 섹션마다 반복되면 AI 티입니다.
한 글에서 2번 이상 나오면 지적 대상.

**판단 기준**: 형용사/명사/동사구 3개를 쉼표로 이어붙인 패턴이 반복되는지. 한 번은 자연스러울
수 있지만, 같은 구조가 여러 섹션에서 반복되면 기계적.

### §RULE-HYPE — 과장 형용사

**규칙**: 마케팅성 형용사를 구체적 동작·수치·예시로 치환합니다.

**금지 단어**: "완벽한", "강력한", "혁신적인", "놀라운", "최고의", "획기적인", "효율적인",
"최적화된", "간편한"

**판단 기준**: 문맥에서 구체성을 제거한 칭찬 단어면 위반. 기술 문서에서 "강력한 타입 시스템"
같은 관용구는 예외적으로 허용할 수 있지만, 대체할 구체 표현이 있으면 그쪽이 낫습니다.

### §RULE-META — 메타 문장

**규칙**: 본문을 예고/정리하는 메타 문장은 금지. 바로 본론으로 들어가세요.

**금지 패턴**:

- "이번 글에서는 ~를 다뤄보겠습니다"
- "~를 살펴보겠습니다"
- "~를 알아보겠습니다"
- "결론적으로 말씀드리면"
- "지금부터 ~을 이야기합니다"
- "~에 대해 알아봅시다"

**예외**: 시리즈 중간 편의 "다음 편 예고"는 메타가 아니라 구조 장치라서 허용.
"이 글에서는"으로 시작하는 도입은 메타지만, 한 글에 한 번 이하로 절제되면 통과.

---

## §RULE-RHYTHM — 호흡과 목소리

### §RULE-RHYTHM-VARIED — 호흡 단조로움

**규칙**: 짧은 문장과 긴 문장을 섞습니다. 한 문단이 같은 종결 어미로 3번 이상 끝나면 안 됩니다.
긴 문장이 연속 3개 이상 나오면 쪼개기 제안.

### §RULE-SELF-VOICE — 자기 목소리 부재

**규칙**: 시행착오·혼잣말·1인칭 경험이 한 줄도 없으면 AI 티가 납니다. 글 1~2군데에
"처음엔 이게 왜 안 되나 싶었어요", "저도 그랬거든요" 같은 한 줄을 넣으세요.

**필수 아님**, 하지만 AI 티 억제에 효과적입니다. 길이가 긴 글(3000자 이상)에서 한 줄도 없으면
반드시 지적, 짧은 글에서는 권장.

---

## §RULE-BARE-LIST — bare 마크다운 리스트 금지

**규칙**: `.prose` 스타일이 `list-style: none`이라 본문의 bare `- 항목` / `1. 항목`은
**마커가 렌더되지 않고** 들여쓴 문단처럼 보입니다. 본문에서 bare 리스트 사용 금지.

**대체 방법**:

- 항목 2~4개 → 문단으로 풀어쓰기 ("첫째는 X, 둘째는 Y")
- 시간 순서 단계 → `<AnimatedStep>`
- 정적 구조·분기·다층 → `<FlowDiagram>`
- 팁/경고 → `<Callout>` 안에 넣거나 리스트 마커를 문자 그대로(`• 항목`, `(1) 항목`, `- 항목`)
- 강조 나열 → `<strong>` 또는 H3로 섹션 분리

**예외 (통과)**:

- `<Callout>` **내부**에서 `• 항목` / `(1) 항목` / `- 항목`처럼 마커가 텍스트에 포함된 형태
- `<References items={[...]} />`의 JSX 배열 (리스트 아님)
- 코드 블록(` ``` `) 안의 리스트

**검출**: 본문 라인 시작이 `- ` 또는 `N. `이면 에러 후보. 주변 컨텍스트 확인해 예외 여부 판단.

---

## §RULE-ENGLISH-QUOTE — 영어 원문 인용의 한글 풀이

**규칙**: 스펙·공식 문서의 영어 문장을 인용하면 **바로 아래에 한국어 풀이**가 붙어야 합니다.

**형식**:

- `<Callout variant="warning">` 또는 `variant="info"` 안에 배치
- 첫 줄: `"원문 문장." - 출처`
- 빈 줄
- 글쓴이 목소리로 풀어쓴 한국어 한 줄

**축자 번역 금지**. "(번역) ..."처럼 기계적으로 옮기지 말고 본문 톤으로 이어받으세요.
용어는 원문 그대로(`flex-item`, `stacking context`) 유지.

**예시**:

```mdx
<Callout variant="warning">
"If you are using flexbox and find yourself disabling some of the flexibility, you probably need to use CSS grid layout." - MDN

flex-item에 고정 width를 박고 있다면, 그건 "Flex의 유연성을 꺼서" 2D를 흉내 내고 있는 겁니다. Grid 한 줄이면 끝날 일이에요.

</Callout>
```

**검출**: 본문에 영어 문장 단위 인용구(`"If ... ."` 등)가 있는데 아래 한국어 풀이가 없는 경우.

---

## §RULE-LINK-PATH — 내부 링크 경로 규칙

**규칙**: 이 블로그의 내부 링크는 **두 가지 경로 형식만** 유효합니다.

- 단편: `/posts/<slug>`
- 시리즈 인덱스: `/series/<seriesSlug>`
- 시리즈 편: `/posts/<partSlug>` — 단편과 동일 형식. slug 는 **파일명 단일 세그먼트**.
  디스크상 `content/posts/<folder>/<file>.mdx` 여도 URL 은 `/posts/<file>` (폴더 제외).
  velite.config.ts 가 slug 를 파일명만 추출하기 때문 (`parts[parts.length - 1]`).

**금지 패턴**:

- `/blog/<slug>`, `/post/<slug>`, `/articles/<slug>` 등 임의 접두사 (404)
- `.mdx` 확장자 포함 (`/posts/foo.mdx` 금지)
- `http(s)://` 풀 URL (내부 링크인데 외부 URL 형식으로 쓰면 안 됨)
- `content/posts/...` 파일 경로 그대로
- `/posts/<folder>/<slug>` — URL 에 폴더 경로 포함. 디스크상 파일이 존재해도 라우트는 404

**slug 실존 확인**:

- `/posts/<slug>` → slug 에 `/` 포함 금지 (확정 에러). 단일 세그먼트인 경우에만
  `content/posts/<slug>.mdx` 또는 `content/posts/*/<slug>.mdx` Glob 매칭.
- `/series/<seriesSlug>` → `content/posts/<seriesSlug>/` 디렉토리 존재 + 편들의 frontmatter
  `series` 값 일치

**검출 전략** (grep):

1. `\]\([^)]+\)` + `grep -vE` 로 `/posts/|/series/|https?://|#` 제외 — 접두사 위반
2. `\]\(/blog/` / `\]\(/post/` / `\]\(/article` — 흔한 실수
3. `\]\([^)]*\.mdx\)` — 확장자 포함
4. `\]\(content/posts/` — 파일 경로
5. `\]\(/posts/[^)/]+/[^)]+\)` — slug 에 `/` 포함 (폴더 경로 URL)

**작성 원칙**:

- 한 글에 내부 링크 2~4개 정도. 남발 금지.
- 문장 안에 녹이기. "관련 글" 박스 금지.
- 선행 개념 → 본문 초반, 심화 주제 → 본문 후반.
- 억지 연결은 과감히 생략. 후보 없으면 없는 대로.
- `<References />` 섹션에 내부 글은 넣지 마세요 (외부 출처 전용).

---

## §RULE-EXTERNAL-MENTION — 외부 라이브러리·도구·공식 문서 인라인 링크

**규칙**: 본문에서 공식 라이브러리, 도구, 공식 문서를 **처음 언급할 때** 해당
공식 사이트로 가는 인라인 마크다운 링크를 답니다.

**대상**:

- 라이브러리/프레임워크 이름 (예: Radix UI, Next.js, Chakra UI)
- 도구/CLI/런타임 이름 (예: Webpack, Rollup, Bun)
- 표준·명세·공식 문서 이름 (예: WAI-ARIA, MDN 특정 문서)

**형식**:

- 인라인 마크다운 링크: `[Radix UI](https://www.radix-ui.com)`
- 한 글 안에서 **첫 등장 시 1회**만 링크. 같은 이름이 뒤에 또 나오면 링크 생략
- 공식 도메인을 우선. README/GitHub 저장소보다 docs 사이트 링크가 있으면 그쪽
- 링크 텍스트는 제품명 그대로 (번역·의역 금지)

**예외**:

- `<References />` 컴포넌트 내부는 대상 아님 (자료 출처 전용, §RULE-REFERENCES)
- 코드 블록·인라인 코드 안의 이름은 대상 아님
- 일반 명사(`Server Component`, `Context API` 등)는 대상 아님. 제품명이 아니기 때문
- 한 글에서 5개 이상의 라이브러리를 나열하는 문단은 가독성을 위해 일부만 링크 가능

**References 와의 차이**:

- External Mention: 본문 **인라인 링크**. 제품/도구 이름이 처음 등장하는 자리에 거는 맥락 링크.
- References: 본문 맨 아래 `<References />` 컴포넌트. **자료 출처**로 삼은 공식 문서 목록.
- 같은 사이트가 둘 다에 나올 수 있음. 예를 들어 MDN 문서를 근거로 삼으면 본문에서
  처음 MDN을 언급할 때 인라인 링크, References 배열에도 자료로 포함.

**검출**: 의미 판단이 필요해서 자동 검증 대상 아님. writer 가 작성 단계에서 준수하고,
사용자가 리뷰 시 누락 지점 보완.

---

## §RULE-TERM-INTRODUCTION — 약어·기술 용어 도입 규칙

**규칙**: 본문에서 약어, 이벤트 이름, 라이프사이클 단계 이름, API 메서드 이름
같은 기술 용어가 **처음 등장할 때** 풀어쓰기·한 줄 정의·인라인 링크 중 하나가
동반되어야 합니다. 본문에서 한 번도 풀이·정의되지 않은 용어를 결론·요약 단락에서
던지지 마세요.

### 대상

- **약어**: PWA, CDN, SSR, SSG, ISR, RSC, FCP, LCP, CLS, INP, TTI 등
- **이벤트·라이프사이클 단계 이름**: `install`, `activate`, `fetch`, `sync`,
  `beforeunload`, `installing`, `activating` 등
- **API 메서드 이름**: `skipWaiting()`, `clients.claim()`, `respondWith()` 등
- **표준·명세 약식 표기**: Background Sync, Cache Storage, IndexedDB 등

### 형식 (셋 중 하나)

1. **풀어쓰기**: "PWA(Progressive Web App)"
2. **한 줄 정의**: "PWA, 즉 브라우저에 설치 가능한 웹 앱이에요"
3. **인라인 링크 + 짧은 풀이**: "[PWA](https://web.dev/learn/pwa) 가 제공하는…"

### 예외

- §META-TITLE 의 "허용 1·2" 약어 (글의 핵심 식별자 + 대상 독자가 통상 아는 약어)
  는 본문에서도 풀이 생략 가능. 판단 기준은 글의 대상 독자
- 글의 frontmatter `tags` 와 주제 범위로 대상 독자 추정:
  - React/Next.js 글에서 `SSR` / `CSR` / `SSG` / `ISR` / `RSC` 는 풀이 생략 가능
  - 일반 브라우저·웹 표준 글에서 `PWA` / `CDN` 같은 약어는 풀이 권장
- 헤딩에 등장하는 이벤트·단계 이름은 그 헤딩 직전 본문이나 같은 단락에 한 줄
  사전 설명이 있으면 통과 (예: 헤딩 "install 과 activate 사이의 기다림" 직전에
  "install 이벤트로 설치하고, 이전 SW 통제가 풀리면 activate 으로 활성화된다"
  같은 흐름 한 줄)

### §RULE-EXTERNAL-MENTION 과의 관계

- §RULE-EXTERNAL-MENTION: **외부 제품·도구·라이브러리 이름** 의 인라인 링크
  (예: Radix UI, Next.js, Bun)
- §RULE-TERM-INTRODUCTION: **기술 용어·약어·이벤트 이름** 의 본문 풀이
- 겹치는 영역: API 명세 이름은 양쪽 다 해당 가능. 두 규칙 모두 만족하면 OK.
  예를 들어 `[Background Sync API](https://...) 가 그 자리예요` 는
  §RULE-EXTERNAL-MENTION 의 인라인 링크와 §RULE-TERM-INTRODUCTION 의 인라인
  링크 형식을 동시에 만족

### 검출

의미 판단이 필요해 자동 검증 대상 아님. coherence-review 의 E5 가 통독으로
검사하고, writer 가 작성 단계에서 준수합니다.

---

## §RULE-REFERENCES — `<References />` 규칙

**규칙**: 모든 글의 본문 맨 아래에 `<References items={[...]} />` 컴포넌트가 반드시 존재해야 합니다.

**형식**:

```mdx
<References
  items={[
    {
      id: "mdn-word-break",
      title: "MDN - CSS `word-break`",
      href: "https://developer.mozilla.org/en-US/docs/Web/CSS/word-break",
      description: "`keep-all` 동작과 브라우저 지원 범위 확인",
    },
    // ...
  ]}
/>
```

**필수 조건**:

- 최소 1개 이상의 **1순위 공식 출처** 포함 (아래 §SOURCE-PRIORITY 참조)
- 1순위 출처를 배열 **맨 위**에 배치
- `id`는 kebab-case 짧은 식별자 (예: `mdn-word-break`)
- `title`/`description`에 em-dash(`—`) 금지 (§RULE-EMDASH)
- `title`/`description`에 `**` 금지 (§RULE-BOLD-WHERE — JSX prop 값)
- `description`은 "어떤 부분을 참고했는지" 한 줄
- `href`는 캐노니컬 URL, 로그인/유료 장벽 피하기
- `## 참고` 같은 마크다운 헤딩 **금지** (컴포넌트가 자체 헤딩 렌더)

### §RULE-CITE — `<Cite id="..." />` 사용

**규칙**: 본문에서 특정 주장 옆에 하단 참고자료로 점프하는 인포 마크.

- **한 문단에 최대 1개**. 여러 출처 참고 문단이면 가장 핵심 하나만
- **본문 단락의 문장 끝에 인라인으로, 공백 없이**: `...지원됩니다.<Cite id="mdn-xxx" />`
- **JSX 컴포넌트 직후 단독 라인 금지** (확정 위반): `</Callout>`, `<AnimatedStep />`, `<CodePlayground />` 같은 JSX 블록이 닫힌 다음 빈 줄을 두고 `<Cite />` 만 단독으로 한 줄에 두면, 렌더링 시 본문 텍스트 없이 ⓘ 아이콘만 외롭게 떠서 시각적으로 끊겨요. 인용 출처는 항상 그 인용을 처음 언급하는 **본문 단락 문장 끝**에 붙이세요. JSX 블록(Callout 인용 박스 등)은 그 본문 단락 다음에 보충 자료로 따라옵니다.
- **기본 원칙 (권고, SHOULD)**: `<References items>` 에 등록한 각 출처는 본문에서 해당 사실·인용을 처음 언급하는 지점에 대응 Cite를 붙이는 것을 기본으로 합니다. 문장 흐름을 부자연스럽게 만들면 생략 가능.
- `<Cite id="X" />`의 id는 `<References items>` 배열에 반드시 존재해야 함

**올바른 예시**:

```mdx
요청이 들어오면 서버가 HTML을 조립해서 내려줘요.<Cite id="mdn-ssr" />

<Callout variant="info">
"인용 원문" - 출처

한국어 풀이.

</Callout>
```

**잘못된 예시** (확정 위반):

```mdx
요청이 들어오면 서버가 HTML을 조립해서 내려줘요.

<Callout variant="info">
"인용 원문" - 출처

한국어 풀이.

</Callout>

<Cite id="mdn-ssr" />
```

위 잘못된 예시는 Callout 박스 아래에 ⓘ 아이콘만 단독으로 떠요. 본문 단락 끝(`내려줘요.` 뒤)에 인라인으로 붙이는 게 정답입니다.

---

## §SOURCE-PRIORITY — 자료 수집 우선순위

**1순위 (필수)**: 공식 문서/명세/표준

- MDN, W3C/WHATWG, TC39, RFC
- 언어/런타임 공식 문서 (예: Node.js, Python, TypeScript 공식 문서)
- 라이브러리 공식 저장소 및 공식 문서
- `context7` MCP (`mcp__plugin_context7_context7__resolve-library-id` → `query-docs`)

**2순위**: 원저자/핵심 구현체 글

- 스펙 저자, 메인테이너 블로그
- 브라우저 엔진 블로그 (V8, Chrome dev, WebKit 등)

**3순위**: 검증 가능한 2차 자료

- 컨퍼런스 발표, 논문, 기술 컨퍼런스 토크

**4순위 (보조)**: 개인 블로그

- 개념 설명 보조용으로만
- 주장하려는 사실의 **유일한 출처**가 되면 안 됨

**필수 조건**: 최소 하나의 1순위 출처를 확보해야 합니다. 입력 URL이 개인 블로그뿐이라면
거기서 인용된 1순위 출처를 역추적해 직접 확인하세요.

**블로커 조건**: 1순위 공식 출처가 0개이거나, 개인 블로그/커뮤니티 글만으로 구성된 경우.

---

## §DOMAIN-WHITELIST — 공식 도메인 화이트리스트 (포인터)

1순위 출처 판정에 쓰는 도메인 목록입니다. 실제 리스트는 별도 설정 파일에
분리되어 있어요:

**파일**: `.claude/skills/blog-shared/config/domains.md`

### 왜 분리되어 있나

- SHARED.md는 한 번 정한 규칙이 잘 안 바뀌는 SSOT. 도메인 리스트는 새 프레임워크,
  새 공식 문서가 나올 때마다 수정될 가능성이 높음.
- 이 스킬 패밀리를 다른 개발자가 포크해서 쓸 때, 자기 관심사에 맞게 화이트리스트를
  고치는 건 잦은 편집이라 분리된 설정 파일이 관리 편함.
- 여러 skill(blog-research, blog-validator, blog-draft-review)이 같은 리스트를
  참조하므로 한 곳에서 관리.

### 참조하는 skill

- `blog-research` — 1순위 출처 자동 판정
- `blog-validator` — References의 1순위 출처 포함 여부 체크 (Phase 4-1)
- `blog-draft-review` — (나중에) 출처 품질 검증

### 섹션 구조

`config/domains.md` 안의 섹션 ID:

- `§DOMAIN-PRIORITY-1` — 공식 문서/명세/표준
- `§DOMAIN-PRIORITY-2` — 원저자/구현체 블로그
- `§DOMAIN-PRIORITY-3` — 컨퍼런스/논문
- `§DOMAIN-BLACKLIST` — 참고 금지
- `§DOMAIN-UNCLASSIFIED` — 미분류 (자동 4순위)

### 수정 방법

- `blog-rule-editor` 스킬로 수정 (권장)
- 또는 직접 편집 후 CHANGELOG.md 에 기록

---

## §META-TITLE — 제목(title) 품질 규칙

- 한국어 **20자 이내**
- 클릭하고 싶은 질문·호기심 유발형 우선 ("왜 ~할까", "~하는 이유")
- 군더더기 단어 제거: "이야기", "살펴보기", "알아보기", "~에 대한 정리"
- 키워드가 드러나 있어야 함
- "키워드: 요약" 콜론 구조 금지 (§RULE-COLON-HEADING)
- em-dash 금지 (§RULE-EMDASH)
- 반말 문어체 종결 금지 (`~이유다`, `~필요하다` 등)
  - 예외: `"Flexbox만으로는 부족하다"`처럼 구어 톤과 어울리는 단정형은 허용
  - 판단 기준: 본문 톤과 어울리는 자연스러운 구인가
- 약어/전문용어를 제목 전면에 주어로 내세울지는 대상 독자 기준으로 판단할 것 (기본은 풀어 쓰기)
  - 현상·결과·체감을 한국어로 풀어 제시하는 게 기본
  - 허용 1: 글의 핵심 기술 식별자(`Object.assign`, `useMemo`, `will-change` 등). 글 자체가 그 식별자를 다룸
  - 허용 2: 대상 독자가 통상 아는 약어
    - 대중 약어: `npm`, `CSS`, `API`, `DOM`, `URL` 등
    - 생태계 약어: `RSC`, `SSR`, `CSR`, `ISR`, `SPA` 같은 React/Next 생태계 글이 대상이면 허용
  - 풀어 쓰기 권장: 성능 지표 약어(`LCP`, `CLS`, `TTI`, `FID`, `INP`)는 대중 웹 독자층을 가정하면 풀어 쓰기. 단, 지표 이름 자체가 독자가 검색해 들어오는 키워드인 글(지표 정의·측정 글)은 허용
  - 판단 기준: 글의 대상 독자가 제목만 보고 주제를 감 잡을 수 있는가
  - 예: "LCP와 CLS가 나빠지는 두 범인" → "이미지와 폰트만 잡아도 점수가 돌아온다"

## §META-DESCRIPTION — 설명(description) 품질 규칙

- **50자 내외**
- 독자가 겪는 장면/막히는 지점을 구체적으로
- 본문 요약이 아니라 **"이 글이 풀어주는 문제"** 한 문장
- **존댓말 구어체가 기본** (블로그 전체 어조와 일치)
- 반말(`~다`, `~이다`) 금지
- 교과서 문체(`~학습합니다`, `~소개합니다`) 금지
- 콜론 구조 금지 (§RULE-COLON-HEADING)
- em-dash 금지 (§RULE-EMDASH)
- `**` 금지 (frontmatter는 JSX prop 값에 준함, §RULE-BOLD-WHERE)
- 약어/전문용어도 §META-TITLE 동일 원칙 적용. 대상 독자 기준으로 판단하고, 대중 독자면 풀어 쓰기

**기존 톤 예시**:

- "Tailwind냐 CSS-in-JS냐는 취향 싸움이 아닙니다. 각자 다른 문제를 푸는 도구예요."
- "z-index를 아무리 올려도 안 먹히는 순간이 있습니다. 범인은 숫자가 아니에요."

---

## §COMPLEXITY — 복잡도와 분량 판단

**단편 vs 시리즈**:

- **단편 (1편)**: 하나의 개념/문제/패턴을 1편에 담을 수 있을 때
- **시리즈 (2~5편)**: 여러 하위 개념이 순차 심화되거나 3000자를 크게 초과할 때
- **1편은 단편으로**, **6편 이상은 과도** (억지 분할 의심)

**분량 감**:

- 1500자 ≈ 3분
- 2500자 ≈ 5분
- 3000자 ≈ 6분
- 3500자 ≈ 7분
- 5000자 ≈ 10분 (경고 - 편 분할 고려)

**기준**:

- 1편당 **1500~3000자** (한글 기준)
- H2 섹션 **3~6개** (2개면 얕고, 8개 이상이면 산만)
- 3000자 초과 → 편 분할 제안
- 1500자 미만 → 묶음 제안
- frontmatter에 읽기 시간(분) 표기 금지 - 본문 길이만 맞추면 자동 계산

**섹션 구조 원칙**:

- 오프닝: 이론 나열 금지, **독자가 마주하는 실제 문제**에서 출발
- 핵심 메시지 한 줄로 명확
- 각 섹션이 하나의 명확한 역할
- 시리즈 중간 편 → "다음 편 예고"
- 시리즈 마지막 편 → "시리즈 회고"
- 단편 → 핵심 요약 + 한 걸음 더 힌트

---

## §FRONTMATTER — Frontmatter 스키마 (velite.config.ts 기준)

**시리즈 편**:

```yaml
---
title: "<편 제목>"
description: "<한 문장 설명, 50자 내외>"
date: <YYYY-MM-DD>
tags: ["<태그1>", "<태그2>", "<태그3>"]
series: "<시리즈 제목 - 모든 편이 완전히 동일>"
seriesOrder: <1부터 시작>
published: true
---
```

**단편**: `series` / `seriesOrder` 필드 생략.

```yaml
---
title: "<글 제목>"
description: "<한 문장 설명, 50자 내외>"
date: <YYYY-MM-DD>
tags: ["<태그1>", "<태그2>", "<태그3>"]
published: true
---
```

**필수 조건**:

- `title`, `description`, `date`, `tags`, `published` 필드 존재
- `date`는 `YYYY-MM-DD` 형식
- `tags`는 배열이고 비어있지 않음
- `tags` 항목은 약어가 있으면 약어형 사용 (§META-TITLE 허용 1·2 기준 재사용)
  - 예: "React Server Components" → `"RSC"`, "Server-Side Rendering" → `"SSR"`
  - 이유: 태그는 식별 라벨이라 짧고 일관된 형태가 검색·중복 방지에 유리
  - §META-TITLE 에서 "풀어쓰기 권장"으로 분류된 성능 지표 약어(`LCP`, `CLS` 등)도 tags 에서는 약어형 허용 — 태그는 검색 키워드성이 우선
  - 판단 기준: 대상 독자가 해당 약어를 식별자로 인지하는가
- `published: true`
- `title`/`description`에 콜론 구조 금지 (§RULE-COLON-HEADING)
- `title`/`description`에 em-dash 금지 (§RULE-EMDASH)
- `title`/`description`에 `**` 금지 (§RULE-BOLD-WHERE)
- 본문에 frontmatter 구분자(`---`) 중복 금지 (시작/끝 각 1회 = 총 2줄만)

**시리즈 추가 조건**:

- 모든 편에 `series` + `seriesOrder` 존재
- 모든 편의 `series` 문자열 **완전히 동일** (오타·공백·접미사 차이 전부 에러)
- `seriesOrder`가 1부터 시작, 중복/결번 없음
- `tags`가 편끼리 통일

**단편 조건**:

- `series` / `seriesOrder` **미포함**

---

## §MDX-COMPONENTS — 사용 가능한 MDX 컴포넌트

```jsx
<Callout variant="tip|warning|info|error">
내용
</Callout>

<AnimatedStep steps={[
  { title: "제목", content: "설명", code: "코드(선택)" },
  { title: "제목", content: "설명" }
]} />

<CodePlayground
  code={`코드 내용`}
  css={`선택: 별도 CSS`}
  template="react"
  showPreview={true}
/>

<VideoEmbed src="https://youtube.com/watch?v=..." title="제목" />

<FlowDiagram
  height={360}
  caption="다이어그램 설명"
  nodes={[
    { id: "a", title: "노드 제목", description: "한 줄 설명", x: 0, y: 0, kind: "accent" },
    { id: "b", title: "다른 노드", x: 200, y: 0 }
  ]}
  edges={[{ from: "a", to: "b", label: "관계", animated: true }]}
/>
```

### §MDX-ANIMATEDSTEP — AnimatedStep title 번호 금지

컴포넌트가 왼쪽에 자동 번호 뱃지(1, 2, 3…)를 렌더링합니다.
`title`에 수동 번호를 넣으면 이중 번호가 돼요.

**금지 패턴** (확정 에러):

- `"1. 토큰 추출"` → `"토큰 추출"`
- `"1단계: 기본 동작 이해하기"` → `"기본 동작 이해하기"`
- `"Step 1. Parse"` → `"Parse"`
- `"1단계"` (번호만 있는 경우) → content에서 핵심 키워드를 뽑아 title로

**검출**:

AnimatedStep 블록 안의 title 값에서 번호 접두사를 찾습니다:

```bash
grep -nE 'title:\s*"[0-9]+[\.\s단]' <file>
grep -nE 'title:\s*"Step\s*[0-9]' <file>
```

매칭되면 확정 에러. 번호 접두사(`\d+[\.\s]*단?계?[\.\s:：-]*`)를 제거하고,
남는 제목이 빈 문자열이면 content에서 핵심 키워드를 뽑아 title로 씁니다.

**자동 수정**: 번호 접두사 제거만으로 해결. writer/validator 모두 자동 수정 가능.

### §MDX-FLOWDIAGRAM — FlowDiagram 사용 규칙

**사용 시점**: 노드 사이의 정적 관계, 분기, 다층 구조를 시각화할 때.

- 다층 구조: 캐시 위계, 네트워크 스택, 권한 계층
- 분기 결정: 라우팅, 이벤트 분배, 캐시 hit/miss
- 요청·데이터 흐름: API 호출 경로, 메시지 전달

**AnimatedStep 과의 분리**:

- AnimatedStep: 시간 순서가 있는 단계 ("1단계 → 2단계 → 3단계")
- FlowDiagram: 정적 구조 + 분기 ("A 가 B 와 C 로 갈린다")
- 같은 자리에서 경합하면 시간 순서가 핵심이면 AnimatedStep, 분기·복귀가 핵심이면
  FlowDiagram

**제약**:

- 노드 7~8개를 넘기지 말 것. 가독성 급락
- title 한 줄 + description 한 줄 이내 (긴 설명은 본문으로 분리)
- prop 안 모든 문자열에 `§RULE-EMDASH`, `§RULE-BOLD-WHERE` 적용 (caption /
  nodes title·description / edges label)
- 좌표는 fitView 가 자동 정렬하지만 상대 위치는 수동. 가로 200px, 세로 100~150px
  간격 권장

**상세 props·좌표 가이드**: `components/ui/CLAUDE.md` 의 FlowDiagram 섹션 참조
(SSOT). FlowNode/FlowEdge 타입, kind 변형, 핸들 자동 선택 동작 등.

### §MDX-CODEPLAYGROUND — CodePlayground 규칙

**템플릿**:

- `template="react"`: 코드는 `function PascalCase() { return <div>...</div> }` 형태.
  `export default`는 자동 주입되므로 쓰지 말 것
- `template="vanilla"`: CSS 스니펫은 바로 쓰면 `/styles.css`로 자동 분리.
  JS 필요하면 `react` 권장

**props**:

- `code`는 반드시 **백틱 템플릿 리터럴**(``{`...`}``). 내부 백틱은 이스케이프
- 여러 줄 문자열 prop은 큰따옴표 금지. 무조건 템플릿 리터럴
- 중첩 템플릿 리터럴 안의 줄바꿈은 `\n`으로 (실제 개행 넣으면 포매터가 깨뜨림)
- `{`, `}`, `` ` ``, `$`는 값 안에서 이스케이프
- prop 값 안에 `**`, em-dash 금지 (§RULE-BOLD-WHERE, §RULE-EMDASH)

**import 규칙** (런타임 에러 방지):

- 사용 식별자는 전부 import 선언 필요
- Sandpack `template="react"`가 자동 주입하는 건 **`React`만** (`React.useState` 가능)
- `ReactDOM`, `flushSync`, 외부 라이브러리는 전부 명시적 import 필요
- **`ReactDOM.xxx` 네임스페이스 호출 금지** - 확정 런타임 에러
  - ❌ `ReactDOM.flushSync(() => setX(next))` (import 없음)
  - ✅ `import { flushSync } from "react-dom";` 후 `flushSync(() => setX(next))`
- 원칙: destructured import로 뽑아 쓰기
  - `ReactDOMClient.createRoot` → `createRoot`
  - 외부 라이브러리도 동일

**인라인 스타일 금지**:

- `style={{ ... }}` 덩어리를 code prop 안에 쓰지 말 것
- className으로 빼고 BEM modifier(`.box--bad`, `.sample--nowrap`)로 변형 표현
- 스타일은 `css` prop으로 분리

**검출**:

- code prop 내부에서 `\b([A-Z][A-Za-z0-9]+)\.(\w+)` 정규식으로 네임스페이스 호출 수집
- `React` 제외
- 각 이름에 대해 `import (.+ from )?"[^"]*"` 블록에 해당 식별자 존재 확인

### §MDX-DEMO-DENSITY — 인터랙티브 데모 밀도

**데모 적합 주제 판별**:

글의 주제가 아래 조건 중 2개 이상 해당하면 "데모 밀집형"으로 분류:

1. CSS 속성/선택자/레이아웃 동작을 설명 (시각적 결과가 핵심)
2. 브라우저 API를 다룸 (동작을 직접 해봐야 이해)
3. 비교 데모가 효과적 (A vs B, before/after)
4. 사용자 인터랙션이 포인트 (클릭, 호버, 스크롤 반응)

**밀도 기준**:

- 데모 밀집형: H2 섹션 중 **최소 절반**에 CodePlayground 포함. 정적 코드 블록만 있는 섹션이 2개 이상 연속하지 않을 것
- 일반형: 글 전체에 1~2개면 충분. 핵심 개념 시연용으로만
- 이론/개념형 (렌더링 파이프라인, 알고리즘 설명 등): CodePlayground 0~1개. AnimatedStep (시간 순서 단계) 이나 FlowDiagram (정적 구조·분기) 이 더 적합

**기획안 반영**:

데모 밀집형으로 분류되면 기획안의 각 섹션에 `데모: <한 줄 설명>` 항목 추가. 사용자가 GATE 1에서 데모 구성을 확인하고 조정 가능.

**검출 (blog-revise 패턴 5용)**:

1. 글에서 CodePlayground 개수 카운트
2. 정적 코드 블록(``````` 펜스) 개수 카운트
3. 주제 태그로 데모 밀집형 여부 판단
4. 밀집형인데 CodePlayground < 정적 코드 블록이면 "데모 부족" 경고

### §MDX-CHECKLIST — 체크리스트 포맷

**규칙**:

- `<Callout>` 내부에 배치
- 각 항목은 `☐`(U+2610) 문자로 시작
- 각 항목 끝에 `<br/>` (마지막 항목 선택)
- 그룹 헤딩(`**반응형**` 등) 뒤에 빈 줄 분리
- **`- [ ]` 마크다운 task list 금지**

**예시**:

```mdx
<Callout variant="info">
**반응형**

☐ 모든 화면 크기에서 텍스트가 적절히 줄바꿈되는가?<br/>
☐ 긴 URL이 레이아웃을 깨뜨리지 않는가?<br/>

**접근성**

☐ 스크린 리더가 텍스트를 올바르게 읽는가?<br/>
☐ 200% 확대 시에도 가로 스크롤이 없는가?

</Callout>
```

### §MDX-JSX-BALANCE — JSX 태그 균형

**규칙**: 모든 JSX 태그는 짝이 맞거나 self-closing이어야 합니다.

- `<Callout variant="...">` 열었으면 `</Callout>`으로 닫기
- `<CodePlayground ... />` 속성만 있으면 `/>` 자체 닫기
- `<Cite id="..." />` 여닫힘
- `<References items={[...]} />` self-closing
- **JSX 여닫는 태그 사이에 빈 줄 주의** - 마크다운 파서가 끊을 수 있음. Callout
  내부는 마크다운이지만 여닫는 태그는 붙여쓰는 게 안전

---

## §FILE-LAYOUT — 저장 경로 규칙

- **단편**: `content/posts/<slug>.mdx`
- **시리즈**: `content/posts/<seriesSlug>/<partSlug>.mdx`
- slug는 **영문 kebab-case**
- 기존 파일 덮어쓰기 금지. 경로 충돌 시 사용자 확인 후 진행
- 시리즈 디렉토리가 없으면 만들고, 한 편씩 차례로 저장

---

## §UI-USER-CHOICE — 사용자 선택지 제시 규칙

**규칙**: 사용자에게 선택지를 제시해야 하는 모든 지점에서 **반드시 `AskUserQuestion`
툴을 호출**해야 합니다. 마크다운 리스트로 선택지를 나열하는 건 **금지**입니다.

### 왜

마크다운 리스트로 선택지를 출력하면:

- 사용자가 클릭/탭 으로 응답할 수 없어요 (모바일에서 특히 불편)
- 사용자가 번호나 문장을 다시 타이핑해야 함
- Claude Code 의 UI 가 선택지를 인식 못 해서 자동화 불가

`AskUserQuestion` 툴을 호출하면:

- 선택지가 클릭 가능한 UI 요소로 렌더됨
- 사용자 응답이 구조화된 형태로 돌아옴
- 모바일/데스크톱 모두에서 일관된 UX

### 올바른 사용

```
AskUserQuestion(
  questions=[{
    "question": "어떻게 진행할까요?",
    "options": [
      "진행 — 이 기획안으로 글 작성 시작",
      "수정 — 어느 부분을 수정할지 알려주세요",
      "주제 재검토 — 자료 수집부터 다시",
      "취소"
    ]
  }]
)
```

### 절대 금지 패턴

**금지 1**: 번호 리스트로 선택지 출력

```markdown
어떻게 진행할까요?

1. 진행 — ...
2. 수정 — ...
3. 주제 재검토 — ...
4. 취소
```

**금지 2**: bullet 으로 선택지 출력

```markdown
- A) 진행
- B) 수정
- C) 주제 재검토
- D) 취소
```

**금지 3**: "어느 걸로 할까요?" 만 말하고 툴 호출 없이 대기

**금지 4**: "1, 2, 3 중에 답해주세요" 유도

### 허용되는 텍스트 출력

선택지 제시 **전에** 맥락 설명은 텍스트로 가능:

```markdown
## 기획안 검토

[기획안 본문 전체]

검토해주세요. 이 기획안으로 진행하거나, 수정하거나, 주제를 다시 잡을 수 있어요.

[AskUserQuestion 툴 호출]
```

기획안 본문 같은 **읽을 거리** 는 마크다운으로 출력. 선택지 자체만 AskUserQuestion.

### 예외

다음 경우는 AskUserQuestion 대신 자유 서술 응답을 기다려도 됨:

- 사용자 입력이 **자유 형식** 이어야 할 때 (예: "어느 섹션을 수정할지 구체적으로 알려주세요")
- 개방형 질문 (예: "어떤 자료가 더 필요한가요?")

이 경우도 **"입력 대기 중" 을 명시적으로 표시**하고 사용자 응답을 기다려야 함.
다음 작업을 자동 진행하지 않기.

### 적용 범위

이 규칙은 **모든 blog-\* skill** 에 적용됩니다. 특히:

- `blog-write`: GATE 1 (기획안 승인), Phase 2 거부, Phase 4-F 실패 복구, Phase 5 validator 선택지, velite 에러, Phase 1 중복 주제 감지
- `blog-validator`: 사용자 확인 필요 카테고리 (§RULE-COLON-HEADING 재작성 선택, §RULE-BARE-LIST 변환 선택, 유사 slug 선택 등)
- `blog-rule-editor`: 규칙 변경 승인, 영향 범위 확인
- 나중에 추가될 리뷰어 skill 들도 동일

---

## §META-FEEDBACK-HANDOFF — 메타 피드백 자동 핸드오프

**규칙**: validator / expression-review / coherence-review 등 스킬이 메인 작업을
끝낸 직후, 실행 중 사용자가 한 메시지에서 **메타 피드백** 을 자동 감지해
`blog-rule-editor` 로 라우팅한다.

**메타 피드백 정의**: 글 내용이 아니라 **스킬이나 규칙 자체** 에 대한 변경 요청.

### 감지 패턴

다음 패턴 중 하나 이상이 사용자 메시지에 포함되면 메타 피드백으로 간주:

- "이 규칙 (좀) 바꿔야겠다 / 완화 / 강화"
- "이거 너무 엄격해 / 너무 느슨해"
- "validator (또는 reviewer) 가 이거 잡으면 안 돼"
- "이런 케이스는 예외로 해줘 / 예외 추가"
- "스킬에 X 추가해줘 / 빼줘"
- "다음부터는 X 하지 말아줘 / 자동으로 X 해줘"
- "SHARED.md 의 §RULE-X 를..."
- "blog-rule-editor 로 넘겨줘 / 메타로 넘겨줘"

위 패턴이 명확하지 않더라도, 스킬이 **현재 글 작업 외의 규칙·스킬 개선 의견**
이라고 판단하면 메타 피드백으로 분류 가능.

### 핸드오프 흐름

각 스킬은 메인 작업을 마친 직후 다음 단계 실행:

1. **스캔**: 이 스킬 실행 중 사용자 메시지에서 메타 피드백 패턴 추출
2. **분류**: 각 매치를 한 문장으로 요약 (어떤 규칙/스킬에 대한 어떤 변경 요청인지)
3. **확인**: 발견 항목이 있으면 AskUserQuestion 으로 사용자 확인:

```
AskUserQuestion("작업 중 다음 의견을 들었어요. blog-rule-editor 로 넘길까요?"):
- 네, 모두 넘겨주세요
- 일부만 — 선택할게요
- 아니요, 그냥 넘어가요
```

4. **호출**: 승인 시 `Skill(skill="blog-rule-editor", args="...")` 호출. args 형식:

```
[META-FEEDBACK from <스킬명>]
- 의도 1: <한 문장 요약>
- 의도 2: ...

근거 메시지:
"<원문 인용 1>"
"<원문 인용 2>"
```

5. **종료**: blog-rule-editor 가 자체 Rails 로 처리. 호출한 스킬은 핸드오프 후 자기 작업 완료 보고.

### 발견 없음

메타 피드백이 없으면 이 단계는 **조용히 skip**. "메타 피드백 없음" 같은 안내도
출력하지 않음 (정상 동작 시 노이즈).

### 적용 범위

- ✅ 적용: validator, expression-review, coherence-review (단독 실행 + 오케스트레이터 경유 모두)
- ❌ 미적용: blog-research, blog-writer (작성 단계에서 메타 피드백 발생 드뭄)
- ❌ 미적용: blog-rule-editor 자체 (자기 자신 호출 무한 루프 방지)
- ⚠️ 선택: blog-revise 는 향후 확장 가능 (현재는 미적용)

### 안전 장치

- **사용자 확인 없이 호출 금지**: 패턴 매치만으로 자동 호출 금지 (오인식 가능). 항상 AskUserQuestion 1회.
- **조용한 skip**: 발견 없으면 출력 없음.
- **무한 루프 방지**: blog-rule-editor 가 자기 자신을 다시 호출하지 않게.
- **글 작업 우선**: 메인 작업 (validation, review) 결과 보고가 먼저, 메타 핸드오프는 그 다음.

---

## 부록: 다른 skill에서 이 파일 참조하는 법

이 파일은 **전체를 한 번에 읽지 않고** 필요한 섹션만 참조하는 용도입니다. 각 skill은
아래 패턴으로 참조하세요:

```markdown
# 예: blog-validator/SKILL.md 안에서

## 검증 규칙

em-dash 전수 검사는 SHARED.md §RULE-EMDASH 의 검출 전략을 따릅니다.
콜론 구조 검사는 SHARED.md §RULE-COLON-HEADING 의 판단 기준을 그대로 적용합니다.
`**` 검출은 SHARED.md §RULE-BOLD-DETECTION 을 참조하세요.
```

혹은 skill이 실행 시작 시점에 다음 명령으로 필요한 섹션을 Read:

```bash
# SHARED.md 전체 읽기 (권장 안 함, 토큰 낭비)
Read .claude/skills/blog-shared/SHARED.md

# 특정 섹션만 grep으로 뽑기 (권장)
grep -A 50 '^## §RULE-EMDASH' .claude/skills/blog-shared/SHARED.md
```

각 skill의 preamble에 "이 skill은 SHARED.md의 §X, §Y, §Z 를 전제합니다"를 명시하면,
오케스트레이터가 skill을 호출할 때 해당 섹션만 미리 주입해줄 수 있습니다.
