"use client";

import { useMemo, useState, useTransition } from "react";
import {
  ALERT_DAYS,
  ALERT_TIME_SLOTS,
  MAX_ALERT_CONDITIONS,
  createAlertConditionId,
  defaultAlertCondition,
  formatSidoForDisplay,
  formatTimeSlot,
  type AlertCondition,
  type JobTypeAlertPreference,
  type NotificationPreference,
} from "@black-swan/domain";
import { saveNotificationPreferenceAction } from "@/components/account-actions";
import type { InterestRegion } from "@/lib/interest-regions";

type TabKey = "regular" | "substitute";

const WEEKDAY_PRESETS = [
  { id: "any", label: "상관없음", days: [] as string[] },
  { id: "weekday", label: "평일", days: ["월", "화", "수", "목", "금"] },
  { id: "weekend", label: "주말", days: ["토", "일"] },
] as const;

export function NotificationPreferenceForm({
  initialPreference,
  interestRegions,
}: {
  initialPreference: NotificationPreference;
  interestRegions: InterestRegion[];
}) {
  const [preference, setPreference] = useState(initialPreference);
  const [tab, setTab] = useState<TabKey>("regular");
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  const active = preference[tab];

  const summary = useMemo(
    () => buildSummary(preference, interestRegions, tab),
    [preference, interestRegions, tab],
  );

  function updateActive(next: JobTypeAlertPreference) {
    setPreference((prev) => ({ ...prev, [tab]: next }));
  }

  function updateCondition(conditionId: string, next: AlertCondition) {
    updateActive({
      ...active,
      conditions: active.conditions.map((item) => (item.id === conditionId ? next : item)),
    });
  }

  function addCondition() {
    if (active.conditions.length >= MAX_ALERT_CONDITIONS) return;
    updateActive({
      ...active,
      conditions: [
        ...active.conditions,
        defaultAlertCondition({ id: createAlertConditionId() }),
      ],
    });
  }

  function removeCondition(conditionId: string) {
    if (active.conditions.length <= 1) {
      updateCondition(conditionId, {
        ...active.conditions[0]!,
        days: [],
        timeSlots: [],
        enabled: true,
      });
      return;
    }
    updateActive({
      ...active,
      conditions: active.conditions.filter((item) => item.id !== conditionId),
    });
  }

  return (
    <div className="space-y-5">
      <label className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-white px-4 py-3.5 shadow-sm">
        <div>
          <p className="text-sm font-semibold text-zinc-900">알림 받기</p>
          <p className="mt-0.5 text-xs text-zinc-500">꺼 두면 새 공고 알림이 오지 않습니다.</p>
        </div>
        <Toggle
          checked={preference.enabled}
          onChange={(enabled) => setPreference((prev) => ({ ...prev, enabled }))}
        />
      </label>

      <div
        className={`space-y-4 ${preference.enabled ? "" : "pointer-events-none opacity-45"}`}
      >
        <div className="flex rounded-2xl border border-zinc-200 bg-zinc-50 p-1">
          {(
            [
              { key: "regular", label: "정규 채용" },
              { key: "substitute", label: "대타" },
            ] as const
          ).map((item) => {
            const selected = tab === item.key;
            const on = preference[item.key].enabled;
            return (
              <button
                key={item.key}
                type="button"
                onClick={() => setTab(item.key)}
                className={`flex-1 rounded-xl px-3 py-2.5 text-sm font-semibold transition ${
                  selected
                    ? "bg-white text-zinc-900 shadow-sm"
                    : "text-zinc-500 hover:text-zinc-700"
                }`}
              >
                {item.label}
                {!on ? <span className="ml-1 text-xs font-medium text-zinc-400">꺼짐</span> : null}
              </button>
            );
          })}
        </div>

        <div className="space-y-5 border-t border-zinc-100 pt-5">
          <label className="flex items-center justify-between gap-3">
            <div>
              <p className="text-sm font-semibold text-zinc-900">
                {tab === "regular" ? "정규 채용 알림" : "대타 알림"}
              </p>
              <p className="mt-0.5 text-xs text-zinc-500">
                조건을 여러 개 두면, 그중 하나라도 맞는 공고를 알려 드립니다.
              </p>
            </div>
            <Toggle
              checked={active.enabled}
              disabled={!preference.enabled}
              onChange={(enabled) => updateActive({ ...active, enabled })}
            />
          </label>

          <div
            className={`space-y-4 ${active.enabled ? "" : "pointer-events-none opacity-45"}`}
          >
            {active.conditions.map((condition, index) => (
              <ConditionCard
                key={condition.id}
                index={index}
                condition={condition}
                canRemove={active.conditions.length > 1}
                onChange={(next) => updateCondition(condition.id, next)}
                onRemove={() => removeCondition(condition.id)}
              />
            ))}

            {active.conditions.length < MAX_ALERT_CONDITIONS ? (
              <button
                type="button"
                onClick={addCondition}
                className="w-full rounded-2xl border border-dashed border-zinc-300 px-4 py-3 text-sm font-semibold text-zinc-600 hover:border-zinc-400 hover:text-zinc-800"
              >
                + 조건 추가
              </button>
            ) : (
              <p className="text-center text-xs text-zinc-500">
                조건은 최대 {MAX_ALERT_CONDITIONS}개까지 둘 수 있습니다.
              </p>
            )}
          </div>
        </div>

        <div className="rounded-2xl border border-rose-100 bg-rose-50/50 px-4 py-3">
          <p className="text-xs font-semibold text-rose-800">이렇게 알림이 옵니다</p>
          <p className="mt-1 text-sm leading-relaxed text-zinc-800">{summary}</p>
        </div>
      </div>

      <div className="flex flex-wrap items-center gap-3">
        <button
          type="button"
          disabled={pending}
          onClick={() => {
            setMessage(null);
            setError(null);
            startTransition(async () => {
              const result = await saveNotificationPreferenceAction(preference);
              if (!result.ok) {
                setError(result.error);
                return;
              }
              setMessage("저장했습니다.");
            });
          }}
          className="rounded-full bg-zinc-900 px-5 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "저장 중..." : "저장하기"}
        </button>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    </div>
  );
}

