import { readFileSync, writeFileSync, readdirSync, statSync } from "fs";
import { resolve, join } from "path";
import prettier from "prettier";

type Parser = "css" | "babel" | "typescript" | "scss" | "none";

function pickParser(template: string | undefined, code: string): Parser {
  if (template === "react-ts" || template === "vanilla-ts") return "typescript";
  if (template === "react") return "babel";
  if (template === "vanilla") {
    if (/\bfunction\b|=>|\bdocument\.|\bconsole\./.test(code)) return "babel";
    return "css";
  }

  const trimmed = code.trim();

  // HTML fragment — skip; prettier's html parser rewraps awkwardly for short snippets.
  if (/^(<!--|<!DOCTYPE|<[a-zA-Z])/.test(trimmed)) return "none";

  // CSS at-rule or full ruleset (selector + braces + declarations)
  if (/^(\/\*|:root\b|@media\b|@keyframes\b|@supports\b|@import\b)/.test(trimmed)) {
    return "css";
  }
  if (
    /^[\w.#:*>\s,+~-]*\{[\s\S]*\}/.test(trimmed) &&
    /:\s*[^;{}]+;/.test(trimmed) &&
    !/=>|\bfunction\b|\breturn\b/.test(trimmed)
  ) {
    return "css";
  }

  // Bare one-liner declaration like `word-break: normal;` — no braces to
  // wrap, prettier can't parse it standalone, and reformatting a single
  // line adds nothing. Skip.
  if (/^[\w-]+\s*:\s*[^{}\n]+;?\s*$/.test(trimmed)) return "none";

  // Looks like JS/TS source
  if (/\bfunction\b|=>|\bconst\s|\blet\s|\bvar\s|\breturn\b|\bimport\s/.test(trimmed)) {
    return "babel";
  }

  // Free-form text / illustrative snippet — don't try to format.
  return "none";
}

function extractTemplateProp(attrs: string): string | undefined {
  const m = attrs.match(/template\s*=\s*"([^"]+)"/);
  return m?.[1];
}

// Walk forward from `start` (just past an opening backtick) and return the
// index of the next *unescaped* "`}" sequence. indexOf() can't tell escaped
// from unescaped backticks, which trips it up on code that contains
// `${...}` template-literal expressions.
function findClosingBacktickBrace(source: string, start: number): number {
  for (let i = start; i < source.length - 1; i++) {
    const c = source[i];
    if (c === "\\") {
      i++;
      continue;
    }
    if (c === "`" && source[i + 1] === "}") return i;
  }
  return -1;
}

// MDX serializer dedents JSX attribute template literals (top-level attribute
// expressions like `<CodePlayground code={`...`} />`) by the attribute's own
// indent — typically 2 spaces. So for those we prepend an extra 2 spaces to
// every non-empty line on disk to compensate.
//
// Template literals nested deeper inside an expression (e.g. inside an array
// of object literals passed to `<AnimatedStep steps={[{ code: `...` }]} />`)
// are NOT dedented by the serializer, so they need lineIndent only — no
// extra padding.
const MDX_DEDENT_COMPENSATION = "  ";

function reindent(code: string, baseIndent: string, compensate: boolean): string {
  const pad = compensate ? baseIndent + MDX_DEDENT_COMPENSATION : baseIndent;
  return code
    .split("\n")
    .map((line, i) => (i === 0 || line.length === 0 ? line : pad + line))
    .join("\n");
}

// Strip the smallest leading-indent shared by every non-empty non-first
// line. This normalizes both the previous (unpadded) format and any
// accumulated stacked padding from older formatter runs. The first line is
// excluded because it sits right after the opening backtick and naturally
// has zero indent.
function dedentToMinimum(code: string): string {
  const lines = code.split("\n");
  let min = Infinity;
  for (let i = 1; i < lines.length; i++) {
    const line = lines[i];
    if (!line.trim()) continue;
    const lead = line.match(/^(\s*)/)?.[1].length ?? 0;
    if (lead < min) min = lead;
  }
  if (min === Infinity || min === 0) return code;
  return lines
    .map((line, i) => {
      if (i === 0 || !line.trim()) return line;
      return line.slice(min);
    })
    .join("\n");
}

