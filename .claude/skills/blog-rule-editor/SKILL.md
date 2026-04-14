---
name: blog-rule-editor
description: |
  블로그 스킬 패밀리(blog-*, blog-shared)를 안전하게 관리하는 **필수 경유 메타 스킬**.
  SHARED.md 규칙 수정, config/domains.md 편집, 개별 skill 파일 수정, 새 skill 추가,
  writer-failures.md 패턴 분석 등을 대화로 처리한다. 모든 수정은 백업 + 사용자 승인
  + CHANGELOG 자동 기록 + 영향 범위 분석 + 재검증 제안을 거친다.

  **필수 경유 원칙 (블로커급)**: `.claude/skills/blog-*` 경로의 어떤 파일이든
  수정이 필요하면 **반드시** 이 스킬을 호출해야 한다. 직접 Edit/Write 툴로 접근하는
  것은 금지. "한 줄만 고치는 간단한 수정"이라는 판단도 금지 (간단해 보여도 SSOT
  위반, 다른 skill 참조 손상, CHANGELOG 누락 등의 리스크가 있음). 유일한 예외는
  blog-rule-editor SKILL.md 자기 자신 수정 (Rail 5).

  사용 트리거 (다음 중 하나라도 맞으면 즉시 이 스킬 호출):
  - "이 규칙 고치고 싶어", "새 규칙 추가해줘"
  - "SHARED.md 에 X 추가/수정/삭제"
  - "writer 실패 로그 봐줘"
  - "domains.md 에 X 추가"
  - "새 blog-* 스킬 만들자"
  - "blog-writer/validator/research SKILL.md 에 X 추가"
  - "스킬에 ~ 언급되면 ~ 해달라고 추가"
  - 모든 `.claude/skills/blog-*` 경로 편집 요청
  - `/blog-rule-editor` 슬래시 커맨드

  절대 하지 않는 것: 블로그 글 직접 작성 (blog-write 몫), 글 검증 (blog-validator 몫),
  자기 자신(blog-rule-editor SKILL.md) 수정, content/posts/* 편집, 사용자 승인 없는
  자동 수정.

tools:
  - Read
  - Write
  - Edit
  - Grep
  - Glob
  - Bash
  - AskUserQuestion
  - Agent
---

# blog-rule-editor

블로그 스킬 패밀리의 **메타 관리 스킬**. SHARED.md 규칙, config/domains.md, 개별
skill 파일을 안전하게 수정하고, 새 skill 을 추가하고, 반복 실패 로그를 분석해서
장기 개선 방향을 제안합니다.

**모든 수정은 사용자 승인 후에만 이루어져요.** 읽기는 자유, 쓰기는 승인 필수.

---

## 전제 (시작 시 로드)

SHARED.md 의 다음 섹션을 Read 로 주입:

- `§UI-USER-CHOICE` — 모든 사용자 선택지는 AskUserQuestion 툴 호출 (마크다운 리스트 금지)

나머지 섹션(§RULE-_, §META-_, §FRONTMATTER 등)은 **수정 대상이 되는 섹션만 필요할 때 Read**.
전체 로드 안 함.

---

## 관리 대상

blog-rule-editor 가 수정할 수 있는 파일:

**✅ 허용**:

- `.claude/skills/blog-shared/SHARED.md`
- `.claude/skills/blog-shared/config/*.md` (domains.md 등)
- `.claude/skills/blog-write/SKILL.md`
- `.claude/skills/blog-research/SKILL.md`
- `.claude/skills/blog-writer/SKILL.md`
- `.claude/skills/blog-validator/SKILL.md`
- `.claude/skills/blog-*/SKILL.md` (나중에 추가될 blog-expression-review, blog-coherence-review, blog-draft-review 등)
- `.claude/skills/blog-shared/CHANGELOG.md` (자동 기록)
- `.claude/skills/blog-shared/.backups/*.md` (자동 생성)
- 새 `.claude/skills/blog-*/SKILL.md` (신규 skill 생성)

**❌ 금지**:

- `.claude/skills/blog-rule-editor/SKILL.md` ← **자기 자신 수정 금지** (Rail 5)
- `content/posts/*` ← blog-writer 가 관리
- `content/tmp/*` ← 로컬 로그, 일반 편집 대상 아님
- 그 외 프로젝트 파일 전부

---

## 안전 장치 (Rails)

### Rail 1: 사용자 승인 없는 수정 금지

모든 쓰기 작업은 AskUserQuestion 으로 명시적 승인을 받은 후에만 실행. 읽기는 자유.

### Rail 2: 수정 전 백업

모든 수정 전에 대상 파일을 `.claude/skills/blog-shared/.backups/` 에 타임스탬프 붙여 복사:

```bash
BACKUP_DIR=.claude/skills/blog-shared/.backups
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# 예: SHARED.md 수정 전
cp .claude/skills/blog-shared/SHARED.md "$BACKUP_DIR/SHARED-$TIMESTAMP.md"
```

파일명 규칙: `<원본파일명 without ext>-<YYYYMMDD-HHMMSS>.md`

### Rail 3: 수정 전 diff 미리보기

실제 Edit 호출 전에 사용자에게 변경 예정 내용을 보여주고 최종 확인:

```markdown
## 수정 예정 diff

파일: .claude/skills/blog-shared/SHARED.md
섹션: §RULE-HYPE

- "완벽한", "강력한", "혁신적인", "놀라운", "최고의", "획기적인", "효율적인",
- "최적화된", "간편한"

* "완벽한", "강력한", "혁신적인", "놀라운", "최고의", "획기적인", "효율적인",
* "최적화된"
```

AskUserQuestion 으로 최종 확인 (§UI-USER-CHOICE 준수):

```
AskUserQuestion(
  questions=[{
    "question": "위 diff 대로 수정할까요?",
    "options": [
      "네, 이대로 수정",
      "수정은 맞는데 조금 다르게 — 추가 설명할게요",
      "취소"
    ]
  }]
)
```

### Rail 4: SSOT 원칙 강제

같은 규칙을 여러 파일에 복사하려는 시도 거부.

예: 사용자가 "post-validator SKILL.md 에 em-dash 검출 로직 직접 써줘" 라고 하면:

```
거부. em-dash 규칙은 SHARED.md §RULE-EMDASH 에 이미 정의되어 있어요.
blog-validator 는 "SHARED.md §RULE-EMDASH 참조" 로 가야 합니다 (SSOT 원칙).

규칙 자체를 바꾸고 싶으면 SHARED.md §RULE-EMDASH 를 수정하세요.
blog-validator 에만 다르게 동작시키고 싶으면 그건 SSOT 원칙 위반이에요.

왜 이런 요구가 나왔는지 설명해주시면 대안을 같이 고민할게요.
예를 들어:
- SHARED.md 의 규칙이 너무 엄격한가요? → 규칙 자체 완화
- 특정 컨텍스트에서만 예외가 필요한가요? → 규칙에 예외 조항 추가
- blog-validator 가 규칙을 잘못 해석하고 있나요? → 참조 방식 수정
```

### Rail 5: 자기 자신 수정 금지

blog-rule-editor SKILL.md 를 수정하려는 요청은 거부:

```
거부. blog-rule-editor 는 자기 자신을 수정할 수 없어요. 자기 수정 루프는 디버깅
악몽이에요.

blog-rule-editor 자체를 고치고 싶으시면:
- Claude 에게 일반 Edit 요청: "blog-rule-editor SKILL.md 의 X 섹션을 Y 로 고쳐줘"
- 또는 에디터로 직접 편집

수정 후에는 새 버전의 blog-rule-editor 가 다음 세션부터 동작합니다.
```

### Rail 6: 영향 범위 자동 분석 (B: 중간 깊이)

수정 전에 반드시 영향 범위 확인. 중간 깊이로:

1. **grep**: 수정할 섹션 ID 또는 관련 키워드를 참조하는 다른 파일 검색
2. **파일 읽기**: grep 결과에 걸린 파일의 frontmatter + 관련 섹션 읽기
3. **1단계 영향 평가**: 이 파일이 다른 파일에 의존하는지 한 단계만 추적

```bash
# 예: §RULE-HYPE 수정 시
grep -r "§RULE-HYPE" .claude/skills/blog-*/SKILL.md 2>/dev/null
grep -r "§RULE-HYPE" .claude/skills/blog-shared/ 2>/dev/null

