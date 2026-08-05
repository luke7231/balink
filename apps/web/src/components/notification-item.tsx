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
}: {
  id: string;
  type: string;
  title: string;
  body: string;
  href: string | null;
  createdAt: Date | string;
  unread: boolean;
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
      className={`block rounded-3xl border px-4 py-4 shadow-sm transition hover:border-rose-200 ${
        unread ? "border-rose-100 bg-rose-50/40" : "border-zinc-200 bg-white"
      }`}
    >
      <div className="flex items-start justify-between gap-3">
        <div className="min-w-0">
          <div className="flex items-center gap-2">
            <span className="rounded-full bg-zinc-900 px-2 py-0.5 text-[10px] font-semibold text-white">
              {notificationTypeLabel(type)}
            </span>
            {unread ? (
              <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-label="읽지 않음" />
            ) : null}
          </div>
          <p className="mt-2 text-sm font-semibold text-zinc-900">{title}</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-600">{body}</p>
        </div>
        <time className="shrink-0 text-xs text-zinc-400">{formatNotificationTime(createdAt)}</time>
      </div>
    </Link>
  );
}
