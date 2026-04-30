import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { Callout } from "@/components/ui/callout";
import { CodePlayground } from "@/components/ui/code-playground";
import { AnimatedStep } from "@/components/ui/animated-step";
import { VideoEmbed } from "@/components/ui/video-embed";
import { FlowDiagram } from "@/components/ui/flow-diagram";
import { References } from "@/components/ui/references";
import { Cite } from "@/components/ui/cite";
import { Table, THead, TBody, TR, TH, TD } from "@/components/ui/table";
import { CodeBlock } from "@/components/mdx/code-block";

function slugify(text: string): string {
  return text
    .toLowerCase()
    .replace(/[^\p{L}\p{N} -]/gu, "")
    .replace(/ /g, "-");
}

function extractText(children: ReactNode): string {
  if (typeof children === "string") return children;
  if (Array.isArray(children)) return children.map(extractText).join("");
  if (children && typeof children === "object" && "props" in children) {
    return extractText((children as { props: { children?: ReactNode } }).props.children);
  }
  return "";
}

function Heading({ level, children }: { level: 2 | 3; children?: ReactNode }) {
  const text = extractText(children);
  const id = slugify(text);
  const Tag = `h${level}` as const;
  return <Tag id={id}>{children}</Tag>;
}

export const mdxComponents: MDXComponents = {
  h2: (props) => <Heading level={2} {...props} />,
  h3: (props) => <Heading level={3} {...props} />,
  pre: (props) => <CodeBlock>{<pre {...props} />}</CodeBlock>,
  table: Table,
  thead: THead,
  tbody: TBody,
  tr: TR,
  th: TH,
  td: TD,
  Callout,
  CodePlayground,
  AnimatedStep,
  VideoEmbed,
  FlowDiagram,
  References,
  Cite,
};
