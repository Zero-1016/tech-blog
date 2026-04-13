import type { ReactNode } from "react";

export function PostHeader({ children }: { children: ReactNode }) {
  return <header className="mb-10">{children}</header>;
}
