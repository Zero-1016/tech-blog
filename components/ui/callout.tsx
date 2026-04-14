import { cn } from "@/lib/utils";

const variants = {
  tip: {
    icon: "💡",
    label: "팁",
    role: "note" as const,
    bg: "bg-blue-50 dark:bg-blue-950/30",
    border: "border-blue-200 dark:border-blue-800",
  },
  warning: {
    icon: "⚠️",
    label: "주의",
    role: "note" as const,
    bg: "bg-yellow-50 dark:bg-yellow-950/30",
    border: "border-yellow-200 dark:border-yellow-800",
  },
  info: {
    icon: "ℹ️",
    label: "정보",
    role: "note" as const,
    bg: "bg-gray-50 dark:bg-gray-950/30",
    border: "border-gray-200 dark:border-gray-800",
  },
  error: {
    icon: "🚨",
    label: "경고",
    role: "note" as const,
    bg: "bg-red-50 dark:bg-red-950/30",
    border: "border-red-200 dark:border-red-800",
  },
} as const;

interface CalloutProps {
  variant?: keyof typeof variants;
  children: React.ReactNode;
}

export function Callout({ variant = "info", children }: CalloutProps) {
  const style = variants[variant];

  return (
    <div
      role={style.role}
      aria-label={style.label}
      className={cn("my-6 flex gap-3 rounded-lg border p-4", style.bg, style.border)}
    >
      <span aria-hidden className="text-lg leading-7">
        {style.icon}
      </span>
      <div className="flex-1 text-sm leading-7">{children}</div>
    </div>
  );
}
