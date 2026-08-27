"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import { useState, useTransition } from "react";
import {
  MAX_NOTIFICATION_RULES,
  allowedInterestRegionCount,
  defaultNotificationRule,
  formatNotificationRuleTitle,
  isBlankNotificationPreference,
  uniqueInterestRegionCount,
  type NotificationPreference,
  type NotificationRule,
} from "@balink/domain";
import { Modal } from "@balink/ui/modal";
import { saveNotificationPreferenceAction } from "@/components/account-actions";
import { FormError } from "@/components/form-error";
import { ButtonPendingContent } from "@/components/pending-submit-button";
import { RegionLimitSheet } from "@/components/region-limit-sheet";
import { trackDeletedNotificationRule } from "@/lib/amplitude-notification";
import { useSyncedNotificationPreference } from "@/lib/use-synced-notification-preference";
import { emptyCopy, notificationCopy } from "@/lib/ui-copy";

const REGION_SLOT_PREVIEW = 5;

export function NotificationRulesOverview({
  preference: initialPreference,
  regionUnlocked = false,
  regionReferred = false,
}: {
  preference: NotificationPreference;
  regionUnlocked?: boolean;
  regionReferred?: boolean;
}) {
  const router = useRouter();
  const [preference, setPreference] =
    useSyncedNotificationPreference(initialPreference);
  const [deleteTarget, setDeleteTarget] = useState<NotificationRule | null>(
    null,
  );
  const [limitOpen, setLimitOpen] = useState(false);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();
  const blank = isBlankNotificationPreference(preference);
  const canAddRule = preference.rules.length < MAX_NOTIFICATION_RULES;
  const uniqueRegions = uniqueInterestRegionCount(preference.rules);
  const allowedRegions = allowedInterestRegionCount({
    unlocked: regionUnlocked,
    referred: regionReferred,
  });
  const canAddOpenSlot =
    canAddRule && (regionUnlocked || uniqueRegions < allowedRegions);
  const openChipCount = blank
    ? 1
    : preference.rules.length + (canAddOpenSlot ? 1 : 0);
  const lockedCount = regionUnlocked
    ? 0
    : Math.max(0, REGION_SLOT_PREVIEW - openChipCount);

  function confirmDelete() {
    if (!deleteTarget) return;
    const deletedRule = deleteTarget;
    const prev = preference;
    const remaining = preference.rules.filter(
      (rule) => rule.id !== deleteTarget.id,
    );
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
      trackDeletedNotificationRule(next, deletedRule);
      router.refresh();
    });
  }

  return (
    <section
      id="alert-rules"
      className="mb-6 scroll-mt-20"
      aria-label="알림 조건"
    >
      <div className="mb-3 flex items-center justify-between gap-3">
        <h3 className="text-base font-semibold text-foreground">알림 조건</h3>
        {!blank ? (
          <div className="flex shrink-0 items-center gap-3">
            <p className="flex items-center gap-2.5 text-[11px] text-muted-foreground">
              <span className="inline-flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-accent"
                  aria-hidden
                />
                정규
              </span>
              <span className="inline-flex items-center gap-1">
                <span
                  className="h-1.5 w-1.5 shrink-0 rounded-full bg-amber-500"
                  aria-hidden
                />
                대강
              </span>
            </p>
            <Link
              href="/notifications/rules"
              className="text-xs font-semibold text-muted-foreground hover:text-foreground"
            >
              전체 보기
            </Link>
          </div>
        ) : null}
      </div>

      {blank ? (
        <p className="mb-3 text-sm text-muted-foreground" role="status">
          {emptyCopy.notificationRules.inline}
        </p>
      ) : null}

      <div className="flex min-w-0 max-w-full gap-2 overflow-x-auto overscroll-x-contain py-1 scrollbar-none">
        {blank ? (
          <Link
            href="/notifications/settings?new=1&from=inbox"
            className="inline-flex h-10 shrink-0 items-center rounded-full border border-dashed border-border bg-surface px-3.5 text-sm font-semibold text-muted-foreground hover:border-muted-foreground hover:text-foreground"
          >
            + 조건
          </Link>
        ) : (
          preference.rules.map((rule) => {
            const on = preference.enabled && rule.enabled;
            const title = formatNotificationRuleTitle(rule);
            return (
              <div
                key={rule.id}
                className={`inline-flex h-10 shrink-0 items-center gap-1 rounded-full pl-3.5 pr-1.5 text-sm font-semibold whitespace-nowrap ${
                  on
                    ? rule.jobType === "substitute"
                      ? "bg-amber-50 text-amber-900 ring-1 ring-amber-100"
                      : "bg-accent-subtle text-accent ring-1 ring-accent-border"
                    : "border border-border bg-surface-muted text-muted-foreground"
                }`}
              >
                <Link
                  href={`/notifications/settings?ruleId=${encodeURIComponent(rule.id)}&from=inbox`}
                  aria-label={`${rule.jobType === "substitute" ? "대강" : "정규"} · ${title}${on ? "" : " · 꺼짐"}`}
                  className="inline-flex items-center gap-1.5 py-1"
                >
                  <span
                    className={`h-1.5 w-1.5 shrink-0 rounded-full ${
                      on
                        ? rule.jobType === "substitute"
                          ? "bg-amber-500"
                          : "bg-accent"
                        : "bg-muted-foreground/40"
                    }`}
                    aria-hidden
                  />
                  {title}
                  {!on ? (
                    <span className="text-[11px] font-medium">꺼짐</span>
                  ) : null}
                </Link>
                <button
                  type="button"
                  disabled={pending}
                  aria-label={`${title} 삭제`}
                  onClick={() => setDeleteTarget(rule)}
                  className={`inline-flex h-7 w-7 items-center justify-center rounded-full transition disabled:opacity-50 ${
                    on
                      ? "text-current/70 hover:bg-black/5 hover:text-current"
                      : "text-muted-foreground hover:bg-surface-muted/70 hover:text-muted-foreground"
                  }`}
                >
                  <ChipCloseIcon />
                </button>
              </div>
            );
          })
        )}
        {!blank && canAddOpenSlot ? (
          <Link
            href="/notifications/settings?new=1&from=inbox"
            className="inline-flex h-10 shrink-0 items-center rounded-full border border-dashed border-border bg-surface px-3.5 text-sm font-semibold text-muted-foreground hover:border-muted-foreground hover:text-foreground"
          >
            + 조건
          </Link>
        ) : null}
        {Array.from({ length: lockedCount }, (_, index) => (
          <button
            key={`locked-region-${index}`}
            type="button"
            onClick={() => setLimitOpen(true)}
            aria-label="관심지역 무제한 열기"
            className="inline-flex h-10 shrink-0 items-center gap-1.5 rounded-full bg-surface-muted px-3.5 text-sm font-semibold text-muted-foreground hover:bg-border"
          >
            <LockIcon />
            잠김
          </button>
        ))}
      </div>

      {error ? <FormError className="mt-2 text-sm text-accent">{error}</FormError> : null}

      <RegionLimitSheet
        open={limitOpen}
        referred={regionReferred}
        onClose={() => setLimitOpen(false)}
      />

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
    </section>
  );
}

function LockIcon() {
  return (
    <svg width="14" height="14" viewBox="0 0 14 14" fill="none" aria-hidden="true">
      <rect
        x="3"
        y="6.2"
        width="8"
        height="5.8"
        rx="1.6"
        stroke="currentColor"
        strokeWidth="1.4"
      />
      <path
        d="M4.7 6.2V4.6a2.3 2.3 0 0 1 4.6 0v1.6"
        stroke="currentColor"
        strokeWidth="1.4"
        strokeLinecap="round"
      />
    </svg>
  );
}

function ChipCloseIcon() {
  return (
    <svg
      width="12"
      height="12"
      viewBox="0 0 12 12"
      fill="none"
      aria-hidden="true"
    >
      <path
        d="M3 3l6 6M9 3L3 9"
        stroke="currentColor"
        strokeWidth="1.5"
        strokeLinecap="round"
      />
    </svg>
  );
}