function ConditionCard({
  index,
  condition,
  canRemove,
  onChange,
  onRemove,
}: {
  index: number;
  condition: AlertCondition;
  canRemove: boolean;
  onChange: (next: AlertCondition) => void;
  onRemove: () => void;
}) {
  const anyDaySelected = condition.days.length === 0;

  return (
    <div
      className={`rounded-2xl border px-4 py-4 ${
        condition.enabled ? "border-zinc-200 bg-zinc-50/70" : "border-zinc-200 bg-zinc-50 opacity-60"
      }`}
    >
      <div className="flex items-center justify-between gap-3">
        <p className="text-sm font-semibold text-zinc-900">조건 {index + 1}</p>
        <div className="flex items-center gap-2">
          {canRemove ? (
            <button
              type="button"
              onClick={onRemove}
              className="text-xs font-medium text-zinc-500 hover:text-rose-700"
            >
              삭제
            </button>
          ) : null}
          <Toggle
            checked={condition.enabled}
            onChange={(enabled) => onChange({ ...condition, enabled })}
          />
        </div>
      </div>

      <div
        className={`mt-4 space-y-5 ${condition.enabled ? "" : "pointer-events-none opacity-45"}`}
      >
        <section>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <h3 className="text-sm font-semibold text-zinc-900">요일</h3>
            <div className="flex flex-wrap gap-1.5">
              {WEEKDAY_PRESETS.map((preset) => {
                const selected =
                  preset.days.length === 0
                    ? anyDaySelected
                    : preset.days.length === condition.days.length &&
                      preset.days.every((day) => condition.days.includes(day));
                return (
                  <button
                    key={preset.id}
                    type="button"
                    onClick={() => onChange({ ...condition, days: [...preset.days] })}
                    className={`rounded-full px-2.5 py-1 text-xs font-semibold ${
                      selected
                        ? "bg-zinc-900 text-white"
                        : "border border-zinc-200 bg-white text-zinc-500 hover:border-zinc-300"
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
              const selected = condition.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  onClick={() => {
                    if (anyDaySelected) {
                      onChange({ ...condition, days: [day] });
                      return;
                    }
                    const days = selected
                      ? condition.days.filter((item) => item !== day)
                      : [...condition.days, day];
                    onChange({ ...condition, days });
                  }}
                  className={`rounded-xl py-2.5 text-sm font-semibold ${
                    selected
                      ? "bg-zinc-900 text-white"
                      : anyDaySelected
                        ? "border border-zinc-200 bg-white text-zinc-400"
                        : "border border-zinc-200 bg-white text-zinc-600"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>

          <p className="mt-2 text-xs text-zinc-500">
            {anyDaySelected
              ? "요일 상관없이 알림이 옵니다."
              : "선택한 요일이 모두 들어 있는 공고만 맞습니다. 다른 조합은 조건을 하나 더 만드세요."}
          </p>
        </section>

        <section>
          <h3 className="text-sm font-semibold text-zinc-900">시간대</h3>
          <div className="mt-3 space-y-2">
            <button
              type="button"
              onClick={() => onChange({ ...condition, timeSlots: [] })}
              className={`w-full rounded-2xl px-3 py-3 text-sm font-semibold ${
                condition.timeSlots.length === 0
                  ? "bg-zinc-900 text-white"
                  : "border border-zinc-200 bg-white text-zinc-600 hover:border-zinc-300"
              }`}
            >
              상관없음
            </button>
            <div className="grid grid-cols-3 gap-2">
              {ALERT_TIME_SLOTS.map((slot) => {
                const anyTime = condition.timeSlots.length === 0;
                const selected = condition.timeSlots.includes(slot);
                return (
                  <button
                    key={slot}
                    type="button"
                    onClick={() => {
                      if (anyTime) {
                        onChange({ ...condition, timeSlots: [slot] });
                        return;
                      }
                      if (selected) {
                        const timeSlots = condition.timeSlots.filter((item) => item !== slot);
                        // 마지막 시간대를 끄면 상관없음으로 돌아감
                        onChange({ ...condition, timeSlots });
                        return;
                      }
                      onChange({
                        ...condition,
                        timeSlots: [...condition.timeSlots, slot],
                      });
                    }}
                    className={`rounded-2xl px-2 py-3 text-sm font-semibold ${
                      selected
                        ? "bg-zinc-900 text-white"
                        : anyTime
                          ? "border border-zinc-200 bg-white text-zinc-400"
                          : "border border-zinc-200 bg-white text-zinc-600"
                    }`}
                  >
                    {formatTimeSlot(slot)}
                  </button>
                );
              })}
            </div>
          </div>
          <p className="mt-2 text-xs text-zinc-500">
            {condition.timeSlots.length === 0
              ? "시간대 상관없이 알림이 옵니다. 오전·오후·저녁과는 함께 고를 수 없습니다."
              : "선택한 시간대 중 하나라도 겹치면 알림이 옵니다. 상관없음을 고르면 이 선택이 해제됩니다."}
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
        checked ? "bg-zinc-900" : "bg-zinc-300"
      }`}
    >
      <span
        className={`absolute top-0.5 left-0.5 h-6 w-6 rounded-full bg-white shadow transition ${
          checked ? "translate-x-5" : "translate-x-0"
        }`}
      />
    </button>
  );
}

function formatConditionLine(condition: AlertCondition): string {
  const dayText =
    condition.days.length === 0 ? "요일 상관없음" : `${condition.days.join("·")} 모두 포함`;
  const timeText =
    condition.timeSlots.length === 0
      ? "시간 상관없음"
      : condition.timeSlots.map(formatTimeSlot).join("·");
  return `${dayText} · ${timeText}`;
}

function buildSummary(
  preference: NotificationPreference,
  interestRegions: InterestRegion[],
  tab: TabKey,
): string {
  if (!preference.enabled) return "알림이 꺼져 있습니다.";

  const active = preference[tab];
  if (!active.enabled) {
    return tab === "regular"
      ? "정규 채용 알림이 꺼져 있습니다. 대타 탭도 확인해 보세요."
      : "대타 알림이 꺼져 있습니다. 정규 채용 탭도 확인해 보세요.";
  }

  if (interestRegions.length === 0) {
    return "관심지역을 먼저 선택해 주세요. 지역이 없으면 알림이 가지 않습니다.";
  }

  const regionText = interestRegions
    .slice(0, 3)
    .map((region) => `${formatSidoForDisplay(region.sido)} ${region.sigungu}`)
    .join(" · ");
  const regionMore =
    interestRegions.length > 3 ? ` 외 ${interestRegions.length - 3}곳` : "";

  const enabledConditions = active.conditions.filter((item) => item.enabled);
  if (enabledConditions.length === 0) {
    return "켜져 있는 조건이 없습니다. 조건을 켜 주세요.";
  }

  const kind = tab === "regular" ? "정규 채용" : "대타";
  const conditionText = enabledConditions.map(formatConditionLine).join(" / ");
  return `${regionText}${regionMore}의 ${kind} 중, (${conditionText})이면 알려 드립니다.`;
}
