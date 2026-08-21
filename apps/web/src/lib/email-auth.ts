import { createHash, createHmac, randomInt, timingSafeEqual } from "node:crypto";
import { prisma, type EmailAuthPurpose } from "@balink/db";

export const OTP_LENGTH = 6;
export const OTP_TTL_MS = 10 * 60 * 1000;
export const OTP_RESEND_COOLDOWN_MS = 60 * 1000;
export const OTP_MAX_ATTEMPTS = 5;

export const LOGIN_FAIL_WINDOW_MS = 15 * 60 * 1000;
export const LOGIN_FAIL_MAX = 10;
export const LOGIN_LOCK_MS = 15 * 60 * 1000;

export const AUTH_TICKET_TTL_MS = 15 * 60 * 1000;

export type AuthTicketPurpose = "signup" | "reset";

export function normalizeEmail(raw: string): string {
  return raw.trim().toLowerCase();
}

export function isValidEmail(email: string): boolean {
  return /^[^\s@]+@[^\s@]+\.[^\s@]+$/.test(email) && email.length <= 254;
}

export function generateOtpCode(): string {
  return String(randomInt(0, 1_000_000)).padStart(OTP_LENGTH, "0");
}

export function hashOtpCode(code: string): string {
  return createHash("sha256").update(code.trim()).digest("hex");
}

export function verifyOtpCode(code: string, codeHash: string): boolean {
  const hashed = Buffer.from(hashOtpCode(code), "hex");
  const expected = Buffer.from(codeHash, "hex");
  if (hashed.length !== expected.length) return false;
  return timingSafeEqual(hashed, expected);
}

function authSecret(): string {
  const secret = process.env.AUTH_SECRET?.trim();
  if (!secret) {
    throw new Error("AUTH_SECRET is not configured");
  }
  return secret;
}

/** Signed ticket: purpose.emailB64.exp.sig */
export function createAuthTicket(
  purpose: AuthTicketPurpose,
  email: string,
  ttlMs = AUTH_TICKET_TTL_MS,
): string {
  const exp = Date.now() + ttlMs;
  const emailB64 = Buffer.from(email, "utf8").toString("base64url");
  const payload = `${purpose}.${emailB64}.${exp}`;
  const sig = createHmac("sha256", authSecret()).update(payload).digest("base64url");
  return `${payload}.${sig}`;
}

export function parseAuthTicket(
  ticket: string,
): { purpose: AuthTicketPurpose; email: string } | null {
  const parts = ticket.split(".");
  if (parts.length !== 4) return null;
  const [purpose, emailB64, expStr, sig] = parts;
  if (purpose !== "signup" && purpose !== "reset") return null;
  if (!emailB64 || !expStr || !sig) return null;

  const exp = Number(expStr);
  if (!Number.isFinite(exp) || exp < Date.now()) return null;

  const payload = `${purpose}.${emailB64}.${exp}`;
  const expected = createHmac("sha256", authSecret()).update(payload).digest("base64url");
  const a = Buffer.from(sig);
  const b = Buffer.from(expected);
  if (a.length !== b.length || !timingSafeEqual(a, b)) return null;

  let email: string;
  try {
    email = Buffer.from(emailB64, "base64url").toString("utf8");
  } catch {
    return null;
  }
  if (!email || !isValidEmail(email)) return null;

  return { purpose, email };
}

export async function isThrottled(key: string): Promise<boolean> {
  const row = await prisma.authThrottle.findUnique({ where: { key } });
  if (!row?.lockedUntil) return false;
  if (row.lockedUntil.getTime() > Date.now()) return true;
  return false;
}

export async function recordThrottleFailure(
  key: string,
  options: { windowMs: number; max: number; lockMs: number },
): Promise<{ locked: boolean }> {
  const now = new Date();
  const existing = await prisma.authThrottle.findUnique({ where: { key } });

  if (existing?.lockedUntil && existing.lockedUntil.getTime() > now.getTime()) {
    return { locked: true };
  }

  const windowExpired =
    !existing || now.getTime() - existing.windowStart.getTime() > options.windowMs;

  if (!existing || windowExpired) {
    await prisma.authThrottle.upsert({
      where: { key },
      create: {
        key,
        count: 1,
        windowStart: now,
        lockedUntil: null,
      },
      update: {
        count: 1,
        windowStart: now,
        lockedUntil: null,
      },
    });
    return { locked: false };
  }

  const nextCount = existing.count + 1;
  const locked = nextCount >= options.max;
  await prisma.authThrottle.update({
    where: { key },
    data: {
      count: nextCount,
      lockedUntil: locked ? new Date(now.getTime() + options.lockMs) : null,
    },
  });
  return { locked };
}

