---
name: blog-research
description: |
  블로그 글 주제에 대한 1순위 공식 출처를 수집하고 구조화된 결과를 반환한다.
  MDN, W3C, WHATWG, TC39, RFC, 라이브러리 공식 문서 등을 context7 MCP와
  WebFetch로 읽고, 핵심 포인트와 인용 후보 문장을 추출한다. 원문이 아니라
  요약만 반환해 오케스트레이터 컨텍스트 오염을 막는다.

  사용 트리거: blog-write 오케스트레이터가 Phase 2 자료 수집 단계에서 호출.
  단독 실행 가능하지만 드문 경우 (사용자가 "이 주제 공식 문서 좀 찾아줘"
  같은 요청).

  절대 하지 않는 것: 기획안 작성, 글 작성, 파일 저장, 복잡도 판단.

tools:
  - WebFetch
  - WebSearch
  - mcp__plugin_context7_context7__resolve-library-id
  - mcp__plugin_context7_context7__query-docs
  - Grep
  - Glob
  - Read
---

# blog-research

블로그 글 주제에 대한 공식 출처를 수집해 구조화된 결과로 반환합니다.
**파일 시스템을 쓰기 목적으로 건드리지 않아요** (config 로드 Read는 예외).
읽기 전용 웹 크롤링과 요약 추출만 합니다.

**이 skill은 SHARED.md `§SOURCE-PRIORITY` 와 `§DOMAIN-WHITELIST` 를 전제**
합니다. 시작 시 해당 섹션을 Read로 주입하세요.

---

## 입력 계약

### 오케스트레이터 호출 시

오케스트레이터가 프롬프트로 아래를 전달합니다:

- `topic`: 블로그 글 주제 키워드 (필수)
  - 예: "CSS word-break", "React Suspense", "flexbox vs grid"
- `user_urls`: 사용자가 직접 제공한 참고 URL 배열 (선택)
- `depth`: `"basic"` (3개 이상) 또는 `"deep"` (5개 이상). 기본 `"basic"`.
- `via`: `"orchestrator"` 또는 생략

### 단독 실행 시

사용자가 주제와 URL을 자유 형식으로 전달. 누락된 값은 합리적으로 추정.

---

## Skip List (오케스트레이터 호출 시 건너뜀)

- **최종 사용자 메시지** (오케스트레이터가 다음 단계 진행)
- **단독 실행 전용 입력 확인**

나머지 단계는 전부 실행.

---

## 사전 준비: config/domains.md 로드

Step 1 시작 전에 도메인 판정 테이블을 로드합니다.

```
Read .claude/skills/blog-shared/config/domains.md
```

**성공**: 로드된 리스트로 모든 판정 수행.

**실패 (파일 없음)**: 경고 출력 후 최소 fallback 리스트로 진행.

```
⚠️ config/domains.md 를 찾을 수 없어요. 기본 fallback 리스트로 진행:
   - developer.mozilla.org
   - www.w3.org
   - whatwg.org
   - context7 MCP 결과 (자동 1순위)

정확한 우선순위 판정을 위해 `.claude/skills/blog-shared/config/domains.md` 를
설정하세요. `blog-rule-editor` 로 만들거나 직접 편집 가능.
```

blog-research 동작은 계속 진행. fallback 리스트로도 기본 동작은 가능.

### 로드된 config 의 구조 인식

`config/domains.md` 에서 아래 섹션을 각각 파싱:

- `§DOMAIN-PRIORITY-1` — 1순위 자동 분류 대상
- `§DOMAIN-PRIORITY-2` — 2순위 자동 분류 대상
- `§DOMAIN-PRIORITY-3` — 3순위 자동 분류 대상
- `§DOMAIN-BLACKLIST` — 수집 중 발견 시 즉시 무시
- `§DOMAIN-UNCLASSIFIED` — 명시적 리스트 없음, 나머지 전부 자동 4순위

각 섹션의 백틱으로 감싼 도메인 문자열(`` `domain.com` ``)을 추출해 매칭 테이블 구성.

### 우선순위 판정 로직

각 수집된 URL에 대해:

1. URL에서 도메인 추출 (서브도메인 포함)
2. `§DOMAIN-BLACKLIST` 에 있는가? → 무시, 결과에 포함 안 함
3. `§DOMAIN-PRIORITY-1` 에 있는가? → 1순위
4. `§DOMAIN-PRIORITY-2` 에 있는가? → 2순위
5. `§DOMAIN-PRIORITY-3` 에 있는가? → 3순위
6. 위 어디에도 없음 → 4순위 (UNCLASSIFIED)

