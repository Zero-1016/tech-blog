# MDX 컴포넌트 레퍼런스

MDX 포스트(`content/posts/**/*.mdx`)에서 import 없이 바로 사용할 수 있는 컴포넌트 목록.
등록 위치: `components/mdx/mdx-components.tsx`

---

## Callout

주의·팁·정보·에러 강조 박스.

```typescript
interface CalloutProps {
  variant?: "tip" | "warning" | "info" | "error"; // 기본값: "info"
  children: React.ReactNode;
}
```

| variant   | 아이콘 | 용도            |
| --------- | ------ | --------------- |
| `tip`     | 💡     | 꿀팁, 추천      |
| `warning` | ⚠️     | 주의사항, 함정  |
| `info`    | ℹ️     | 일반 보충 정보  |
| `error`   | 🚨     | 에러, 위험 경고 |

```mdx
<Callout variant="tip">`border-box`를 전역으로 쓰면 레이아웃 계산이 훨씬 편해져요.</Callout>

<Callout variant="warning">
  flex-item에 고정 width를 박고 있다면, 그건 Flex의 유연성을 꺼서 2D를 흉내 내고 있는 거예요.
</Callout>
```

---

## AnimatedStep

단계별 설명을 번호 카드로 표시. 스크롤 진입 시 순차 애니메이션.

**주의: 컴포넌트가 자동으로 왼쪽에 번호 뱃지(1, 2, 3...)를 렌더링하므로, `title`에 "1.", "2." 같은 번호를 넣지 마세요. 번호가 중복됩니다.**

```typescript
interface Step {
  title: string; // 단계 제목
  content: string; // 설명 텍스트
  code?: string; // 선택: 코드 스니펫 (plain text, 언어 지정 불가)
}

interface AnimatedStepProps {
  steps: Step[];
}
```

```mdx
<AnimatedStep
  steps={[
    {
      title: "Block — 독립적인 컴포넌트",
      content: "그 자체로 의미를 갖는 단위. 다른 곳에 옮겨놔도 동작해야 한다.",
    },
    {
      title: "Element — 블록의 부분",
      content: "블록 밖에서는 의미가 없는 하위 요소. 블록 이름 뒤에 __로 연결한다.",
    },
    {
      title: "코드 포함 예시",
      content: "각 문자를 언어별로 분류합니다.",
      code: "// 라틴: H, e, l, l, o\n// 한글: 안, 녕",
    },
  ]}
/>
```

---

## CodePlayground

Sandpack 기반 인터랙티브 코드 에디터 + 미리보기.

```typescript
interface CodePlaygroundProps {
  code: string; // 필수
  css?: string; // 선택: CSS 파일
  template?: "react" | "vanilla" | "vanilla-ts" | "react-ts"; // 기본값: "react"
  showPreview?: boolean; // 기본값: true
}
```

**동작 규칙:**

- `react`/`react-ts`: `code`를 App.js로, `css`를 styles.css로 생성. 미리보기 표시.
- `vanilla`에서 `code`가 CSS만이면: 코드 에디터만 표시 (미리보기 없음).
- React 코드에 `export default`가 없으면 자동 추가. `import React`도 자동 추가.

```mdx
{/* React 컴포넌트 + CSS */}

<CodePlayground
  code={`function BoxDemo() {
  return (
    <div className="wrapper">
      <div className="box">content-box</div>
    </div>
  );
}`}
  css={`
    .wrapper {
      display: flex;
      gap: 24px;
      padding: 16px;
    }
    .box {
      width: 200px;
      padding: 10px;
      border: 2px solid #6366f1;
    }
  `}
  template="react"
  showPreview={true}
/>

{/* CSS 스니펫만 (미리보기 없음) */}

<CodePlayground code={`.demo { display: flex; flex-direction: column; }`} template="vanilla" />
```

---

## References

참고 자료 섹션. 글 하단에 배치. `Cite`와 `id`로 연결.

```typescript
interface ReferenceItem {
  id?: string; // Cite 컴포넌트와 연결할 ID
  title: string; // 출처 제목
  href: string; // URL
  description?: string; // 한 줄 설명
}

interface ReferencesProps {
  title?: string; // 기본값: "참고 자료"
  items: ReferenceItem[];
}
```

```mdx
<References
  items={[
    {
      id: "mdn-box-sizing",
      title: "MDN - CSS box-sizing",
      href: "https://developer.mozilla.org/en-US/docs/Web/CSS/box-sizing",
      description: "content-box/border-box 동작 차이와 브라우저 UA 기본값 확인",
    },
    {
      id: "w3c-css-sizing",
      title: "W3C CSS Sizing Level 3",
      href: "https://www.w3.org/TR/css-sizing-3/#box-sizing",
    },
  ]}
/>
```

**주의: children 패턴(`<References>- [링크](url)...</References>`)은 동작하지 않음. 반드시 `items` prop 사용.**

---

## Cite