# grep 에 걸린 파일의 관련 섹션을 읽어서 영향 파악
```

결과 보고 형식:

```markdown
## 영향 범위

### 직접 참조 (§RULE-HYPE)

- .claude/skills/blog-writer/SKILL.md — Step 8 자가 체크에서 참조
- .claude/skills/blog-validator/SKILL.md — Phase 2 규칙 체크에서 참조

### 기존 블로그 글 영향

- content/posts/css-flexbox.mdx — L23 에 "완벽한" 사용
- content/posts/react-hooks.mdx — L12 에 "강력한" 사용

### writer-failures.md 관련 로그

- 해당 규칙 위반 로그 0건

### 1단계 의존성

- blog-write (오케스트레이터) 가 blog-writer 를 호출하므로 간접 영향.
  하지만 blog-write 는 규칙 참조 안 함, 통과.
```

### Rail 7: 수정 유형별 확인 횟수

| 수정 유형                       | 확인 횟수                 |
| ------------------------------- | ------------------------- |
| 기존 규칙 수정 (단어 추가/제거) | 1회                       |
| 기존 규칙 완전 재작성           | 2회                       |
| 새 규칙 섹션 추가               | 1회                       |
| 기존 섹션 삭제                  | 2회 + "정말 삭제?" 강조   |
| 새 skill 파일 생성              | 여러 번 (요구사항 확인)   |
| 기존 skill 파일 삭제            | 3회 + 1주일 보관          |
| SHARED.md 섹션 분리             | 전체 backup + 단계별 확인 |
| config/domains.md 수정          | 1회                       |
| CHANGELOG 기록                  | 자동 (확인 없음)          |

---

## 입력 패턴

### 패턴 A: 자유 형식 (`/blog-rule-editor`)

사용자가 구체 요청 없이 스킬만 호출. 이 경우 **작업 카탈로그**를 먼저 보여주고
사용자 선택 받기.

### 패턴 B: 구체 요청 (`/blog-rule-editor §RULE-HYPE 에서 간편한 빼줘`)

사용자가 구체 요청과 함께 호출. 카탈로그 건너뛰고 바로 해당 작업 흐름 진입.

---

## 작업 카탈로그 (패턴 A 시작 시)

사용자에게 텍스트로 제시한 후 AskUserQuestion 으로 카테고리 선택:

```markdown
# blog-rule-editor — 블로그 스킬 패밀리 관리

