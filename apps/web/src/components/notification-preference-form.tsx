"use client";

import { useRouter } from "next/navigation";
import { useMemo, useState, useTransition } from "react";
import {
  ALERT_DAYS,
  ALERT_TIME_SLOTS,
  MAX_NOTIFICATION_RULES,
  createNotificationRuleId,
  defaultNotificationRule,
  exceedsFreeInterestRegionLimit,
  formatNotificationRuleSummary,
  formatNotificationRuleTitle,
  getNotificationRuleSummaryParts,
  formatTimeSlot,
  uniqueInterestRegionCount,
  type AlertJobType,
  type NotificationPreference,
  type NotificationRule,
} from "@balink/domain";
import { saveNotificationPreferenceAction } from "@/components/account-actions";
import { BottomSheet } from "@/components/bottom-sheet";
import { RegionLimitSheet } from "@/components/region-limit-sheet";

type DistrictGroup = {
  sido: string;
  districts: readonly string[];
};

const WEEKDAY_PRESETS = [
  { id: "any", label: "상관없음", days: [] as string[] },
  { id: "weekday", label: "평일", days: ["월", "화", "수", "목", "금"] },
  { id: "weekend", label: "주말", days: ["토", "일"] },
] as const;

export function NotificationPreferenceForm({
  initialPreference,
  districtGroups,
  editRuleId,
  redirectOnSave = "/notifications",
  regionUnlocked = false,
  regionReferred = false,
}: {
  initialPreference: NotificationPreference;
  districtGroups: DistrictGroup[];
  /** 지정하면 해당 규칙만 수정하는 단건 모드 */
  editRuleId?: string;
  redirectOnSave?: string;
  regionUnlocked?: boolean;
  regionReferred?: boolean;
}) {
  const router = useRouter();
  const [preference, setPreference] = useState(initialPreference);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [limitOpen, setLimitOpen] = useState(false);
  const [pending, startTransition] = useTransition();
  const singleMode = Boolean(editRuleId);

  const visibleRules = useMemo(() => {
    if (!editRuleId) return preference.rules;
    return preference.rules.filter((rule) => rule.id === editRuleId);
  }, [editRuleId, preference.rules]);

  const summary = useMemo(() => buildSummary(preference), [preference]);
  const editingRule = visibleRules[0] ?? null;
  const editingIndex = editingRule
    ? preference.rules.findIndex((rule) => rule.id === editingRule.id)
    : -1;

  function wouldExceedRegionLimit(nextPreference: NotificationPreference) {
    return exceedsFreeInterestRegionLimit({
      unlocked: regionUnlocked,
      referred: regionReferred,
      currentUniqueCount: uniqueInterestRegionCount(preference.rules),
      nextUniqueCount: uniqueInterestRegionCount(nextPreference.rules),
    });
  }

  function updateRule(ruleId: string, next: NotificationRule) {
    const nextPreference = {
      ...preference,
      rules: preference.rules.map((rule) => (rule.id === ruleId ? next : rule)),
    };
    if (wouldExceedRegionLimit(nextPreference)) {
      setLimitOpen(true);
      return;
    }
    setPreference(nextPreference);
  }

  function addRule() {
    if (preference.rules.length >= MAX_NOTIFICATION_RULES) return;
    const last = preference.rules[preference.rules.length - 1];
    setPreference((prev) => ({
      ...prev,
      rules: [
        ...prev.rules,
        defaultNotificationRule({
          id: createNotificationRuleId(),
          jobType: last?.jobType ?? "regular",
          sido: "",
          sigungu: "",
        }),
      ],
    }));
  }

  function removeRule(ruleId: string) {
    setPreference((prev) => {
      if (prev.rules.length <= 1) {
        return {
          ...prev,
          rules: [
            defaultNotificationRule({
              id: prev.rules[0]?.id ?? "default_0",
              enabled: true,
              jobType: "regular",
              sido: "",
              sigungu: "",
              days: [],
              timeSlots: [],
            }),
          ],
        };
      }
      return {
        ...prev,
        rules: prev.rules.filter((rule) => rule.id !== ruleId),
      };
    });
  }

  function save(nextPreference: NotificationPreference, options?: { redirect?: boolean }) {
    setMessage(null);
    setError(null);
    startTransition(async () => {
      const result = await saveNotificationPreferenceAction(nextPreference);
      if (!result.ok) {
        setError(result.error);
        if (result.code === "REGION_LIMIT") setLimitOpen(true);
        return;
      }
      setPreference(nextPreference);
      if (options?.redirect !== false && singleMode) {
        router.push(redirectOnSave);
        router.refresh();
        return;
      }
      setMessage("저장했습니다.");
    });
  }

  if (singleMode && !editingRule) {
    return (
      <div className="rounded-2xl border border-border bg-surface px-4 py-8 text-center">
        <p className="text-sm text-muted-foreground">수정할 조건을 찾을 수 없습니다.</p>
        <button
          type="button"
          onClick={() => router.push(redirectOnSave)}
          className="mt-4 text-sm font-semibold text-foreground underline"
        >
          알림으로 돌아가기
        </button>
      </div>
    );
  }

  return (
    <div className="space-y-5">
      <div className="space-y-4">
        {!singleMode ? (
          <div>
            <h2 className="text-base font-semibold text-foreground">알림 규칙</h2>
            <p className="mt-1 text-xs text-muted-foreground">
              규칙마다 지역·정규/대강·요일·시간대를 따로 정합니다. 하나라도 맞으면 알림이 옵니다.
            </p>
          </div>
        ) : null}

        {visibleRules.map((rule) => (
          <RuleCard
            key={rule.id}
            index={editingIndex >= 0 ? editingIndex : preference.rules.indexOf(rule)}
            rule={rule}
            districtGroups={districtGroups}
            canRemove={preference.rules.length > 1}
            hideHeader={singleMode}
            onChange={(next) => updateRule(rule.id, next)}
            onRemove={() => {
              if (singleMode) {
                const next =
                  preference.rules.length <= 1
                    ? {
                        ...preference,
                        enabled: false,
                        rules: [
                          defaultNotificationRule({
                            id: rule.id,
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
                        rules: preference.rules.filter((item) => item.id !== rule.id),
                      };
                save(next);
                return;
              }
              removeRule(rule.id);
            }}
          />
        ))}

        {!singleMode && preference.rules.length < MAX_NOTIFICATION_RULES ? (
          <button
            type="button"
            onClick={addRule}
            className="w-full rounded-2xl border border-dashed border-border px-4 py-3 text-sm font-semibold text-muted-foreground hover:border-muted-foreground hover:text-foreground"
          >
            + 규칙 추가
          </button>
        ) : null}

        {!singleMode && preference.rules.length >= MAX_NOTIFICATION_RULES ? (
          <p className="text-center text-xs text-muted-foreground">
            규칙은 최대 {MAX_NOTIFICATION_RULES}개까지 둘 수 있습니다.
          </p>
        ) : null}

        {!singleMode ? (
          <div className="rounded-2xl border border-accent-border bg-accent-subtle/50 px-4 py-3">
            <p className="text-xs font-semibold text-accent">이렇게 알림이 옵니다</p>
            <p className="mt-1 whitespace-pre-line text-sm leading-relaxed text-foreground">
              {summary}
            </p>
          </div>
        ) : editingRule ? (
          <div className="rounded-2xl border border-accent-border bg-accent-subtle/50 px-4 py-3">
            <p className="text-xs font-semibold text-accent">미리보기</p>
            <ul className="mt-2 space-y-1 text-sm text-foreground">
              {getNotificationRuleSummaryParts(editingRule).map((part) => (
                <li key={part} className="flex gap-2 leading-snug">
                  <span className="text-muted-foreground" aria-hidden>
                    ·
                  </span>
                  <span>{part}</span>
                </li>
              ))}
            </ul>
          </div>
        ) : null}
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => save({ ...preference, enabled: true })}
          className="rounded-full bg-foreground px-5 py-2.5 text-sm font-semibold text-background hover:opacity-90 disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장하기"}
        </button>
        {singleMode ? (
          <button
            type="button"
            disabled={pending}
            onClick={() => router.push(redirectOnSave)}
            className="rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:border-border"
          >
            취소
          </button>
        ) : null}
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-accent">{error}</p> : null}
      </div>

      <RegionLimitSheet
        open={limitOpen}
        referred={regionReferred}
        onClose={() => setLimitOpen(false)}
      />
    </div>
  );
}

function RuleCard({
  index,
  rule,
  districtGroups,
  canRemove,
  hideHeader,
  onChange,
  onRemove,
}: {
  index: number;
  rule: NotificationRule;
  districtGroups: DistrictGroup[];
  canRemove: boolean;
  hideHeader?: boolean;
  onChange: (next: NotificationRule) => void;
  onRemove: () => void;
}) {
  const anyDay = rule.days.length === 0;
  const districts =
    districtGroups.find((group) => group.sido === rule.sido)?.districts ?? [];

  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        rule.enabled ? "border-border bg-surface shadow-sm" : "border-border bg-surface-muted opacity-70"
      }`}
    >
      {!hideHeader ? (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">
            {formatNotificationRuleTitle(rule)}
          </p>
          <div className="flex items-center gap-2">
            {canRemove ? (
              <button
                type="button"
                onClick={onRemove}
                className="text-xs font-medium text-muted-foreground hover:text-accent"
              >
                삭제
              </button>
            ) : null}
            <Toggle checked={rule.enabled} onChange={(enabled) => onChange({ ...rule, enabled })} />
          </div>
        </div>
      ) : (
        <div className="flex items-center justify-between gap-3">
          <p className="text-sm font-semibold text-foreground">
            {formatNotificationRuleTitle(rule)}
          </p>
          <div className="flex items-center gap-2">
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-medium text-muted-foreground hover:text-accent"
            >
              삭제
            </button>
            <Toggle checked={rule.enabled} onChange={(enabled) => onChange({ ...rule, enabled })} />
          </div>
        </div>
      )}

      <div className={`mt-4 space-y-5 ${rule.enabled ? "" : "pointer-events-none opacity-45"}`}>
        <section>
          <h3 className="text-sm font-semibold text-foreground">유형</h3>
          <div className="mt-2 flex rounded-2xl border border-border bg-surface-muted p-1">
            {(
              [
                { key: "regular" as AlertJobType, label: "정규 채용" },
                { key: "substitute" as AlertJobType, label: "대강" },
              ] as const
            ).map((item) => {
              const selected = rule.jobType === item.key;
              return (
                <button
                  key={item.key}
                  type="button"
                  onClick={() => onChange({ ...rule, jobType: item.key })}
                  className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                    selected
                      ? "bg-surface text-foreground shadow-sm"
                      : "text-muted-foreground hover:text-foreground"
                  }`}
                >
                  {item.label}
                </button>
              );
            })}
          </div>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground">지역</h3>
          <div className="mt-2 grid gap-2 sm:grid-cols-2">
            <SheetSelect
              label="시·도"
              value={rule.sido}
              placeholder="시·도 선택"
              options={districtGroups.map((group) => ({
                value: group.sido,
                label: group.sido,
              }))}
              onChange={(sido) => onChange({ ...rule, sido, sigungu: "" })}
            />
            <SheetSelect
              label="시·군·구"
              value={rule.sigungu}
              placeholder="시·군·구 선택"
              disabled={!rule.sido}
              options={districts.map((sigungu) => ({
                value: sigungu,
                label: sigungu,
              }))}
              onChange={(sigungu) => onChange({ ...rule, sigungu })}
            />
          </div>
          {!rule.sido || !rule.sigungu ? (
            <p className="mt-2 text-xs text-accent">지역을 선택해야 이 규칙으로 알림이 갑니다.</p>
          ) : null}
        </section>

        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-foreground">요일</h3>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_PRESETS.map((preset) => {
                const selected =
                  preset.days.length === 0
                    ? anyDay
                    : preset.days.length === rule.days.length &&
                      preset.days.every((day) => rule.days.includes(day));
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChange({ ...rule, days: [...preset.days] })}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      selected
                        ? "bg-foreground text-background"
                        : "border border-border bg-surface text-muted-foreground hover:border-border"
                    }`}
                  >
                    {preset.label}
                  </button>
                );
              })}
            </div>
          </div>

          <div className="mt-3 grid grid-cols-7 gap-1.5">
            {ALERT_DAYS.map((day) => {
              const selected = rule.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    if (anyDay) {
                      onChange({ ...rule, days: [day] });
                      return;
                    }
                    const days = selected
                      ? rule.days.filter((item) => item !== day)
                      : [...rule.days, day];
                    onChange({ ...rule, days });
                  }}
                  className={`rounded-xl py-2.5 text-sm font-semibold ${
                    selected
                      ? "bg-foreground text-background"
                      : anyDay
                        ? "border border-border bg-surface text-muted-foreground"
                        : "border border-border bg-surface text-muted-foreground"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {anyDay
              ? "요일 상관없이 알림이 옵니다."
              : "선택한 요일이 모두 들어 있는 공고만 맞습니다."}
          </p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-foreground">시간대</h3>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => onChange({ ...rule, timeSlots: [] })}
              className={`w-full rounded-2xl px-3 py-3 text-sm font-semibold ${
                rule.timeSlots.length === 0
                  ? "bg-foreground text-background"
                  : "border border-border bg-surface text-muted-foreground hover:border-border"
              }`}
            >
              상관없음
            </button>
            <div className="grid grid-cols-3 gap-2">
              {ALERT_TIME_SLOTS.map((slot) => {
                const anyTime = rule.timeSlots.length === 0;
                const selected = rule.timeSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      if (anyTime) {
                        onChange({ ...rule, timeSlots: [slot] });
                        return;
                      }
                      if (selected) {
                        onChange({
                          ...rule,
                          timeSlots: rule.timeSlots.filter((item) => item !== slot),
                        });
                        return;
                      }
                      onChange({ ...rule, timeSlots: [...rule.timeSlots, slot] });
                    }}
                    className={`rounded-2xl px-2 py-3 text-sm font-semibold ${
                      selected
                        ? "bg-foreground text-background"
                        : anyTime
                          ? "border border-border bg-surface text-muted-foreground"
                          : "border border-border bg-surface text-muted-foreground"
                    }`}
                  >
                    {formatTimeSlot(slot)}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-2 text-xs text-muted-foreground">
            {rule.timeSlots.length === 0
              ? "시간대 상관없이 알림이 옵니다. 오전·오후·저녁과는 함께 고를 수 없습니다."
              : "선택한 시간대 중 하나라도 겹치면 알림이 옵니다."}
          </p>
        </section>
      </div>
    </div>
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
      className={`relative h-7 w-12 shrink-0 rounded-full transition disabled:opacity-50 ${
        checked ? "bg-foreground" : "bg-surface-muted"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-surface shadow transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function SheetSelect({
  label,
  value,
  placeholder,
  options,
  disabled,
  onChange,
}: {
  label: string;
  value: string;
  placeholder: string;
  options: Array<{ value: string; label: string }>;
  disabled?: boolean;
  onChange: (value: string) => void;
}) {
  const [open, setOpen] = useState(false);
  const selectedLabel = options.find((option) => option.value === value)?.label;

  return (
    <>
      <button
        type="button"
        disabled={disabled}
        onClick={() => setOpen(true)}
        aria-haspopup="dialog"
        aria-expanded={open}
        aria-label={label}
        className="flex w-full items-center justify-between gap-2 rounded-xl border border-border bg-surface px-3 py-2.5 text-left text-sm transition hover:bg-surface-muted disabled:pointer-events-none disabled:opacity-50"
      >
        <span className={selectedLabel ? "font-medium text-foreground" : "text-muted-foreground"}>
          {selectedLabel ?? placeholder}
        </span>
        <SheetChevronIcon />
      </button>

      <BottomSheet open={open} title={label} onClose={() => setOpen(false)}>
        <div className="space-y-2" role="radiogroup" aria-label={label}>
          {options.map((option) => {
            const selected = option.value === value;
            return (
              <button
                key={option.value}
                type="button"
                role="radio"
                aria-checked={selected}
                onClick={() => {
                  onChange(option.value);
                  setOpen(false);
                }}
                className={`flex w-full items-center justify-between rounded-2xl px-4 py-3.5 text-left text-sm font-semibold transition ${
                  selected
                    ? "bg-accent-subtle text-accent"
                    : "border border-border text-foreground hover:bg-surface-muted"
                }`}
              >
                <span>{option.label}</span>
                {selected ? <SheetCheckIcon /> : null}
              </button>
            );
          })}
        </div>
      </BottomSheet>
    </>
  );
}

function SheetChevronIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-3.5 w-3.5 shrink-0 text-muted-foreground" fill="none" aria-hidden="true">
      <path
        d="M4 6l4 4 4-4"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function SheetCheckIcon() {
  return (
    <svg viewBox="0 0 16 16" className="h-4 w-4 shrink-0" fill="none" aria-hidden="true">
      <path
        d="M3.5 8.5l3 3 6-6"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function buildSummary(preference: NotificationPreference): string {
  const enabledRules = preference.rules.filter((rule) => rule.enabled);
  if (enabledRules.length === 0) return "켜져 있는 규칙이 없습니다.";

  const incomplete = enabledRules.filter((rule) => !rule.sido || !rule.sigungu);
  if (incomplete.length === enabledRules.length) {
    return "지역이 선택된 규칙이 없습니다. 각 규칙에서 지역을 골라 주세요.";
  }

  return enabledRules
    .map((rule, index) => `${index + 1}. ${formatNotificationRuleSummary(rule)}`)
    .join("\n");
}
