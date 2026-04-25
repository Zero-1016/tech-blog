# AGENTS.md

이 파일은 AI 에이전트가 이 프로젝트의 **블로그 스킬 패밀리**
(`blog-*`) 와 작업할 때 따라야 할 가이드입니다.

> 이 프로젝트의 일반 코드 작업 (컴포넌트 추가, velite 설정 등) 가이드는 여기에
> 포함하지 않습니다. 이 문서는 `.claude/skills/blog-*` 작업에 한정됩니다.

---

## 빠른 참조

| 작업                    | 명령                                               |
| ----------------------- | -------------------------------------------------- |
| 새 글 작성              | `/blog-write <주제> [URL ...]`                     |
| 기존 글 다듬기          | `/blog-revise <파일> [의도]`                       |
| 규칙 수정               | `/blog-rule-editor`                                |
| validator 단독 실행     | `/blog-validator content/posts/<slug>.mdx`         |
| expression-review 단독  | `/blog-expression-review content/posts/<slug>.mdx` |
| coherence-review 단독   | `/blog-coherence-review content/posts/<slug>.mdx`  |
| 배너 모티프 추천        | `/blog-banner content/posts/<slug>.mdx`            |
| writer 실패 로그 확인   | `cat content/tmp/writer-failures.md`               |
| 글 백업 확인            | `ls content/posts/.backups/`                       |
| 스킬 백업 확인          | `ls .claude/skills/blog-shared/.backups/`          |
| CHANGELOG 확인          | `cat .claude/skills/blog-shared/CHANGELOG.md`      |
| GATE 1 피드백 로그 확인 | `cat content/tmp/draft-feedback.md`                |

---

## 핵심 원칙

블로그 스킬 패밀리는 다음 5가지 원칙으로 설계되었습니다. 작업 시 위반하지 마세요.

### 1. SSOT (Single Source of Truth)

모든 글쓰기 규칙은 `.claude/skills/blog-shared/SHARED.md` 한 곳에 정의됩니다.

**금지**:

- 같은 규칙을 여러 SKILL.md 파일에 복사
- 한 스킬에서만 다르게 동작하는 규칙 삽입

**허용**:

- SHARED.md 의 섹션을 Read 로 주입받아 참조
- 스킬별 고유한 동작은 SKILL.md 에 기술 (단, 규칙은 참조)

규칙 자체를 바꾸려면 SHARED.md 를 수정하세요. `blog-rule-editor` 가 안전하게
처리합니다.

### 2. 사용자 선택지는 AskUserQuestion 툴 호출

`§UI-USER-CHOICE` 규칙: 사용자에게 선택지를 제시할 때는 **반드시
`AskUserQuestion` 툴을 호출**해야 합니다. 마크다운 리스트로 나열하면 안 됩니다.

**금지**:

```
어떻게 진행할까요?
1. 진행
2. 수정
3. 취소
```

**허용**:

```
AskUserQuestion(
  questions=[{
    "question": "어떻게 진행할까요?",
    "options": ["진행", "수정", "취소"]
  }]
)
```

이유: 마크다운 리스트는 클릭 UI 가 안 되고, 사용자가 번호를 다시 입력해야 합니다.

### 3. sub-agent 격리 (blog-research)

`blog-research` 는 **반드시 Agent 툴로 sub-agent 컨텍스트에서 실행**합니다.
WebFetch 결과 (수만 토큰) 가 오케스트레이터 컨텍스트를 오염시키지 않도록.

호출 예시:

```
Agent(
  description="자료 수집",
  prompt="""
.claude/skills/blog-research/SKILL.md 의 지침을 따라 자료를 수집해줘.

topic: <주제>
user_urls: [...]
depth: basic
via: orchestrator

결과는 SKILL.md 의 출력 형식대로 구조화된 마크다운으로 반환해줘.
"""
)
```

오케스트레이터는 sub-agent 가 반환한 **요약** 만 받습니다. 원문 복사 금지.

