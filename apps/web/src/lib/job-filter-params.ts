export function toParamList(value?: string | string[] | null): string[] {
  if (!value) return [];
  const entries = Array.isArray(value) ? value : [value];
  return entries
    .flatMap((entry) => entry.split(","))
    .map((entry) => entry.trim())
    .filter(Boolean);
}

export function parseJobFilterParams(query: {
  sido?: string | string[];
  sigungu?: string | string[];
  region?: string | string[];
}) {
  const selectedSidos = toParamList(query.sido);
  const selectedSigungus = toParamList(query.sigungu);

  if (selectedSidos.length || selectedSigungus.length) {
    return { selectedSidos, selectedSigungus };
  }

  const regionValue = toParamList(query.region)[0] ?? "";
  const [regionSido, regionSigungu] = regionValue.split("::");
  return {
    selectedSidos: regionSido?.trim() ? [regionSido.trim()] : [],
    selectedSigungus: regionSigungu?.trim() ? [regionSigungu.trim()] : [],
  };
}

export function parseJobFilterSearchParams(searchParams: {
  getAll: (name: string) => string[];
}) {
  return parseJobFilterParams({
    sido: searchParams.getAll("sido"),
    sigungu: searchParams.getAll("sigungu"),
    region: searchParams.getAll("region"),
  });
}

export function buildJobsFilterHref(sidos: string[], sigungus: string[]): string {
  const params = new URLSearchParams();
  for (const sido of sidos) params.append("sido", sido);
  for (const sigungu of sigungus) params.append("sigungu", sigungu);
  const query = params.toString();
  return query ? `/?${query}` : "/";
}
