"use server";

import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { normalizeReferralCode } from "@balink/domain";
import {
  afterInviteClaimPath,
  attachReferralToUser,
  dismissInvitePrompt,
  findInviterByCode,
  type InviteClaimFrom,
} from "@/lib/referral";
import { setInviteRefCookie } from "@/lib/referral-cookie";

export async function rememberInviteCodeAction(rawCode: string) {
  const code = normalizeReferralCode(rawCode);
  if (!code) return { ok: false as const };
  const inviter = await findInviterByCode(code);
  if (!inviter) return { ok: false as const };
  await setInviteRefCookie(code);
  return { ok: true as const };
}

async function finishClaimAndGo(userId: string, from: InviteClaimFrom) {
  await dismissInvitePrompt(userId);
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

  await finishClaimAndGo(session.user.id, from);
}

export async function skipInviteClaimAction(from: InviteClaimFrom = "signup") {
  const session = await auth();
  if (!session?.user?.id) redirect("/login");
  await finishClaimAndGo(session.user.id, from);
}
