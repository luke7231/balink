"use server";

import { redirect } from "next/navigation";
import { auth, signIn } from "@/auth";
import { isAppleLoginEnabled } from "@/lib/auth-features";
import { normalizeReferralCode } from "@balink/domain";
import {
  afterInviteClaimPath,
  attachReferralToUser,
  findInviterByCode,
  getOrCreateReferralCode,
  type InviteClaimFrom,
} from "@/lib/referral";
import {
  clearClaimInviteCookie,
  setClaimInviteDoneCookie,
  setInviteRefCookie,
} from "@/lib/referral-cookie";

export async function rememberInviteCodeAction(rawCode: string) {
  const code = normalizeReferralCode(rawCode);
  if (!code) return { ok: false as const };
  const inviter = await findInviterByCode(code);
  if (!inviter) return { ok: false as const };
  await setInviteRefCookie(code);
  return { ok: true as const };
}

export async function startInviteKakaoAction(rawCode: string) {
  const remembered = await rememberInviteCodeAction(rawCode);
  if (!remembered.ok) redirect("/signup");
  await signIn("kakao", { redirectTo: "/notifications/settings?new=1" });
}

export async function startInviteAppleAction(rawCode: string) {
  const remembered = await rememberInviteCodeAction(rawCode);
  if (!remembered.ok) redirect("/login");
  if (!isAppleLoginEnabled()) redirect("/login");
  await signIn("apple", { redirectTo: "/notifications/settings?new=1" });
}

export async function loadMyInviteLinkAction() {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  const code = await getOrCreateReferralCode(session.user.id);
  return { code, path: `/invite/${code}` };
}

/** Skip/claim from a Server Action: stamp done in-place. Avoid /api hop (WebView session). */
async function finishClaimAndGo(from: InviteClaimFrom) {
  await clearClaimInviteCookie();
  await setClaimInviteDoneCookie();
  redirect(afterInviteClaimPath(from));
}

export async function claimInviteCodeAction(
  rawCode: string,
  from: InviteClaimFrom = "signup",
) {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");

  try {
    const attached = await attachReferralToUser(session.user.id, rawCode);
    if (!attached) {
      return { ok: false as const, error: "코드를 다시 확인해 주세요." };
    }
  } catch (error) {
    console.warn("[referral] claim failed", error);
    return { ok: false as const, error: "코드를 다시 확인해 주세요." };
  }

  await finishClaimAndGo(from);
}

export async function skipInviteClaimAction(from: InviteClaimFrom = "signup") {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await finishClaimAndGo(from);
}
