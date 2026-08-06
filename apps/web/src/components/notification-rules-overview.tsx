"use client";

import Link from "next/link";
import { useState, useTransition } from "react";
import {
  MAX_NOTIFICATION_RULES,
  formatNotificationRuleSummary,
  formatNotificationRuleTitle,
  isBlankNotificationPreference,
  type NotificationPreference,
} from "@black-swan/domain";
import { saveNotificationPreferenceAction } from "@/components/account-actions";

export function NotificationRulesOverview({
  initialPreference,
}: {
  initialPreference: NotificationPreference;
}) {
  const [preference, setPreference] = useState(initialPreference);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const blank = isBlankNotificationPreference(preference);
  const canAdd = preference.rules.length < MAX_NOTIFICATION_RULES;

  function toggleMaster(enabled: boolean) {
    const next = { ...preference, enabled };
    setPreference(next);
    setError(null);
    startTransition(async () => {
      const result = await saveNotificationPreferenceAction(next);
      if (!result.ok) {
        setPreference(preference);
        setError(result.error);
      }
    });
  }

  return (
    <section id="alert-rules" className="scroll-mt-20 md:mb-0">
      <div className="mb-3 flex flex-wrap items-end justify-between gap-3">
        <div>
          <h3 className="text-base font-semibold text-zinc-900">알림 조건</h3>
          <p className="mt-0.5 text-xs text-zinc-500">
            조건을 먼저 확인한 뒤, 각각 수정할 수 있습니다.
          </p>
        </div>
        <label className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-3 py-1.5 shadow-sm">
          <span className="text-xs font-medium text-zinc-600">알림 받기</span>
          <Toggle
            checked={preference.enabled}
            disabled={pending || blank}
            onChange={toggleMaster}
          />
        </label>
      </div>

      {blank ? (
        <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-10 text-center shadow-sm">
          <p className="text-sm font-medium text-zinc-800">아직 알림 조건이 없습니다</p>
          <p className="mt-2 text-sm text-zinc-500">
            지역·유형·요일·시간대를 설정해 두면, 맞는 공고가 올라올 때 알림함으로 옵니다.
          </p>
          <Link
            href="/notifications/settings?new=1"
            className="mt-5 inline-flex rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            알림 조건 설정하기
          </Link>
        </div>
      ) : (
        <ul className="space-y-3">
          {preference.rules.map((rule) => (
            <li key={rule.id}>
              <div
                className={`rounded-2xl border px-4 py-4 shadow-sm ${
                  rule.enabled && preference.enabled
                    ? "border-zinc-200 bg-white"
                    : "border-zinc-200 bg-zinc-50"
                }`}
              >
                <div className="flex items-start justify-between gap-3">
                  <div className="min-w-0">
                    <div className="flex flex-wrap items-center gap-2">
                      <p className="text-sm font-semibold text-zinc-900">
                        {formatNotificationRuleTitle(rule)}
                      </p>
                      <span
                        className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                          rule.jobType === "substitute"
                            ? "bg-amber-50 text-amber-800"
                            : "bg-rose-50 text-rose-800"
                        }`}
                      >
                        {rule.jobType === "substitute" ? "대타" : "정규 채용"}
                      </span>
                      {!rule.enabled || !preference.enabled ? (
                        <span className="rounded-full bg-zinc-100 px-2 py-0.5 text-[11px] font-semibold text-zinc-500">
                          꺼짐
                        </span>
                      ) : null}
                    </div>
                    <p className="mt-1.5 text-sm leading-relaxed text-zinc-600">
                      {formatNotificationRuleSummary(rule)}
                    </p>
                  </div>
                  <Link
                    href={`/notifications/settings?ruleId=${encodeURIComponent(rule.id)}`}
                    className="shrink-0 rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-rose-200 hover:text-rose-700"
                  >
                    수정
                  </Link>
                </div>
              </div>
            </li>
          ))}
        </ul>
      )}

      {!blank && canAdd ? (
        <Link
          href="/notifications/settings?new=1"
          className="mt-3 flex w-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
        >
          + 조건 추가
        </Link>
      ) : null}

      {error ? <p className="mt-2 text-sm text-rose-700">{error}</p> : null}
    </section>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-6 w-10 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? "bg-zinc-900" : "bg-zinc-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-white shadow transition ${
          checked ? "translate-x-4" : "translate-x-0"
        }`}
      />
    </button>
  );
}
