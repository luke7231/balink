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
        className="flex w-full items-center justify-between rounded-2xl border border-zinc-200 px-4 py-3 text-left text-sm font-semibold text-zinc-900 transition hover:border-rose-200 hover:bg-rose-50/40"
      >
        <span>원문 보기</span>
        <span className="text-zinc-500">{open ? "접기" : "펼치기"}</span>
      </button>
      {open ? (
        <p className="mt-3 whitespace-break-spaces rounded-2xl bg-zinc-50 px-4 py-4 leading-7 text-zinc-700">
          {description}
        </p>
      ) : null}
    </section>
  );
}