### 4. 사용자 승인은 GATE 1 한 곳만 (강제)

`blog-write` 파이프라인에서 사용자 개입은 기획안 승인 (GATE 1) 한 곳만
의무입니다. 그 외 사용자 확인은:

- **draft-review**: 블로커 발견 시 또는 큰 구조 변경 제안 시
- **validator**: 판단 여지 있는 에러 발견 시
- **expression-review**: 의미 재작성 필요한 항목
- **coherence-review**: 거의 모든 항목

이 외에는 자동 진행. **사용자 승인 없이 어떤 파일도 저장하지 않는 시점은 GATE 1
이전까지** 입니다.

### 5. content/tmp/ 는 로컬 로그 전용

`content/tmp/` 는 로컬 로그 디렉토리입니다. gitignored.

- `content/tmp/writer-failures.md` — writer 가 자가 체크리스트 통과에 실패할 때
  자동 기록
- 그 외 임시 파일들

이 디렉토리는 **수정/편집 대상이 아닙니다**. 로그가 누적되면
`blog-rule-editor` 의 "writer 실패 패턴 분석" 시나리오로 확인하세요.

---

## 스킬 관계

9개 스킬은 다음과 같이 호출 관계를 맺습니다.

### 호출 관계 (실선)

```
blog-write (오케스트레이터, 새 글 작성)
  ├── blog-research        (Phase 2, sub-agent)
  ├── blog-draft-review    (Phase 3.5)
  ├── blog-writer          (Phase 4)
  ├── blog-validator       (Phase 5)
  ├── blog-expression-review (Phase 5.5)
  └── blog-coherence-review  (Phase 5.6)

blog-revise (오케스트레이터, 기존 글 다듬기)
  ├── blog-validator       (패턴 1, 2, 3 검증 사이클)
  ├── blog-expression-review (패턴 1, 2, 3 검증 사이클)
  ├── blog-coherence-review  (패턴 1, 2, 3 검증 사이클)
  ├── blog-research        (패턴 3 자료 보강, sub-agent)
  └── blog-write           (패턴 4 완전 재작성)

blog-rule-editor (메타 관리, 별도)
  ├── SHARED.md
  ├── config/domains.md
  └── 각 스킬의 SKILL.md

blog-banner (배너 모티프 관리, 독립 실행)
  ├── lib/banner/spec.ts
  ├── public/banners/motifs/*.svg
  └── MDX frontmatter (banner 필드만)
```

### 참조 관계 (SHARED.md SSOT)

모든 스킬이 `blog-shared/SHARED.md` 의 필요한 섹션을 Read 로 주입받아 참조합니다.
대표적인 참조:

| 스킬                     | 주로 참조하는 SHARED.md 섹션                                                                                                                               |
| ------------------------ | ---------------------------------------------------------------------------------------------------------------------------------------------------------- |
| `blog-research`          | §SOURCE-PRIORITY, §DOMAIN-WHITELIST                                                                                                                        |
| `blog-writer`            | §BLOG-VOICE, §META-_, §FRONTMATTER, §MDX-_, §RULE-\* (전체)                                                                                                |
| `blog-validator`         | §FRONTMATTER, §FILE-LAYOUT, §RULE-EMDASH, §RULE-COLON-HEADING, §RULE-BOLD, §RULE-BARE-LIST, §RULE-ENGLISH-QUOTE, §DOMAIN-WHITELIST, §META-FEEDBACK-HANDOFF |
| `blog-expression-review` | §BLOG-VOICE, §RULE-FORBIDDEN-PATTERNS, §RULE-RHYTHM, §RULE-SELF-VOICE, §META-FEEDBACK-HANDOFF                                                              |
| `blog-coherence-review`  | (논리 구조 검사, 표면 규칙 참조 안 함), §META-FEEDBACK-HANDOFF                                                                                             |
| `blog-draft-review`      | §SOURCE-PRIORITY, §META-\*, §COMPLEXITY                                                                                                                    |
| `blog-write`             | §SOURCE-PRIORITY, §META-\*, §COMPLEXITY, §FILE-LAYOUT, §UI-USER-CHOICE                                                                                     |
| `blog-revise`            | §FILE-LAYOUT, §FRONTMATTER, §UI-USER-CHOICE                                                                                                                |
| `blog-rule-editor`       | §UI-USER-CHOICE                                                                                                                                            |

