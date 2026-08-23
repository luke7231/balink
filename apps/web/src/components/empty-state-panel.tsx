import type { ReactNode } from "react";

type EmptyStatePanelProps = {
  title: string;
  description?: string;
  children?: ReactNode;
  className?: string;
  /** Compact inline empty hint (no card chrome). */
  variant?: "card" | "muted" | "inline" | "dashed";
};

const variantClass: Record<NonNullable<EmptyStatePanelProps["variant"]>, string> = {
  card: "rounded-3xl border border-border bg-surface px-6 py-12 text-center shadow-sm",
  muted: "rounded-3xl bg-surface-muted px-6 py-12 text-center",
  dashed:
    "rounded-3xl border border-dashed border-border bg-surface px-6 py-16 text-center",
  inline: "",
};

/**
 * Accessible empty-state block. Announced politely to screen readers.
 */
export function EmptyStatePanel({
  title,
  description,
  children,
  className = "",
  variant = "card",
}: EmptyStatePanelProps) {
  return (
    <div
      role="status"
      className={`${variantClass[variant]} ${className}`.trim()}
    >
      <p
        className={
          variant === "inline"
            ? "text-sm text-muted-foreground"
            : "text-sm font-medium text-foreground sm:text-base sm:font-semibold"
        }
      >
        {title}
      </p>
      {description ? (
        <p className="mt-2 text-sm text-muted-foreground">{description}</p>
      ) : null}
      {children}
    </div>
  );
}
