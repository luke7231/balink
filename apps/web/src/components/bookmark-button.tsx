"use client";

import { useEffect, useState, useTransition } from "react";
import Link from "next/link";
import {
  toggleJobBookmarkAction,
  toggleSubstituteBookmarkAction,
} from "@/components/bookmark-actions";
import { FormError } from "@/components/form-error";
import { notifyWebViewSync } from "@/lib/native-shell";

function BookmarkIcon({ filled, className = "h-5 w-5" }: { filled: boolean; className?: string }) {
  if (filled) {
    return (
      <svg viewBox="0 0 24 24" className={className} aria-hidden="true">
        <path
          fill="currentColor"
          d="M6 3.75A2.25 2.25 0 0 1 8.25 1.5h7.5A2.25 2.25 0 0 1 18 3.75v18.19a.75.75 0 0 1-1.2.6L12 18.75l-4.8 3.79a.75.75 0 0 1-1.2-.6V3.75Z"
        />
      </svg>
    );
  }

  return (
    <svg viewBox="0 0 24 24" className={className} fill="none" aria-hidden="true">
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

const barIconClass =
  "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition";

type BookmarkKind = "job" | "substitute";

export function BookmarkButton({
  jobPostId,
  substitutePostId,
  initialBookmarked,
  variant = "label",
  loginHref,
}: {
  jobPostId?: string;
  substitutePostId?: string;
  initialBookmarked?: boolean;
  variant?: "label" | "icon" | "bar";
  /** 비로그인 시 이동할 경로 (bar/icon). 타깃 id 없이 로그인 유도만 할 때. */
  loginHref?: string;
}) {
  const kind: BookmarkKind | null = jobPostId
    ? "job"
    : substitutePostId
      ? "substitute"
      : null;
  const targetId = jobPostId ?? substitutePostId;
  const saveLabel = kind === "substitute" ? "대강 저장" : "공고 저장";
  const savedLabel = "저장됨";

  const [bookmarked, setBookmarked] = useState(initialBookmarked ?? false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  useEffect(() => {
    setBookmarked(initialBookmarked ?? false);
  }, [initialBookmarked, targetId]);

  if ((variant === "icon" || variant === "bar") && loginHref && !targetId) {
    return (
      <Link
        href={loginHref}
        aria-label="로그인 후 저장"
        className={
          variant === "bar"
            ? `${barIconClass} border-border bg-surface text-muted-foreground hover:border-accent-border hover:text-foreground`
            : "rounded-full border border-border bg-surface p-2 text-muted-foreground shadow-sm hover:border-accent-border hover:text-accent"
        }
      >
        <BookmarkIcon filled={false} />
      </Link>
    );
  }

  if (!kind || !targetId) return null;

  function onToggle() {
    const previous = bookmarked;
    const next = !previous;
    setError(null);
    setBookmarked(next);
    window.balinkHaptics?.play(next ? "success" : "selection");

    startTransition(async () => {
      const result =
        kind === "substitute"
          ? await toggleSubstituteBookmarkAction(targetId!)
          : await toggleJobBookmarkAction(targetId!);
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

  if (variant === "icon" || variant === "bar") {
    return (
      <button
        type="button"
        aria-busy={pending}
        onClick={(event) => {
          event.preventDefault();
          event.stopPropagation();
          onToggle();
        }}
        aria-label={bookmarked ? "저장 해제" : saveLabel}
        aria-pressed={bookmarked}
        className={
          variant === "bar"
            ? `${barIconClass} ${
                bookmarked
                  ? "border-accent-border bg-accent-subtle text-accent"
                  : "border-border bg-surface text-muted-foreground hover:border-accent-border hover:text-foreground"
              }`
            : `rounded-full border p-2 shadow-sm transition ${
                bookmarked
                  ? "border-accent-border bg-accent-subtle text-accent hover:bg-accent-subtle"
                  : "border-border bg-surface text-muted-foreground hover:border-accent-border hover:text-accent"
              }`
        }
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
        {bookmarked ? savedLabel : saveLabel}
      </button>
      {error ? <FormError className="text-xs text-accent">{error}</FormError> : null}
    </div>
  );
}
