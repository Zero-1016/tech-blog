---
name: blog-revise
description: |
  기존 블로그 글을 다듬는 오케스트레이터형 스킬. 5가지 다듬기 패턴을 지원한다:
  재검증만, 부분 수정, 자료 보강, 완전 재작성, 분석만. 사용자가 의도를 자유 서술로
  설명하면 적절한 패턴으로 라우팅하고, 검증 사이클을 마지막에 자동 실행한다.

  사용 트리거: "이 글 다듬어줘", "이 글에 새 정보 추가", "마무리 단락이 어색해",
  "이 글 다시 검증해줘", "/blog-revise <파일>".

  blog-write 와의 차이: blog-write 는 새 글 작성, blog-revise 는 기존 글 수정.
  blog-rule-editor 와의 차이: blog-rule-editor 는 스킬/규칙 수정, blog-revise 는
  글 수정.

tools:
  - Read
  - Edit
  - Write
  - Grep
  - Glob
  - Bash
  - Agent
---

# blog-revise

기존 블로그 글을 다듬는 오케스트레이터. 5가지 패턴 (재검증/부분 수정/자료 보강/
완전 재작성/분석만) 을 사용자 의도에 따라 라우팅하고, 검증 사이클을 마지막에
자동 실행합니다.

**이 skill 은 SHARED.md 의 다음 섹션을 전제**합니다:

- `§FILE-LAYOUT` — 파일 경로 규칙
- `§FRONTMATTER` — frontmatter 필수 필드
- `§UI-USER-CHOICE` — 사용자 선택지는 AskUserQuestion 툴 호출

다른 SHARED.md 섹션은 패턴별로 호출하는 하위 스킬 (validator, expression-review
등) 이 자체적으로 로드합니다. blog-revise 는 라우터 역할이라 규칙을 직접 알 필요
없어요.

---

## 입력 패턴

### 패턴 A: 파일만 지정

```
/blog-revise content/posts/css-aspect-ratio.mdx
```

blog-revise 가 글을 읽고 사용자에게 "어떤 패턴으로 다듬을지" 물어봄.

### 패턴 B: 파일 + 의도 함께

```
/blog-revise content/posts/css-aspect-ratio.mdx 마무리 단락이 좀 단조로워
/blog-revise content/posts/use-memo.mdx 새 규칙으로 다시 검증해줘
/blog-revise content/posts/react-suspense.mdx 완전히 다시 쓰자
```

의도가 명확하면 카탈로그 건너뛰고 바로 해당 패턴으로 진입.

---

## Phase 0: 입력 파싱 + 환경 준비

### Step 0-1: 인자 파싱

`$ARGUMENTS` 에서 다음을 추출:

- **파일 경로**: `.mdx` 로 끝나는 인자
- **의도 (선택)**: 파일 경로를 제외한 나머지 자유 서술

파일 경로가 없으면 거부:

```
파일 경로가 필요해요. 예: /blog-revise content/posts/css-aspect-ratio.mdx
```

### Step 0-2: 파일 존재 확인

```bash
[ -f "$FILE_PATH" ] || echo "파일 없음"
```

없으면 거부. 사용자에게 정확한 경로 확인 요청.

### Step 0-3: 백업 디렉토리 준비

```bash
BACKUP_DIR=content/posts/.backups
mkdir -p "$BACKUP_DIR"
```

`.gitignore` 에 추가되어 있는지 확인:

```bash
if ! grep -q "^content/posts/.backups" .gitignore 2>/dev/null; then
  cat >> .gitignore <<'EOF'

# blog-revise 백업
content/posts/.backups/
EOF
fi
```

---

## Phase 1: 글 읽기 + 메타 정보 추출

### Step 1-1: 파일 통독

```bash
cat "$FILE_PATH"
```

또는 Read 툴로 limit 없이 전체 로드.

### Step 1-2: 메타 정보 추출

frontmatter 에서:

- title
- description
- date
- tags
- series / seriesOrder (시리즈일 때)

본문에서:

