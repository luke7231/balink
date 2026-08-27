import { cookies } from "next/headers";
import { normalizeReferralCode } from "@balink/domain";
import {
  CLAIM_INVITE_COOKIE,
  CLAIM_INVITE_DONE_COOKIE,
  CLAIM_INVITE_DONE_MAX_AGE_SEC,
  INVITE_REF_COOKIE,
} from "@/lib/referral-cookie-name";

export {
  CLAIM_INVITE_COOKIE,
  CLAIM_INVITE_DONE_COOKIE,
  CLAIM_INVITE_DONE_MAX_AGE_SEC,
  INVITE_REF_COOKIE,
} from "@/lib/referral-cookie-name";

const INVITE_REF_MAX_AGE_SEC = 7 * 24 * 60 * 60;
const CLAIM_INVITE_MAX_AGE_SEC = 60 * 60;

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

export async function setClaimInviteCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(CLAIM_INVITE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies(),
    maxAge: CLAIM_INVITE_MAX_AGE_SEC,
  });
}

export async function hasClaimInviteCookie(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(CLAIM_INVITE_COOKIE)?.value === "1";
}

export async function clearClaimInviteCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(CLAIM_INVITE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies(),
    maxAge: 0,
  });
}

export async function hasClaimInviteDoneCookie(): Promise<boolean> {
  const jar = await cookies();
  return jar.get(CLAIM_INVITE_DONE_COOKIE)?.value === "1";
}

export async function setClaimInviteDoneCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(CLAIM_INVITE_DONE_COOKIE, "1", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies(),
    maxAge: CLAIM_INVITE_DONE_MAX_AGE_SEC,
  });
}

export async function clearClaimInviteDoneCookie(): Promise<void> {
  const jar = await cookies();
  jar.set(CLAIM_INVITE_DONE_COOKIE, "", {
    httpOnly: true,
    sameSite: "lax",
    path: "/",
    secure: useSecureCookies(),
    maxAge: 0,
  });
}
