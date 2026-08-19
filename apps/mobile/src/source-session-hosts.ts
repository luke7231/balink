export type SourceLoginSite = "balletmania" | "esangdance";

const SOURCE_SESSION_HOSTS = ["balletmania.com", "esangdance.net"] as const;

export const SOURCE_LOGIN_LABELS: Record<SourceLoginSite, string> = {
  balletmania: "발레매니아",
  esangdance: "이상댄스",
};

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

export function sourceLoginSite(url: string): SourceLoginSite | null {
  const origin = sourceSessionOrigin(url);
  if (!origin) return null;
  try {
    const host = new URL(origin).hostname.replace(/^www\./i, "").toLowerCase();
    if (host === "esangdance.net" || host.endsWith(".esangdance.net")) return "esangdance";
    if (host === "balletmania.com" || host.endsWith(".balletmania.com")) return "balletmania";
  } catch {
    return null;
  }
  return null;
}

export function sourceLoginPageUrl(currentUrl: string): string | null {
  const site = sourceLoginSite(currentUrl);
  const origin = sourceSessionOrigin(currentUrl);
  if (!site || !origin) return null;
  if (site === "esangdance") {
    return `${origin}/bbs/login.php?url=${encodeURIComponent(currentUrl)}`;
  }
  return `${origin}/m/login.html`;
}

export function isSourceLoginPageUrl(url: string): boolean {
  try {
    const path = new URL(url).pathname;
    return (
      /\/login\.html$/i.test(path) ||
      /\/bbs\/login\.php$/i.test(path) ||
      /rankup_member\/login/i.test(path)
    );
  } catch {
    return false;
  }
}
