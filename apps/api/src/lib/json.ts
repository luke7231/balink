export function jsonArray(value: unknown): string[] {
  if (!Array.isArray(value)) return [];
  return value.filter((item): item is string => typeof item === "string");
}

export function jsonValue(value: unknown): unknown {
  return value ?? null;
}
