"use client";

import Link from "next/link";
import { useTransition } from "react";
import { markNotificationReadAction } from "@/components/notification-actions";
import { formatNotificationTime, notificationTypeLabel } from "@/lib/notification-format";

export function NotificationItem({
  id,
  type,
  title,
  body,
  href,
  createdAt,
  unread,
  index = 0,
}: {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: Date | string;
  unread: boolean;
  index?: number;
}) {
  const [, startTransition] = useTransition();
  const target = href || "/notifications";

  return (
    <Link
      href={target}
      onClick={() => {
        if (!unread) return;
        startTransition(async () => {
          await markNotificationReadAction(id);
        });
      }}
      style={{ ["--motion-index" as string]: Math.min(index, 10) }}
      className={`motion-fade-up block rounded-3xl border px-4 py-4 shadow-sm transition hover:border-accent-border ${
        unread ? "border-accent-border bg-accent-subtle/60" : "border-border bg-surface"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-foreground px-2 py-0.5 text-[10px] font-semibold text-background">
              {notificationTypeLabel(type)}
            </span>
            {unread ? (
              <span className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent" aria-label="읽지 않음" />
            ) : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-foreground">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-muted-foreground">{body}</p>
        </div>
        <time className="shrink-0 text-xs text-muted-foreground">{formatNotificationTime(createdAt)}</time>
      </div>
    </Link>
  );
}
