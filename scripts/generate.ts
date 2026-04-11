import { config } from "dotenv";
import { resolve } from "path";
import { mkdirSync, writeFileSync, existsSync } from "fs";
import Anthropic from "@anthropic-ai/sdk";
import { planSeries } from "./series-planner";
import { buildMDX, assembleMDX } from "./mdx-builder";
import { validateMDX } from "./validate-mdx";

config({ path: resolve(process.cwd(), ".env.local") });

const MAX_RETRIES = 3;

async function sleep(ms: number) {
  return new Promise((r) => setTimeout(r, ms));
}

async function main() {
  const topic = process.argv[2];
  if (!topic) {
    console.error("Usage: pnpm generate \"주제\"");
    process.exit(1);
  }

  if (!process.env.ANTHROPIC_API_KEY) {
    console.error("Error: ANTHROPIC_API_KEY not found in .env.local");
    console.error("Create .env.local with: ANTHROPIC_API_KEY=sk-ant-...");
    process.exit(1);
  }

  const client = new Anthropic();

  // Step 1: Plan series
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

  // Step 2: Create directory
  const seriesDir = resolve(
    process.cwd(),
    "content/posts",
    plan.seriesSlug
  );
  if (!existsSync(seriesDir)) {
    mkdirSync(seriesDir, { recursive: true });
  }

  // Step 3: Generate each part
  for (let i = 0; i < plan.parts.length; i++) {
    const part = plan.parts[i];
    console.log(`\n✍️  [${i + 1}/${plan.parts.length}] "${part.title}" 생성 중...`);

    let mdxContent = "";
    let attempts = 0;

    while (attempts < MAX_RETRIES) {
      try {
        const body = await buildMDX(client, plan, i);
        mdxContent = assembleMDX(plan, i, body);

        const filePath = resolve(seriesDir, `${part.slug}.mdx`);
        writeFileSync(filePath, mdxContent, "utf-8");

        // Validate
        const result = validateMDX(filePath);
        if (result.valid) {
          console.log(`   ✅ 검증 통과 → ${part.slug}.mdx`);
          break;
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
          break;
        } else {
          console.log(`   ⚠️  오류 (${attempts}/${MAX_RETRIES}): ${errMsg}`);
          await sleep(1000);
        }
      }
    }
  }

  console.log(`\n🎉 완료! ${plan.parts.length}편 생성됨`);
  console.log(`📁 위치: content/posts/${plan.seriesSlug}/`);
  console.log(`\n다음 단계:`);
  console.log(`  pnpm dev --webpack    # 로컬에서 확인`);
  console.log(`  git add . && git push # 배포\n`);
}

main();