모든 스킬이 `§UI-USER-CHOICE` 를 참조해야 합니다 (사용자 선택지가 있는 경우).
validator / expression-review / coherence-review 는 메인 작업 종료 후
`§META-FEEDBACK-HANDOFF` 흐름을 실행해 메타 피드백을 `blog-rule-editor` 로
자동 라우팅합니다.

---

## 작업 시나리오별 가이드

### 시나리오 1: 새 글 작성

```bash
/blog-write <주제> [참고 URL ...]
```

오케스트레이터가 Phase 0~6 을 자동 실행합니다. 사용자 개입은 GATE 1 한 번
(기획안 승인) 만 필요합니다.

### 시나리오 2: 글이 작성 후 추가 검토 필요

각 리뷰어를 단독으로 호출 가능:

```bash
/blog-validator content/posts/<slug>.mdx
/blog-expression-review content/posts/<slug>.mdx
/blog-coherence-review content/posts/<slug>.mdx
```

단독 실행 시 리뷰어가 직접 사용자와 대화 (`AskUserQuestion` 호출).
오케스트레이터 경유와 다른 점은 SKILL.md 의 "skip list" 섹션 참조.

### 시나리오 3: 규칙 수정

```bash
/blog-rule-editor
```

대화로 수정 작업 진행. `blog-rule-editor` 가 안전 장치를 거쳐 SHARED.md, config,
개별 스킬을 수정합니다.

직접 호출 예:

```bash
/blog-rule-editor §RULE-HYPE 에서 "간편한" 빼줘
/blog-rule-editor config/domains.md 에 bun.sh 추가
/blog-rule-editor writer-failures.md 패턴 분석해줘
```

### 시나리오 4: writer 실패 누적

`content/tmp/writer-failures.md` 가 3건 이상 쌓이면 `blog-write` 시작 시 자동
알림이 옵니다. 이 시점에서:

```bash
/blog-rule-editor writer-failures 분석해줘
```

`blog-rule-editor` 가 패턴을 분석하고 Layer 1 (이번 글 복구) 또는 Layer 2 (스킬
규칙 자체 개선) 를 권장합니다.

### 시나리오 5: 새 스킬 추가

새 `blog-*` 스킬이 필요할 때:

```bash
/blog-rule-editor 새 스킬 blog-X 만들고 싶어
```

`blog-rule-editor` 가 요구사항을 단계적으로 정의하고, SKILL.md 템플릿을 생성한 후,
오케스트레이터 (`blog-write`) 와의 통합도 함께 처리합니다.

직접 SKILL.md 를 편집하는 것보다 안전합니다.

### 시나리오 6: 기존 글 다듬기

기존 글을 수정할 때는 `blog-revise` 스킬을 사용합니다. 5가지 다듬기 패턴을
지원합니다.

```bash
# 파일만 지정 — blog-revise 가 패턴 카탈로그 제시
/blog-revise content/posts/.mdx

# 파일 + 의도 함께 — 의도 분석 후 적절한 패턴으로 라우팅
/blog-revise content/posts/.mdx 마무리 단락이 어색해
/blog-revise content/posts/.mdx 새 자료 추가가 필요해
/blog-revise content/posts/.mdx 새 규칙으로 다시 검증해줘
/blog-revise content/posts/.mdx 완전히 다시 쓰자
/blog-revise content/posts/.mdx 뭐가 문제인지 분석해줘
```

