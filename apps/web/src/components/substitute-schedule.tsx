import {
  formatLessonDates,
  formatRecurrenceSummary,
  groupSubstituteSessionsByDate,
  type SubstituteSessionDateGroup,
} from "@balink/domain";
import { CalendarIcon } from "@balink/ui";

type ScheduleBlock =
  | { kind: "groups"; groups: SubstituteSessionDateGroup[] }
  | { kind: "lines"; lines: string[] };

type SessionLike = {
  date?: string | null;
  day?: string | null;
  startTime?: string | null;
  endTime?: string | null;
  origin?: string | null;
};

type RecurrenceLike = {
  startDate?: string | null;
  endDate?: string | null;
  daysOfWeek?: string[];
  startTime?: string | null;
  endTime?: string | null;
} | null;

export function resolveSubstituteSchedule(input: {
  scheduleKind?: string | null;
  sessions?: SessionLike[];
  recurrence?: RecurrenceLike;
  lessonDates: string[];
}): ScheduleBlock {
  if (input.scheduleKind === "recurring") {
    const summary = formatRecurrenceSummary(input.recurrence ?? null);
    return { kind: "lines", lines: summary ? [summary] : ["반복 일정"] };
  }

  if (input.scheduleKind === "unscheduled" || input.lessonDates.length === 0) {
    return { kind: "lines", lines: ["일정 협의"] };
  }

  const groups = groupSubstituteSessionsByDate(input.sessions ?? []);
  if (groups.length > 0) {
    return { kind: "groups", groups };
  }

  const fallback = formatLessonDates(input.lessonDates);
  return {
    kind: "lines",
    lines: fallback ? fallback.split(" · ") : ["일정 협의"],
  };
}

export function SubstituteScheduleView({
  schedule,
  className = "",
}: {
  schedule: ScheduleBlock;
  className?: string;
}) {
  return (
    <div
      className={`inline-grid grid-cols-[14px_minmax(0,auto)] gap-x-1.5 gap-y-1 text-left text-sm leading-snug text-foreground ${className}`}
    >
      {schedule.kind === "groups" ? (
        schedule.groups.map((group, groupIndex) => (
          <div key={group.date} className="contents">
            {groupIndex === 0 ? (
              <CalendarIcon className="mt-0.5 text-muted-foreground" />
            ) : (
              <span aria-hidden="true" />
            )}
            <div className="min-w-0">
              <p className="font-medium">{group.dateLabel}</p>
              {group.times.length > 0 ? (
                <ul className="mt-0.5 space-y-0.5 pl-2 text-muted-foreground">
                  {group.times.map((time) => (
                    <li key={`${group.date}-${time}`}>· {time}</li>
                  ))}
                </ul>
              ) : null}
            </div>
          </div>
        ))
      ) : (
        schedule.lines.map((line, index) => (
          <div key={`${line}-${index}`} className="contents">
            {index === 0 ? (
              <CalendarIcon className="mt-0.5 text-muted-foreground" />
            ) : (
              <span aria-hidden="true" />
            )}
            <span className="wrap-break-word font-medium">{line}</span>
          </div>
        ))
      )}
    </div>
  );
}