context7 MCP 응답으로 얻은 URL은 도메인과 무관하게 **1순위 자동 분류**.

---

## 수집 한도 (엄격 준수)

토큰 낭비와 무한 크롤을 막기 위한 한도입니다.

- **WebFetch 최대 6회** (누적)
- **context7 query-docs 최대 3회** (누적)
- **context7 resolve-library-id는 한도 없음** (가벼운 호출)

`basic` depth (1순위 3개 이상) 에는 이 한도가 충분해요. `deep` depth (1순위
5개 이상) 이라도 한도를 늘리지 말고, 대신 아래 "한도 초과 시 거부" 경로로
처리하세요.

---

## 수집 전략

아래 순서대로 자료를 찾습니다. 하나씩 시도하면서 1순위 출처가 `depth` 기준을
만족하면 조기 종료해도 됩니다.

### Step 1: 사용자 제공 URL 먼저 처리

`user_urls` 가 있으면:

1. 각 URL을 WebFetch로 읽기
2. 도메인 판정으로 우선순위 분류 (config 기반)
3. 블랙리스트면 건너뛰기
4. 핵심 포인트와 인용 후보 추출
5. 결과에 기록

**사용자 제공 URL이 개인 블로그 (4순위) 라면**: 가볍게 참조만. "이 글에서
어떤 1순위 출처를 인용하고 있는가?" 를 확인해서 **그 1순위 출처를 직접 WebFetch**
로 다시 읽습니다. 개인 블로그를 글의 근거로 삼지 않아요.

### Step 2: 라이브러리/프레임워크 주제인가?

주제 키워드에 라이브러리/프레임워크 이름이 포함되어 있으면 (React, Vue, Next.js,
Tailwind, Prisma, Drizzle 등):

1. `mcp__plugin_context7_context7__resolve-library-id` 호출
2. 성공하면 `mcp__plugin_context7_context7__query-docs` 로 주제 질의
3. 결과를 1순위로 분류
4. 핵심 포인트 추출

context7 query-docs 는 한 주제당 **최대 3회** 까지.

### Step 3: CSS / Web API / ECMAScript 주제인가?

주제가 CSS 속성, Web API, JavaScript 표준 기능 등이면:

1. MDN URL 패턴 직관 매칭
   - CSS: `https://developer.mozilla.org/en-US/docs/Web/CSS/<property>`
   - JS: `https://developer.mozilla.org/en-US/docs/Web/JavaScript/Reference/...`
   - Web API: `https://developer.mozilla.org/en-US/docs/Web/API/<interface>`
2. WebFetch 시도
3. 200 응답이면 1순위로 기록
4. 404면 WebSearch 로 정확한 URL 찾기

W3C/WHATWG 스펙:

1. `WebSearch` 로 `<topic> site:w3.org OR site:whatwg.org` 검색
2. 최상위 결과 1~2개 WebFetch
3. 1순위로 기록

### Step 4: 부족하면 WebSearch 보조

Step 1~3 후 1순위 출처가 `depth` 기준에 미달하면:

- `basic` (3개 이상): 1순위 1개 미달 → 추가 검색
- `deep` (5개 이상): 1순위 3개 미달 → 추가 검색

WebSearch 전략:

- `<topic> MDN` — MDN 직접 검색
- `<topic> spec` — 스펙 문서 검색
- `<topic> official documentation` — 공식 문서 검색

결과의 도메인을 확인하고 **config 화이트리스트에 있는 것만** WebFetch.

### Step 5: 종료 조건

다음 중 하나를 만족하면 수집 종료:

- 1순위 출처 `depth` 기준 충족
- WebFetch 누적 **6회** 도달
- context7 query 누적 **3회** 도달
- 사용자 제공 URL 전부 처리 + Step 2~4 시도 완료

이 후에도 1순위 출처 0개면 **거부**.

---

## 핵심 포인트 추출 규칙

각 출처에서 **글쓴이가 본문에 쓸 수 있는** 구체적 정보를 추출합니다.
"이 출처가 다루는 주제" 같은 추상 요약이 아니라, **한 문장 한 문장 짚을 수 있는**
구체적 사실.

**추출해야 할 것**:

- 정의 (용어, 동작, 반환값)
- 수치 (지원 버전, 성능 숫자, 제한값)
- 예시 코드 (짧으면 그대로, 길면 요약)
- 엣지 케이스 (문서가 명시한 예외)
- 브라우저 지원 범위 (있으면)
- 경고 사항 ("Note:", "Warning:" 박스 내용)

**추출하지 말 것**:

