"use client";

import dynamic from "next/dynamic";

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

interface CodePlaygroundProps {
  code: string;
  template?: "react" | "vanilla" | "vanilla-ts" | "react-ts";
  showPreview?: boolean;
}

export function CodePlayground({
  code,
  template = "react",
  showPreview = true,
}: CodePlaygroundProps) {
  return (
    <div className="my-6 overflow-hidden rounded-lg border border-border">
      <SandpackProvider
        template={template}
        files={{ "/App.js": code }}
        theme="auto"
      >
        <SandpackLayout>
          <SandpackCodeEditor
            showLineNumbers
            showTabs={false}
            style={{ minHeight: "200px" }}
          />
          {showPreview && (
            <SandpackPreview style={{ minHeight: "200px" }} />
          )}
        </SandpackLayout>
      </SandpackProvider>
    </div>
  );
}