자주 하는 작업 카테고리예요:

## 규칙 수정

- 기존 규칙 완화/강화 (예: "§RULE-HYPE 에서 '간편한' 빼줘")
- 새 규칙 추가 (예: "'~하는 것 같아요' 패턴 잡고 싶어")
- 규칙 충돌 해결

## 설정 파일 (config/)

- domains.md 에 새 도메인 추가
- 도메인 화이트리스트에서 특정 도메인 제거
- 블랙리스트 추가

## 스킬 파일

- 기존 skill 의 Phase/Step 수정
- 새 skill 추가
- skill 의 역할 재정의

## 분석 및 진단

- writer-failures.md 패턴 분석
- validator 경고 누적 트렌드
- 규칙 위반 빈도 리포트

## 유지보수

- 백업 정리 (30일 초과분 삭제)
- CHANGELOG 확인
- SHARED.md 섹션 재구성
```

그 다음 AskUserQuestion 호출:

```
AskUserQuestion(
  questions=[{
    "question": "어떤 작업을 도와드릴까요?",
    "options": [
      "규칙 수정 (SHARED.md)",
      "설정 파일 (config/)",
      "스킬 파일 편집",
      "분석 및 진단",
      "유지보수",
      "자유 서술로 설명할게요"
    ]
  }]
)
```

선택 후 해당 Phase 로 진입.

---

## Phase 1: 현재 상태 읽기

어떤 작업이든 시작은 **현재 상태 확인**. 수정 대상 파일과 관련 섹션을 Read.

### Step 1-1: 작업 카테고리 확정

사용자 선택 또는 구체 요청에서 다음을 파악:

- 수정 대상 파일 (SHARED.md / config / skill)
- 수정 대상 섹션 (§RULE-X, Phase Y 등)
- 수정 유형 (규칙 수정 / 섹션 추가 / 파일 생성 등)

### Step 1-2: 관련 파일 Read

대상 파일의 해당 섹션만 Read (토큰 절약):

```bash
# 예: §RULE-HYPE 수정 시
grep -A 30 "^## §RULE-HYPE" .claude/skills/blog-shared/SHARED.md
```

또는 `Read` 툴로 offset/limit 써서 해당 라인 주변만.

### Step 1-3: 현재 상태 사용자에게 보여주기

```markdown
## 현재 상태: §RULE-HYPE