- 섹션 구조 (H2 목록 + 라인 번호)
- References 항목들
- 글 길이 (자수)
- 마지막 수정일 (`git log` 가능하면)

```bash
# 마지막 수정 (git 사용 가능 시)
git log -1 --format=%ai "$FILE_PATH" 2>/dev/null
```

### Step 1-3: 메타 정보 사용자에게 표시

```markdown
## 글 정보

- 파일: content/posts/css-aspect-ratio.mdx
- 제목: "CSS aspect-ratio, 반응형 이미지 비율 유지하기"
- 작성일: 2026-04-13
- 마지막 수정: 2026-04-13 (오늘)
- 길이: 약 2400자
- 섹션:
  1. 왜 비율 유지가 어려운가 (L15)
  2. aspect-ratio 의 동작 (L40)
  3. 실전 예시 (L75)
  4. 브라우저 지원 (L120)
  5. 정리 (L150)
- References: 3개 (MDN, W3C, web.dev)
```

---

## Phase 2: 다듬기 패턴 결정

### Case A: 의도가 입력에 포함된 경우 (패턴 B 입력)

자유 서술을 분석해서 패턴 추정:

| 자유 서술 키워드                               | 추정 패턴            |
| ---------------------------------------------- | -------------------- |
| "재검증", "다시 검증", "새 규칙", "통과하는지" | 패턴 1 (재검증만)    |
| "단락", "어색", "다시 써", "수정"              | 패턴 2 (부분 수정)   |
| "새 정보", "자료 추가", "최신", "outdated"     | 패턴 3 (자료 보강)   |
| "다시 쓰자", "완전히", "방향 자체", "처음부터" | 패턴 4 (완전 재작성) |
| "진단", "뭐가 문제", "분석", "어디부터"        | 패턴 5 (분석만)      |

추정한 패턴을 사용자에게 확인 (§UI-USER-CHOICE 준수):

```
입력하신 의도 ("마무리 단락이 좀 단조로워") 를 분석해보니 **부분 수정** 패턴 같아요.

AskUserQuestion(
  questions=[{
    "question": "이 패턴으로 진행할까요?",
    "options": [
      "네, 부분 수정으로 진행",
      "아니요, 다른 패턴 선택할게요",
      "취소"
    ]
  }]
)
```

### Case B: 의도가 없는 경우 (패턴 A 입력)

다듬기 패턴 카탈로그를 사용자에게 제시 (§UI-USER-CHOICE 준수):

```
이 글을 어떻게 다듬을까요?

- 재검증만: 글 본문은 그대로, 새 규칙으로 다시 검증
- 부분 수정: 특정 단락이나 섹션이 어색해서 수정
- 자료 보강: 새 정보 추가 또는 outdated 부분 갱신
- 완전 재작성: 글의 방향 자체를 다시
- 분석만: 뭐가 문제인지 진단만 (수정은 안 함)
```

```
AskUserQuestion(
  questions=[{
    "question": "어떤 패턴으로 다듬을까요?",
    "options": [
      "재검증만 — 새 규칙으로 통과 확인",
      "부분 수정 — 특정 부분이 어색해",
      "자료 보강 — 새 정보 추가",
      "완전 재작성 — 방향 자체를 다시",
      "분석만 — 진단만, 수정은 나중에"
    ]
  }]
)
```

선택된 패턴에 따라 해당 Phase 로 진입.

---

## Phase 3: 패턴별 실행

각 패턴은 독립적인 흐름이에요. 사용자가 선택한 패턴에 해당하는 섹션만 실행.

### 패턴 1: 재검증만

가장 단순한 패턴. 글 본문은 손대지 않고 검증 사이클만 다시 돌림.

#### Step P1-1: validator 호출

`.claude/skills/blog-validator/SKILL.md` 를 Read 로 주입하고 호출:

```
Read .claude/skills/blog-validator/SKILL.md
```

입력:

```
files: [<파일 경로>]
mode: "single"
via: "blog-revise"
```

validator 가 자동 수정 + 사용자 확인 항목을 반환.

#### Step P1-2: expression-review 호출

