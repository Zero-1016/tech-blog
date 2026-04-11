const SITE_URL = (process.env.NEXT_PUBLIC_SITE_URL ?? "").replace(/\/$/, "");
const KEY = process.env.INDEXNOW_KEY;
const ENDPOINT = "https://api.indexnow.org/indexnow";

function normalizeUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!trimmed) return null;
  if (trimmed.startsWith("http://") || trimmed.startsWith("https://")) return trimmed;
  if (!SITE_URL) return null;
  return `${SITE_URL}${trimmed.startsWith("/") ? "" : "/"}${trimmed}`;
}

async function main() {
  if (!KEY) {
    console.log("IndexNow: INDEXNOW_KEY 미설정 → 스킵");
    return;
  }
  if (!SITE_URL) {
    console.log("IndexNow: NEXT_PUBLIC_SITE_URL 미설정 → 스킵");
    return;
  }

  const urls = process.argv
    .slice(2)
    .flatMap((a) => a.split(/\s+/))
    .map(normalizeUrl)
    .filter((u): u is string => !!u);

  if (urls.length === 0) {
    console.log("IndexNow: 제출할 URL 없음 → 스킵");
    return;
  }

  const unique = [...new Set(urls)];
  const host = new URL(SITE_URL).host;
  const keyLocation = `${SITE_URL}/${KEY}.txt`;

  const keyRes = await fetch(keyLocation).catch(() => null);
  if (!keyRes || !keyRes.ok) {
    console.error(`✗ IndexNow: 키 파일 ${keyLocation} 접근 불가 (HTTP ${keyRes?.status ?? "?"}).`);
    console.error("  배포 후 public/{KEY}.txt가 퍼블릭으로 서빙되는지 확인하세요.");
    process.exit(1);
  }
  const keyBody = (await keyRes.text()).trim();
  if (keyBody !== KEY) {
    console.error(`✗ IndexNow: 키 파일 내용 불일치 (${keyLocation}).`);
    process.exit(1);
  }

  const body = { host, key: KEY, keyLocation, urlList: unique };

  console.log(`IndexNow: ${unique.length}개 URL 제출 중 → ${ENDPOINT}`);
  for (const u of unique) console.log(`  · ${u}`);

  const res = await fetch(ENDPOINT, {
    method: "POST",
    headers: { "Content-Type": "application/json; charset=utf-8" },
    body: JSON.stringify(body),
  });

  if (res.status >= 200 && res.status < 300) {
    console.log(`✓ IndexNow: 제출 완료 (HTTP ${res.status})`);
    return;
  }

  const text = await res.text().catch(() => "");
  console.error(`✗ IndexNow: 실패 (HTTP ${res.status}) ${text}`);
  process.exit(1);
}

main().catch((e) => {
  console.error("IndexNow: 예외", e);
  process.exit(1);
});
