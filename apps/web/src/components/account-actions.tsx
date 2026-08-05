"use server";

import { prisma } from "@black-swan/db";
import {
  parseJobTypeAlertPreference,
  validateAdminDistrict,
  type NotificationPreference,
} from "@black-swan/domain";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth, signOut } from "@/auth";
import { MAX_INTEREST_REGIONS } from "@/lib/interest-regions";
import { unlinkKakaoAccount } from "@/lib/kakao-unlink";

export type InterestRegionActionResult =
  | { ok: true; region?: { id: string; sido: string; sigungu: string } }
  | { ok: false; error: string };

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

  const count = await prisma.userInterestRegion.count({ where: { userId } });
  if (count >= MAX_INTEREST_REGIONS) {
    return { ok: false, error: `관심지역은 최대 ${MAX_INTEREST_REGIONS}개까지 저장할 수 있습니다.` };
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
    return { ok: false, error: "삭제할 지역이 없습니다." };
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
  | { ok: false; error: string };

export async function saveNotificationPreferenceAction(
  preference: NotificationPreference,
): Promise<NotificationPreferenceActionResult> {
  const userId = await requireUserId();
  const regular = parseJobTypeAlertPreference(preference.regular);
  const substitute = parseJobTypeAlertPreference(preference.substitute);

  const regularJson = JSON.parse(JSON.stringify(regular)) as object;
  const substituteJson = JSON.parse(JSON.stringify(substitute)) as object;

  await prisma.userNotificationPreference.upsert({
    where: { userId },
    create: {
      userId,
      enabled: preference.enabled !== false,
      regularJson,
      substituteJson,
    },
    update: {
      enabled: preference.enabled !== false,
      regularJson,
      substituteJson,
    },
  });

  revalidatePath("/account");
  revalidatePath("/notifications");
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
    },
  });

  for (const account of accounts) {
    if (account.provider === "kakao" && account.access_token) {
      const result = await unlinkKakaoAccount(account.access_token);
      if (!result.ok) {
        console.warn("[delete-account] kakao unlink failed", result.detail);
      }
    }
  }

  await prisma.user.delete({ where: { id: userId } });
  await signOut({ redirectTo: "/login?deleted=1" });
}