**규칙**: 마케팅성 형용사를 구체적 동작·수치·예시로 치환합니다.

**금지 단어**: "완벽한", "강력한", "혁신적인", "놀라운", "최고의", "획기적인",
"효율적인", "최적화된", "간편한"

**판단 기준**: 문맥에서 구체성을 제거한 칭찬 단어면 위반.

마지막 수정: (CHANGELOG 에서 추출, 있으면)
```

---

## Phase 2: 진단 + 옵션 제시

현재 상태를 확인한 후 **Rail 6 영향 범위 분석**을 먼저 실행하고, 수정 옵션을 제시.

### Step 2-1: 영향 범위 분석 (Rail 6)

grep + 파일 읽기 + 1단계 의존성 추적. 결과를 리포트 형식으로 정리.

### Step 2-2: 수정 옵션 생성

사용자 요청에 따라 2~4개 옵션 생성. 옵션마다:

- 구체적 수정 내용
- 장단점
- 영향 범위

예:

```markdown
## 수정 옵션

### 옵션 A: 금지 단어 리스트에서 "간편한" 완전 제거

- 변경: 리스트에서 "간편한" 한 단어 삭제
- 장점: 가장 단순, SSOT 유지
- 단점: "간편 결제" 같은 마케팅 용도도 통과시킴
- 영향: blog-writer Step 8, blog-validator Phase 2 자동 반영

### 옵션 B: 조건부 예외 추가

- 변경: "간편한" 유지하되 "단, '간편 결제', '간편 인증' 같은 고유명사 복합어는 예외"
  조항 추가
- 장점: 일반 사용은 여전히 잡음, 고유명사만 통과
- 단점: 규칙이 복잡해짐, 판단 기준 모호
- 영향: blog-writer Step 8, blog-validator Phase 2 자동 반영

### 옵션 C: 취소

- 현재 상태 유지
```

### Step 2-3: AskUserQuestion 으로 선택

§UI-USER-CHOICE 준수:

```
AskUserQuestion(
  questions=[{
    "question": "어느 옵션으로 진행할까요?",
    "options": [
      "A: '간편한' 완전 제거",
      "B: 고유명사 예외 조항 추가",
      "C: 취소 (현재 상태 유지)"
    ]
  }]
)
```

---

## Phase 3: 수정 계획 확정 (diff 미리보기)

옵션이 선택되면 **Rail 3 diff 미리보기**를 생성.

### Step 3-1: diff 생성

변경 전/후를 명확히 대비해서 보여주기:

```markdown
## 수정 예정 diff

파일: .claude/skills/blog-shared/SHARED.md
섹션: §RULE-HYPE
수정 유형: 기존 규칙 수정 (단어 제거)

