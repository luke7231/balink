import { cookies } from "next/headers";
import { normalizeReferralCode } from "@balink/domain";
import { INVITE_REF_COOKIE } from "@/lib/referral-cookie-name";

export { INVITE_REF_COOKIE } from "@/lib/referral-cookie-name";

const INVITE_REF_MAX_AGE_SEC = 7 * 24 * 60 * 60;

function useSecureCookies(): boolean {
  const url = process.env.AUTH_URL?.trim() || "";
  if (url.startsWith("https://")) return true;
  if (process.env.VERCEL_ENV === "production") return true;
  return false;
}

export async function setInviteRefCookie(rawCode: string): Promise<string | null> {
  const code = normalizeReferralCode(rawCode);
  if (!code) return null;
  const jar = await cookies();
  jar.set(INVITE_REF_COOKIE, code, {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies(),
    maxAge: INVITE_REF_MAX_AGE_SEC,
  });
  return code;
}

export async function readInviteRefCookie(): Promise<string | null> {
  const jar = await cookies();
  return normalizeReferralCode(jar.get(INVITE_REF_COOKIE)?.value ?? null);
}

export async function clearInviteRefCookie(): Promise<void> {
  const jar = await cookies();
  jar.delete(INVITE_REF_COOKIE);
}
