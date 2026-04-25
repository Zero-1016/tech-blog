import type { ComponentPropsWithoutRef } from "react";
import { cn } from "@/lib/utils";

export function Table({ className, ...props }: ComponentPropsWithoutRef<"table">) {
  return (
    <div className="my-6 overflow-x-auto rounded-lg border border-[var(--color-border)]">
      <table
        className={cn("w-full border-collapse text-left text-sm leading-7", className)}
        {...props}
      />
    </div>
  );
}

export function THead({ className, ...props }: ComponentPropsWithoutRef<"thead">) {
  return (
    <thead
      className={cn(
        "border-b border-[var(--color-border)] bg-[var(--color-bg-secondary)]",
        className
      )}
      {...props}
    />
  );
}

export function TBody({ className, ...props }: ComponentPropsWithoutRef<"tbody">) {
  return <tbody className={className} {...props} />;
}

export function TR({ className, ...props }: ComponentPropsWithoutRef<"tr">) {
  return (
    <tr
      className={cn(
        "border-b border-[var(--color-border)] last:border-b-0",
        "transition-colors hover:bg-[var(--color-card-hover)]",
        className
      )}
      {...props}
    />
  );
}

export function TH({ className, ...props }: ComponentPropsWithoutRef<"th">) {
  return (
    <th
      className={cn("px-4 py-3 text-sm font-semibold text-[var(--color-text)]", className)}
      {...props}
    />
  );
}

export function TD({ className, ...props }: ComponentPropsWithoutRef<"td">) {
  return <td className={cn("px-4 py-3 align-top", className)} {...props} />;
}