export async function clearThrottle(key: string): Promise<void> {
  await prisma.authThrottle.deleteMany({ where: { key } });
}

export function loginThrottleKey(email: string): string {
  return `login:${email}`;
}

export function otpSendThrottleKey(email: string, purpose: EmailAuthPurpose): string {
  return `otp-send:${purpose}:${email}`;
}

export type ChallengeLookup = {
  id: string;
  email: string;
  purpose: EmailAuthPurpose;
  codeHash: string;
  expiresAt: Date;
  verifiedAt: Date | null;
  attemptCount: number;
  sentAt: Date;
};

export async function getActiveChallenge(
  email: string,
  purpose: EmailAuthPurpose,
): Promise<ChallengeLookup | null> {
  const challenge = await prisma.emailAuthChallenge.findFirst({
    where: {
      email,
      purpose,
      verifiedAt: null,
      expiresAt: { gt: new Date() },
    },
    orderBy: { createdAt: "desc" },
  });
  return challenge;
}

export async function createChallenge(params: {
  email: string;
  purpose: EmailAuthPurpose;
  code: string;
}): Promise<{ id: string; sentAt: Date }> {
  const now = new Date();
  const expiresAt = new Date(now.getTime() + OTP_TTL_MS);
  const codeHash = hashOtpCode(params.code);

  await prisma.emailAuthChallenge.deleteMany({
    where: { email: params.email, purpose: params.purpose },
  });

  const created = await prisma.emailAuthChallenge.create({
    data: {
      email: params.email,
      purpose: params.purpose,
      codeHash,
      expiresAt,
      sentAt: now,
    },
  });

  return { id: created.id, sentAt: created.sentAt };
}

export type VerifyChallengeResult =
  | { ok: true }
  | { ok: false; error: "expired" | "invalid" | "locked" | "not_found" };

export async function verifyChallengeCode(params: {
  email: string;
  purpose: EmailAuthPurpose;
  code: string;
}): Promise<VerifyChallengeResult> {
  const challenge = await getActiveChallenge(params.email, params.purpose);
  if (!challenge) return { ok: false, error: "not_found" };

  if (challenge.expiresAt.getTime() < Date.now()) {
    await prisma.emailAuthChallenge.delete({ where: { id: challenge.id } });
    return { ok: false, error: "expired" };
  }

  if (challenge.attemptCount >= OTP_MAX_ATTEMPTS) {
    await prisma.emailAuthChallenge.delete({ where: { id: challenge.id } });
    return { ok: false, error: "locked" };
  }

  const match = verifyOtpCode(params.code, challenge.codeHash);
  if (!match) {
    const next = challenge.attemptCount + 1;
    if (next >= OTP_MAX_ATTEMPTS) {
      await prisma.emailAuthChallenge.delete({ where: { id: challenge.id } });
      return { ok: false, error: "locked" };
    }
    await prisma.emailAuthChallenge.update({
      where: { id: challenge.id },
      data: { attemptCount: next },
    });
    return { ok: false, error: "invalid" };
  }

  await prisma.emailAuthChallenge.update({
    where: { id: challenge.id },
    data: { verifiedAt: new Date() },
  });
  return { ok: true };
}

export async function canResendChallenge(
  email: string,
  purpose: EmailAuthPurpose,
): Promise<{ ok: true } | { ok: false; retryAfterSec: number }> {
  const latest = await prisma.emailAuthChallenge.findFirst({
    where: { email, purpose },
    orderBy: { sentAt: "desc" },
    select: { sentAt: true },
  });
  if (!latest) return { ok: true };
  const elapsed = Date.now() - latest.sentAt.getTime();
  if (elapsed < OTP_RESEND_COOLDOWN_MS) {
    return {
      ok: false,
      retryAfterSec: Math.ceil((OTP_RESEND_COOLDOWN_MS - elapsed) / 1000),
    };
  }
  return { ok: true };
}
