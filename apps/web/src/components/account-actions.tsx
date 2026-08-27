"use server";

import { prisma } from "@balink/db";
import {
  MAX_NOTIFICATION_RULES,
  exceedsFreeInterestRegionLimit,
  parseNotificationPreference,
  uniqueInterestRegionCount,
  validateAdminDistrict,
  type NotificationPreference,
} from "@balink/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { revalidateAuthBoundary } from "@/lib/auth-boundary";
import { MAX_INTEREST_REGIONS, regionLimitError } from "@/lib/interest-regions";
import { revokeAppleAccount } from "@/lib/apple-revoke";
import { unlinkKakaoAccount } from "@/lib/kakao-unlink";
import { backfillInboxMatchesForUser } from "@/lib/notification-inbox-backfill";
import { loadRegionLimitState, qualifyReferralIfNeeded } from "@/lib/referral";

export type InterestRegionActionResult =
  | { ok: true; region?: { id: string; sido: string; sigungu: string } }
  | { ok: false; error: string; code?: "REGION_LIMIT" };

async function requireUserId() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }
  return userId;
}

export async function addInterestRegionAction(
  sido: string,
  sigungu: string,
): Promise<InterestRegionActionResult> {
  const userId = await requireUserId();
  const validated = validateAdminDistrict(sido, sigungu);
  if (!validated.valid || !validated.sido || !validated.sigungu) {
    return { ok: false, error: "올바른 지역을 선택해 주세요." };
  }

  const [currentRegions, { unlocked, referred }] = await Promise.all([
    prisma.userInterestRegion.findMany({
      where: { userId },
      select: { sido: true, sigungu: true },
    }),
    loadRegionLimitState(userId),
  ]);
  const nextRegions = [
    ...currentRegions,
    { sido: validated.sido, sigungu: validated.sigungu },
  ];
  const currentUniqueCount = uniqueInterestRegionCount(currentRegions);
  const nextUniqueCount = uniqueInterestRegionCount(nextRegions);
  if (
    exceedsFreeInterestRegionLimit({
      unlocked,
      referred,
      currentUniqueCount,
      nextUniqueCount,
    })
  ) {
    return {
      ok: false,
      error:
        nextUniqueCount > MAX_INTEREST_REGIONS
          ? `관심지역은 최대 ${MAX_INTEREST_REGIONS}개까지 저장할 수 있습니다.`
          : regionLimitError(referred),
      code: nextUniqueCount > MAX_INTEREST_REGIONS ? undefined : "REGION_LIMIT",
    };
  }

  const region = await prisma.userInterestRegion.upsert({
    where: {
      userId_sido_sigungu: {
        userId,
        sido: validated.sido,
        sigungu: validated.sigungu,
      },
    },
    create: {
      userId,
      sido: validated.sido,
      sigungu: validated.sigungu,
    },
    update: {},
    select: { id: true, sido: true, sigungu: true },
  });

  revalidatePath("/account");
  revalidatePath("/notifications/settings");
  return { ok: true, region };
}

export async function removeInterestRegionAction(
  regionId: string,
): Promise<InterestRegionActionResult> {
  const userId = await requireUserId();
  if (!regionId.trim()) {
    return { ok: false, error: "삭제할 지역이 없어요." };
  }

  await prisma.userInterestRegion.deleteMany({
    where: { id: regionId, userId },
  });

  revalidatePath("/account");
  revalidatePath("/notifications/settings");
  return { ok: true };
}

export type NotificationPreferenceActionResult =
  | { ok: true }
  | { ok: false; error: string; code?: "REGION_LIMIT" };

export async function saveNotificationPreferenceAction(
  preference: NotificationPreference,
): Promise<NotificationPreferenceActionResult> {
  const userId = await requireUserId();
  const parsed = parseNotificationPreference({
    enabled: preference.enabled,
    rulesJson: preference.rules,
  });

  if (parsed.rules.length > MAX_NOTIFICATION_RULES) {
    return { ok: false, error: `규칙은 최대 ${MAX_NOTIFICATION_RULES}개까지 저장할 수 있습니다.` };
  }

  for (const rule of parsed.rules) {
    if (!rule.enabled) continue;
    if (!rule.sido || !rule.sigungu) {
      return { ok: false, error: "켜 둔 규칙에는 지역을 모두 선택해 주세요." };
    }
    const validated = validateAdminDistrict(rule.sido, rule.sigungu);
    if (!validated.valid) {
      return { ok: false, error: "올바른 지역을 선택해 주세요." };
    }
  }

  const [existingRow, existingInterest, { unlocked, referred }] = await Promise.all([
    prisma.userNotificationPreference.findUnique({
      where: { userId },
    }),
    prisma.userInterestRegion.findMany({
      where: { userId },
      select: { sido: true, sigungu: true },
    }),
    loadRegionLimitState(userId),
  ]);
  const currentPreference = parseNotificationPreference(existingRow, existingInterest);
  const currentUniqueCount = uniqueInterestRegionCount(currentPreference.rules);
  const nextUniqueCount = uniqueInterestRegionCount(parsed.rules);
  if (
    exceedsFreeInterestRegionLimit({
      unlocked,
      referred,
      currentUniqueCount,
      nextUniqueCount,
    })
  ) {
    return {
      ok: false,
      error:
        nextUniqueCount > MAX_INTEREST_REGIONS
          ? `관심지역은 최대 ${MAX_INTEREST_REGIONS}개까지 저장할 수 있습니다.`
          : regionLimitError(referred),
      code: nextUniqueCount > MAX_INTEREST_REGIONS ? undefined : "REGION_LIMIT",
    };
  }

  const rulesJson = JSON.parse(JSON.stringify(parsed.rules)) as object;

  await prisma.userNotificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      enabled: parsed.enabled,
      rulesJson,
      regularJson: {},
      substituteJson: {},
    },
    update: {
      enabled: parsed.enabled,
      rulesJson,
      regularJson: {},
      substituteJson: {},
    },
  });

  try {
    await backfillInboxMatchesForUser(userId, parsed);
  } catch (error) {
    console.error("[notification-inbox] backfill failed", error);
  }

  await qualifyReferralIfNeeded(userId, parsed);

  revalidatePath("/account");
  revalidatePath("/notifications");
  revalidatePath("/notifications/rules");
  revalidatePath("/notifications/settings");
  return { ok: true };
}

export async function deleteAccountAction() {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) {
    redirect("/login");
  }

  const accounts = await prisma.account.findMany({
    where: { userId },
    select: {
      provider: true,
      access_token: true,
      refresh_token: true,
    },
  });

  for (const account of accounts) {
    if (account.provider === "kakao" && account.access_token) {
      const result = await unlinkKakaoAccount(account.access_token);
      if (!result.ok) {
        console.warn("[delete-account] kakao unlink failed", result.detail);
      }
    }

    if (account.provider === "apple") {
      const token = account.refresh_token || account.access_token;
      const hint = account.refresh_token ? "refresh_token" : "access_token";
      if (!token) {
        console.warn("[delete-account] apple revoke skipped: no token");
        continue;
      }
      const result = await revokeAppleAccount(token, hint);
      if (!result.ok) {
        console.warn("[delete-account] apple revoke failed", result.detail);
      }
    }
  }

  await prisma.user.delete({ where: { id: userId } });
  revalidateAuthBoundary();
  // Tab root — native popToTop clears manage stack; guest LoginScreen shows deleted banner.
  await signOut({ redirectTo: "/account?deleted=1" });
}
