# Blog Skills Family — Changelog

이 파일은 blog-rule-editor 가 자동으로 관리합니다. 직접 편집 가능하지만,
형식을 유지하세요.

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
