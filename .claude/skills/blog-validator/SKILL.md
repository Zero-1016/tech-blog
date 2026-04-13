---
name: blog-validator
description: |
  블로그 MDX 파일의 기술 정합성과 기계적으로 확정 가능한 표면 규칙을 검증하고
  자동 수정한다. frontmatter 스키마, JSX 균형, em-dash 전수 검사, 콜론 구조,
  `**` JSX prop 값 안 사용, bare 리스트, 내부 링크 실존, References 정합성,
  velite 스키마를 순차 검증한다. 확정 에러는 직접 Edit으로 수정하고, 애매한
  것만 사용자에게 선택지를 제시한다.

  사용 트리거: writer가 방금 MDX 파일을 저장한 뒤, 또는 사용자가 직접
  "검증해줘", "validator 돌려줘", "이 글 정합성 확인해줘" 같은 요청.

tools:
  - Read
  - Edit
  - Grep
  - Glob
  - Bash
---

# blog-validator

블로그 MDX 파일의 기술 정합성을 검증하고 **직접 수정**합니다. 확정적 에러는
자동 수정하고, 판단 여지가 있는 것만 사용자에게 선택지를 제시합니다.

**이 skill은 `.claude/skills/blog-shared/SHARED.md`를 전제**합니다. 아래 섹션을
실행 시점에 필요할 때 Read로 주입하세요:

- `§RULE-EMDASH` — em-dash 전수 금지
- `§RULE-COLON-HEADING` — 헤딩/title/description 콜론 금지
- `§RULE-BOLD-WHERE`, `§RULE-BOLD-DETECTION` — `**` 맥락 구분
- `§RULE-BARE-LIST` — bare 마크다운 리스트 금지
- `§RULE-ENGLISH-QUOTE` — 영어 인용 한글 풀이
- `§RULE-LINK-PATH` — 내부 링크 경로 규칙
- `§RULE-REFERENCES`, `§RULE-CITE`, `§SOURCE-PRIORITY` — References 정합성
- `§FRONTMATTER` — frontmatter 스키마
- `§MDX-COMPONENTS`, `§MDX-CODEPLAYGROUND`, `§MDX-CHECKLIST`, `§MDX-JSX-BALANCE` — 컴포넌트 규칙
- `§FILE-LAYOUT` — 파일 경로 규칙
- `§UI-USER-CHOICE` — 사용자 선택지 반환 형식 (오케스트레이터에게 전달 시)

---

## 입력 계약

### 오케스트레이터 호출 시

오케스트레이터가 프롬프트로 아래를 전달합니다:

- `files`: 검증 대상 파일 경로 배열 (1개 이상)
- `mode`: `"single"` (단편) 또는 `"series"` (시리즈)
- `series_name`: 시리즈일 때 기대하는 `series` frontmatter 값
- `via`: `"orchestrator"` (오케스트레이터에서 호출) 또는 생략

`via`가 `"orchestrator"`면 **skip list** 섹션들을 건너뜁니다 (아래 명시).

### 단독 실행 시 (`/blog-validator`)

- 사용자가 파일 경로를 말해주거나, "최근 작성한 글" 같은 모호한 지시 사용
- 모호할 경우 `git status`나 `ls -t content/posts/`로 최근 수정 파일 찾기
- 확인되면 바로 검증 시작

---

## Skip List (오케스트레이터 호출 시 건너뜀)

- **"최종 완료 보고"** 섹션 (오케스트레이터가 다음 단계 진행)
- **단독 실행 전용 입력 확인** (파일 경로 질문)

나머지는 단독/호출 동일하게 실행.

---

## 검증 Phase 구조

Phase 1이 실패하면 Phase 2 이후는 건너뛰고 Phase 1 수정 후 재시작합니다.
의존성이 있기 때문이에요 (구조가 깨져 있으면 콘텐츠 검사가 부정확해짐).

```
Phase 1: 구조 검증
Phase 2: 콘텐츠 표면 규칙 (SHARED.md 규칙 적용)
Phase 3: 컴포넌트 정합성
Phase 4: 참조 정합성
Phase 5: velite 스키마 실행
```

---

## Phase 1: 구조 검증

