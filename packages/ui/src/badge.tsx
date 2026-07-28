import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "rose" | "neutral";
}

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  const className =
    variant === "rose"
      ? "rounded-full bg-rose-50 px-3 py-1 text-xs font-medium text-rose-700"
      : "rounded-full bg-zinc-100 px-3 py-1 text-xs text-zinc-600";

  return <span className={className}>{children}</span>;
}
