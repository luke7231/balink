"use client";

import type { ButtonHTMLAttributes, ReactNode } from "react";
import { useFormStatus } from "react-dom";
import { CTA_PRESS_CLASS } from "@/lib/button-classes";

export { CTA_PRESS_CLASS };

export function ButtonSpinner({ className = "h-4 w-4" }: { className?: string }) {
  return (
    <svg
      className={`btn-spinner animate-spin ${className}`}
      viewBox="0 0 16 16"
      fill="none"
      aria-hidden
    >
      <circle
        cx="8"
        cy="8"
        r="6"
        stroke="currentColor"
        strokeOpacity="0.25"
        strokeWidth="2"
      />
      <path
        d="M14 8a6 6 0 0 0-6-6"
        stroke="currentColor"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

export function ButtonPendingContent({
  pending,
  pendingLabel,
  children,
}: {
  pending: boolean;
  pendingLabel: string;
  children: ReactNode;
}) {
  if (!pending) return children;
  return (
    <span className="inline-flex items-center justify-center gap-2">
      <ButtonSpinner />
      {pendingLabel}
    </span>
  );
}

type PendingSubmitButtonProps = Omit<
  ButtonHTMLAttributes<HTMLButtonElement>,
  "type" | "children"
> & {
  pendingLabel: string;
  children: ReactNode;
  /** When true, also disable while a sibling action owns the shared pending flag. */
  forceDisabled?: boolean;
};

/**
 * Submit button for native `form action={serverAction}` forms.
 * Must be a descendant of the form — `useFormStatus` only works inside it.
 */
export function PendingSubmitButton({
  pendingLabel,
  children,
  className,
  disabled,
  forceDisabled,
  ...rest
}: PendingSubmitButtonProps) {
  const { pending } = useFormStatus();
  const busy = pending || Boolean(forceDisabled);

  return (
    <button
      type="submit"
      disabled={busy || disabled}
      aria-busy={pending || undefined}
      className={className}
      {...rest}
    >
      <ButtonPendingContent pending={pending} pendingLabel={pendingLabel}>
        {children}
      </ButtonPendingContent>
    </button>
  );
}
