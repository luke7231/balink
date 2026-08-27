"use server";

import { prisma } from "@balink/db";
import { revalidatePath } from "next/cache";
import { auth } from "@/auth";
import { sendEmailChangeVerification } from "@/lib/email";
import {
  createEmailChangeToken,
  DEFAULT_AVATAR_PATH,
  hashEmailChangeToken,
  saveUploadedProfileImage,
} from "@/lib/profile-image";

export type ProfileActionResult = { ok: true; message?: string } | { ok: false; error: string };

const EMAIL_CHANGE_TTL_MS = 30 * 60 * 1000;
const EMAIL_CHANGE_COOLDOWN_MS = 60 * 1000;
const NAME_MIN = 2;
const NAME_MAX = 20;

function siteOrigin(): string {
  const fromAuth = process.env.AUTH_URL?.trim().replace(/\/$/, "");
  if (fromAuth) return fromAuth;
  if (process.env.VERCEL_ENV === "production") return "https://www.balink.co.kr";
  return "http://localhost:3100";
}

async function requireUserId(): Promise<string | null> {
  const session = await auth();
  return session?.user?.id ?? null;
}

function normalizeName(raw: string): string {
  return raw.replace(/\s+/g, " ").trim();
}

function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export async function updateDisplayNameAction(nameInput: string): Promise<ProfileActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  const name = normalizeName(nameInput);
  if (name.length < NAME_MIN || name.length > NAME_MAX) {
    return { ok: false, error: `이름은 ${NAME_MIN}~${NAME_MAX}자로 입력해 주세요.` };
  }

  await prisma.user.update({
    where: { id: userId },
    data: { name },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/account/manage");
  return { ok: true, message: "이름을 저장했습니다." };
}

export async function uploadProfileImageAction(formData: FormData): Promise<ProfileActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  const file = formData.get("image");
  if (!(file instanceof File) || file.size === 0) {
    return { ok: false, error: "이미지 파일을 선택해 주세요." };
  }

  const saved = await saveUploadedProfileImage(userId, file);
  if (!saved.ok) return saved;

  await prisma.user.update({
    where: { id: userId },
    data: { image: saved.url },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/account/manage");
  return { ok: true, message: "프로필 사진을 변경했습니다." };
}

export async function resetProfileImageAction(): Promise<ProfileActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  await prisma.user.update({
    where: { id: userId },
    data: { image: DEFAULT_AVATAR_PATH },
  });

  revalidatePath("/account");
  revalidatePath("/account/profile");
  revalidatePath("/account/manage");
  return { ok: true, message: "기본 프로필 사진으로 되돌렸습니다." };
}

export async function requestEmailChangeAction(emailInput: string): Promise<ProfileActionResult> {
  const userId = await requireUserId();
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  const newEmail = normalizeEmail(emailInput);
  if (!isValidEmail(newEmail)) {
    return { ok: false, error: "올바른 이메일 주소를 입력해 주세요." };
  }

  const current = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true },
  });
  if (!current) return { ok: false, error: "계정을 찾을 수 없어요." };
  if (current.email && current.email.toLowerCase() === newEmail) {
    return { ok: false, error: "현재 사용 중인 이메일과 같습니다." };
  }

  const taken = await prisma.user.findFirst({
    where: {
      email: { equals: newEmail, mode: "insensitive" },
      NOT: { id: userId },
    },
    select: { id: true },
  });
  if (taken) {
    return { ok: false, error: "이미 다른 계정에서 사용 중인 이메일입니다." };
  }

  const latest = await prisma.emailChangeRequest.findFirst({
    where: { userId },
    orderBy: { createdAt: "desc" },
    select: { createdAt: true },
  });
  if (latest && Date.now() - latest.createdAt.getTime() < EMAIL_CHANGE_COOLDOWN_MS) {
    return { ok: false, error: "잠시 후 다시 요청해 주세요." };
  }

  const token = createEmailChangeToken();
  const tokenHash = hashEmailChangeToken(token);
  const expiresAt = new Date(Date.now() + EMAIL_CHANGE_TTL_MS);

  await prisma.$transaction([
    prisma.emailChangeRequest.deleteMany({ where: { userId } }),
    prisma.emailChangeRequest.create({
      data: {
        userId,
        newEmail,
        tokenHash,
        expiresAt,
      },
    }),
  ]);

  const confirmUrl = `${siteOrigin()}/account/email/confirm?token=${encodeURIComponent(token)}`;
  const sent = await sendEmailChangeVerification({ to: newEmail, confirmUrl });
  if (!sent.ok) {
    await prisma.emailChangeRequest.deleteMany({ where: { userId, tokenHash } });
    return sent;
  }

  revalidatePath("/account/profile");
  return {
    ok: true,
    message: `${newEmail}로 인증 메일을 보냈습니다. 30분 안에 링크를 확인해 주세요.`,
  };
}

export async function confirmEmailChangeWithToken(
  token: string,
): Promise<ProfileActionResult> {
  const trimmed = token.trim();
  if (!trimmed) return { ok: false, error: "유효하지 않은 링크입니다." };

  const tokenHash = hashEmailChangeToken(trimmed);
  const request = await prisma.emailChangeRequest.findUnique({
    where: { tokenHash },
  });

  if (!request) {
    return { ok: false, error: "만료되었거나 이미 사용된 링크입니다." };
  }
  if (request.expiresAt.getTime() < Date.now()) {
    await prisma.emailChangeRequest.delete({ where: { id: request.id } });
    return { ok: false, error: "인증 링크가 만료되었습니다. 다시 요청해 주세요." };
  }

  const taken = await prisma.user.findFirst({
    where: {
      email: { equals: request.newEmail, mode: "insensitive" },
      NOT: { id: request.userId },
    },
    select: { id: true },
  });
  if (taken) {
    await prisma.emailChangeRequest.delete({ where: { id: request.id } });
    return { ok: false, error: "이미 다른 계정에서 사용 중인 이메일입니다." };
  }

  await prisma.$transaction([
    prisma.user.update({
      where: { id: request.userId },
      data: {
        email: request.newEmail,
        emailVerified: new Date(),
      },
    }),
    prisma.emailChangeRequest.deleteMany({ where: { userId: request.userId } }),
  ]);

  // Called from /account/email/confirm during render — revalidatePath is not allowed there.
  // Account pages are force-dynamic, so the next navigation reads fresh data.
  return { ok: true, message: "이메일이 변경되었습니다." };
}
