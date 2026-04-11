import { config } from "dotenv";
import { resolve } from "path";
import { mkdirSync, writeFileSync, readFileSync, existsSync, readdirSync, statSync } from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { planSeries } from "./series-planner";
import { buildMDX, assembleMDX, improveMDX } from "./mdx-builder";
import { validateMDX } from "./validate-mdx";

config({ path: resolve(process.cwd(), ".env.local") });

const MAX_RETRIES = 3;

function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

function printUsage() {
  console.log(`
Usage:
  pnpm generate "주제"                  시리즈 생성 (2~5편)
  pnpm generate --single "주제"         단일 글 생성
  pnpm generate --update <slug>         기존 글 개선
  pnpm generate --update <slug> "지시"  특정 지시로 개선
`);
}

async function generateWithRetry(
  client: Anthropic,
  fn: () => Promise<string>,
  filePath: string,
  label: string
) {
  let attempts = 0;
  while (attempts < MAX_RETRIES) {
    try {
      const content = await fn();
      writeFileSync(filePath, content, "utf-8");

      const result = validateMDX(filePath);
      if (result.valid) {
        console.log(`   ✅ 검증 통과 → ${label}`);
        return;
      }

      attempts++;
      console.log(`   ⚠️  검증 실패 (${attempts}/${MAX_RETRIES}): ${result.error}`);
      if (attempts < MAX_RETRIES) {
        console.log("   🔄 재생성 중...");
        await sleep(1000 * attempts);
      } else {
        console.log(`   ❌ ${MAX_RETRIES}회 시도 후 실패. 마지막 버전을 저장합니다.`);
      }
    } catch (e: unknown) {
      attempts++;
      const errMsg = e instanceof Error ? e.message : String(e);

      if (errMsg.includes("rate_limit") || errMsg.includes("429")) {
        const backoff = 1000 * Math.pow(2, attempts);
        console.log(`   ⏳ Rate limit. ${backoff / 1000}초 대기...`);
        await sleep(backoff);
      } else if (attempts >= MAX_RETRIES) {
        console.error(`   ❌ 생성 실패:`, errMsg);
        return;
      } else {
        console.log(`   ⚠️  오류 (${attempts}/${MAX_RETRIES}): ${errMsg}`);
        await sleep(1000);
      }
    }
  }
}

async function handleSingle(client: Anthropic, topic: string) {
  console.log(`\n✍️  단일 글 생성: "${topic}"\n`);

  const slug = topic
    .toLowerCase()
    .replace(/[^a-z0-9가-힣\s]/g, "")
    .replace(/\s+/g, "-")
    .slice(0, 50);

  const plan = {
    seriesSlug: "",
    seriesTitle: topic,
    parts: [
      {
        order: 1,
        slug,
        title: topic,
        description: `${topic}에 대해 알아봅니다.`,
        keyTopics: [topic],
      },
    ],
  };

  const filePath = resolve(process.cwd(), "content/posts", `${slug}.mdx`);

  await generateWithRetry(
    client,
    async () => {
      const body = await buildMDX(client, plan, 0);
      return assembleMDX(plan, 0, body);
    },
    filePath,
    `${slug}.mdx`
  );

  console.log(`\n🎉 완료! content/posts/${slug}.mdx`);
}

async function handleUpdate(client: Anthropic, slug: string, instruction?: string) {
  // content/posts/ 하위에서 slug에 맞는 파일 찾기
  const candidates = [
    resolve(process.cwd(), "content/posts", `${slug}.mdx`),
    ...findMDXFiles(resolve(process.cwd(), "content/posts"), slug),
  ];

  const filePath = candidates.find((f) => existsSync(f));
  if (!filePath) {
    console.error(`❌ "${slug}" 파일을 찾을 수 없습니다.`);
    console.error("content/posts/ 하위에서 해당 slug의 .mdx 파일을 확인하세요.");
    process.exit(1);
  }

  console.log(`\n🔄 글 개선: ${filePath}\n`);

  const original = readFileSync(filePath, "utf-8");
  const improved = await improveMDX(client, original, instruction);
  writeFileSync(filePath, improved, "utf-8");

  const result = validateMDX(filePath);
  if (result.valid) {
    console.log("✅ 개선 완료 + 검증 통과");
  } else {
    console.log(`⚠️  개선 완료. 검증 경고: ${result.error}`);
  }
}

function findMDXFiles(dir: string, slug: string): string[] {
  const results: string[] = [];
  try {
    for (const entry of readdirSync(dir)) {
      const full = resolve(dir, entry);
      if (statSync(full).isDirectory()) {
        results.push(...findMDXFiles(full, slug));
      } else if (entry === `${slug}.mdx`) {
        results.push(full);
      }
    }
  } catch {}
  return results;
}

async function handleSeries(client: Anthropic, topic: string) {
  console.log(`\n📋 시리즈 기획 중: "${topic}"\n`);

  let plan;
  try {
    plan = await planSeries(client, topic);
  } catch (e) {
    console.error("시리즈 기획 실패:", e);
    process.exit(1);
  }

  console.log(`✅ "${plan.seriesTitle}" 시리즈 (${plan.parts.length}편)`);
  for (const part of plan.parts) {
    console.log(`   ${part.order}. ${part.title}`);
  }

  const seriesDir = resolve(process.cwd(), "content/posts", plan.seriesSlug);
  if (!existsSync(seriesDir)) {
    mkdirSync(seriesDir, { recursive: true });
  }

  for (let i = 0; i < plan.parts.length; i++) {
    const part = plan.parts[i];
    console.log(`\n✍️  [${i + 1}/${plan.parts.length}] "${part.title}" 생성 중...`);

    const filePath = resolve(seriesDir, `${part.slug}.mdx`);
    await generateWithRetry(
      client,
      async () => {
        const body = await buildMDX(client, plan, i);
        return assembleMDX(plan, i, body);
      },
      filePath,
      `${part.slug}.mdx`
    );
  }

  console.log(`\n🎉 완료! ${plan.parts.length}편 생성됨`);
  console.log(`📁 위치: content/posts/${plan.seriesSlug}/`);
}

async function main() {
  const args = process.argv.slice(2);

  if (args.length === 0) {
    printUsage();
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY not found in .env.local");
    console.error("Create .env.local with: ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  const client = new Anthropic();

  if (args[0] === "--single") {
    const topic = args[1];
    if (!topic) {
      console.error('Usage: pnpm generate --single "주제"');
      process.exit(1);
    }
    await handleSingle(client, topic);
  } else if (args[0] === "--update") {
    const slug = args[1];
    if (!slug) {
      console.error("Usage: pnpm generate --update <slug>");
      process.exit(1);
    }
    await handleUpdate(client, slug, args[2]);
  } else {
    await handleSeries(client, args[0]);
  }

  console.log(`\n다음 단계:`);
  console.log(`  pnpm dev --webpack    # 로컬에서 확인`);
  console.log(`  git add . && git push # 배포\n`);
}

main();
