"use client";

import { useEffect, useState, useTransition } from "react";
import { toggleJobBookmarkAction } from "@/components/bookmark-actions";
import { notifyWebViewSync } from "@/lib/native-shell";

function BookmarkIcon({ filled }: { filled: boolean }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" className="h-5 w-5" aria-hidden="true">
        <path
          fill="currentColor"
          d="M6 3.75A2.25 2.25 0 0 1 8.25 1.5h7.5A2.25 2.25 0 0 1 18 3.75v18.19a.75.75 0 0 1-1.2.6L12 18.75l-4.8 3.79a.75.75 0 0 1-1.2-.6V3.75Z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className="h-5 w-5" fill="none" aria-hidden="true">
      <path
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
        d="M6.75 3.75h10.5A1.5 1.5 0 0 1 18.75 5.25v15.19a.75.75 0 0 1-1.2.6L12 17.25l-5.55 3.79a.75.75 0 0 1-1.2-.6V5.25a1.5 1.5 0 0 1 1.5-1.5Z"
      />
    </svg>
  );
}

export function BookmarkButton({
  jobPostId,
  initialBookmarked,
  variant = "label",
}: {
  jobPostId: string;
  initialBookmarked: boolean;
  variant?: "label" | "icon";
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setBookmarked(initialBookmarked);
  }, [initialBookmarked, jobPostId]);

  function onToggle() {
    const previous = bookmarked;
    const next = !previous;
    setError(null);
    setBookmarked(next);
    window.balinkHaptics?.play(next ? "success" : "selection");

    startTransition(async () => {
      const result = await toggleJobBookmarkAction(jobPostId);
      if (!result.ok) {
        setBookmarked(previous);
        setError(result.error);
        window.balinkHaptics?.play("error");
        return;
      }
      setBookmarked(result.bookmarked);
      notifyWebViewSync("bookmark");
    });
  }

  if (variant === "icon") {
    return (
      <button
        type="button"
        aria-busy={pending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }}
        aria-label={bookmarked ? "저장 해제" : "공고 저장"}
        aria-pressed={bookmarked}
        className={`rounded-full border p-2 shadow-sm transition ${
          bookmarked
            ? "border-accent-border bg-accent-subtle text-accent hover:bg-accent-subtle"
            : "border-border bg-surface text-muted-foreground hover:border-accent-border hover:text-accent"
        }`}
      >
        <BookmarkIcon filled={bookmarked} />
      </button>
    );
  }

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        aria-busy={pending}
        onClick={onToggle}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition ${
          bookmarked
            ? "border border-accent-border bg-accent-subtle text-accent hover:bg-accent-subtle"
            : "border border-border bg-surface text-foreground hover:border-accent-border hover:text-accent"
        }`}
        aria-pressed={bookmarked}
      >
        {bookmarked ? "저장됨" : "공고 저장"}
      </button>
      {error ? <p className="text-xs text-accent">{error}</p> : null}
    </div>
  );
}
