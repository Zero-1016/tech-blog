import Anthropic from "@anthropic-ai/sdk";
import type { SeriesPlan } from "./series-planner";

const COMPONENT_SCHEMAS = `
사용 가능한 MDX 커스텀 컴포넌트:

1. <Callout variant="tip|warning|info|error">텍스트</Callout>
   - 팁, 경고, 정보, 에러 박스

2. <AnimatedStep steps={[
  { title: "제목", content: "설명", code: "코드(선택)" },
  { title: "제목", content: "설명" }
]} />
   - 단계별 시각화. 스크롤 시 순차적으로 나타남.

3. <CodePlayground code={\`코드내용\`} template="react" showPreview={true} />
   - 라이브 코드 에디터. template: "react" | "vanilla" | "vanilla-ts" | "react-ts"
   - code는 반드시 백틱 템플릿 리터럴로 감싸기

4. <VideoEmbed src="https://youtube.com/watch?v=..." title="제목" />
   - 유튜브 영상 임베드
`;

const SYSTEM_PROMPT = `당신은 기술 블로그 작가입니다. Lydia Hallie, Josh Comeau 스타일로 인터랙티브한 기술 글을 작성합니다.

글 작성 규칙:
- 한국어로 작성
- MDX 형식 (마크다운 + JSX 컴포넌트)
- frontmatter는 포함하지 마세요 (별도로 추가됩니다)
- 개념을 시각적으로 설명 (AnimatedStep 활용)
- 코드 예제는 실행 가능하게 (CodePlayground 활용)
- 중요한 팁이나 주의사항은 Callout으로
- 독자가 "아하!" 하는 순간을 만들어주세요
- 글 분량: 1500~3000자

${COMPONENT_SCHEMAS}

MDX 본문만 반환하세요. frontmatter(---) 블록은 절대 포함하지 마세요.`;

export async function buildMDX(
  client: Anthropic,
  plan: SeriesPlan,
  partIndex: number
): Promise<string> {
  const part = plan.parts[partIndex];

  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: SYSTEM_PROMPT,
    messages: [
      {
        role: "user",
        content: `시리즈: ${plan.seriesTitle}
편: ${part.order}/${plan.parts.length} - ${part.title}
설명: ${part.description}
핵심 주제: ${part.keyTopics.join(", ")}

${partIndex > 0 ? `이전 편 제목: ${plan.parts[partIndex - 1].title}` : "시리즈의 첫 번째 글입니다."}
${partIndex < plan.parts.length - 1 ? `다음 편 제목: ${plan.parts[partIndex + 1].title}` : "시리즈의 마지막 글입니다."}

위 정보를 바탕으로 MDX 본문을 작성해주세요.`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return text;
}

export function assembleMDX(
  plan: SeriesPlan,
  partIndex: number,
  body: string
): string {
  const part = plan.parts[partIndex];
  const date = new Date().toISOString().split("T")[0];

  const frontmatter = `---
title: "${part.title}"
description: "${part.description}"
date: ${date}
tags: ${JSON.stringify(plan.seriesTitle.split(" ").slice(0, 3))}
series: "${plan.seriesTitle}"
seriesOrder: ${part.order}
published: true
---`;

  return `${frontmatter}\n\n${body}\n`;
}

export async function improveMDX(
  client: Anthropic,
  original: string,
  instruction?: string
): Promise<string> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 4000,
    system: `당신은 기술 블로그 편집자입니다. 기존 MDX 글을 개선합니다.
규칙:
- frontmatter는 그대로 유지
- 인터랙티브 컴포넌트를 더 활용
- 설명을 명확하게, 예제를 풍부하게
- 전체 MDX를 반환 (frontmatter 포함)

${COMPONENT_SCHEMAS}`,
    messages: [
      {
        role: "user",
        content: `다음 MDX 글을 개선해주세요.${instruction ? `\n\n지시: ${instruction}` : ""}\n\n---\n${original}`,
      },
    ],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return text;
}
