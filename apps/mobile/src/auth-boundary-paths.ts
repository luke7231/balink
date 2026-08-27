/**
 * Tab roots that must refresh when auth changes.
 * Keep in sync with apps/web/src/lib/auth-boundary-paths.ts
 */
export const AUTH_BOUNDARY_PATHS = [
  "/",
  "/substitutes",
  "/saved",
  "/notifications",
  "/account",
  "/login",
] as const;

/** Soft-refresh on focus after any WEB_SYNC bump. */
export const AUTH_SYNC_SENSITIVE_PATHS = new Set<string>(AUTH_BOUNDARY_PATHS);

/**
 * Hard-reload on auth WEB_SYNC so stale guest/logged-in RSC/DOM cannot linger.
 * Same set as boundary paths — login and logout share one pipeline.
 */
export const AUTH_HARD_RELOAD_PATHS = new Set<string>(AUTH_BOUNDARY_PATHS);