// Prettier doesn't insert a blank line after the import block. Readers
// expect one as a visual break between module wiring and the actual code,
// so we add it ourselves after formatting.
function addBlankLineAfterImports(code: string, parser: Parser): string {
  if (parser !== "babel" && parser !== "typescript") return code;

  const lines = code.split("\n");
  let lastImportEnd = -1;
  let i = 0;

  while (i < lines.length) {
    const trimmed = lines[i].trim();

    if (trimmed === "" || trimmed.startsWith("//")) {
      i++;
      continue;
    }

    if (!/^import\b/.test(trimmed)) break;

    let j = i;
    while (j < lines.length && !lines[j].trimEnd().endsWith(";")) j++;
    if (j >= lines.length) break;
    lastImportEnd = j;
    i = j + 1;
  }

  if (lastImportEnd === -1) return code;
  if (lastImportEnd + 1 >= lines.length) return code;
  if (lines[lastImportEnd + 1].trim() === "") return code;

  lines.splice(lastImportEnd + 1, 0, "");
  return lines.join("\n");
}

// Prettier keeps blank lines from the source but doesn't add them. Our
// inputs are almost always crammed together (no blank lines between rules)
// because they live inside an MDX attribute, so insert a blank line between
// every top-level rule for readability.
function addBlankLinesBetweenCssRules(css: string): string {
  return css.replace(/^\}\n(?=[^\s}])/gm, "}\n\n");
}

async function formatCodeBlock(raw: string, parser: Parser, context: string): Promise<string> {
  if (parser === "none") return raw;

  try {
    const formatted = await prettier.format(raw, {
      parser,
      semi: true,
      singleQuote: false,
      trailingComma: "es5",
      printWidth: 80,
      tabWidth: 2,
    });
    const trimmed = formatted.replace(/\n$/, "");
    if (parser === "css" || parser === "scss") {
      return addBlankLinesBetweenCssRules(trimmed);
    }
    return addBlankLineAfterImports(trimmed, parser);
  } catch (e) {
    const msg = e instanceof Error ? e.message : String(e);
    console.warn(`   ⚠️  ${context} prettier 실패 (parser=${parser}): ${msg.split("\n")[0]}`);
    return raw;
  }
}

function indexAt(s: string, needle: string, from: number): number {
  const idx = s.indexOf(needle, from);
  return idx === -1 ? Infinity : idx;
}

