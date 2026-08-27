/**
 * Public login is Kakao-only for now.
 * Email/password stays available outside production so we can keep testing it.
 * Apple is hidden until account-linking UX is ready.
 */
export function isEmailAuthEnabled(
  vercelEnv = process.env.VERCEL_ENV,
): boolean {
  return vercelEnv !== "production";
}

export function isAppleLoginEnabled(): boolean {
  return false;
}
