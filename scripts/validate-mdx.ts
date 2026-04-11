import { readFileSync } from "fs";

export function validateMDX(filePath: string): { valid: boolean; error?: string } {
  try {
    const content = readFileSync(filePath, "utf-8");

    // frontmatter 존재 확인
    if (!content.startsWith("---")) {
      return { valid: false, error: "Missing frontmatter" };
    }

    const frontmatterEnd = content.indexOf("---", 3);
    if (frontmatterEnd === -1) {
      return { valid: false, error: "Unclosed frontmatter" };
    }

    const frontmatter = content.slice(3, frontmatterEnd);

    // 필수 필드 확인
    const requiredFields = ["title", "description", "date", "published"];
    for (const field of requiredFields) {
      if (!frontmatter.includes(`${field}:`)) {
        return { valid: false, error: `Missing required field: ${field}` };
      }
    }

    const body = content.slice(frontmatterEnd + 3);

    // JSX 태그 밸런스 확인 (self-closing 제외)
    const openTags = body.match(/<(Callout|AnimatedStep|CodePlayground|VideoEmbed)[\s>]/g) || [];
    const closeTags = body.match(/<\/(Callout|AnimatedStep|CodePlayground|VideoEmbed)>/g) || [];
    const selfClosing = body.match(/<(AnimatedStep|CodePlayground|VideoEmbed)[^>]*\/>/g) || [];

    const unclosed = openTags.length - closeTags.length - selfClosing.length;
    if (unclosed > 0) {
      return { valid: false, error: `${unclosed} unclosed component tag(s)` };
    }

    return { valid: true };
  } catch (e) {
    return { valid: false, error: String(e) };
  }
}
