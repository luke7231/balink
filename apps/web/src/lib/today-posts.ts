import { prisma, toJobPostSummary, toSubstitutePostSummary } from "@balink/db";
import { kstDayRange, type KstDayRange } from "@balink/domain";

export type TodaySigunguChip = {
  sigungu: string;
  count: number;
};

function postedTodayWhere(range: KstDayRange) {
  return {
    OR: [
      { postedAt: { gte: range.start, lt: range.end } },
      {
        AND: [
          { postedAt: null },
          { createdAt: { gte: range.start, lt: range.end } },
        ],
      },
    ],
  };
}

function postedTodaySubstituteWhere(range: KstDayRange) {
  return {
    OR: [
      { postedAt: { gte: range.start, lt: range.end } },
      {
        AND: [
          { postedAt: null },
          { createdAt: { gte: range.start, lt: range.end } },
        ],
      },
    ],
  };
}

function aggregateSigungu(
  rows: Array<{ sigungu: string | null }>,
): TodaySigunguChip[] {
  const counts = new Map<string, number>();
  for (const row of rows) {
    const key = row.sigungu?.trim();
    if (!key) continue;
    counts.set(key, (counts.get(key) ?? 0) + 1);
  }
  return Array.from(counts.entries())
    .map(([sigungu, count]) => ({ sigungu, count }))
    .sort((a, b) => {
      if (b.count !== a.count) return b.count - a.count;
      return a.sigungu.localeCompare(b.sigungu, "ko");
    });
}

export async function fetchTodayPosts(now: Date = new Date()) {
  const range = kstDayRange(now);
  const dayWhere = postedTodayWhere(range);
  const substituteDayWhere = postedTodaySubstituteWhere(range);

  const [jobRows, substituteRows] = await Promise.all([
    prisma.jobPost.findMany({
      where: {
        isBallet: true,
        jobType: { not: "substitute" },
        ...dayWhere,
      },
      orderBy: [{ postedAt: "desc" }, { createdAt: "desc" }],
    }),
    prisma.substitutePost.findMany({
      where: {
        status: "OPEN",
        ...substituteDayWhere,
      },
      orderBy: [
        { postedAt: { sort: "desc", nulls: "last" } },
        { createdAt: "desc" },
      ],
    }),
  ]);

  const jobs = jobRows.map(toJobPostSummary);
  const substitutes = substituteRows.map(toSubstitutePostSummary);

  return {
    range,
    jobs,
    substitutes,
    jobSigunguChips: aggregateSigungu(jobRows),
    substituteSigunguChips: aggregateSigungu(substituteRows),
  };
}

export function filterBySigungu<T extends { sigungu?: string | null }>(
  items: T[],
  selected: string[],
): T[] {
  if (selected.length === 0) return items;
  const selectedSet = new Set(selected);
  return items.filter((item) => {
    const key = item.sigungu?.trim();
    return key ? selectedSet.has(key) : false;
  });
}
