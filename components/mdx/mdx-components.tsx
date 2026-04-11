import type { MDXComponents } from "mdx/types";
import type { ReactNode } from "react";
import { Callout } from "@/components/ui/callout";
import { CodePlayground } from "@/components/ui/code-playground";
import { AnimatedStep } from "@/components/ui/animated-step";
import { VideoEmbed } from "@/components/ui/video-embed";

function slugify(text: string): string {
  return text
    .replace(/[^a-zA-Z0-9가-힣\s-]/g, "")
    .replace(/\s+/g, "-")
    .replace(/-+/g, "-")
    .toLowerCase()
    .trim();
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
  Callout,
  CodePlayground,
  AnimatedStep,
  VideoEmbed,
};