본문 인라인 참고 표시. 클릭 시 하단 References 항목으로 스크롤.

```typescript
interface CiteProps {
  id: string; // References 항목의 id와 일치해야 함
  label?: string; // 기본값: "참고자료로 이동"
}
```

`#ref-{id}` 앵커로 이동하며, References 컴포넌트가 `ref-{id}`를 자동 생성.

```mdx
CSS2.1 스펙은 박스 모델에서 width를 콘텐츠 영역으로 정의했어요.<Cite id="w3c-css2-box" />
```

**Cite-References 매칭 규칙:**

- 본문의 `<Cite id="xxx" />`마다 References `items`에 `id: "xxx"` 항목이 있어야 함
- References에 `id`가 있는데 본문에 Cite가 없으면 경고 (사용은 가능)

---

## VideoEmbed

YouTube 영상 임베드. 썸네일 레이지 로딩 후 클릭 시 iframe 로드.

```typescript
interface VideoEmbedProps {
  src: string; // YouTube URL (youtu.be, youtube.com/watch, youtube.com/embed)
  title?: string; // 기본값: "Video"
}
```

```mdx
<VideoEmbed src="https://youtu.be/dQw4w9WgXcQ" title="CSS Layout 튜토리얼" />
```

---

## FlowDiagram

노드와 엣지로 구성된 다이어그램. 자바스크립트 동작 과정, 데이터 흐름, 시스템
아키텍처처럼 코드만으론 설명이 부족한 구조를 시각화할 때 사용.

`@xyflow/react` 기반. 다크 모드 자동 대응. 읽기 중심이라 드래그·휠 줌은 비활성,
핀치 줌·더블탭·Controls 버튼만 허용해서 모바일 페이지 스크롤이 갇히지 않게 했어요.
컨테이너 높이는 `min(height, 60vh)` 로 캡되니, 작은 화면에서도 viewport 절반을
넘지 않아요.

```typescript
type NodeKind = "default" | "accent" | "warning" | "success" | "error";

interface FlowNode {
  id: string; // 엣지 연결용 식별자
  title: string; // 카드 제목 (font-semibold)
  description?: string; // 한 줄 설명 (text-secondary)
  x: number; // 픽셀 좌표
  y: number;
  kind?: NodeKind; // 카드 색상 변형 (기본: "default")
}

interface FlowEdge {
  from: string; // source node id
  to: string; // target node id
  label?: string; // 엣지 위 텍스트
  animated?: boolean; // 점선 흐름 애니메이션 (기본: false)
}

interface FlowDiagramProps {
  nodes: FlowNode[];
  edges: FlowEdge[];
  height?: number; // 컨테이너 높이 px (기본: 400)
  caption?: string; // 다이어그램 하단 figcaption
}
```

| kind      | 용도               |
| --------- | ------------------ |
| `default` | 일반 단계, 중립    |
| `accent`  | 핵심 노드, 시작점  |
| `warning` | 주의가 필요한 단계 |
| `success` | 정상 경로, 완료    |
| `error`   | 실패 경로, 예외    |

```mdx
<FlowDiagram
  height={360}
  caption="자바스크립트 비동기 실행 흐름"
  nodes={[
    {
      id: "stack",
      title: "Call Stack",
      description: "동기 함수가 쌓이는 곳",
      x: 0,
      y: 80,
      kind: "accent",
    },
    {
      id: "webapi",
      title: "Web APIs",
      description: "setTimeout, fetch 등",
      x: 220,
      y: 0,
    },
    {
      id: "queue",
      title: "Task Queue",
      description: "콜백이 대기",
      x: 440,
      y: 80,
    },
    {
      id: "loop",
      title: "Event Loop",
      description: "스택이 비면 큐에서 꺼냄",
      x: 220,
      y: 200,
      kind: "success",
    },
  ]}
  edges={[
    { from: "stack", to: "webapi", label: "비동기 호출", animated: true },
    { from: "webapi", to: "queue", label: "콜백 등록" },
    { from: "queue", to: "loop" },
    { from: "loop", to: "stack", label: "다시 푸시", animated: true },
  ]}
/>
```

**좌표 가이드**:

- 노드 카드는 보통 140~220px 너비. 가로 간격은 200px, 세로는 100~150px이 적당.
- 자동 `fitView`로 컨테이너에 맞춰 줌·정렬되므로 절대 좌표보다 **상대 위치**가 중요.
- 핸들은 자동 선택. 일반적으로 좌→우, 상→하 흐름이 자연스럽게 그려진다.

**주의**:

- `id`는 짧고 의미 있게. 엣지의 `from`/`to`와 정확히 일치해야 한다.
- 노드 7~8개 넘어가면 가독성이 빠르게 떨어진다. 그 이상은 글을 분할하거나
  섹션별로 다이어그램을 쪼갤 것.
- 글 흐름 보조용. 다이어그램만으로 핵심을 설명하지 말고 본문이 주가 되도록.
