import Constants from "expo-constants";

export const WEB_BASE_URL = (
  (Constants.expoConfig?.extra?.webUrl as string | undefined) ||
  "https://www.balink.co.kr"
).replace(/\/$/, "");

export const WEB_ORIGIN = new URL(WEB_BASE_URL).origin;

export const WEBVIEW_AUTH_HOSTS = new Set([
  "kauth.kakao.com",
  "accounts.kakao.com",
  "appleid.apple.com",
]);

export const ALLOWED_PUSH_PATHS = ["/jobs/", "/substitutes/", "/notifications"];

export type TabName = "Jobs" | "Substitutes" | "Bookmarks" | "Notifications" | "Account";

function isLoopbackHost(hostname: string): boolean {
  return hostname === "localhost" || hostname === "127.0.0.1" || hostname === "[::1]";
}

function isPrivateLanHost(hostname: string): boolean {
  return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);
}

function isLocalDevHost(hostname: string): boolean {
  return isLoopbackHost(hostname) || isPrivateLanHost(hostname);
}

function urlPort(url: URL): string {
  if (url.port) return url.port;
  return url.protocol === "https:" ? "443" : "80";
}

/**
 * Auth.js redirects use AUTH_URL (often http://localhost:3100) while the
 * native WebView loads the LAN IP. Treat those as the same app in local
 * dev so we don't open the in-app browser sheet.
 */
export function rewriteToWebOrigin(url: string): string | null {
  try {
    const parsed = new URL(url, WEB_BASE_URL);
    if (parsed.origin === WEB_ORIGIN) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
    }

    const web = new URL(WEB_BASE_URL);
    if (
      parsed.protocol === web.protocol &&
      urlPort(parsed) === urlPort(web) &&
      isLocalDevHost(parsed.hostname) &&
      isLocalDevHost(web.hostname)
    ) {
      return `${parsed.pathname}${parsed.search}${parsed.hash}` || "/";
    }

    return null;
  } catch {
    return null;
  }
}

export function withNativeShell(pathOrUrl: string): string {
  const url = new URL(pathOrUrl, WEB_BASE_URL);
  url.searchParams.set("nativeShell", "1");
  return url.toString();
}

export function toAppPath(url: string): string | null {
  return rewriteToWebOrigin(url);
}

export function isAllowedPushHref(href: string): boolean {
  if (!href.startsWith("/") || href.startsWith("//")) return false;
  if (href === "/") return true;
  return ALLOWED_PUSH_PATHS.some(
    (prefix) => href === prefix.slice(0, -1) || href.startsWith(prefix),
  );
}

export function isTrustedWebUrl(url: string): boolean {
  return rewriteToWebOrigin(url) !== null;
}

/** Paths that should stay inside the current WebView (tab root + query). */
export function isTabRootPath(pathname: string): boolean {
  return (
    pathname === "/" ||
    pathname === "/substitutes" ||
    pathname === "/saved" ||
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
  if (pathname.startsWith("/saved/") && pathname !== "/saved") return true;
  if (pathname.startsWith("/account/") && pathname !== "/account") return true;
  if (pathname.startsWith("/login/")) return true;
  // Signup/welcome stay in the Account Home WebView — stacking them cancels
  // the tab root load and leaves a blank screen under the stack.
  if (pathname === "/privacy" || pathname === "/terms") return true;
  return false;
}

export function tabForPath(pathname: string): TabName {
  if (pathname.startsWith("/substitutes")) return "Substitutes";
  if (pathname === "/saved" || pathname.startsWith("/saved/")) return "Bookmarks";
  if (pathname.startsWith("/notifications")) return "Notifications";
  if (
    pathname.startsWith("/account") ||
    pathname === "/login" ||
    pathname.startsWith("/login/") ||
    pathname === "/signup" ||
    pathname.startsWith("/signup/") ||
    pathname === "/privacy" ||
    pathname === "/terms"
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
    case "Bookmarks":
      return "/saved";
    case "Notifications":
      return "/notifications";
    case "Account":
      return "/account";
  }
}