async function formatCodePlaygrounds(
  source: string,
  filePath: string
): Promise<{ output: string; changed: boolean }> {
  let output = "";
  let i = 0;
  let changed = false;

  while (i < source.length) {
    const openStart = source.indexOf("<CodePlayground", i);
    if (openStart === -1) {
      output += source.slice(i);
      break;
    }

    output += source.slice(i, openStart);

    // template= is always before any template-literal prop, so scan the
    // header region up to the first backtick.
    const firstBacktick = source.indexOf("`", openStart);
    const headerEnd = firstBacktick === -1 ? source.length : firstBacktick;
    const template = extractTemplateProp(source.slice(openStart, headerEnd));

    const lineStart = source.lastIndexOf("\n", openStart) + 1;
    const lineIndent = source.slice(lineStart, openStart).match(/^(\s*)/)?.[1] ?? "";

    // Walk props within this tag. Each iteration processes the nearest
    // `code={\`` or `css={\`` until `/>` appears first (tag close).
    let cursor = openStart;
    let bail = false;
    while (true) {
      const codeIdx = indexAt(source, "code={`", cursor);
      const cssIdx = indexAt(source, "css={`", cursor);
      const closeIdx = indexAt(source, "/>", cursor);
      const nextProp = Math.min(codeIdx, cssIdx);

      if (closeIdx < nextProp) {
        const end = closeIdx === Infinity ? source.length : closeIdx + 2;
        output += source.slice(cursor, end);
        cursor = end;
        break;
      }

      if (nextProp === Infinity) {
        output += source.slice(cursor);
        cursor = source.length;
        break;
      }

      const propName: "code" | "css" = codeIdx < cssIdx ? "code" : "css";
      const marker = `${propName}={\``;
      const codeStart = nextProp + marker.length;
      const codeEnd = findClosingBacktickBrace(source, codeStart);
      if (codeEnd === -1) {
        output += source.slice(cursor);
        cursor = source.length;
        bail = true;
        break;
      }

      output += source.slice(cursor, codeStart);

      const rawCode = source.slice(codeStart, codeEnd);
      const parser: Parser = propName === "css" ? "css" : pickParser(template, rawCode);
      const line = source.slice(0, nextProp).split("\n").length;
      const unescaped = rawCode.replace(/\\`/g, "`").replace(/\\\$\{/g, "${");
      const dedented = dedentToMinimum(unescaped);
      const formatted = await formatCodeBlock(
        dedented,
        parser,
        `${filePath.split("/").pop()}:${line}`
      );
      const reescaped = formatted.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
      const reindented = reindent(reescaped, lineIndent, true);

      if (reindented !== rawCode) changed = true;

      output += reindented + "`}";
      cursor = codeEnd + 2;
    }

    i = cursor;
    if (bail) break;
  }

  return { output, changed };
}

// Find every `code: \`...\`` field inside an <AnimatedStep> block (or any
// JSX expression really) and prettier-format it the same way as
// CodePlayground's `code` prop. Operates on the file string after
// CodePlayground processing.
async function formatAnimatedStepCodes(
  source: string,
  filePath: string
): Promise<{ output: string; changed: boolean }> {
  let changed = false;
  const blockRegex = /<AnimatedStep\b[\s\S]*?\/>/g;
  const blocks: { start: number; end: number }[] = [];
  let m: RegExpExecArray | null;
  while ((m = blockRegex.exec(source)) !== null) {
    blocks.push({ start: m.index, end: m.index + m[0].length });
  }

  // Process from end to start so earlier offsets stay valid.
  for (let b = blocks.length - 1; b >= 0; b--) {
    const { start, end } = blocks[b];
    const block = source.slice(start, end);

    // Match `code: \`...\`` — assumes no nested backticks inside the literal.
    const codeFieldRegex = /(\bcode\s*:\s*)`([^`]*)`/g;
    const fields: { fStart: number; fEnd: number; prefix: string; raw: string }[] = [];
    let fm: RegExpExecArray | null;
    while ((fm = codeFieldRegex.exec(block)) !== null) {
      fields.push({
        fStart: fm.index,
        fEnd: fm.index + fm[0].length,
        prefix: fm[1],
        raw: fm[2],
      });
    }

    let newBlock = block;
    for (let f = fields.length - 1; f >= 0; f--) {
      const { fStart, fEnd, prefix, raw } = fields[f];

      const lineStart = newBlock.lastIndexOf("\n", fStart) + 1;
      const lineIndent = newBlock.slice(lineStart, fStart).match(/^(\s*)/)?.[1] ?? "";

      const parser = pickParser(undefined, raw);
      const absoluteLine = source.slice(0, start + fStart).split("\n").length;
      const unescaped = raw.replace(/\\`/g, "`").replace(/\\\$\{/g, "${");
      // Nested expression: ignore lineIndent so the rendered code starts
      // flush left and shows only prettier's own indentation. mdx still
      // dedents 2 spaces from the result, so we reapply that compensation.
      const dedented = dedentToMinimum(unescaped);
      const formatted = await formatCodeBlock(
        dedented,
        parser,
        `${filePath.split("/").pop()}:${absoluteLine} (AnimatedStep)`
      );
      const reescaped = formatted.replace(/`/g, "\\`").replace(/\$\{/g, "\\${");
      const reindented = reindent(reescaped, "", true);

      if (reindented !== raw) changed = true;

      newBlock = newBlock.slice(0, fStart) + prefix + "`" + reindented + "`" + newBlock.slice(fEnd);
    }

    if (newBlock !== block) {
      source = source.slice(0, start) + newBlock + source.slice(end);
    }
  }

  return { output: source, changed };
}

async function formatMdxFile(filePath: string): Promise<boolean> {
  const original = readFileSync(filePath, "utf-8");

  const cp = await formatCodePlaygrounds(original, filePath);
  const as = await formatAnimatedStepCodes(cp.output, filePath);

  const finalOutput = as.output;
  const changed = cp.changed || as.changed;

  if (changed) {
    writeFileSync(filePath, finalOutput, "utf-8");
  }
  return changed;
}

function walkMdx(dir: string): string[] {
  const out: string[] = [];
  for (const entry of readdirSync(dir)) {
    const full = join(dir, entry);
    if (statSync(full).isDirectory()) {
      out.push(...walkMdx(full));
    } else if (entry.endsWith(".mdx")) {
      out.push(full);
    }
  }
  return out;
}

async function main() {
  const args = process.argv.slice(2);
  const targets = args.length > 0 ? args : walkMdx(resolve(process.cwd(), "content/posts"));

  if (targets.length === 0) {
    console.log("대상 MDX 파일이 없습니다.");
    return;
  }

  let changedCount = 0;
  for (const target of targets) {
    const full = resolve(process.cwd(), target);
    const changed = await formatMdxFile(full);
    if (changed) {
      console.log(`✨ ${target}`);
      changedCount++;
    }
  }

  if (changedCount === 0) {
    console.log("변경된 파일 없음 (이미 포매팅 완료).");
  } else {
    console.log(`\n총 ${changedCount}개 파일 포매팅 완료.`);
  }
}

main();
