"use client";

import { useState } from "react";

interface OriginalDescriptionProps {
  description: string;
  /** Parent already provides section chrome (title / border-t). */
  embedded?: boolean;
}

export function OriginalDescription({
  description,
  embedded = false,
}: OriginalDescriptionProps) {
  const [open, setOpen] = useState(false);

  const toggle = (
    <button
      type="button"
      onClick={() => setOpen((value) => !value)}
      className={
        embedded
          ? "-mx-2 flex w-[calc(100%+1rem)] items-center justify-between px-2 py-3 text-left text-sm font-semibold text-foreground hover:opacity-80"
          : "flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:bg-surface-muted"
      }
    >
      <span>원문 펼치기</span>
      <span className="text-muted-foreground">{open ? "접기" : "펼치기"}</span>
    </button>
  );

  const body = open ? (
    <p
      className={
        embedded
          ? "mt-1 whitespace-break-spaces rounded-2xl bg-surface-muted px-4 py-4 text-sm leading-7 text-foreground"
          : "mt-3 whitespace-break-spaces rounded-2xl bg-surface-muted px-4 py-4 leading-7 text-foreground"
      }
    >
      {description}
    </p>
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