`.claude/skills/blog-expression-review/SKILL.md` 를 Read 로 주입하고 호출:

```
Read .claude/skills/blog-expression-review/SKILL.md
```

입력:

```
files: [<파일 경로>]
mode: "single"
via: "blog-revise"
```

#### Step P1-3: coherence-review 호출

`.claude/skills/blog-coherence-review/SKILL.md` 를 Read 로 주입하고 호출:

```
Read .claude/skills/blog-coherence-review/SKILL.md
```

입력:

```
files: [<파일 경로>]
mode: "single"
via: "blog-revise"
```

#### Step P1-4: 결과 종합

세 리뷰어의 결과를 종합해서 Phase 4 (결과 보고) 로 진입.

---

### 패턴 2: 부분 수정

가장 손이 많이 가는 패턴. "어느 부분 / 어떻게" 를 단계적으로 받음.

#### Step P2-1: 어느 부분인지 추정

사용자가 의도를 자유 서술로 줬으면 (`"마무리 단락이 어색해"`), Phase 1 에서 추출한 섹션 구조와 비교해서 가장 가까운 위치 추정:

- "마무리" → 마지막 H2 섹션
- "도입" → 첫 H2 섹션
- "섹션 N" → N 번째 H2 섹션
- "L23" → 라인 번호 직접 지정
- 본문 일부 인용 → grep 으로 라인 찾기

추정 결과를 사용자에게 확인:

```
"마무리 단락" 은 L150~L165 (섹션 5 "정리") 같아요.

이 섹션:
  L150: ## 정리
  L152: aspect-ratio 는 반응형 이미지에서 가장 깔끔한 해법이에요.
  L154: 단, 폴백을 위한 padding-top 트릭도 알아두면 좋아요.
  L156: 브라우저 지원이 충분해진 지금 망설일 이유가 없죠.

맞나요?
```

```
AskUserQuestion(
  questions=[{
    "question": "이 부분이 맞나요?",
    "options": [
      "네, 이 부분",
      "아니요, 다른 부분 (직접 지정할게요)",
      "취소"
    ]
  }]
)
```

"다른 부분" 선택 시 사용자에게 자유 서술로 더 명확한 위치 지시 요청.

#### Step P2-2: 어떻게 수정할지 받기

수정 방식 선택 (§UI-USER-CHOICE 준수):

```
AskUserQuestion(
  questions=[{
    "question": "어떻게 수정할까요?",
    "options": [
      "직접 새 내용을 줄게요 — 다음 메시지에서 입력",
      "의도만 설명할 테니 Claude 가 제안",
      "취소"
    ]
  }]
)
```

#### Step P2-3a: 직접 내용 입력 시

사용자가 다음 메시지에서 새 내용을 보내면 그대로 Edit 으로 적용 준비. Phase 3.5 (수정 적용) 로 진입.

#### Step P2-3b: 의도 설명 + Claude 제안 시

사용자에게 의도 자유 서술로 받기:

```
어떻게 다듬으면 좋을지 설명해주세요. 예:
- "더 짧게, 한 문장으로"
- "구체 예시 한 줄 추가"
- "어조를 더 친근하게"
- "결론을 좀 더 강하게"
```

사용자 응답 받은 후, 원문 + 의도를 기반으로 Claude 가 수정안 2~3개 생성:

```markdown
원문:
L150: ## 정리
L152: aspect-ratio 는 반응형 이미지에서 가장 깔끔한 해법이에요.
L154: 단, 폴백을 위한 padding-top 트릭도 알아두면 좋아요.
L156: 브라우저 지원이 충분해진 지금 망설일 이유가 없죠.

의도: "어조를 더 친근하게, 마지막에 1인칭 한 줄 추가"

수정안 1:

## 정리

aspect-ratio 는 반응형 이미지에서 가장 깔끔한 해법이에요.
폴백으로 padding-top 트릭도 알아두면 더 든든하고요.
저도 처음엔 padding-top 만 썼는데, aspect-ratio 가 나온 이후로는
거의 안 쓰게 되더라고요.

수정안 2:

## 정리

반응형 이미지에서 비율 유지는 aspect-ratio 가 가장 단순해요.
옛날엔 padding-top 트릭으로 우회했는데, 이젠 한 줄로 끝나죠.
브라우저 지원도 충분하니 망설일 이유가 없어요.
```