**실패 시 동작**: Phase 2 이후 건너뛰기. 구조 에러를 전부 보고하고 수정 후 재시작 요청.

### 1-1. Frontmatter 스키마 (§FRONTMATTER 참조)

각 파일의 첫 `---`부터 둘째 `---`까지 읽고 다음 필드 확인:

- `title`, `description`, `date`, `tags`, `published` 필수
- `date`는 `YYYY-MM-DD` 형식
- `tags`는 배열이고 비어있지 않음
- `published: true`
- **시리즈 모드**:
  - 모든 파일에 `series` + `seriesOrder` 존재
  - 모든 파일의 `series` 문자열이 입력받은 `series_name`과 정확히 일치
  - `seriesOrder`가 1부터 시작, 중복/결번 없음
  - `tags`가 편끼리 통일
- **단편 모드**:
  - `series` / `seriesOrder` **미포함**

**자동 수정 가능한 것**:

- 필드 순서가 스키마 순서와 다르면 정렬
- `tags`의 공백/오타 통일 (시리즈 편끼리 비교)

**수정 불가 (구조 결함 — writer 재실행 필요)**:

- 필수 필드 누락
- `date` 형식 오류
- `series` 값 불일치

### 1-2. 본문 frontmatter 중복 금지

파일 내 `---` 구분자가 2개 초과면 에러.

```bash
grep -c '^---$' <file>
```

결과가 3 이상이면 본문에 frontmatter가 중복되거나 코드 블록 경계와 충돌.
**자동 수정 불가** — 사용자 확인 후 어느 걸 제거할지 결정.

### 1-3. JSX 태그 균형 (§MDX-JSX-BALANCE)

여는 태그와 닫는 태그의 짝이 맞는지 확인:

- `<Callout variant="...">` 이 `</Callout>`로 닫혔는가?
- `<References ... />` 같은 self-closing이 올바르게 `/>`로 닫혔는가?
- `<CodePlayground ... />`, `<Cite id="..." />`, `<AnimatedStep ... />` 동일
- `<VideoEmbed ... />` 동일

**검출**: 각 컴포넌트에 대해 여는 태그 수와 닫는 태그 수 비교.

```bash
# Callout 예시
OPEN=$(grep -c '<Callout' <file>)
CLOSE=$(grep -c '</Callout>' <file>)
SELF=$(grep -c '<Callout[^>]*/>' <file>)
# OPEN - SELF == CLOSE 이어야 함
```

**자동 수정 불가** — 태그 균형은 writer가 다시 해야 함 (잘못 닫힌 자리를
validator가 추측하면 의미가 망가질 위험).

**구조적 팁**: 이 단계에서 에러가 나면 Phase 2~5를 건너뛰고 writer에게 되돌려
보내세요. 태그가 깨진 상태에서 콘텐츠 검사를 하면 오탐이 심해요.

---

## Phase 2: 콘텐츠 표면 규칙

Phase 1이 통과한 상태에서만 실행. SHARED.md의 규칙 섹션을 그대로 적용합니다.

### 2-1. em-dash 전수 검사 (§RULE-EMDASH)

**먼저 SHARED.md §RULE-EMDASH 전체를 Read로 주입**하세요. 검출 전략과 맥락별
수정 방법이 거기 있습니다.

```bash
grep -n '—' <file>
```

결과가 **한 건이라도** 있으면 에러. 각 매칭에 대해 맥락 분류:

- 본문 단락 → 쉼표 또는 괄호로 치환
- 코드 블록 안 주석 → `//` 뒤 쉼표 또는 콜론
- JSX prop 값 (`AnimatedStep`, `References` 등) → 쉼표 또는 괄호
- frontmatter → 자연스러운 한국어 구로 재작성

**자동 수정**: 쉼표 치환은 95% 케이스에서 안전. 쉼표로 우선 자동 수정하고,
결과가 어색한 문장이면 사용자에게 alternate 제시.

**수정 로그 형식**:

