"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  MAX_NOTIFICATION_RULES,
  defaultNotificationRule,
  formatNotificationRuleTitle,
  getNotificationRuleSummaryParts,
  isBlankNotificationPreference,
  type NotificationPreference,
  type NotificationRule,
} from "@black-swan/domain";
import { Modal } from "@black-swan/ui/modal";
import { saveNotificationPreferenceAction } from "@/components/account-actions";

export function NotificationRulesList({
  initialPreference,
}: {
  initialPreference: NotificationPreference;
}) {
  const router = useRouter();
  const [preference, setPreference] = useState(initialPreference);
  const [deleteTarget, setDeleteTarget] = useState<NotificationRule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const blank = isBlankNotificationPreference(preference);
  const canAdd = preference.rules.length < MAX_NOTIFICATION_RULES;

  function savePreference(next: NotificationPreference) {
    const prev = preference;
    setPreference(next);
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

  function toggleMaster(enabled: boolean) {
    savePreference({ ...preference, enabled });
  }

  function toggleRule(ruleId: string, enabled: boolean) {
    savePreference({
      ...preference,
      rules: preference.rules.map((rule) =>
        rule.id === ruleId ? { ...rule, enabled } : rule,
      ),
    });
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const remaining = preference.rules.filter((rule) => rule.id !== deleteTarget.id);
    const next: NotificationPreference =
      remaining.length === 0
        ? {
            enabled: preference.enabled,
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
            rules: remaining,
          };

    setDeleteTarget(null);
    savePreference(next);
  }

  return (
    <div className="space-y-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-zinc-900">알림 조건</h1>
        <LabeledToggle
          checked={preference.enabled}
          disabled={pending || blank}
          onChange={toggleMaster}
          ariaLabel="알림 받기"
        />
      </div>

      {blank ? (
        <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-medium text-zinc-800">아직 알림 조건이 없습니다</p>
          <p className="mt-2 text-sm text-zinc-500">
            지역·유형·요일·시간대를 설정해 두면, 맞는 공고가 올라올 때 알림함으로 옵니다.
          </p>
          <Link
            href="/notifications/settings?new=1"
            className="mt-5 inline-flex rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800"
          >
            조건 설정하기
          </Link>
        </div>
      ) : (
        <ul className={`space-y-3 ${preference.enabled ? "" : "opacity-55"}`}>
          {preference.rules.map((rule) => {
            const matchingOn = preference.enabled && rule.enabled;
            return (
              <li key={rule.id}>
                <div
                  className={`rounded-2xl border px-4 py-4 shadow-sm ${
                    matchingOn ? "border-zinc-200 bg-white" : "border-zinc-200 bg-zinc-50"
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
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-zinc-600">
                        {getNotificationRuleSummaryParts(rule).map((part) => (
                          <li key={part} className="flex gap-2 leading-snug">
                            <span className="text-zinc-400" aria-hidden>
                              ·
                            </span>
                            <span>{part}</span>
                          </li>
                        ))}
                      </ul>
                    </div>
                    <div className="flex shrink-0 flex-col items-end gap-2">
                      <Toggle
                        checked={rule.enabled}
                        disabled={pending}
                        onChange={(enabled) => toggleRule(rule.id, enabled)}
                        ariaLabel={`${formatNotificationRuleTitle(rule)} 조건 사용`}
                      />
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/notifications/settings?ruleId=${encodeURIComponent(rule.id)}`}
                          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-rose-200 hover:text-rose-700"
                        >
                          수정
                        </Link>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setDeleteTarget(rule)}
                          className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-500 hover:border-rose-200 hover:text-rose-700 disabled:opacity-50"
                        >
                          삭제
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              </li>
            );
          })}
        </ul>
      )}

      {!blank && canAdd ? (
        <Link
          href="/notifications/settings?new=1"
          className="flex w-full items-center justify-center rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
        >
          + 조건 추가
        </Link>
      ) : null}

      {!blank && !canAdd ? (
        <p className="text-center text-xs text-zinc-500">
          조건은 최대 {MAX_NOTIFICATION_RULES}개까지 둘 수 있습니다.
        </p>
      ) : null}

      {error ? <p className="text-sm text-rose-700">{error}</p> : null}

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
    </div>
  );
}

function Toggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? "알림 받기"}
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

/** 헤더용 — 썸에 ON/OFF 표기 */
function LabeledToggle({
  checked,
  onChange,
  disabled,
  ariaLabel,
}: {
  checked: boolean;
  onChange: (checked: boolean) => void;
  disabled?: boolean;
  ariaLabel?: string;
}) {
  return (
    <button
      type="button"
      role="switch"
      aria-checked={checked}
      aria-label={ariaLabel ?? "알림 받기"}
      disabled={disabled}
      onClick={() => onChange(!checked)}
      className={`relative h-8 w-13 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? "bg-zinc-900" : "bg-zinc-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-white text-[9px] font-bold tracking-wide shadow transition ${
          checked ? "translate-x-5 text-zinc-900" : "translate-x-0 text-zinc-500"
        }`}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}