```
AskUserQuestion(
  questions=[{
    "question": "어느 수정안으로 진행할까요?",
    "options": [
      "수정안 1",
      "수정안 2",
      "둘 다 마음에 안 들어요 — 다시 제안",
      "취소"
    ]
  }]
)
```

#### Step P2-4: 수정 적용 (Phase 3.5)

선택된 수정안으로 Edit 적용. 백업 먼저:

```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SLUG=$(basename "$FILE_PATH" .mdx)
cp "$FILE_PATH" "content/posts/.backups/${SLUG}-${TIMESTAMP}.mdx"
```

그 다음 Edit 툴로 수정:

```
Edit(
  file_path="<파일 경로>",
  old_string="<원문>",
  new_string="<수정안>"
)
```

#### Step P2-5: 검증 사이클 (P1-1 ~ P1-4 와 동일)

수정 후 새 결함이 없는지 확인. validator + expression-review + coherence-review 순차 호출.

---

### 패턴 3: 자료 보강

자료를 새로 가져와서 특정 섹션에 통합. 패턴 2 보다 복잡함.

#### Step P3-1: 어떤 자료가 필요한지 받기

```
AskUserQuestion(
  questions=[{
    "question": "어떤 자료가 필요한가요?",
    "options": [
      "URL을 직접 줄게요 — 다음 메시지에서 입력",
      "주제 키워드로 자동 검색 (blog-research 호출)",
      "취소"
    ]
  }]
)
```

#### Step P3-2a: URL 직접 제공 시

사용자가 다음 메시지에서 URL 입력. WebFetch 로 내용 가져오기:

```
WebFetch(url=<URL>)
```

여러 URL 가능. 각각 fetch 후 핵심 정보 요약.

#### Step P3-2b: blog-research 호출 시

사용자에게 검색 키워드 받기:

```
어떤 주제로 검색할까요? 예: "React 19 useActionState"
```

blog-research 를 sub-agent 로 호출:

```
Agent(
  description="기존 글에 통합할 추가 자료 수집",
  prompt="""
.claude/skills/blog-research/SKILL.md 의 지침을 따라 자료를 수집해줘.

topic: <사용자 키워드>
user_urls: []
depth: basic
via: "blog-revise"

기존 글의 주제와 관련된 추가 자료를 모아줘.
"""
)
```

#### Step P3-3: 어느 섹션에 통합할지 받기

수집한 자료의 요약을 사용자에게 보여주고:

```
AskUserQuestion(
  questions=[{
    "question": "이 자료를 어느 섹션에 통합할까요?",
    "options": [
      "섹션 1: 왜 비율 유지가 어려운가",
      "섹션 2: aspect-ratio 의 동작",
      "섹션 3: 실전 예시",
      "섹션 4: 브라우저 지원",
      "섹션 5: 정리",
      "새 섹션 추가",
      "취소"
    ]
  }]
)
```

"새 섹션 추가" 선택 시 어디에 삽입할지 추가 질문.

#### Step P3-4: 통합 제안 생성

선택된 섹션의 원문 + 새 자료 → Claude 가 통합 수정안 생성. 패턴 2 의 Step P2-3b 와 비슷한 형식으로 1~2개 안 제시.

#### Step P3-5: References 업데이트

새 자료가 References 에 추가되어야 함. 자동으로:

- 새 출처를 References 컴포넌트에 추가
- Cite id 매칭 확인
- 1순위 출처면 §SOURCE-PRIORITY 분류

#### Step P3-6: 수정 적용 (백업 + Edit)

패턴 2 의 Step P2-4 와 동일.

#### Step P3-7: 검증 사이클

패턴 2 의 Step P2-5 와 동일.

---

### 패턴 4: 완전 재작성