#### 5가지 패턴

| 패턴           | 변경 범위                                 | 백업                         | 검증 사이클             |
| -------------- | ----------------------------------------- | ---------------------------- | ----------------------- |
| 1. 재검증만    | 본문 변경 없음 (검증 결과로만 자동 수정)  | 불필요                       | 실행                    |
| 2. 부분 수정   | 특정 단락/섹션                            | 필요                         | 실행                    |
| 3. 자료 보강   | 새 자료 + 섹션 통합 + References 업데이트 | 필요                         | 실행                    |
| 4. 완전 재작성 | 전체 (blog-write 호출의 wrapper)          | 필요 (`-pre-rewrite` 접미사) | blog-write 가 자체 검증 |
| 5. 분석만      | 변경 없음, 진단만                         | 불필요                       | dry_run 모드            |

#### 패턴 5 (분석만) 의 dry_run 모드

`blog-revise` 가 `validator` 와 `expression-review` 를 호출할 때 `dry_run: true`
로 호출. 이 모드에서는:

- Edit 툴 호출 안 함 (자동 수정 안 됨)
- 모든 발견 항목을 "수정 가능 분류" 로 보고만
- 검사 단계는 정상 실행

`coherence-review` 는 원래 자동 수정을 거의 안 하므로 별도 dry_run 필요 없음.

#### blog-revise 의 GATE

GATE 는 두 곳만 (사용자 짜증 방지):

1. **패턴 결정 GATE**: 어떤 패턴으로 진행할지
2. **수정 적용 직전 GATE**: 패턴 2/3 의 수정안 최종 확인 또는 패턴 4 의
   blog-write GATE 1 (위임)

그 외 단계는 자동 진행.

#### 백업

`content/posts/.backups/` 에 자동 저장 (gitignored). 파일명 규칙:

```
content/posts/.backups/<slug>-<YYYYMMDD-HHMMSS>.mdx
content/posts/.backups/<slug>-<YYYYMMDD-HHMMSS>-pre-rewrite.mdx  (패턴 4 전용)
```

30일 이상 된 백업은 수동 정리:

```bash
find content/posts/.backups/ -mtime +30 -delete
```

#### blog-rule-editor 와의 차이

| 스킬               | 수정 대상                                         |
| ------------------ | ------------------------------------------------- |
| `blog-revise`      | 글 (`content/posts/*.mdx`)                        |
| `blog-rule-editor` | 스킬 / 규칙 (`SHARED.md`, `config/`, 각 SKILL.md) |

둘 다 호출이 필요하면 사용자가 순차로. 자동 연결 없음.

#### 직접 글 편집과의 비교

`blog-revise` 를 거치지 않고 직접 MDX 파일을 편집하는 것도 가능합니다. 하지만
다음과 같은 차이가 있습니다:

| 직접 편집                | blog-revise 사용      |
| ------------------------ | --------------------- |
| 빠름                     | 안전함                |
| 검증 안 됨               | 검증 사이클 자동 실행 |
| 백업 안 됨               | 자동 백업             |
| References 업데이트 수동 | 패턴 3 에서 자동      |
| 수정 이력 없음           | 백업 + git 으로 추적  |

작은 오타 수정 같은 경우는 직접 편집이 빠르고, 어조나 구조 변경 같은 경우는
`blog-revise` 가 안전합니다.

---

## SKILL.md 작성 컨벤션

새 스킬을 만들거나 기존 스킬을 수정할 때 따라야 할 SKILL.md 구조.

### 필수 frontmatter

```yaml
---
name: blog-<역할>
description: |
  스킬이 하는 일 (한 단락).
  사용 트리거 (어떤 명령/요청에서 발동).
  하지 않는 일 (역할 경계).
tools:
  - Read
  - Edit
  - ...
---
```

### 표준 섹션 순서