### 변경 전
```

**금지 단어**: "완벽한", "강력한", "혁신적인", "놀라운", "최고의", "획기적인",
"효율적인", "최적화된", "간편한"

```

### 변경 후
```

**금지 단어**: "완벽한", "강력한", "혁신적인", "놀라운", "최고의", "획기적인",
"효율적인", "최적화된"

```

### 추가 영향
- blog-writer Step 8 자가 체크 리스트는 SHARED.md 참조만 하므로 자동 반영
- blog-validator Phase 2 단어 체크도 자동 반영
- CHANGELOG 자동 기록 예정
- 기존 글 영향: 3건에 "간편한" 사용됨 (재검증 제안 예정)
```

### Step 3-2: 최종 확인 (Rail 7: 수정 유형별 확인 횟수)

Rail 7 의 확인 횟수에 따라 AskUserQuestion 호출.

이 예시(기존 규칙 수정, 단어 제거)는 1회 확인:

```
AskUserQuestion(
  questions=[{
    "question": "위 diff 대로 수정할까요?",
    "options": [
      "네, 이대로 수정",
      "조금 다르게 — 추가 지시할게요",
      "취소"
    ]
  }]
)
```

**2회 확인이 필요한 경우** (기존 섹션 삭제 등): 첫 확인 후 "정말 삭제하시겠어요?" 한 번 더.

**3회 확인이 필요한 경우** (skill 파일 삭제): 첫 확인 + "정말?" + "파일 삭제는 1주일 보관 후 최종 삭제됩니다" + 최종 확인.

---

## Phase 4: 백업 + 수정 실행

사용자 승인 후에만 실행.

### Step 4-1: 백업 생성 (Rail 2)

```bash
BACKUP_DIR=.claude/skills/blog-shared/.backups
mkdir -p "$BACKUP_DIR"
TIMESTAMP=$(date +%Y%m%d-%H%M%S)

# 대상 파일별 백업
cp .claude/skills/blog-shared/SHARED.md "$BACKUP_DIR/SHARED-$TIMESTAMP.md"
```

백업 완료 메시지:

```
✅ 백업 생성: .claude/skills/blog-shared/.backups/SHARED-20260413-1530.md
```

### Step 4-2: Edit 실행

Edit 툴로 파일 수정:

```
Edit(
  file_path=".claude/skills/blog-shared/SHARED.md",
  old_string="...기존 문자열...",
  new_string="...새 문자열..."
)
```

**중요**: old_string 은 충분히 구체적이어야 함 (주변 맥락 포함). Edit 실패하면 롤백 고려.

### Step 4-3: 수정 검증

수정 후 대상 파일을 다시 Read 해서 의도대로 수정되었는지 확인:

```bash
grep -A 5 "^## §RULE-HYPE" .claude/skills/blog-shared/SHARED.md
```

의도한 대로면 다음 Phase 로. 아니면 롤백:

```bash
cp "$BACKUP_DIR/SHARED-$TIMESTAMP.md" .claude/skills/blog-shared/SHARED.md
```

---

## Phase 5: CHANGELOG 기록

`.claude/skills/blog-shared/CHANGELOG.md` 에 자동 append.

### Step 5-1: CHANGELOG 파일 확인 및 생성

```bash
CHANGELOG=.claude/skills/blog-shared/CHANGELOG.md
if [ ! -f "$CHANGELOG" ]; then
  cat > "$CHANGELOG" <<'EOF'
# Blog Skills Family — Changelog

이 파일은 blog-rule-editor 가 자동으로 관리합니다. 직접 편집 가능하지만,
형식을 유지하세요.

---

EOF
fi
```

### Step 5-2: 새 엔트리 append

```markdown
## 2026-04-13 15:30

### SHARED.md §RULE-HYPE

**변경**: 금지 단어 리스트에서 "간편한" 제거

**이유**: "간편 결제", "간편 인증" 같은 고유명사성 용어와 충돌. 사용자 피드백에서
실제 블로그 글의 정당한 사용 케이스 발견.