기존 글을 통째로 다시 씀. blog-write 호출의 wrapper.

#### Step P4-1: 기존 글의 메타 정보 보존

Phase 1 에서 추출한 메타 정보를 보관:

- 제목 (그대로 쓸지 새로 받을지)
- slug (유지할지 새로 받을지)
- 기존 References (참고로 사용)
- 작성일 (유지)

#### Step P4-2: 사용자에게 재작성 옵션 묻기

```
AskUserQuestion(
  questions=[{
    "question": "재작성 시 무엇을 유지할까요?",
    "options": [
      "제목과 slug 유지, 본문만 새로",
      "전부 새로 (제목도 다시)",
      "취소"
    ]
  }]
)
```

#### Step P4-3: 백업

기존 파일을 .backups/ 로 복사:

```bash
TIMESTAMP=$(date +%Y%m%d-%H%M%S)
SLUG=$(basename "$FILE_PATH" .mdx)
cp "$FILE_PATH" "content/posts/.backups/${SLUG}-${TIMESTAMP}-pre-rewrite.mdx"
```

`pre-rewrite` 접미사로 일반 백업과 구분.

#### Step P4-4: blog-write 호출

```
Read .claude/skills/blog-write/SKILL.md
```

지침대로 실행하되, 다음 점에서 다름:

- 주제는 기존 글의 제목 또는 사용자가 새로 지정
- 기존 References 를 user_urls 로 전달 (writer 가 참고)
- 저장 경로는 기존 파일 경로 (덮어쓰기)

blog-write 가 정상 흐름대로 Phase 0~6 실행. GATE 1 (기획안 승인) 도 정상 작동.

#### Step P4-5: 덮어쓰기 처리

blog-write 가 새 파일을 저장할 때 기존 경로와 충돌. 두 가지 처리:

**방법 A**: blog-write 가 저장 전 충돌 감지 → blog-revise 가 "덮어쓰기 승인" 받았다고 알림
**방법 B**: blog-write 가 임시 경로에 저장 → blog-revise 가 받아서 원본 위치로 이동

방법 B 가 더 안전. blog-write 의 Phase 4 에서 "via: blog-revise" 면 임시 경로 사용.

(이건 blog-write SKILL.md 패치가 필요한 부분이라, 다음 메시지에서 다룸)

---

### 패턴 5: 분석만

수정 없이 진단만. validator + expression-review + coherence-review 를 dry_run 모드로 호출.

#### Step P5-1: validator dry_run

```
Read .claude/skills/blog-validator/SKILL.md
```

입력:

```
files: [<파일 경로>]
mode: "single"
via: "blog-revise"
dry_run: true
```

`dry_run: true` 일 때 validator 는 자동 수정하지 않고, **발견한 모든 항목을 보고만** 반환.

(이 dry_run 모드는 다음 메시지에서 validator 패치로 추가)

#### Step P5-2: expression-review dry_run

```
Read .claude/skills/blog-expression-review/SKILL.md
```

입력:

```
files: [<파일 경로>]
mode: "single"
via: "blog-revise"
dry_run: true
```

마찬가지로 자동 수정 없이 보고만.

#### Step P5-3: coherence-review (이미 거의 보고만)

coherence-review 는 원래 자동 수정을 거의 안 하므로 dry_run 옵션 불필요. 일반 호출:

```
files: [<파일 경로>]
mode: "single"
via: "blog-revise"
```

#### Step P5-4: 데모 밀도 검사

`§MDX-DEMO-DENSITY` 기준으로 글의 인터랙티브 데모 충분성 진단.

