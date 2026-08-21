"use client";

import { useState, type ReactNode } from "react";
import { LinkifiedText } from "@/components/linkified-text";

interface OriginalDescriptionProps {
  description?: string;
  /** Parent already provides section chrome (title / border-t). */
  embedded?: boolean;
  /** description 대신 커스텀 본문 (대강 원문 등). */
  children?: ReactNode;
  label?: string;
}

export function OriginalDescription({
  description,
  embedded = false,
  children,
  label = "원문 펼치기",
}: OriginalDescriptionProps) {
  const [open, setOpen] = useState(false);
  const hasBody = Boolean(children) || Boolean(description?.trim());
  if (!hasBody) return null;

  const toggle = (
    <button
      type="button"
      aria-expanded={open}
      onClick={() => setOpen((value) => !value)}
      className={
        embedded
          ? "-mx-2 flex w-[calc(100%+1rem)] items-center gap-2 px-2 py-3 text-left text-sm font-semibold text-foreground hover:opacity-80"
          : "flex w-full items-center gap-2 rounded-2xl border border-border px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-surface-muted"
      }
    >
      <span
        aria-hidden
        className={`inline-flex shrink-0 text-muted-foreground transition-transform duration-200 ease-out motion-reduce:transition-none ${
          open ? "rotate-90" : "rotate-0"
        }`}
      >
        <NotionToggleIcon />
      </span>
      <span>{label}</span>
    </button>
  );

  const bodyClass = embedded
    ? "mt-1 whitespace-pre-wrap rounded-2xl bg-surface-muted px-4 py-4 text-sm leading-7 text-foreground"
    : "mt-3 whitespace-pre-wrap rounded-2xl bg-surface-muted px-4 py-4 text-sm leading-7 text-foreground";

  const body = open ? (
    children ? (
      <div className={bodyClass}>{children}</div>
    ) : description ? (
      <LinkifiedText text={description} className={bodyClass} />
    ) : null
  ) : null;

  if (embedded) {
    return (
      <div>
        {toggle}
        {body}
      </div>
    );
  }

  return (
    <section className="mt-8">
      {toggle}
      {body}
    </section>
  );
}

/** Notion disclosure triangle (▶), rotates when open. */
function NotionToggleIcon() {
  return (
    <svg
      viewBox="0 0 16 16"
      width="14"
      height="14"
      fill="currentColor"
      aria-hidden
    >
      <path d="M6.2 3.6a.75.75 0 0 1 1.2-.6l5.2 4a.75.75 0 0 1 0 1.2l-5.2 4A.75.75 0 0 1 6 11.4V4.6c0-.35.13-.6.2-1Z" />
    </svg>
  );
}
