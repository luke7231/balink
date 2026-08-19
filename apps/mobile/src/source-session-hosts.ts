const SOURCE_SESSION_HOSTS = ["balletmania.com", "esangdance.net"] as const;

export const SOURCE_SESSION_ORIGINS = [
  "https://www.balletmania.com",
  "https://balletmania.com",
  "https://www.esangdance.net",
  "https://esangdance.net",
] as const;

export function sourceSessionOrigin(url: string): string | null {
  try {
    const parsed = new URL(url);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    const host = parsed.hostname.replace(/^www\./i, "").toLowerCase();
    if (
      !SOURCE_SESSION_HOSTS.some((root) => host === root || host.endsWith(`.${root}`))
    ) {
      return null;
    }
    return parsed.origin;
  } catch {
    return null;
  }
}

export function isSourceSessionUrl(url: string): boolean {
  return sourceSessionOrigin(url) !== null;
}