```
[§RULE-EMDASH] content/posts/foo.mdx
  L42  본문
    원문: "간단한 개념 — 쌓임 맥락 — 만 알면 끝나요"
    수정: "간단한 개념, 쌓임 맥락만 알면 끝나요"
  L88  코드 주석
    원문: "// flex-item — 고정 width 주의"
    수정: "// flex-item, 고정 width 주의"
```

### 2-2. 콜론 구조 (§RULE-COLON-HEADING)

**SHARED.md §RULE-COLON-HEADING Read**.

```bash
# 본문 헤딩
grep -nE '^#{1,6} .+:.+' <file>

# frontmatter title/description
awk '/^---$/{c++} c==1 && /^(title|description):/' <file>
```

각 매칭에 대해:

1. 콜론이 **백틱 안에 완전히 갇혀 있는지** 확인 (`` `:has()` ``, `` `box-sizing: border-box` ``)
2. 갇혀 있으면 통과
3. 아니면 위반

**자동 수정은 위험** — 콜론 구조를 풀어쓰는 건 문장 재작성이라서 validator가
임의로 할 수 없음. **사용자 확인 후 수정** 카테고리로 분류.

대신 validator는 **두세 가지 재작성 후보를 제안**합니다:

```
[§RULE-COLON-HEADING] content/posts/foo.mdx
  L5  frontmatter title
    원문: title: "페이지 전환: 브라우저에 맡기기"
    제안 1: title: "페이지 전환을 브라우저에 맡기기"
    제안 2: title: "브라우저에 맡기는 페이지 전환"
    제안 3: title: "페이지 전환, 브라우저에게"

  L23  본문 H2
    원문: ## SPA: 한 줄이면 시작
    제안 1: ## SPA에서 한 줄로 시작하기
    제안 2: ## SPA의 한 줄 시작법
```

**이 항목은 "사용자 확인 필요" 카테고리**. validator 는 직접 Edit 하지 말고
위 "판단 여지 있는 에러의 반환 형식" 구조로 오케스트레이터에게 반환. 오케스트레이터가
AskUserQuestion 으로 사용자 선택을 받으면, 선택을 validator 에게 재전달해 Edit 반영.

기본값: 제안 1 (사용자가 "알아서 해줘" 라고 하면 이걸로 자동 적용).

### 2-3. `**` JSX prop 값 안 사용 (§RULE-BOLD-DETECTION)

**SHARED.md §RULE-BOLD-WHERE, §RULE-BOLD-DETECTION Read**.

이건 **확정 에러**입니다. JSX prop 값 안의 `**`는 리터럴로 노출되므로 무조건
제거해야 합니다.

```bash
# 1차 스캔
grep -nE '\*\*[^*]+\*\*' <file>
```

각 매칭 라인에 대해 맥락 판단:

- `<Callout>` 여닫기 태그 **사이의 본문 텍스트**? → 마크다운 문맥, 통과
- `<Callout>` 내부 그룹 헤딩 (`**반응형**` 같이 앞뒤 빈 줄)? → 통과
- 본문 단락? → 통과 (단 §RULE-BOLD-KOREAN 한글 인접 체크)
- 그 외 (`steps={[{content: "**x**"}]}` 등)? → **확정 에러**

**자동 수정**: 확정 에러에 해당하는 `**`는 제거만 하거나, 인용부호(`"..."`)로
감싸 강조 효과를 유지. 기본 정책은 **인용부호로 감싸기**.

```
[§RULE-BOLD] content/posts/foo.mdx
  L55  AnimatedStep content (JSX prop)
    원문: content: "먼저 **flex-direction**을 설정합니다"
    수정: content: '먼저 "flex-direction"을 설정합니다'
```

한글 인접 함정(§RULE-BOLD-KOREAN)은 마크다운 문맥에 한해 경고로 보고:

```
[§RULE-BOLD-KOREAN] content/posts/foo.mdx
  L78  본문
    원문: 다음 편 **word-break**에서는
    제안: 다음 편 **word-break** 에서는 (공백 추가)
       또는: 다음 편 <strong>word-break</strong>에서는
```

마크다운 문맥의 한글 인접은 **사용자 확인 후 수정**. 본문 맥락을 validator가
임의로 건드리지 않아요.

### 2-4. bare 리스트 (§RULE-BARE-LIST)

