"use client";

import { useState, useTransition } from "react";
import {
  ALERT_DAYS,
  ALERT_TIME_SLOTS,
  formatTimeSlot,
  type JobTypeAlertPreference,
  type NotificationPreference,
} from "@black-swan/domain";
import { saveNotificationPreferenceAction } from "@/components/account-actions";

export function NotificationPreferenceForm({
  initialPreference,
}: {
  initialPreference: NotificationPreference;
}) {
  const [preference, setPreference] = useState(initialPreference);
  const [message, setMessage] = useState<string | null>(null);
  const [error, setError] = useState<string | null>(null);
  const [pending, startTransition] = useTransition();

  function updateType(key: "regular" | "substitute", next: JobTypeAlertPreference) {
    setPreference((prev) => ({ ...prev, [key]: next }));
  }

  return (
    <div className="space-y-5">
      <label className="flex items-center justify-between gap-3 rounded-2xl border border-zinc-200 bg-zinc-50 px-4 py-3">
        <div>
          <p className="text-sm font-semibold text-zinc-900">알림 받기</p>
          <p className="mt-0.5 text-xs text-zinc-500">끄면 정규·대타 알림이 모두 중지됩니다.</p>
        </div>
        <input
          type="checkbox"
          checked={preference.enabled}
          onChange={(event) =>
            setPreference((prev) => ({ ...prev, enabled: event.target.checked }))
          }
          className="h-5 w-5 accent-zinc-900"
        />
      </label>

      <JobTypePreferenceCard
        title="정규 공고"
        description="채용 공고 알림 조건"
        value={preference.regular}
        disabled={!preference.enabled}
        onChange={(next) => updateType("regular", next)}
      />

      <JobTypePreferenceCard
        title="대타 공고"
        description="대타 게시판 알림 조건"
        value={preference.substitute}
        disabled={!preference.enabled}
        onChange={(next) => updateType("substitute", next)}
      />

      <p className="text-xs leading-relaxed text-zinc-500">
        관심지역은 위에서 선택한 지역 중 하나라도 겹치면 대상입니다. 요일·시간을 비우면 해당 축은 전부
        허용합니다.
      </p>

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
              setMessage("알림 조건을 저장했습니다.");
            });
          }}
          className="rounded-full bg-zinc-900 px-4 py-2.5 text-sm font-semibold text-white hover:bg-zinc-800 disabled:opacity-60"
        >
          {pending ? "저장 중..." : "알림 조건 저장"}
        </button>
        {message ? <p className="text-sm text-emerald-700">{message}</p> : null}
        {error ? <p className="text-sm text-rose-700">{error}</p> : null}
      </div>
    </div>
  );
}

function JobTypePreferenceCard({
  title,
  description,
  value,
  disabled,
  onChange,
}: {
  title: string;
  description: string;
  value: JobTypeAlertPreference;
  disabled: boolean;
  onChange: (value: JobTypeAlertPreference) => void;
}) {
  const inactive = disabled || !value.enabled;

  return (
    <section
      className={`rounded-2xl border px-4 py-4 ${
        inactive ? "border-zinc-200 bg-zinc-50/70 opacity-70" : "border-zinc-200 bg-white"
      }`}
    >
      <label className="flex items-center justify-between gap-3">
        <div>
          <h3 className="text-sm font-semibold text-zinc-900">{title}</h3>
          <p className="mt-0.5 text-xs text-zinc-500">{description}</p>
        </div>
        <input
          type="checkbox"
          checked={value.enabled}
          disabled={disabled}
          onChange={(event) => onChange({ ...value, enabled: event.target.checked })}
          className="h-5 w-5 accent-zinc-900"
        />
      </label>

      <div className="mt-4 space-y-4">
        <div>
          <div className="flex flex-wrap items-center justify-between gap-2">
            <p className="text-xs font-medium text-zinc-700">요일</p>
            <div className="flex rounded-full border border-zinc-200 p-0.5 text-xs">
              <button
                type="button"
                disabled={inactive}
                onClick={() => onChange({ ...value, daysMode: "or" })}
                className={`rounded-full px-2.5 py-1 font-medium ${
                  value.daysMode === "or" ? "bg-zinc-900 text-white" : "text-zinc-500"
                }`}
              >
                OR · 하나라도
              </button>
              <button
                type="button"
                disabled={inactive}
                onClick={() => onChange({ ...value, daysMode: "and" })}
                className={`rounded-full px-2.5 py-1 font-medium ${
                  value.daysMode === "and" ? "bg-zinc-900 text-white" : "text-zinc-500"
                }`}
              >
                AND · 모두 포함
              </button>
            </div>
          </div>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALERT_DAYS.map((day) => {
              const selected = value.days.includes(day);
              return (
                <button
                  key={day}
                  type="button"
                  disabled={inactive}
                  onClick={() => {
                    const days = selected
                      ? value.days.filter((item) => item !== day)
                      : [...value.days, day];
                    onChange({ ...value, days });
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    selected
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600"
                  }`}
                >
                  {day}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-400">
            {value.days.length === 0
              ? "미선택 = 모든 요일"
              : value.daysMode === "and"
                ? `${value.days.join("·")}이 모두 있는 공고`
                : `${value.days.join("·")} 중 하나라도 있는 공고`}
          </p>
        </div>

        <div>
          <p className="text-xs font-medium text-zinc-700">시간대</p>
          <div className="mt-2 flex flex-wrap gap-2">
            {ALERT_TIME_SLOTS.map((slot) => {
              const selected = value.timeSlots.includes(slot);
              return (
                <button
                  key={slot}
                  type="button"
                  disabled={inactive}
                  onClick={() => {
                    const timeSlots = selected
                      ? value.timeSlots.filter((item) => item !== slot)
                      : [...value.timeSlots, slot];
                    onChange({ ...value, timeSlots });
                  }}
                  className={`rounded-full px-3 py-1.5 text-sm font-medium ${
                    selected
                      ? "bg-zinc-900 text-white"
                      : "border border-zinc-200 bg-white text-zinc-600"
                  }`}
                >
                  {formatTimeSlot(slot)}
                </button>
              );
            })}
          </div>
          <p className="mt-1.5 text-[11px] text-zinc-400">
            {value.timeSlots.length === 0
              ? "미선택 = 모든 시간대 · 선택 시 OR"
              : `${value.timeSlots.map(formatTimeSlot).join("·")} 중 하나라도 겹치면 알림`}
          </p>
        </div>
      </div>
    </section>
  );
}
