/**
 * Routes that must refresh when the auth session changes
 * (login / signup / logout / account delete).
 *
 * Keep in sync with apps/mobile/src/auth-boundary-paths.ts
 */
export const AUTH_BOUNDARY_PATHS = [
  "/",
  "/substitutes",
  "/saved",
  "/notifications",
  "/account",
  "/login",
] as const;

export type AuthBoundaryPath = (typeof AUTH_BOUNDARY_PATHS)[number];