- 출처 자체의 메타 정보 ("이 문서는 ~에 대해 설명합니다")
- 광고/네비게이션/푸터
- 관련 없는 배경 설명

**형식**:

```markdown
- 핵심 포인트:
  - `word-break: keep-all` 은 CJK에서 단어 경계 유지
  - `break-all` 은 어떤 문자든 줄바꿈 허용
  - 브라우저 지원: Chrome 1+, Safari 3+, Firefox 15+
```

각 항목은 한 줄, 구체적, 검증 가능한 정보.

---

## 인용 후보 추출 규칙

출처에서 **그대로 인용할 만한 영어 원문 한 문장** 을 뽑습니다. writer가
`<Callout variant="warning">` 안에 한국어 풀이와 함께 쓸 수 있도록.

**좋은 인용 후보**:

- 핵심 개념을 한 문장으로 압축한 원문
- 스펙 저자의 권고 ("If you are using flexbox and find yourself disabling...")
- 주의 사항 ("Do not use X when Y")
- 정의 문장 ("A stacking context is ...")

**나쁜 인용 후보** (뽑지 마세요):

- 2문장 이상 (길이 초과, writer가 요약하기 힘듦)
- 맥락 없이 이해 안 되는 문장
- 출처 자체의 메타 ("This document describes...")

**형식**:

```markdown
- 인용 후보:
  - "Word boundaries are ignored for CJK scripts."
    - 출처: MDN word-break
    - 활용 제안: "브라우저 동작" 섹션 또는 핵심 개념 강조
```

각 출처마다 **1~2개만**. 너무 많으면 writer가 헷갈려요.

---

## 어느 섹션에 쓰면 좋은가

각 출처의 내용이 **기획안의 어느 섹션에 대응하는지** 힌트를 줍니다.
이건 writer가 자료를 배치할 때 참고하는 용도예요.

**원칙**: 구체적으로, 추측 가능한 섹션 이름으로.

**좋은 힌트**:

- "'브라우저 지원' 섹션"
- "'실전 적용' 섹션의 코드 예시"
- "오프닝의 문제 제기"
- "마무리의 '한 걸음 더' 링크"

**나쁜 힌트**:

- "본문 어디든" (쓸모없음)
- "필요한 곳에" (쓸모없음)

기획안이 아직 없으니 섹션 이름이 확정된 건 아니지만, 주제 흐름상 자연스러운
배치를 추정해서 힌트 줘요.

---

## 출력 형식

구조화된 마크다운으로 반환합니다. **웹 원문 그대로 포함 금지**.

```markdown
# 자료 수집 결과: <topic>

## 요약

- 주제: <topic>
- 1순위 출처: <N>개 ✅ (최소 1개 충족) 또는 ❌ (부족)
- 2순위 출처: <N>개
- 3순위 출처: <N>개
- 4순위 출처: <N>개 (보조)
- 수집 시도: WebFetch <X>/6회, context7 query <Y>/3회
- **필수 조건**: 충족 / 미충족 (1순위 1개 이상)

## 1순위 출처 (공식 문서/명세)

### 1. <출처 제목>

- URL: <절대 URL>
- 도메인 판정: <도메인 이름> (config §DOMAIN-PRIORITY-1 매칭)
- 핵심 포인트:
  - <구체 항목 1>
  - <구체 항목 2>
  - ...
- 인용 후보:
  - "<영어 원문 문장>" (출처: <출처 약칭>)
    - 활용 제안: <어느 섹션에 쓰면 좋은가>
- 어느 섹션에 쓰면 좋은가: <구체적 섹션 힌트>

### 2. <출처 제목>

...

## 2순위 출처 (원저자/구현체)

...

## 3순위 출처 (컨퍼런스/논문)

...

## 4순위 출처 (참고만, 글의 근거로 쓰지 말 것)

...

## 수집 메모

- <자료 수집 중 주목할 만한 관찰>
- <주제와 관련된 추가 맥락이 있으면 간단히>
- 예: "이 주제는 Chrome/Safari 동작이 다름. 브라우저 지원 섹션에서 구분 필요."
- 예: "공식 스펙이 Working Draft 단계. 프로덕션 사용 주의 필요."
```

**출력 양**: 평균 500~1500 토큰 정도. 원문의 10% 이하로 압축. 절대 원문 복사
금지.

---

## 거부 조건

다음 경우 **수집 결과 반환 없이 거부**합니다:

### 1. 1순위 출처 0개

`§SOURCE-PRIORITY` 의 필수 조건 위반. 반환:

