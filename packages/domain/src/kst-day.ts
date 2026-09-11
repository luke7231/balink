const KST_TIME_ZONE = "Asia/Seoul";
const DAY_MS = 24 * 60 * 60 * 1000;

export type KstDayRange = {
  /** YYYY-MM-DD in Asia/Seoul */
  date: string;
  /** Inclusive start (KST midnight as UTC Instant) */
  start: Date;
  /** Exclusive end (next KST midnight) */
  end: Date;
};

/** Asia/Seoul calendar date as YYYY-MM-DD. */
export function toKstDateString(value: Date = new Date()): string {
  return new Intl.DateTimeFormat("en-CA", {
    timeZone: KST_TIME_ZONE,
    year: "numeric",
    month: "2-digit",
    day: "2-digit",
  }).format(value);
}

/** [start, end) covering the Korea calendar day that contains `now`. */
export function kstDayRange(now: Date = new Date()): KstDayRange {
  const date = toKstDateString(now);
  const start = new Date(`${date}T00:00:00+09:00`);
  const end = new Date(start.getTime() + DAY_MS);
  return { date, start, end };
}

/**
 * Effective "appeared at" for today lists: prefer postedAt, else createdAt.
 */
export function effectivePostedAt(
  postedAt: Date | null | undefined,
  createdAt: Date,
): Date {
  return postedAt ?? createdAt;
}

export function isInKstDayRange(
  value: Date,
  range: Pick<KstDayRange, "start" | "end">,
): boolean {
  const time = value.getTime();
  return time >= range.start.getTime() && time < range.end.getTime();
}
