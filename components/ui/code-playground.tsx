"use client";

import dynamic from "next/dynamic";
import { useSyncExternalStore } from "react";

function subscribeDarkClass(callback: () => void) {
  const observer = new MutationObserver(callback);
  observer.observe(document.documentElement, { attributes: true, attributeFilter: ["class"] });
  return () => observer.disconnect();
}

function getDarkClassSnapshot() {
  return document.documentElement.classList.contains("dark");
}

function getServerDarkSnapshot() {
  return false;
}

function useIsDark() {
  return useSyncExternalStore(subscribeDarkClass, getDarkClassSnapshot, getServerDarkSnapshot);
}

const SandpackProvider = dynamic(
  () => import("@codesandbox/sandpack-react").then((mod) => mod.SandpackProvider),
  { ssr: false }
);

const SandpackLayout = dynamic(
  () => import("@codesandbox/sandpack-react").then((mod) => mod.SandpackLayout),
  { ssr: false }
);

const SandpackCodeEditor = dynamic(
  () => import("@codesandbox/sandpack-react").then((mod) => mod.SandpackCodeEditor),
  { ssr: false }
);

const SandpackPreview = dynamic(
  () => import("@codesandbox/sandpack-react").then((mod) => mod.SandpackPreview),
  { ssr: false }
);

type Template = "react" | "vanilla" | "vanilla-ts" | "react-ts";

interface CodePlaygroundProps {
  code: string;
  css?: string;
  template?: Template;
  showPreview?: boolean;
}

interface BuiltPlayground {
  template: Template;
  files: Record<string, string>;
  showPreview: boolean;
  activeFile?: string;
  visibleFiles?: string[];
}

function isCssSnippet(code: string): boolean {
  const t = code.trim();
  if (!t) return false;
  if (/^\s*(\/\*|:root\b|@media|@keyframes|@supports|@import)/.test(t)) return true;
  if (/^[.#]?[\w-]+\s*\{[\s\S]*?\}/.test(t) && !/\bfunction\b|=>|\breturn\b/.test(t)) {
    return true;
  }
  return false;
}

// Insert a blank line between the import block and the rest of the file
// so the injected imports read as a distinct section in the editor.
function ensureBlankLineAfterImports(code: string): string {
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

function buildReactFiles(code: string, css?: string): Record<string, string> {
  const trimmed = code.trim();
  const hasDefaultExport = /\bexport\s+default\b/.test(trimmed);
  const hasReactImport = /\bimport\s+React\b/.test(trimmed);
  const hasCssImport = /import\s+["']\.\/styles\.css["']/.test(trimmed);

  let appCode = trimmed;
  if (css && !hasCssImport) {
    appCode = `import "./styles.css";\n${appCode}`;
  }
  if (!hasReactImport) {
    appCode = `import React from "react";\n${appCode}`;
  }

  appCode = ensureBlankLineAfterImports(appCode);

  if (!hasDefaultExport) {
    const match = trimmed.match(/function\s+([A-Z]\w*)\s*\(/);
    const name = match?.[1] ?? "App";
    appCode = `${appCode}\n\nexport default ${name};\n`;
  }

  const files: Record<string, string> = { "/App.js": appCode };
  if (css) {
    files["/styles.css"] = css.trim();
  }
  return files;
}

function buildVanillaCssFiles(code: string): Record<string, string> {
  const css = code.trim();
  const html = `<!DOCTYPE html>
<html lang="ko">
  <head>
    <meta charset="UTF-8" />
    <link rel="stylesheet" href="./styles.css" />
    <style>
      body { font-family: system-ui, -apple-system, sans-serif; padding: 20px; }
      .demo-note { color: #666; font-size: 14px; }
    </style>
  </head>
  <body>
    <div class="demo-note">CSS 스니펫입니다. 편집기에서 코드를 확인하세요.</div>
  </body>
</html>
`;
  return {
    "/styles.css": css,
    "/index.html": html,
  };
}

function buildFiles(code: string, template: Template, css?: string): BuiltPlayground {
  if ((template === "vanilla" || template === "vanilla-ts") && isCssSnippet(code)) {
    return {
      template: "vanilla",
      files: buildVanillaCssFiles(code),
      showPreview: false,
      activeFile: "/styles.css",
      visibleFiles: ["/styles.css"],
    };
  }

  if (template === "react" || template === "react-ts") {
    const files = buildReactFiles(code, css);
    const visible = css ? ["/App.js", "/styles.css"] : ["/App.js"];
    return {
      template,
      files,
      showPreview: true,
      activeFile: "/App.js",
      visibleFiles: visible,
    };
  }

  return {
    template,
    files: { "/index.js": code.trim() },
    showPreview: true,
    activeFile: "/index.js",
    visibleFiles: ["/index.js"],
  };
}

export function CodePlayground({
  code,
  css,
  template = "react",
  showPreview = true,
}: CodePlaygroundProps) {
  const built = buildFiles(code, template, css);
  const shouldShowPreview = showPreview && built.showPreview;
  const isDark = useIsDark();

  return (
    <div className="my-6 overflow-hidden rounded-lg border border-border">
      <SandpackProvider
        template={built.template}
        files={built.files}
        theme={isDark ? "dark" : "light"}
        options={{
          recompileMode: "delayed",
          recompileDelay: 500,
          activeFile: built.activeFile,
          visibleFiles: built.visibleFiles,
        }}
      >
        <SandpackLayout>
          <SandpackCodeEditor
            showLineNumbers
            showTabs={Boolean(css)}
            style={{ minHeight: "260px" }}
          />
          {shouldShowPreview && (
            <SandpackPreview style={{ minHeight: "260px" }} />
          )}
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}
