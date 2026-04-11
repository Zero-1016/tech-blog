import Anthropic from "@anthropic-ai/sdk";

export interface SeriesPlan {
  seriesSlug: string;
  seriesTitle: string;
  parts: {
    order: number;
    slug: string;
    title: string;
    description: string;
    keyTopics: string[];
  }[];
}

const SYSTEM_PROMPT = `당신은 기술 블로그 시리즈 기획자입니다.
주제를 받으면 시리즈 구조를 JSON으로 반환하세요.

규칙:
- 주제 복잡도에 따라 2~5편으로 구성
- 각 편은 독립적으로 읽을 수 있되, 순서대로 읽으면 심화되는 구조
- slug는 영문 kebab-case
- 한국어로 작성

JSON 형식만 반환하세요 (마크다운 코드블록 없이):
{
  "seriesSlug": "react-server-components",
  "seriesTitle": "React Server Components",
  "parts": [
    {
      "order": 1,
      "slug": "rsc-intro",
      "title": "React Server Components 입문",
      "description": "RSC가 무엇이고 왜 필요한지 알아봅니다.",
      "keyTopics": ["SSR vs CSR", "RSC 개념", "장점"]
    }
  ]
}`;

export async function planSeries(
  client: Anthropic,
  topic: string
): Promise<SeriesPlan> {
  const response = await client.messages.create({
    model: "claude-sonnet-4-20250514",
    max_tokens: 2000,
    system: SYSTEM_PROMPT,
    messages: [{ role: "user", content: `주제: ${topic}` }],
  });

  const text =
    response.content[0].type === "text" ? response.content[0].text : "";
  return JSON.parse(text);
}