```markdown
# 자료 수집 거부: 1순위 공식 출처 없음

주제: <topic>

시도한 전략:

- context7 MCP 조회: <결과>
- MDN URL 직관 매칭: <결과>
- W3C/WHATWG 검색: <결과>
- WebSearch 보조: <결과>

수집된 자료:

- 1순위: 0개
- 2순위: <N>개
- 3순위: <N>개
- 4순위: <N>개

거부 사유: §SOURCE-PRIORITY 필수 조건 미충족.

권장 조치:

- 주제가 너무 새롭거나 공식 문서화되지 않은 영역일 수 있음
- 주제를 더 구체적인 하위 주제로 좁혀서 재시도
- 사용자가 알고 있는 1순위 출처 URL 직접 제공
```

### 2. 수집 한도 초과

WebFetch 6회 또는 context7 3회 초과해도 자료가 부족하면:

```markdown
# 자료 수집 한계 도달

주제: <topic>

수집 시도: WebFetch 6/6회, context7 3/3회 (한도 도달)
수집된 1순위 출처: <N>개 (기준: <depth>)

문제 추정:

- 주제 범위가 너무 넓어서 자료가 분산됨
- 또는 주제가 너무 특수해서 공식 자료가 드묾

권장 조치:

- 주제를 하위 주제로 분할
- 사용자가 핵심 출처 URL 직접 제공
```

### 3. 주제 모호성

`topic` 이 너무 추상적이거나 여러 해석이 가능하면:

```markdown
# 주제 모호

입력: <topic>

이 주제가 아래 중 어느 쪽인가요?

- A. <가능한 해석 1>
- B. <가능한 해석 2>
- C. <가능한 해석 3>

구체적 주제를 다시 알려주세요.
```

---

## 단독 실행 시 — 최종 메시지

(오케스트레이터 호출 시 skip)

수집 완료 후 사용자에게:

```
자료 수집 완료.

주제: <topic>
1순위 출처 <N>개, 2순위 <M>개, 4순위 보조 <K>개 수집.

전체 결과는 위에 있어요. 이 자료로 기획안을 작성하려면:
  /blog-write
  (자료를 붙여넣기)
```

---

## 제약

- **파일 시스템 쓰기 금지**. Read (config 로드) 만 예외. Write, Edit, Bash 안 씀.
- **웹 원문을 반환 금지**. 항상 요약만.
- **한도 초과 시 거부**. WebFetch 6회, context7 3회, 무한 크롤 금지.
- **블랙리스트 도메인 읽기 금지**. config `§DOMAIN-BLACKLIST` 참조.
- **개인 블로그를 1순위로 취급 금지**. 4순위 보조로만.
- **주제 범위 판단 금지**. "이 주제는 너무 커요" 같은 조언은 오케스트레이터/
  draft-review 몫.
- **기획안 작성 금지**. 제목 제안, 섹션 구조 제안 모두 blog-research의 역할 아님.
- SHARED.md 규칙을 SKILL.md에 복사하지 마세요. 참조만.

---

## 가드: MCP 도구 실패 처리

context7 MCP 호출이 실패하면 (네트워크 오류, MCP 서버 미실행 등):

1. 에러를 조용히 기록
2. context7 없이 다른 전략(MDN 직관 매칭, WebSearch)으로 진행
3. 수집 메모에 "context7 MCP 사용 불가, WebFetch로 대체" 명시
4. 거부하지는 않음 (다른 전략으로 1순위 확보 가능하면 정상 진행)

WebFetch가 404, 타임아웃, 권한 오류를 반환하면:

1. 해당 URL만 건너뛰기
2. 다음 URL로 진행
3. 수집 메모에 "URL <x> 접근 실패" 명시
4. **이 경우 WebFetch 카운터는 증가** (시도는 시도니까)

어느 것도 결과 반환을 막지는 않아요. **부분 실패 허용**.

---

## 가드: config/domains.md 없을 때

시작 시 config 로드가 실패하면 (파일 없음, 파싱 실패):

1. 경고 출력 (위 "사전 준비" 섹션 참조)
2. 하드코딩된 최소 fallback 리스트로 진행:
   - `developer.mozilla.org` → 1순위
   - `www.w3.org`, `w3c.github.io` → 1순위
   - `whatwg.org` 및 관련 스펙 도메인 → 1순위
   - 그 외는 전부 4순위
3. 블랙리스트 없음 (fallback 모드에서는 모든 결과 포함)
4. 수집 완료 후 결과 맨 위에 "⚠️ fallback 리스트로 동작" 경고 표기
5. blog-rule-editor 로 config 작성 권장 안내
