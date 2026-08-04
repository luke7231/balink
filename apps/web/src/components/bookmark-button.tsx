"use client";

import { useState, useTransition } from "react";
import { toggleJobBookmarkAction } from "@/components/bookmark-actions";

export function BookmarkButton({
  jobPostId,
  initialBookmarked,
}: {
  jobPostId: string;
  initialBookmarked: boolean;
}) {
  const [bookmarked, setBookmarked] = useState(initialBookmarked);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  return (
    <div className="flex flex-col items-end gap-1">
      <button
        type="button"
        disabled={pending}
        onClick={() => {
          setError(null);
          startTransition(async () => {
            const result = await toggleJobBookmarkAction(jobPostId);
            if (!result.ok) {
              setError(result.error);
              return;
            }
            setBookmarked(result.bookmarked);
          });
        }}
        className={`rounded-full px-4 py-2 text-sm font-semibold transition disabled:opacity-60 ${
          bookmarked
            ? "border border-rose-200 bg-rose-50 text-rose-800 hover:bg-rose-100"
            : "border border-zinc-200 bg-white text-zinc-700 hover:border-rose-200 hover:text-rose-700"
        }`}
        aria-pressed={bookmarked}
      >
        {bookmarked ? "저장됨" : "공고 저장"}
      </button>
      {error ? <p className="text-xs text-rose-700">{error}</p> : null}
    </div>
  );
}
