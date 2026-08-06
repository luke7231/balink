"use client";

import Link from "next/link";
import {
  MAX_NOTIFICATION_RULES,
  formatNotificationRuleTitle,
  isBlankNotificationPreference,
  type NotificationPreference,
} from "@black-swan/domain";

export function NotificationRulesOverview({
  preference,
}: {
  preference: NotificationPreference;
}) {
  const blank = isBlankNotificationPreference(preference);
  const canAdd = preference.rules.length < MAX_NOTIFICATION_RULES;

  return (
    <section id="alert-rules" className="mb-6 scroll-mt-20" aria-label="알림 조건">
      <div className="mb-3 flex items-end justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-900">알림 조건</h3>
        {!blank ? (
          <Link
            href="/notifications/rules"
            className="shrink-0 text-xs font-semibold text-zinc-600 hover:text-zinc-900"
          >
            전체 보기
          </Link>
        ) : null}
      </div>

      {blank ? (
        <div className="rounded-2xl border border-dashed border-zinc-300 bg-white px-4 py-5 text-center">
          <p className="text-sm text-zinc-600">아직 알림 조건이 없습니다</p>
          <Link
            href="/notifications/settings?new=1"
            className="mt-3 inline-flex rounded-full bg-zinc-900 px-4 py-2 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            조건 설정하기
          </Link>
        </div>
      ) : (
        <div className="-mx-4 flex gap-2 overflow-x-auto px-4 pb-1 scrollbar-none">
          {preference.rules.map((rule) => {
            const on = preference.enabled && rule.enabled;
            const title = formatNotificationRuleTitle(rule);
            return (
              <Link
                key={rule.id}
                href={`/notifications/settings?ruleId=${encodeURIComponent(rule.id)}`}
                className={`inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full px-3.5 text-sm font-semibold whitespace-nowrap transition ${
                  on
                    ? rule.jobType === "substitute"
                      ? "bg-amber-50 text-amber-900 ring-1 ring-amber-100"
                      : "bg-rose-50 text-rose-800 ring-1 ring-rose-100"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-400"
                }`}
              >
                <span
                  className={`h-1.5 w-1.5 rounded-full ${
                    on
                      ? rule.jobType === "substitute"
                        ? "bg-amber-500"
                        : "bg-rose-500"
                      : "bg-zinc-300"
                  }`}
                  aria-hidden
                />
                {title}
                {!on ? <span className="text-[11px] font-medium">꺼짐</span> : null}
              </Link>
            );
          })}
          {canAdd ? (
            <Link
              href="/notifications/settings?new=1"
              className="inline-flex h-10 shrink-0 items-center rounded-full border border-dashed border-zinc-300 bg-white px-3.5 text-sm font-semibold text-zinc-500 hover:border-zinc-400 hover:text-zinc-800"
            >
              + 조건
            </Link>
          ) : null}
        </div>
      )}
    </section>
  );
}
