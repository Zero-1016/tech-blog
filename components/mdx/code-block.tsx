"use client";

import { useRef, type ReactNode } from "react";
import { CopyButton } from "@/components/ui/copy-button";

export function CodeBlock({ children }: { children: ReactNode }) {
  const ref = useRef<HTMLDivElement>(null);

  function getCode() {
    return ref.current?.querySelector("code")?.textContent ?? "";
  }

  return (
    <div ref={ref} className="group relative">
      {children}
      <CopyButton code={getCode()} />
    </div>
  );
}