**수정 유형**: 기존 규칙 완화 (단어 제거)

**영향 범위**:

- blog-writer: Step 8 자가 체크 참조 (자동 반영, 수정 불필요)
- blog-validator: Phase 2 단어 체크 참조 (자동 반영)
- 기존 글: 3건이 "간편한" 포함, 재검증 제안됨

**백업**: `.backups/SHARED-20260413-1530.md`

**재검증 결과**: (Phase 6 후 업데이트 예정)

---
```

날짜 + 시각, 변경 섹션, 변경 내용, 이유, 영향 범위, 백업 경로, 재검증 결과. 형식 통일.

---

## Phase 6: 영향 범위 분석 + 재검증 제안

수정이 완료된 후 **결정 5: 수정할 때마다 매번 재검증 제안**.

### Step 6-1: 영향받는 기존 글 확인

grep 으로 관련 키워드 포함 글 찾기:

```bash
grep -l "간편한" content/posts/*.mdx content/posts/**/*.mdx 2>/dev/null
```

### Step 6-2: 사용자에게 재검증 제안

결과를 텍스트로 보고:

```markdown
## 영향받는 기존 글

3건 발견:

- content/posts/css-flexbox.mdx (L23: "간편한 방법")
- content/posts/react-hooks.mdx (L12: "간편한 상태 관리")
- content/posts/next-routing.mdx (L34: "간편한 라우팅")

새 규칙은 이 글들을 더 이상 위반으로 잡지 않아요. 오히려 **통과시킵니다**.
즉 재검증하면 이전에 경고였던 항목이 사라질 뿐, 새 에러가 발생하진 않아요.
```

**중요**: 이 예시는 "완화" 케이스라 재검증해도 에러 늘어날 일 없음. "강화" 케이스라면 반대로 "3건에 새 에러 발생 가능" 이라고 경고.

AskUserQuestion (§UI-USER-CHOICE 준수):

```
AskUserQuestion(
  questions=[{
    "question": "영향받는 3건의 기존 글을 재검증할까요?",
    "options": [
      "네, 지금 재검증 (blog-validator 호출)",
      "영향받는 글 목록만 보고 나중에",
      "지금은 무시"
    ]
  }]
)
```

### Step 6-3: 재검증 실행 (선택 시)

사용자가 재검증 선택 시 blog-validator 를 Agent 툴로 호출:

```
Agent(
  description="Validate existing posts after rule change",
  prompt="""
.claude/skills/blog-validator/SKILL.md 의 지침을 따라 아래 파일들을 재검증해줘.

files:
- content/posts/css-flexbox.mdx
- content/posts/react-hooks.mdx
- content/posts/next-routing.mdx

mode: single (각 파일 독립)
via: orchestrator

결과는 요약 형식으로 반환해줘. 파일별 에러/경고 건수만.
"""
)
```

반환된 결과를 CHANGELOG 의 "재검증 결과" 필드에 업데이트.

---

## Phase 7: 완료 보고

```markdown
# ✅ 수정 완료

## 변경 내용

- 파일: .claude/skills/blog-shared/SHARED.md
- 섹션: §RULE-HYPE
- 내용: 금지 단어 리스트에서 "간편한" 제거

## 기록

- 백업: .claude/skills/blog-shared/.backups/SHARED-20260413-1530.md
- CHANGELOG: .claude/skills/blog-shared/CHANGELOG.md (엔트리 추가됨)

## 재검증 결과

- 3개 파일 재검증 완료
- 모두 통과 (이전 경고 해소)

## 다음에 해볼 것

