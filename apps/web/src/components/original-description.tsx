"use client";

import { useState } from "react";

interface OriginalDescriptionProps {
  description: string;
}

export function OriginalDescription({ description }: OriginalDescriptionProps) {
  const [open, setOpen] = useState(false);

  return (
    <section className="mt-8">
      <button
        type="button"
        onClick={() => setOpen((value) => !value)}
        className="flex w-full items-center justify-between rounded-2xl border border-border px-4 py-3 text-left text-sm font-semibold text-foreground transition hover:border-accent-border hover:bg-accent-subtle/60"
      >
        <span>원문 보기</span>
        <span className="text-muted-foreground">{open ? "접기" : "펼치기"}</span>
      </button>
      {open ? (
        <p className="mt-3 whitespace-break-spaces rounded-2xl bg-surface-muted px-4 py-4 leading-7 text-foreground">
          {description}
        </p>
      ) : null}
    </section>
  );
}
