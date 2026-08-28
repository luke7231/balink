"use client";

import { useEffect, useRef, useState } from "react";
import { MotionReveal } from "@/components/motion-reveal";
import { normalizeJobSearchQuery } from "@balink/domain";

const DEBOUNCE_MS = 300;

type ListSearchFieldProps = {
  value: string;
  onChange: (next: string) => void;
  placeholder?: string;
  ariaLabel?: string;
};

export function ListSearchField({
  value,
  onChange,
  placeholder = "학원명, 지역으로 검색",
  ariaLabel = "채용 공고 검색",
}: ListSearchFieldProps) {
  const [draft, setDraft] = useState(value);
  const draftRef = useRef(draft);
  const valueRef = useRef(value);
  const onChangeRef = useRef(onChange);
  draftRef.current = draft;
  valueRef.current = value;
  onChangeRef.current = onChange;

  // Sync from URL / parent when external value changes (back/forward, clear CTA).
  useEffect(() => {
    setDraft(value);
  }, [value]);

  useEffect(() => {
    const handle = window.setTimeout(() => {
      const next = normalizeJobSearchQuery(draftRef.current);
      const current = normalizeJobSearchQuery(valueRef.current);
      if (next === current) return;
      onChangeRef.current(next);
    }, DEBOUNCE_MS);
    return () => window.clearTimeout(handle);
  }, [draft]);

  function commitNow(raw: string) {
    const next = normalizeJobSearchQuery(raw);
    setDraft(next);
    if (next !== normalizeJobSearchQuery(valueRef.current)) {
      onChange(next);
    }
  }

  return (
    <MotionReveal index={1} variant="fade-up" className="mb-4">
      <div role="search" className="min-w-0 max-w-full">
        <label className="sr-only" htmlFor="job-list-search">
          {ariaLabel}
        </label>
        <div className="flex h-10 items-center gap-2 rounded-xl border border-border bg-surface px-3 focus-within:border-accent-border focus-within:ring-2 focus-within:ring-accent-border/40">
          <SearchIcon />
          <input
            id="job-list-search"
            type="search"
            enterKeyHint="search"
            autoComplete="off"
            autoCorrect="off"
            spellCheck={false}
            value={draft}
            placeholder={placeholder}
            aria-label={ariaLabel}
            onChange={(event) => setDraft(event.target.value)}
            onKeyDown={(event) => {
              if (event.key === "Enter") {
                event.preventDefault();
                commitNow(draftRef.current);
              }
            }}
            className="min-w-0 flex-1 bg-transparent text-sm text-foreground outline-none placeholder:text-muted-foreground"
          />
          {draft ? (
            <button
              type="button"
              aria-label="검색어 지우기"
              onClick={() => commitNow("")}
              className="inline-flex h-6 w-6 shrink-0 touch-manipulation items-center justify-center rounded-full text-muted-foreground hover:bg-surface-muted hover:text-foreground"
            >
              <ClearIcon />
            </button>
          ) : null}
        </div>
      </div>
    </MotionReveal>
  );
}

function SearchIcon() {
  return (
    <svg
      viewBox="0 0 24 24"
      className="h-4 w-4 shrink-0 text-muted-foreground"
      fill="none"
      aria-hidden="true"
    >
      <circle cx="11" cy="11" r="6.5" stroke="currentColor" strokeWidth="1.8" />
      <path
        d="M16.5 16.5 20 20"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ClearIcon() {
  return (
    <svg viewBox="0 0 24 24" className="h-3.5 w-3.5" fill="none" aria-hidden="true">
      <path
        d="M7 7l10 10M17 7 7 17"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}