- 새 규칙으로 새 글 작성: `/blog-write <주제>`
- 추가 규칙 수정이 필요하면 `/blog-rule-editor`
```

---

## 특수 시나리오들

위 Phase 1~7 은 가장 일반적인 "규칙 수정" 흐름이에요. 특수 시나리오는 변형이 필요해요.

### 시나리오 A: writer-failures.md 패턴 분석

사용자: "writer 가 계속 실패해. 로그 좀 봐줘"

실행 흐름:

1. **Phase 1**: `content/tmp/writer-failures.md` Read (존재 확인 먼저)
2. **Phase 2**: 로그 분석
   - 몇 건 누적?
   - 반복 위반 규칙?
   - 공통 패턴?
   - Layer 1 복구로 해결된 케이스 vs Layer 2 전환 권장 케이스?
3. **진단 리포트** (텍스트):

```markdown
## writer 실패 로그 분석

### 기간

2026-04-05 ~ 2026-04-13 (8일간)

### 누적

5건

### 반복 패턴

- §RULE-PARALLEL-THREE: 3건 (60%)
- 모두 "실전 적용" 섹션에서 발생
- 공통 원인: 자료에 구체 예시 없음 → writer 가 병렬 삼단으로 채움

### 다른 케이스

- §RULE-EMDASH: 1건 (MDN 인용 중 원문에 em-dash 포함)
- §RULE-HYPE: 1건 (주제 범위 과소)

### 진단

- 1번 패턴(60%)은 **규칙 문제가 아니라 자료 수집 문제**. blog-research 가
  충분한 구체 예시를 확보하지 못함.
- 2번 패턴은 writer 가 원문 인용 시 em-dash 처리 로직이 약함.
- 3번 패턴은 주제 범위 판단 문제.
```

4. **해결책 옵션 제시**:
   - 옵션 A: blog-research SKILL.md 에 "섹션별 구체 예시 최소 N 개" 요구 추가
   - 옵션 B: §RULE-PARALLEL-THREE 완화 (3회 → 5회 허용)
   - 옵션 C: blog-writer Step 4 미니 체크에 "자료-섹션 매칭 충분성 체크" 추가
5. **사용자 선택 후 해당 파일 수정** (Phase 3~6 진행)
6. **아카이브**: 분석이 끝난 `writer-failures.md` 를 아카이브로 이동:

```bash
   ARCHIVE_DIR=.claude/skills/blog-shared/.archived-failures
   mkdir -p "$ARCHIVE_DIR"
   mv content/tmp/writer-failures.md "$ARCHIVE_DIR/failures-$(date +%Y%m%d).md"
```

### 시나리오 B: 새 skill 추가

사용자: "blog-publish 라는 배포 자동화 스킬 만들자"

실행 흐름:

1. **Phase 1**: 기존 blog-\* skill 목록 확인, 중복 역할 여부 체크
2. **Phase 2**: 새 skill 요구사항 정의 (여러 번의 AskUserQuestion)
   - 이 skill 이 하는 일?
   - 언제 호출되나? (사용자 명시 / 오케스트레이터 자동 / 둘 다)
   - 어떤 tools 필요?
   - 입력/출력 계약?
   - 기존 skill 과의 관계?
3. **Phase 3**: SKILL.md 템플릿 생성
   - SHARED.md 참조 구조
   - description, tools, skip list
   - Phase/Step 기본 구조
4. **Phase 4**: 사용자에게 초안 제시
5. **Phase 5**: 승인 후 파일 생성 (Write 툴)

```bash
   mkdir -p .claude/skills/blog-publish
   # Write tool 로 SKILL.md 생성