1. frontmatter의 `tags`로 데모 밀집형 여부 판단 (CSS 속성, 브라우저 API, 비교 데모, 인터랙션 중 2개 이상)
2. 글에서 `<CodePlayground` 개수 카운트
3. 정적 코드 블록 (``````` 펜스) 개수 카운트
4. 밀집형인데 CodePlayground < 정적 코드 블록이면 "데모 부족" 경고
5. 정적 코드 블록 중 CodePlayground로 전환하면 효과적인 것 식별

결과는 진단 리포트의 별도 섹션으로 포함:

```markdown
### 데모 밀도 — 1건 [권장]

- 분류: 밀집형 (CSS 선택자 + 인터랙션)
- CodePlayground: 1개 / 정적 코드 블록: 4개
- 권장: 섹션 2 "실전 패턴", 섹션 4 "조합 활용"의 코드 블록을 CodePlayground로 전환
```

#### Step P5-5: 종합 진단 리포트

세 리뷰어의 결과 + 데모 밀도 검사를 종합해서 사용자에게 진단 리포트 제공:

```markdown
## 진단 리포트: content/posts/css-aspect-ratio.mdx

### validator (표면 패턴) — 0건

✅ 모든 정규식 검증 통과

### expression-review (표현 의미) — 3건

- A4 과장 형용사 (L67): "강력한 성능"
- B1 어미 비율: 격식체 35% (권장 30% 이하)
- B3 자기 목소리: 1인칭 0건 (3000자+ 글에서 1~2건 권장)

### coherence-review (논리) — 1건 [취향]

- E2 섹션 연결 [취향]: 섹션 3 → 섹션 4 전환이 약간 갑작스러움

### 데모 밀도 — N건

- 분류: <밀집형|일반형|이론형>
- CodePlayground: N개 / 정적 코드 블록: M개
- 권장: <전환 대상 섹션 또는 "충분">

### 종합 권장

- 우선순위 높음: 자기 목소리 추가 (B3)
- 우선순위 중간: "강력한 성능" 을 구체 표현으로
- 취향: 섹션 3-4 사이 연결 문장
```

#### Step P5-6: 다음 행동 제안

진단 후 사용자가 어떻게 할지 (§UI-USER-CHOICE 준수):

```
AskUserQuestion(
  questions=[{
    "question": "진단 결과를 보고 다음 행동을 선택해주세요",
    "options": [
      "발견된 항목들 자동 수정 (validator + expression-review 정상 모드 호출)",
      "특정 항목만 부분 수정 (패턴 2 로 진입)",
      "데모 부족 항목에 CodePlayground 추가 (패턴 2 로 진입)",
      "지금은 안 함, 결과만 확인",
      "분석 다시 (다른 시각으로)"
    ]
  }]
)
```

선택에 따라 패턴 1 또는 패턴 2 로 라우팅, 또는 종료.

---

## Phase 4: 결과 보고

모든 패턴의 마지막 단계. 수행한 작업과 결과를 종합 보고.

### 보고 형식

```markdown
# ✅ blog-revise 완료

## 작업 내역

- 패턴: <선택된 패턴>
- 파일: content/posts/<slug>.mdx
- 백업: content/posts/.backups/<slug>-<timestamp>.mdx

## 변경 사항

(패턴별로 다름)

### 패턴 1 (재검증만):

- validator: <자동 수정 N건, 경고 M건>
- expression-review: <자동 수정 N건, 사용자 확인 후 수정 M건>
- coherence-review: <사용자 확인 후 수정 N건>

### 패턴 2 (부분 수정):

- 수정 위치: L150~L165 (섹션 5 "정리")
- 수정 방식: 의도 기반 제안, 수정안 1 적용
- 검증 결과: 모두 통과

### 패턴 3 (자료 보강):

- 추가 자료: 2건 (URL: ..., URL: ...)
- 통합 위치: 섹션 4 "브라우저 지원"
- References 업데이트: 2건 추가
- 검증 결과: 모두 통과

### 패턴 4 (완전 재작성):

- blog-write 호출 완료
- 새 본문 길이: <자수>
- References: <개수>
- 검증 결과: <모두 통과 또는 N건 사용자 확인>

### 패턴 5 (분석만):

- 진단 결과: <validator N건, expression M건, coherence K건>
- 후속 행동: <사용자 선택>

## 다음 단계

- 로컬 확인: pnpm dev
- git diff 로 변경 확인
- 필요하면 git checkout content/posts/.backups/<백업파일>.mdx 로 복구

## 백업 정리

30일 이상 된 백업이 있으면 정리 권장. 수동:
find content/posts/.backups/ -mtime +30 -delete
```

---

## 백업 정책

### 백업 시점

- 패턴 2 (부분 수정) 적용 전
- 패턴 3 (자료 보강) 적용 전
- 패턴 4 (완전 재작성) 적용 전
- 패턴 1, 5 는 본문 수정 없으므로 백업 불필요 (validator/expression-review 의 자동 수정은 자체 처리)

### 파일명 규칙

```
content/posts/.backups/<slug>-<YYYYMMDD-HHMMSS>.mdx
content/posts/.backups/<slug>-<YYYYMMDD-HHMMSS>-pre-rewrite.mdx  (패턴 4 전용)
```

### 백업 정리

자동 정리 안 함. 사용자가 수동으로:

```bash
# 30일 이상 된 백업 삭제
find content/posts/.backups/ -mtime +30 -delete
```

또는 blog-revise 호출 시 30일 이상 된 백업 발견하면 알림:

```
참고: content/posts/.backups/ 에 30일 이상 된 백업 N개 있어요. 정리하시려면:
  find content/posts/.backups/ -mtime +30 -delete
```

---

## blog-rule-editor 와의 연결 힌트

검증 사이클 (validator + expression-review + coherence-review) 을 돌리다가 같은
규칙에 반복적으로 걸리면, 그건 글의 문제일 수도 있지만 **규칙 자체의 문제** 일
수도 있어요.

이 경우 결과 보고에 힌트 추가:

```
참고: 이 글이 §RULE-HYPE 에 3번 걸렸어요. 글의 문제일 수도 있지만, 규칙이 너무
엄격할 수도 있어요. 규칙을 검토하시려면:
  /blog-rule-editor §RULE-HYPE 검토해줘
```

강제하지 않고 제안만.

---

## GATE 정리 (결정적 단계만)

blog-revise 의 GATE 는 두 곳만:

1. **Phase 2 패턴 결정 GATE**: 어떤 패턴으로 진행할지
2. **수정 적용 직전 GATE**: 패턴 2/3 의 수정안 최종 확인 또는 패턴 4 의 blog-write GATE 1

그 외 단계는 자동 진행. 단:

- 패턴 2 의 "어느 부분" 추정 결과 확인은 GATE 가 아닌 빠른 yes/no
- 패턴 3 의 "자료 종류" 와 "통합 섹션" 은 정보 입력일 뿐 GATE 아님
- 패턴 5 의 "다음 행동" 은 종료 후 추가 작업 라우팅이라 별개

---

## 단독 실행 vs 다른 스킬 호출

blog-revise 는 **항상 단독 실행**이에요. 다른 스킬이 blog-revise 를 호출하지
않음. 사용자가 직접 호출.

내부적으로 blog-revise 는 다음 스킬을 호출:

- blog-validator (Read 로 주입)
- blog-expression-review (Read 로 주입)
- blog-coherence-review (Read 로 주입)
- blog-research (Agent 툴로 sub-agent, 패턴 3 만)
- blog-write (Read 로 주입, 패턴 4 만)

---

## 제약

- **검사 대상은 단일 MDX 파일**. 여러 글을 한 번에 다듬는 건 지원 안 함 (사용자가
  글마다 호출).
- **시리즈 글은 편 단위로 호출**. 시리즈 전체를 한 번에 다듬는 건 복잡도 높아 지원 안 함.
- **GATE 2 곳만 의무**. 나머지는 자동 진행 (사용자가 짜증나지 않게).
- **백업은 본문 수정이 있는 패턴만**. 패턴 1, 5 는 백업 불필요.
- **패턴 4 는 blog-write 의 wrapper**. blog-revise 가 직접 글을 쓰지 않음.
- **blog-rule-editor 와의 경계**: 글 수정은 blog-revise, 규칙/스킬 수정은
  blog-rule-editor. 둘 다 호출이 필요하면 사용자가 순차로.
- **SHARED.md 규칙을 SKILL.md 에 복사하지 마세요**. Read 로 참조만.
