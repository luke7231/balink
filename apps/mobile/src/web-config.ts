import Constants from "expo-constants";

export const WEB_BASE_URL = (
  (Constants.expoConfig?.extra?.webUrl as string | undefined) ||
  "https://balink-web.vercel.app"
).replace(/\/$/, "");

export const WEB_ORIGIN = new URL(WEB_BASE_URL).origin;

export const WEBVIEW_AUTH_HOSTS = new Set([
  "kauth.kakao.com",
  "accounts.kakao.com",
  "appleid.apple.com",
]);

export const ALLOWED_PUSH_PATHS = ["/jobs/", "/substitutes/", "/notifications"];

export type TabName = "Jobs" | "Substitutes" | "Notifications" | "Account";

export function withNativeShell(pathOrUrl: string): string {
  const url = new URL(pathOrUrl, WEB_BASE_URL);
  url.searchParams.set("nativeShell", "1");
  return url.toString();
}

export function toAppPath(url: string): string | null {
  try {
    const parsed = new URL(url, WEB_BASE_URL);
    if (parsed.origin !== WEB_ORIGIN) return null;
    return `${parsed.pathname}${parsed.search}`;
  } catch {
    return null;
  }
}

export function isAllowedPushHref(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  if (href === "/") return true;
  return ALLOWED_PUSH_PATHS.some(
    (prefix) => href === prefix.slice(0, -1) || href.startsWith(prefix),
  );
}

export function isTrustedWebUrl(url: string): boolean {
  try {
    return new URL(url).origin === WEB_ORIGIN;
  } catch {
    return false;
  }
}

/** Paths that should stay inside the current WebView (tab root + query). */
export function isTabRootPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/substitutes" ||
    pathname === "/notifications" ||
    pathname === "/account" ||
    // Guest account gate: keep login in the Account tab root (no stack push).
    pathname === "/login"
  );
}

/** Paths that open as a native stack screen above a tab root. */
export function isStackPath(pathname: string): boolean {
  if (pathname.startsWith("/jobs/")) return true;
  if (pathname.startsWith("/substitutes/") && pathname !== "/substitutes") return true;
  if (pathname.startsWith("/notifications/") && pathname !== "/notifications") return true;
  if (pathname === "/saved" || pathname.startsWith("/saved/")) return true;
  return false;
}

export function tabForPath(pathname: string): TabName {
  if (pathname.startsWith("/substitutes")) return "Substitutes";
  if (pathname.startsWith("/notifications")) return "Notifications";
  if (
    pathname.startsWith("/account") ||
    pathname === "/saved" ||
    pathname.startsWith("/saved/") ||
    pathname === "/login" ||
    pathname.startsWith("/login/")
  ) {
    return "Account";
  }
  return "Jobs";
}

export function tabRootPath(tab: TabName): string {
  switch (tab) {
    case "Jobs":
      return "/";
    case "Substitutes":
      return "/substitutes";
    case "Notifications":
      return "/notifications";
    case "Account":
      return "/account";
  }
}