```

6. **Phase 6**: 기존 skill 과의 통합
   - blog-write 오케스트레이터에 새 Phase 추가 필요? → blog-write SKILL.md 수정
   - SHARED.md 의 관련 섹션에 "참조하는 skill" 목록 업데이트?
7. **Phase 7**: CHANGELOG 기록 + 완료 보고

### 시나리오 C: config/domains.md 수정

사용자: "domains.md 에 `bun.sh` 추가해줘"

실행 흐름은 일반 규칙 수정과 유사하지만 더 간단:

1. **Phase 1**: `config/domains.md` Read
2. **Phase 2**: 어느 섹션에 추가? (`§DOMAIN-PRIORITY-1` 의 "런타임/언어" 하위)
3. **Phase 3**: diff 미리보기
4. **Phase 4**: 백업 + Edit
5. **Phase 5**: CHANGELOG 기록
6. **Phase 6**: 재검증 제안 (새 도메인 추가는 기존 글 영향 없음 → 스킵 가능)
7. **Phase 7**: 완료 보고

**주의**: domains.md 는 섹션 ID 기반이 아니라 마크다운 리스트라서 Edit 시 정확한 위치 매칭이 필요해요.

### 시나리오 D: 백업 정리 (30일 초과 삭제)

사용자: "오래된 백업 정리해줘" 또는 자동 트리거 (blog-rule-editor 호출 시마다 체크)

실행 흐름:

```bash
BACKUP_DIR=.claude/skills/blog-shared/.backups
CUTOFF=$(date -v-30d +%Y%m%d 2>/dev/null || date -d '30 days ago' +%Y%m%d)

# 30일 이전 백업 파일 목록
OLD_BACKUPS=$(find "$BACKUP_DIR" -name "*.md" -type f | while read -r f; do
  FILE_DATE=$(basename "$f" | grep -oE '[0-9]{8}' | head -1)
  if [ "$FILE_DATE" -lt "$CUTOFF" ] 2>/dev/null; then
    echo "$f"
  fi
done)
```

사용자에게 목록 보여주고 AskUserQuestion 으로 삭제 승인:

```
AskUserQuestion(
  questions=[{
    "question": "30일 초과 백업 N개를 삭제할까요?",
    "options": [
      "네, 전부 삭제",
      "목록만 보고 나중에",
      "취소"
    ]
  }]
)
```

**주의**: 백업 삭제는 복구 불가. 1단계 확인으로 충분 (Rail 7: 일반 편집 기준).

---

## 금지 사항

- **자기 자신 수정 금지** (Rail 5)
- **content/posts/\* 편집 금지** (blog-writer 의 영역)
- **content/tmp/\* 일반 편집 금지** (로컬 로그, 특수 시나리오에서만 접근)
- **사용자 승인 없는 자동 수정 금지** (Rail 1)
- **SSOT 원칙 위반 금지** (Rail 4: 같은 규칙 여러 파일 복사)
- **백업 없는 수정 금지** (Rail 2)
- **diff 미리보기 없는 수정 금지** (Rail 3)
- **CHANGELOG 건너뛰기 금지**: 수정하고 기록 안 남기는 것 금지
- **영향 범위 분석 건너뛰기 금지** (Rail 6)

---

## 확장 포인트

이 섹션은 blog-rule-editor 자체의 진화 방향을 명시해요. 나중에 기능 추가 시 여기를 참조:

- **TODO**: validator 경고 누적 트렌드 분석 (validator 가 자주 잡지만 writer 가 못 막는 패턴)
- **TODO**: 규칙 간 충돌 탐지 (예: §META-TITLE 의 "반말 예외" 와 §BLOG-VOICE 의 "반말 금지" 가 충돌)
- **TODO**: 여러 프로젝트 간 SHARED.md 동기화 (사용자가 여러 블로그를 운영할 때)
- **TODO**: SHARED.md 섹션 자동 문서화 (`/blog-rule-editor docs §RULE-HYPE`)

이 TODO 항목들은 blog-rule-editor 를 써보면서 실제로 필요해지면 추가해요. 미리 구현하지 않음.

---

## 제약

- **SHARED.md 규칙을 이 SKILL.md 에 복사하지 마세요**. 필요할 때 Read 로 주입하고 참조만.
- **한 번에 하나의 수정만**. 여러 파일 동시 수정은 Phase 를 분리해서 순차 처리.
- **Agent 툴 호출은 재검증 단계에서만** (blog-validator 재호출). 다른 용도로 쓰지 마세요.
- **Write 툴은 새 skill 파일 생성 시에만**. 기존 파일 수정은 Edit 으로.
- **Bash 는 백업/검증/로그 관리 용도만**. 임의의 시스템 명령 금지.
