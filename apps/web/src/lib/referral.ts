import { randomBytes } from "node:crypto";
import { prisma } from "@balink/db";
import {
  encodeReferralCode,
  normalizeReferralCode,
  parseNotificationPreference,
  uniqueInterestRegionCount,
  type NotificationPreference,
} from "@balink/domain";
import {
  clearInviteRefCookie,
  readInviteRefCookie,
} from "@/lib/referral-cookie";

const CODE_ATTEMPTS = 8;

export async function getOrCreateReferralCode(userId: string): Promise<string> {
  const existing = await prisma.user.findUnique({
    where: { id: userId },
    select: { referralCode: true },
  });
  if (existing?.referralCode) return existing.referralCode;

  for (let attempt = 0; attempt < CODE_ATTEMPTS; attempt += 1) {
    const code = encodeReferralCode(randomBytes(16));
    try {
      await prisma.user.update({
        where: { id: userId },
        data: { referralCode: code },
      });
      return code;
    } catch {
      const clash = await prisma.user.findUnique({
        where: { referralCode: code },
        select: { id: true },
      });
      if (clash && clash.id !== userId) continue;
      const again = await prisma.user.findUnique({
        where: { id: userId },
        select: { referralCode: true },
      });
      if (again?.referralCode) return again.referralCode;
    }
  }

  throw new Error("referral code allocate failed");
}

export async function findInviterByCode(code: string) {
  return prisma.user.findUnique({
    where: { referralCode: code },
    select: { id: true, name: true, referralCode: true },
  });
}

export async function attachReferralToUser(
  inviteeId: string,
  rawCode: string | null | undefined,
): Promise<boolean> {
  const code = normalizeReferralCode(rawCode);
  if (!code) return false;

  const inviter = await findInviterByCode(code);
  if (!inviter || inviter.id === inviteeId) return false;

  const invitee = await prisma.user.findUnique({
    where: { id: inviteeId },
    select: { invitedByUserId: true },
  });
  if (!invitee || invitee.invitedByUserId) return false;

  await prisma.$transaction([
    prisma.user.update({
      where: { id: inviteeId },
      data: { invitedByUserId: inviter.id },
    }),
    prisma.referralInvite.create({
      data: {
        inviterId: inviter.id,
        inviteeId,
        code,
      },
    }),
  ]);
  await qualifyReferralFromExistingRegions(inviteeId);
  return true;
}

export async function attachReferralFromCookie(inviteeId: string): Promise<boolean> {
  const code = await readInviteRefCookie();
  try {
    if (!code) return false;
    return await attachReferralToUser(inviteeId, code);
  } catch (error) {
    console.warn("[referral] attach failed", error);
    return false;
  } finally {
    await clearInviteRefCookie();
  }
}

export async function markInviteClaimNeeded(userId: string): Promise<void> {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { invitedByUserId: true },
  });
  if (!user || user.invitedByUserId) return;
  await prisma.user.update({
    where: { id: userId },
    data: { invitePromptPending: true },
  });
}

/** Skip / claim / leave gate — user won't see welcome again. */
export async function dismissInvitePrompt(userId: string): Promise<void> {
  await prisma.user.updateMany({
    where: { id: userId, invitePromptPending: true },
    data: { invitePromptPending: false },
  });
}

function preferenceQualifiesInvite(preference: NotificationPreference): boolean {
  return uniqueInterestRegionCount(preference.rules) > 0;
}

async function qualifyReferralFromExistingRegions(inviteeId: string) {
  const [row, interest] = await Promise.all([
    prisma.userNotificationPreference.findUnique({
      where: { userId: inviteeId },
    }),
    prisma.userInterestRegion.findMany({
      where: { userId: inviteeId },
      select: { sido: true, sigungu: true },
    }),
  ]);
  await qualifyReferralIfNeeded(inviteeId, parseNotificationPreference(row, interest));
}

export async function qualifyReferralIfNeeded(
  inviteeId: string,
  preference: NotificationPreference,
): Promise<void> {
  if (!preferenceQualifiesInvite(preference)) return;

  try {
    const invite = await prisma.referralInvite.findUnique({
      where: { inviteeId },
      select: {
        id: true,
        inviterId: true,
        qualifiedAt: true,
      },
    });
    if (!invite || invite.qualifiedAt) return;

    const now = new Date();
    await prisma.$transaction([
      prisma.referralInvite.update({
        where: { id: invite.id },
        data: { qualifiedAt: now },
      }),
      prisma.user.updateMany({
        where: { id: invite.inviterId, regionLimitUnlockedAt: null },
        data: { regionLimitUnlockedAt: now },
      }),
    ]);
  } catch (error) {
    console.warn("[referral] qualify failed", error);
  }
}

export type InviteClaimFrom = "signup" | "limit" | "account";

export function afterInviteClaimPath(from: InviteClaimFrom) {
  if (from === "account") return "/account";
  if (from === "limit") return "/notifications/rules";
  // Post-signup skip / claim: stay on 마이, not notification onboarding.
  return "/account";
}

export async function loadRegionLimitState(userId: string) {
  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { regionLimitUnlockedAt: true, invitedByUserId: true },
  });
  return {
    unlocked: Boolean(user?.regionLimitUnlockedAt),
    referred: Boolean(user?.invitedByUserId),
  };
}