1. **제목 + 한 줄 설명**
2. **전제 (SHARED.md 로드 섹션 명시)** — Read 로 주입할 §RULE-X 목록
3. **입력 계약** — 오케스트레이터 호출 시 / 단독 실행 시
4. **Skip List** — 오케스트레이터 호출 시 건너뛸 섹션
5. **Step / Phase 본문** — 실행 흐름
6. **출력 형식** — 반환할 데이터 구조
7. **제약** — 절대 하지 말아야 할 것

### 권장 사항

- **SHARED.md 규칙을 SKILL.md 에 복사하지 마세요**. Read 로 참조만.
- **단독 실행과 오케스트레이터 호출을 모두 지원**. Skip List 로 분리.
- **자동 수정 가능한 것과 사용자 확인 필요한 것을 명확히 분리**.
- **사용자 확인은 §UI-USER-CHOICE 준수** (AskUserQuestion 툴 호출).

---

## 안전 장치

### blog-rule-editor 의 7개 Rail

`blog-rule-editor` 는 다음 7개의 안전 장치를 거쳐서만 파일을 수정합니다:

1. **사용자 승인 없는 수정 금지** — 모든 쓰기는 AskUserQuestion 후
2. **수정 전 백업** — `.backups/<파일>-<timestamp>.md` 자동 생성
3. **diff 미리보기** — 실제 Edit 전 변경 내용 표시 + 최종 확인
4. **SSOT 원칙 강제** — 같은 규칙 여러 파일 복사 거부
5. **자기 자신 수정 금지** — `blog-rule-editor` 자체는 직접 편집해야 함
6. **영향 범위 자동 분석** — grep + 1단계 의존성 추적
7. **수정 유형별 확인 횟수** — 단순 수정 1회, 큰 변경 2~3회

자세한 설명은 `.claude/skills/blog-rule-editor/SKILL.md` 의 "안전 장치 (Rails)"
섹션 참조.

### 자동 생성 파일

다음 파일들은 `blog-rule-editor` 가 자동 관리합니다. 직접 편집하지 마세요:

- `.claude/skills/blog-shared/CHANGELOG.md` — 모든 수정 자동 기록
- `.claude/skills/blog-shared/.backups/*.md` — 수정 전 백업
- `content/tmp/writer-failures.md` — writer 실패 로그

### 30일 백업 정리

`.backups/` 는 자동 cron 으로 정리되지 않습니다. `blog-rule-editor` 호출 시
30일 이상 된 백업이 있으면 정리 옵션을 제안합니다.

수동 정리:

```bash
/blog-rule-editor 백업 정리해줘
```

---

## 작업 시 주의사항

### content/posts/ 직접 편집 금지 (글 작성 파이프라인 사용 권장)

`content/posts/` 의 MDX 파일은 `blog-writer` 가 작성한 결과물입니다. 직접
편집하기보다 다음 흐름을 권장합니다:

1. 작은 수정 → `blog-validator`, `blog-expression-review`, `blog-coherence-review`
   를 단독 실행해서 사용자 확인 후 수정
2. 큰 수정 → 새로 `/blog-write` 호출 (필요하면 기존 파일 삭제 후)

직접 편집은 가능하지만, 이후 검증 사이클을 한 번 돌리는 게 좋습니다.

### .claude/skills/blog-\* 수정은 blog-rule-editor 경유 (블로커급)

`.claude/skills/blog-*` 경로의 파일(SHARED.md, 개별 SKILL.md, config/,
CHANGELOG 등)을 수정할 때는 **반드시 `blog-rule-editor` 스킬을 `Skill` 툴로
호출**해서 처리합니다. 직접 Edit/Write 툴로 건드리는 것은 금지.

**이유**: blog-rule-editor 는 백업 + 사용자 승인 + CHANGELOG 자동 기록 +
영향 범위 분석 + SSOT 검증 레일을 한 번에 실행합니다. "한 줄만 고치는 간단한
수정" 같은 판단으로 우회하면 안전 장치가 전부 빠져요. 간단해 보일수록 레일을
타야 합니다.

