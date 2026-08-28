"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  MAX_NOTIFICATION_RULES,
  allowedInterestRegionCount,
  defaultNotificationRule,
  formatNotificationRuleTitle,
  getNotificationRuleSummaryParts,
  isBlankNotificationPreference,
  uniqueInterestRegionCount,
  type NotificationPreference,
  type NotificationRule,
} from "@balink/domain";
import { Modal } from "@balink/ui/modal";
import { saveNotificationPreferenceAction } from "@/components/account-actions";
import { useSyncedNotificationPreference } from "@/lib/use-synced-notification-preference";
import {
  trackDeletedNotificationRule,
  trackUpdatedNotificationPreference,
} from "@/lib/amplitude-notification";
import { FormError } from "@/components/form-error";
import { ButtonPendingContent } from "@/components/pending-submit-button";
import { emptyCopy, notificationCopy } from "@/lib/ui-copy";

export function NotificationRulesList({
  initialPreference,
  regionUnlocked = false,
  regionReferred = false,
}: {
  initialPreference: NotificationPreference;
  regionUnlocked?: boolean;
  regionReferred?: boolean;
}) {
  const router = useRouter();
  const [preference, setPreference] = useSyncedNotificationPreference(initialPreference);
  const [deleteTarget, setDeleteTarget] = useState<NotificationRule | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const blank = isBlankNotificationPreference(preference);
  const canAdd = preference.rules.length < MAX_NOTIFICATION_RULES;
  const uniqueRegions = uniqueInterestRegionCount(preference.rules);
  const showRegionInvite =
    !regionUnlocked &&
    uniqueRegions >= allowedInterestRegionCount({ unlocked: false, referred: regionReferred });

  function savePreference(
    next: NotificationPreference,
    analytics:
      | { kind: "update"; updateKind: "master_toggle" | "rule_toggle"; ruleId?: string }
      | { kind: "delete"; rule: NotificationRule },
  ) {
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
      if (analytics.kind === "delete") {
        trackDeletedNotificationRule(next, analytics.rule);
      } else {
        trackUpdatedNotificationPreference(next, "notification_rules", {
          updateKind: analytics.updateKind,
          ruleId: analytics.ruleId,
        });
      }
      router.refresh();
    });
  }

  function toggleMaster(enabled: boolean) {
    savePreference({ ...preference, enabled }, { kind: "update", updateKind: "master_toggle" });
  }

  function toggleRule(ruleId: string, enabled: boolean) {
    savePreference(
      {
        ...preference,
        rules: preference.rules.map((rule) =>
          rule.id === ruleId ? { ...rule, enabled } : rule,
        ),
      },
      { kind: "update", updateKind: "rule_toggle", ruleId },
    );
  }

  function confirmDelete() {
    if (!deleteTarget) return;
    const deletedRule = deleteTarget;
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
    savePreference(next, { kind: "delete", rule: deletedRule });
  }

  return (
    <div className="space-y-3">
      <div className="mb-3 flex items-center justify-between gap-3">
        <h1 className="text-2xl font-semibold tracking-tight text-foreground">
          {notificationCopy.rulesTitle}
        </h1>
        <LabeledToggle
          checked={preference.enabled}
          disabled={pending || blank}
          onChange={toggleMaster}
          ariaLabel={notificationCopy.masterAria}
        />
      </div>

      {blank ? (
        <div className="rounded-3xl border border-border bg-surface px-6 py-12 text-center shadow-sm">
          <p className="text-sm font-medium text-foreground">
            {emptyCopy.notificationRules.title}
          </p>
          <p className="mt-2 text-sm text-muted-foreground">
            {emptyCopy.notificationRules.description}
          </p>
          <Link
            href="/notifications/settings?new=1"
            className="mt-5 inline-flex rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
          >
            {emptyCopy.notificationRules.cta}
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
                    matchingOn ? "border-border bg-surface" : "border-border bg-surface-muted"
                  }`}
                >
                  <div className="flex items-start justify-between gap-3">
                    <div className="min-w-0">
                      <div className="flex flex-wrap items-center gap-2">
                        <p className="text-sm font-semibold text-foreground">
                          {formatNotificationRuleTitle(rule)}
                        </p>
                        <span
                          className={`rounded-full px-2 py-0.5 text-[11px] font-semibold ${
                            rule.jobType === "substitute"
                              ? "bg-amber-50 text-amber-800"
                              : "bg-accent-subtle text-accent"
                          }`}
                        >
                          {rule.jobType === "substitute" ? "대강" : "정규 채용"}
                        </span>
                      </div>
                      <ul className="mt-2 space-y-1 text-sm text-muted-foreground">
                        {getNotificationRuleSummaryParts(rule).map((part) => (
                          <li key={part} className="flex gap-2 leading-snug">
                            <span className="text-muted-foreground" aria-hidden>
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
                        ariaLabel={`${formatNotificationRuleTitle(rule)} 알림 받기`}
                      />
                      <div className="flex items-center gap-1.5">
                        <Link
                          href={`/notifications/settings?ruleId=${encodeURIComponent(rule.id)}`}
                          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:border-accent-border hover:text-accent"
                        >
                          수정
                        </Link>
                        <button
                          type="button"
                          disabled={pending}
                          onClick={() => setDeleteTarget(rule)}
                          className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-muted-foreground hover:border-accent-border hover:text-accent disabled:opacity-50"
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
          className="flex w-full items-center justify-center rounded-2xl border border-dashed border-border px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-muted-foreground hover:text-foreground"
        >
          {notificationCopy.addButton}
        </Link>
      ) : null}

      {showRegionInvite ? (
        <Link
          href={regionReferred ? "/account/invite" : "/signup/invite-code?from=limit"}
          className="block rounded-2xl bg-surface-muted px-4 py-3 text-sm leading-relaxed text-muted-foreground hover:text-foreground"
        >
          {regionReferred
            ? "관심지역은 두 곳까지입니다. 친구 한 명을 초대하면 무제한으로 열립니다."
            : "관심지역은 한 곳까지입니다. 코드를 넣으면 하나 더, 친구 한 명을 초대하면 무제한이에요."}
        </Link>
      ) : null}

      {!blank && !canAdd ? (
        <p className="text-center text-xs text-muted-foreground">
          관심지역은 최대 {MAX_NOTIFICATION_RULES}개까지 둘 수 있어요.
        </p>
      ) : null}

      {error ? <FormError>{error}</FormError> : null}

      <Modal
        open={Boolean(deleteTarget)}
        title={notificationCopy.deleteTitle}
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
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:border-border disabled:opacity-50"
            >
              취소
            </button>
            <button
              type="button"
              disabled={pending}
              aria-busy={pending || undefined}
              onClick={confirmDelete}
              className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-50"
            >
              <ButtonPendingContent pending={pending} pendingLabel="삭제 중...">
                삭제
              </ButtonPendingContent>
            </button>
          </>
        }
      >
        {deleteTarget ? (
          <>
            <span className="font-semibold text-foreground">
              {formatNotificationRuleTitle(deleteTarget)}
            </span>
            {notificationCopy.deleteConfirm}
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
        checked ? "bg-foreground" : "bg-surface-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-5 w-5 rounded-full bg-surface shadow transition ${
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
        checked ? "bg-foreground" : "bg-surface-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 flex h-7 w-7 items-center justify-center rounded-full bg-surface text-[9px] font-bold tracking-wide shadow transition ${
          checked ? "translate-x-5 text-foreground" : "translate-x-0 text-muted-foreground"
        }`}
      >
        {checked ? "ON" : "OFF"}
      </span>
    </button>
  );
}