**SHARED.md §RULE-BARE-LIST Read**.

본문 레벨에서 `- 항목` / `1. 항목` 시작 라인을 찾습니다.

```bash
grep -nE '^(- |[0-9]+\. )' <file>
```

각 매칭에 대해 예외 여부 판단:

- `<Callout>` 여닫기 태그 사이인가? → 통과 (예외)
- `<References items={[...]}>` 배열 안인가? → 통과 (예외)
- 코드 블록(` ``` `) 안인가? → 통과 (예외)
- 그 외 본문 레벨? → **에러**

**자동 수정 위험** — bare 리스트를 문단으로 풀어쓰거나 `<AnimatedStep>`/`<Callout>`으로
변환하는 건 문장 재작성이라서 validator가 임의로 할 수 없음. **사용자 확인 필요**
카테고리로 분류, 제안 A/B/C 를 구조화해서 오케스트레이터로 반환.

오케스트레이터가 §UI-USER-CHOICE 규칙에 따라 AskUserQuestion 호출하고 사용자
선택을 받아 validator 에게 재전달.

대안 제시:

```
[§RULE-BARE-LIST] content/posts/foo.mdx
  L45  본문 레벨 bare 리스트 (3개 항목)
    원문:
      - 첫째, flex-direction 설정
      - 둘째, justify-content 설정
      - 셋째, align-items 설정

    제안 A (문단으로 풀어쓰기):
      "flex-direction으로 방향을 정하고, justify-content로 주축을,
       align-items로 교차축을 맞추면 돼요."

    제안 B (AnimatedStep 변환):
      <AnimatedStep
        steps={[
          { title: "방향 설정", content: "flex-direction" },
          { title: "주축 정렬", content: "justify-content" },
          { title: "교차축 정렬", content: "align-items" },
        ]}
      />

    제안 C (Callout + 마커):
      <Callout variant="info">
      • flex-direction — 방향
      • justify-content — 주축
      • align-items — 교차축
      </Callout>
```

잠깐, 제안 C에 em-dash가 들어있네요. 이건 **자기 규칙을 위반**하는 제안입니다.
제안을 생성할 때도 SHARED.md 규칙을 준수해야 해요. 수정:

```
    제안 C (Callout + 마커):
      <Callout variant="info">
      • flex-direction: 방향
      • justify-content: 주축
      • align-items: 교차축
      </Callout>
```

**중요 원칙**: validator가 제안하는 수정본도 SHARED.md 규칙을 전부 따라야 합니다.
특히 em-dash, 콜론 구조, `**` 맥락 규칙을 제안 생성 시 재검증하세요.

### 2-5. 영어 인용 한글 풀이 (§RULE-ENGLISH-QUOTE)

**SHARED.md §RULE-ENGLISH-QUOTE Read**.

본문에서 영어 문장 단위 인용구를 찾습니다:

```bash
# 따옴표로 감싼 영어 문장 (rough)
grep -nE '"[A-Z][^"]{20,}"' <file>
```

각 매칭에 대해:

1. 바로 다음 블록이 `<Callout>`인가?
2. Callout 안에 첫 줄이 인용, 빈 줄, 한국어 풀이가 있는가?
3. 한국어 풀이가 축자 번역("(번역)" 시작)이 아닌가?

조건 하나라도 실패하면 에러.

**자동 수정 불가** — 한국어 풀이 문장을 validator가 창작할 수 없음. **writer
재작성 필요** 카테고리로 분류하고, 어떤 인용에 풀이가 빠졌는지 정확히 보고.

---

## Phase 3: 컴포넌트 정합성

### 3-1. CodePlayground 규칙 (§MDX-CODEPLAYGROUND)

**SHARED.md §MDX-CODEPLAYGROUND Read**.

각 `<CodePlayground>` 블록에 대해:

**3-1-a. template="react"에서 `export default` 금지**

```bash
grep -A 20 '<CodePlayground' <file> | grep 'export default'
```

발견 시 자동 제거.

**3-1-b. 함수명 PascalCase**
`function` 뒤 이름이 소문자로 시작하면 경고. 자동 수정하지 않음 (이름 바꾸면
참조도 바꿔야 하는데 scope 추적이 복잡).

**3-1-c. import 매칭 (런타임 에러 방지)**
code prop 내부에서 네임스페이스 호출 수집:

```
\b([A-Z][A-Za-z0-9]+)\.(\w+)
```

`React` 제외. 각 이름에 대해 code 블록 상단에 `import` 선언 존재 확인.

누락된 import가 있으면:

- **ReactDOM.xxx** → 확정 에러. destructured import로 수정.

```
  원문: ReactDOM.flushSync(() => setX(next))
  수정:
    상단에 `import { flushSync } from "react-dom";` 추가
    본문: flushSync(() => setX(next))
```

- **외부 라이브러리 (lodash 등)** → 에러, 사용자 확인 (패키지 이름 추측이 위험)

**자동 수정**: `ReactDOM` → destructured import 패턴은 안전하게 수정 가능.
다른 네임스페이스는 사용자 확인 후 수정.

**3-1-d. 인라인 스타일 금지**
code prop 안에 `style={{...}}` 덩어리 검출 → 경고. 자동 수정 불가 (className과
css prop 분리는 문맥 판단 필요).

### 3-2. 체크리스트 포맷 (§MDX-CHECKLIST)

**SHARED.md §MDX-CHECKLIST Read**.

- `- [ ]` 마크다운 task list 검출 → 에러
- `☐` 사용한 체크리스트가 `<Callout>` 밖에 있으면 에러
- `☐` 항목 끝에 `<br/>` 누락 (마지막 제외) → 경고

**자동 수정 가능**:

- `- [ ]` → `☐` 치환
- `<br/>` 누락된 `☐` 항목 끝에 자동 추가
- Callout 밖의 체크리스트 → Callout으로 감싸기 (위치는 사용자 확인)

### 3-3. 본문 마침 상태

파일의 마지막 non-empty 라인이:

- `.`, `?`, `!` 중 하나로 끝나거나
- 닫는 JSX 태그(`</Component>` 또는 `/>`)로 끝나야 함

아니면 **중간에 잘린 듯한** 글. 에러.

**자동 수정 불가** — writer 재실행 필요.

---

## Phase 4: 참조 정합성

Phase 1~3이 통과한 상태에서만 실행.

**사전 로드**: Phase 4 시작 시 `.claude/skills/blog-shared/config/domains.md` 를
Read로 로드합니다. 이후 4-1 에서 도메인 판정에 사용.

파일이 없으면:

⚠️ config/domains.md 없음 — fallback 리스트로 진행
(MDN, W3C, WHATWG 만 1순위 인식)
정확한 판정을 위해 config/domains.md 설정 권장

Phase 4 내부 검사는 정상 진행.

### 4-1. References 존재 + 1순위 출처 (§RULE-REFERENCES, §SOURCE-PRIORITY)

**SHARED.md §RULE-REFERENCES, §SOURCE-PRIORITY Read**.

- `<References items={[...]} />` 컴포넌트 존재 확인
- 없으면 **에러, 수정 불가** (writer 재실행 필요)
- 있으면 items 배열 안의 `href` 값들 추출
- 1순위 출처 도메인 판정:
  - **`.claude/skills/blog-shared/config/domains.md`** 의 `§DOMAIN-PRIORITY-1`
    섹션을 Read로 로드
  - References items 의 각 `href` 값에서 도메인 추출
  - 도메인이 `§DOMAIN-PRIORITY-1` 리스트에 있으면 1순위로 카운트
  - `§DOMAIN-BLACKLIST` 에 있으면 에러 (품질 문제 도메인)
  - 1순위 카운트가 **0개**면 블로커 에러
  - `§DOMAIN-BLACKLIST` 에 걸린 항목은 각각 별도 에러로 보고
- **config 파일 로드 실패 시**: 경고 출력 후 최소 fallback 리스트로 진행
  (MDN, W3C, WHATWG 만). SKILL 동작은 계속.

**자동 수정 불가** — 출처 자체는 글의 근거라서 validator가 추가할 수 없음.

또한:

- `## 참고` 마크다운 헤딩이 있으면 에러 → 자동 제거
- `title` / `description`에 em-dash 있으면 §RULE-EMDASH와 함께 처리됨
- `title` / `description`에 `**` 있으면 §RULE-BOLD와 함께 처리됨

### 4-2. Cite ↔ References id 매칭 (§RULE-CITE)

**SHARED.md §RULE-CITE Read**.

```bash
# 본문 Cite id 수집
grep -oE '<Cite\s+id="([^"]+)"' <file> | sed 's/.*id="//;s/"//'
```

수집된 id 각각에 대해:

1. `<References items>` 배열에 동일 id가 존재하는가?
2. 없으면 에러 (id 오타 또는 References 누락)

역방향:

- `<References>`에만 있고 Cite에 쓰이지 않은 id → 경고 (허용)

추가 체크:

- **한 문단에 `<Cite>` 2개 이상?** 한 문단을 빈 줄 기준으로 나누고 각 문단에
  `<Cite>` 개수 세기. 2 이상이면 에러.

**자동 수정 불가** — id 오타는 의미 판단 필요, 한 문단에 2개는 내용 재구성 필요.

### 4-3. 내부 링크 grep + glob 실존 검증 (§RULE-LINK-PATH)

**SHARED.md §RULE-LINK-PATH Read**.

**4-3-a. 접두사/형식 필터** (확정 에러)

```bash
# 잘못된 접두사
grep -nE '\]\((?!/posts/|/series/|https?://|#)' <file>
grep -nE '\]\(/blog/|\]\(/post/|\]\(/article' <file>

# .mdx 확장자
grep -nE '\]\([^)]*\.mdx\)' <file>

# 파일 경로
grep -nE '\]\(content/posts/' <file>
```

검출된 링크는 **전부 에러**. 자동 수정:

- `/blog/slug` → `/posts/slug` (접두사만 교체)
- `/posts/slug.mdx` → `/posts/slug` (확장자 제거)
- `content/posts/slug.mdx` → `/posts/slug` (경로 변환)

**단, 교체 후 slug가 실제 파일과 매칭되는지 4-3-b에서 반드시 재확인**.

**4-3-b. 실존 확인** (Glob 필수)

각 `/posts/<slug>` 링크에 대해:

```bash
ls content/posts/<slug>.mdx 2>/dev/null || ls content/posts/*/<slug>.mdx 2>/dev/null
```

없으면 에러. **자동 수정 불가** — validator가 slug를 추측하면 안 됨.
대신 **가장 근접한 후보 3개를 제시**:

```bash
# Levenshtein 거리 또는 단순 fuzzy 매칭
ls content/posts/*.mdx content/posts/**/*.mdx |
  awk -F'/' '{print $NF}' |
  sed 's/\.mdx$//' |
  # <broken-slug>과 유사한 것 3개
```

유사 후보 리스트를 찾은 후, **사용자 확인 필요** 카테고리로 분류:

```
[§RULE-LINK-PATH] content/posts/foo.mdx
  L67  내부 링크 slug 미매칭
    원문: [쌓임 맥락](/posts/css-stacking-contxt)
    실존 파일 없음.

유사 후보 (오케스트레이터가 AskUserQuestion 으로 전달할 선택지):
  1. /posts/css-stacking-context
  2. /posts/css-stacking
  3. /posts/stacking-context-basics
  4. 링크 제거

기본값: 후보 1 (가장 가까운 매칭)
```

validator 는 이 구조를 반환만 하고, 오케스트레이터가 §UI-USER-CHOICE 에 따라
AskUserQuestion 으로 사용자 선택을 받아 재전달.

각 `/series/<seriesSlug>` 링크에 대해:

- `content/posts/<seriesSlug>/` 디렉토리 존재 확인
- 디렉토리 내 편들의 frontmatter `series` 값 일치 확인

---

## Phase 5: velite 스키마 실행

Phase 1~4가 전부 통과한 뒤에 실행. 에러가 누적된 상태에서 velite를 돌리면
본질적이지 않은 에러 메시지가 나와서 디버깅이 어려워집니다.

```bash
npx velite 2>&1
```

- 성공 → `velite ✅`
- 실패 → 에러 메시지 그대로 인용하고 **사용자에게 넘김**

**자동 수정 없음**: velite가 잡는 에러의 대부분은 Phase 1~4에서 이미 걸러져야
정상이에요. 그래도 여기까지 에러가 남아 있다면, Phase 1~4가 못 잡은 엣지 케이스
거나 velite 쪽 스키마 이슈일 가능성이 높습니다. validator가 임의로 수정하면
엉뚱한 곳을 건드릴 위험이 있어요.

velite 에러는 **에러 메시지 원문과 해당 파일/라인을 그대로 보고**하고 사용자의
판단에 맡깁니다. 에스컬레이션 카테고리로 분류하세요.

만약 velite가 지속적으로 특정 패턴을 잡아낸다면, 그 패턴을 Phase 1~4 규칙에
추가하는 게 맞아요. `blog-rule-editor`로 SHARED.md에 새 규칙을 넣거나 validator
검사 항목을 확장하세요.

---

## 수정 정책 요약

| 카테고리                        | 행동                                                                   |
| ------------------------------- | ---------------------------------------------------------------------- |
| 확정 에러 (명확한 수정안 있음)  | **직접 Edit으로 자동 수정**, 수정 로그에 기록                          |
| 판단 여지 있는 에러 (여러 대안) | 제안 2~3개를 구조화해서 **오케스트레이터로 반환** (직접 사용자 대화 X) |
| 구조 결함 (필수 필드 누락 등)   | **수정 불가**, writer 재실행 요청 (오케스트레이터로 반환)              |
| velite 스키마 에러              | **수정 불가**, 에러 원문 보고 (오케스트레이터로 반환)                  |
| 경고 (스키마 통과, 권장 수정)   | 보고만, 수정은 선택                                                    |

### 판단 여지 있는 에러의 반환 형식

validator 는 skill 이라 사용자와 직접 대화할 수 없어요. "판단 여지 있는 에러" 를
발견하면 구조화된 데이터로 오케스트레이터에게 반환하고, 오케스트레이터가
§UI-USER-CHOICE 규칙에 따라 AskUserQuestion 툴을 호출합니다.

**반환 형식**:

```markdown
## 사용자 확인 필요 항목

### 항목 1: [§RULE-ID] [파일]:[라인]

원문:
<문제 원문>

제안:

1. <제안 1>
2. <제안 2>
3. <제안 3>

기본값: 제안 1 (사용자가 "알아서 해줘" 라고 하면 이걸로)
```

오케스트레이터는 이 구조화된 데이터를 받아 각 항목에 대해 AskUserQuestion 을
호출하고, 사용자 선택을 다시 validator 에게 전달해 Edit 반영.

**자동 수정 시 중요**:

- 수정 전 파일 전체를 Read로 한 번 더 확인
- Edit 툴의 `old_str`는 유니크하게 (주변 몇 줄 포함해서)
- 수정 후 해당 Phase의 검사를 한 번 더 돌려서 재발 여부 확인
- 한 파일에 여러 수정이 있으면 **위→아래 순서로** 적용 (라인 번호가 밀리는 걸
  고려)

**제안 생성 시 중요**:

- 제안 텍스트도 SHARED.md 규칙을 위반하지 않도록 재검증
- em-dash 금지, `**` JSX prop 금지, 콜론 구조 금지 등

---

## 출력 형식

Phase별로 섹션을 나누고, 각 검출 건을 아래 형식으로 보고:

```
# 검증 결과: content/posts/foo.mdx

## Phase 1: 구조 ✅ 통과

## Phase 2: 콘텐츠 ⚠️ 3건 수정됨 + 1건 확인 필요

### 자동 수정 완료 (3건)

[§RULE-EMDASH] L42 본문
  원문: "간단한 개념 — 쌓임 맥락 — 만 알면 끝나요"
  수정: "간단한 개념, 쌓임 맥락만 알면 끝나요"

[§RULE-EMDASH] L88 코드 주석
  원문: "// flex-item — 고정 width 주의"
  수정: "// flex-item, 고정 width 주의"

[§RULE-BOLD] L55 AnimatedStep content (JSX prop, 확정 에러)
  원문: content: "먼저 **flex-direction**을 설정합니다"
  수정: content: '먼저 "flex-direction"을 설정합니다'

### 사용자 확인 필요 (1건)

[§RULE-COLON-HEADING] L5 frontmatter title
  원문: title: "페이지 전환: 브라우저에 맡기기"
  제안 1: title: "페이지 전환을 브라우저에 맡기기"
  제안 2: title: "브라우저에 맡기는 페이지 전환"
  제안 3: title: "페이지 전환, 브라우저에게"

## Phase 3: 컴포넌트 ✅ 통과

## Phase 4: 참조 ⚠️ 1건 확인 필요

[§RULE-LINK-PATH] L67 slug 미매칭
  ...

## Phase 5: velite ✅

## 요약

- 자동 수정: 4건
- 사용자 확인 필요: 2건
- 수정 불가 (writer 재실행): 0건
- velite: ✅

사용자 확인이 필요한 항목이 있어요. 어떻게 할까요?
```

---

## 단독 실행 시 — 최종 완료 보고

(오케스트레이터 호출 시 skip)

사용자 확인이 필요한 항목이 있으면 각각 처리 후, 최종 요약:

```
✅ 검증 완료

수정된 파일: content/posts/foo.mdx
- 자동 수정: 4건
- 사용자 확인 후 수정: 2건
- velite: 통과

다음 단계:
  pnpm dev    # 로컬에서 확인
```

---

## 반복 검증

자동 수정이 이루어진 후에는 **같은 Phase를 한 번 더 돌려서** 재발이나 새 에러
발생 여부를 확인하세요. 특히:

- em-dash 수정 중에 새 em-dash를 실수로 넣지 않았는가?
- Edit으로 라인이 밀린 뒤 다음 수정이 잘못된 위치에 들어가지 않았는가?
- JSX 구조를 건드렸다면 Phase 1-3 JSX 균형이 깨지지 않았는가?

재검증은 **수정한 Phase와 그 이후 Phase**만 돌리면 됩니다. 무한 루프 방지를
위해 최대 **3회**까지만 반복 후 남은 에러는 사용자에게 에스컬레이션.

---

## 에스컬레이션 조건

다음 경우 사용자에게 즉시 에스컬레이션:

- Phase 1 에러 (구조 결함 → writer 재실행 필요)
- 3회 반복 후에도 남는 에러
- 자동 수정이 오히려 새 에러를 만들어내는 상황 (수정 회귀)
- velite 에러 중 파싱 불가능한 메시지
- slug 미매칭 시 유사 후보 0개

에스컬레이션 메시지 형식:

```
⚠️ 자동 처리 한계 도달

파일: content/posts/foo.mdx
남은 에러:
  - [Phase X] 설명
  - ...

권장 조치:
  - writer 재실행 (구조 결함)
  - 또는 수동 검토

어떻게 할까요?
```

---

## 제약

- 파일은 이 skill이 **Edit으로 직접 수정**합니다 (확정 에러만). 오케스트레이터가
  수정을 적용하지 않아요.
- **판단 여지 있는 에러는 validator 가 직접 Edit 하지 않고** 구조화된 제안을
  오케스트레이터로 반환. 오케스트레이터가 §UI-USER-CHOICE 에 따라
  AskUserQuestion 호출, 사용자 선택을 받아 validator 에게 재전달하면 그때 Edit.
- **validator 는 사용자와 직접 대화하지 않음**. 모든 사용자 입력은 오케스트레이터를
  거침.
- 표현/어조(AI 티, 어투, 호흡) 판단은 `blog-expression-review`가 담당.
  validator는 SHARED.md의 **확정 규칙**만 봅니다.
- 논리 완결성(도입-결론 호응, 섹션 연결, 모순)은 `blog-coherence-review`가 담당.
- 새 문장을 창작하지 마세요. 수정은 항상 **기계적으로 치환 가능한 범위**에서만.
  창작이 필요하면 writer에게 돌려보냅니다.
- SHARED.md 규칙을 skill 내부에 복사하지 마세요. 필요할 때 Read로 주입하고,
  `§섹션ID` 참조로만 사용하세요. 규칙 변경은 SHARED.md에서만.
