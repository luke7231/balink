export type TodayTab = "jobs" | "substitutes";

export function resolveTodayTab(raw: string | string[] | undefined): TodayTab {
  const value = Array.isArray(raw) ? raw[0] : raw;
  return value === "substitutes" ? "substitutes" : "jobs";
}

export function parseTodaySigungus(
  raw: string | string[] | undefined,
): string[] {
  const values = Array.isArray(raw) ? raw : raw ? [raw] : [];
  const seen = new Set<string>();
  const result: string[] = [];
  for (const value of values) {
    const trimmed = value.trim();
    if (!trimmed || seen.has(trimmed)) continue;
    seen.add(trimmed);
    result.push(trimmed);
  }
  return result;
}

export function buildTodayHref(
  tab: TodayTab,
  sigungus: string[] = [],
): string {
  const params = new URLSearchParams();
  if (tab === "substitutes") params.set("tab", "substitutes");
  for (const sigungu of sigungus) {
    params.append("sigungu", sigungu);
  }
  const query = params.toString();
  return query ? `/today?${query}` : "/today";
}

export function toggleTodaySigungu(
  current: string[],
  sigungu: string,
): string[] {
  if (current.includes(sigungu)) {
    return current.filter((item) => item !== sigungu);
  }
  return [...current, sigungu];
}