**예외**:

- `blog-rule-editor/SKILL.md` 자기 자신 수정 (Rail 5 에 따라 직접 Edit 허용)
- 사용자가 명시적으로 "그냥 Edit 해도 돼" 라고 허가한 경우

**체크 습관**: `Edit` / `Write` 툴 호출 직전에 `file_path` 가
`.claude/skills/blog-` 로 시작하는지 확인. 맞으면 중단하고
`Skill(skill="blog-rule-editor", args="...")` 로 전환.

### content/tmp/ 는 git 무시

`.gitignore` 에 다음이 포함되어 있어야 합니다:

```
content/tmp/*
!content/tmp/.gitkeep
```

없으면 추가하세요.

### Claude Code skill 인식 확인

skill 자동완성이 안 뜨면:

```bash
ls .claude/skills/
```

`blog-write`, `blog-research`, `blog-writer`, `blog-validator`, `blog-draft-review`,
`blog-expression-review`, `blog-coherence-review`, `blog-rule-editor`, `blog-shared`
9개가 있어야 합니다.

각 스킬 디렉토리에 `SKILL.md` (대문자) 가 정확한 이름으로 있어야 인식됩니다.

### 프로젝트 로컬 vs 전역 스킬

이 스킬 패밀리는 **프로젝트 로컬** (`.claude/skills/`) 입니다. `~/.claude/skills/`
(전역) 가 아닙니다.

다른 프로젝트에서 이 스킬을 쓰려면 `.claude/skills/blog-*` 와
`.claude/skills/blog-shared/` 를 통째로 복사하세요.

---

## 테스트 체크리스트

새 스킬을 추가하거나 기존 스킬을 수정한 후 검증할 항목:

### 기본 검증

```bash
# 1. 옛 경로 잔재 확인
grep -rn "~/.claude/skills/blog/" .claude/skills/blog-* 2>/dev/null
# (출력 없어야 정상)

# 2. 옛 이름 잔재 (post-* → blog-* 마이그레이션 후)
grep -rn "post-writer\|post-validator\|post-draft-review\|post-expression-review\|post-coherence-review" .claude/skills/blog-* 2>/dev/null
# (출력 없어야 정상)

# 3. SHARED.md 참조 경로 확인
grep -rn ".claude/skills/blog-shared/SHARED.md" .claude/skills/blog-* 2>/dev/null
# (참조 라인이 있어야 정상)
```

### 실전 테스트

새 글 작성으로 전체 파이프라인 통과 확인:

```bash
/blog-write CSS aspect-ratio 사용법
```

확인:

- Phase 0~6 모두 순차 실행
- GATE 1 에서 클릭 UI 표시
- blog-research 가 sub-agent 로 실행
- validator 자동 수정 + velite 통과
- 리뷰어 (expression, coherence) 발동 또는 통과
- Phase 6 완료 보고에 모든 단계 결과 포함

---

## 참고 문서

- 프로젝트 개요: [README.md](./README.md)
- 공통 규칙 정의: `.claude/skills/blog-shared/SHARED.md`
- 변경 이력: `.claude/skills/blog-shared/CHANGELOG.md` (첫 수정 후 자동 생성)
- 각 스킬 상세: `.claude/skills/blog-*/SKILL.md`

## 변경 시 영향 범위

이 가이드 (`AGENTS.md`) 자체를 수정할 때는 다음을 확인하세요:

- 스킬 이름이 바뀌면 "빠른 참조" 와 "스킬 관계" 섹션 업데이트
- 새 스킬이 추가되면 "호출 관계" 와 "참조 관계" 표 업데이트
- Phase 가 추가/제거되면 README 의 "파이프라인 흐름" 표도 함께 업데이트
- §RULE-\* 가 추가/제거되면 "스킬 관계" 의 참조 표 업데이트
