"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useEffect, useState, useTransition } from "react";
import {
  MAX_NOTIFICATION_RULES,
  defaultNotificationRule,
  formatNotificationRuleTitle,
  isBlankNotificationPreference,
  type NotificationPreference,
  type NotificationRule,
} from "@black-swan/domain";
import { Modal } from "@black-swan/ui/modal";
import { saveNotificationPreferenceAction } from "@/components/account-actions";

export function NotificationRulesOverview({
  preference: initialPreference,
}: {
  preference: NotificationPreference;
}) {
  const router = useRouter();
  const [preference, setPreference] = useState(initialPreference);
  const [deleteTarget, setDeleteTarget] = useState<NotificationRule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const blank = isBlankNotificationPreference(preference);
  const canAdd = preference.rules.length < MAX_NOTIFICATION_RULES;

  useEffect(() => {
    setPreference(initialPreference);
  }, [initialPreference]);

  function confirmDelete() {
    if (!deleteTarget) return;
    const prev = preference;
    const remaining = preference.rules.filter((rule) => rule.id !== deleteTarget.id);
    const next: NotificationPreference =
      remaining.length === 0
        ? {
            enabled: false,
            rules: [
              defaultNotificationRule({
                id: deleteTarget.id,
                enabled: false,
                jobType: "regular",
                sido: "",
                sigungu: "",
                days: [],
                timeSlots: [],
              }),
            ],
          }
        : {
            ...preference,
            enabled: true,
            rules: remaining,
          };

    setPreference(next);
    setDeleteTarget(null);
    setError(null);
    startTransition(async () => {
      const result = await saveNotificationPreferenceAction(next);
      if (!result.ok) {
        setPreference(prev);
        setError(result.error);
        return;
      }
      router.refresh();
    });
  }

  return (
    <section id="alert-rules" className="mb-6 scroll-mt-20" aria-label="알림 조건">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-zinc-900">알림 조건</h3>
        {!blank ? (
          <div className="flex shrink-0 items-center gap-3">
            <p className="flex items-center gap-2.5 text-[11px] text-zinc-500">
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-rose-500" aria-hidden />
                정규
              </span>
              <span className="inline-flex items-center gap-1">
                <span className="h-1.5 w-1.5 rounded-full bg-amber-500" aria-hidden />
                대강
              </span>
            </p>
            <Link
              href="/notifications/rules"
              className="text-xs font-semibold text-zinc-600 hover:text-zinc-900"
            >
              전체 보기
            </Link>
          </div>
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
              <div
                key={rule.id}
                className={`inline-flex h-10 shrink-0 items-center gap-1 rounded-full pl-3.5 pr-1.5 text-sm font-semibold whitespace-nowrap ${
                  on
                    ? rule.jobType === "substitute"
                      ? "bg-amber-50 text-amber-900 ring-1 ring-amber-100"
                      : "bg-rose-50 text-rose-800 ring-1 ring-rose-100"
                    : "border border-zinc-200 bg-zinc-50 text-zinc-400"
                }`}
              >
                <Link
                  href={`/notifications/settings?ruleId=${encodeURIComponent(rule.id)}`}
                  aria-label={`${rule.jobType === "substitute" ? "대강" : "정규"} · ${title}${on ? "" : " · 꺼짐"}`}
                  className="inline-flex items-center gap-1.5 py-1"
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
                <button
                  type="button"
                  disabled={pending}
                  aria-label={`${title} 삭제`}
                  onClick={() => setDeleteTarget(rule)}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition disabled:opacity-50 ${
                    on
                      ? "text-current/70 hover:bg-black/5 hover:text-current"
                      : "text-zinc-400 hover:bg-zinc-200/70 hover:text-zinc-600"
                  }`}
                >
                  <ChipCloseIcon />
                </button>
              </div>
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

      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}

      <Modal
        open={Boolean(deleteTarget)}
        title="조건 삭제"
        onClose={() => {
          if (!pending) setDeleteTarget(null);
        }}
        closeOnBackdrop={!pending}
        footer={
          <>
            <button
              type="button"
              disabled={pending}
              onClick={() => setDeleteTarget(null)}
              className="rounded-full border border-zinc-200 bg-white px-4 py-2 text-sm font-semibold text-zinc-700 hover:border-zinc-300 disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              disabled={pending}
              onClick={confirmDelete}
              className="rounded-full bg-rose-700 px-4 py-2 text-sm font-semibold text-white hover:bg-rose-800 disabled:opacity-50"
            >
              {pending ? "삭제 중..." : "삭제"}
            </button>
          </>
        }
      >
        {deleteTarget ? (
          <>
            <span className="font-semibold text-zinc-800">
              {formatNotificationRuleTitle(deleteTarget)}
            </span>
            조건을 삭제할까요? 삭제하면 이 조건으로는 더 이상 알림이 오지 않습니다.
          </>
        ) : null}
      </Modal>
    </section>
  );
}

function ChipCloseIcon() {
  return (
    <svg width="12" height="12" viewBox="0 0 12 12" fill="none" aria-hidden="true">
      <path
        d="M3 3l6 6M9 3L3 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
