import type { ReactNode } from "react";

interface BadgeProps {
  children: ReactNode;
  variant?: "rose" | "neutral";
}

export function Badge({ children, variant = "neutral" }: BadgeProps) {
  const className =
    variant === "rose"
      ? "rounded-full bg-accent-subtle px-3 py-1 text-xs font-medium text-accent"
      : "rounded-full bg-surface-muted px-3 py-1 text-xs text-muted-foreground";

  return <span className={className}>{children}</span>;
}
