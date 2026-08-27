"use server";

import { prisma } from "@balink/db";
import { revalidatePath } from "next/cache";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import {
  clearAuthTicketCookie,
  createDatabaseSession,
  readAuthTicketCookie,
  setAuthTicketCookie,
} from "@/lib/auth-session";
import { revalidateAuthBoundary } from "@/lib/auth-boundary";
import { attachReferralFromCookie, markInviteClaimNeeded } from "@/lib/referral";
import {
  canResendChallenge,
  clearThrottle,
  createAuthTicket,
  createChallenge,
  generateOtpCode,
  isThrottled,
  isValidEmail,
  LOGIN_FAIL_MAX,
  LOGIN_FAIL_WINDOW_MS,
  LOGIN_LOCK_MS,
  loginThrottleKey,
  normalizeEmail,
  parseAuthTicket,
  recordThrottleFailure,
  verifyChallengeCode,
} from "@/lib/email-auth";
import {
  sendAlreadyRegisteredEmail,
  sendResetOtpEmail,
  sendSignupOtpEmail,
} from "@/lib/email";
import { hashPassword, validatePassword, verifyPassword } from "@/lib/password";
import { finalizeNewUserProfile } from "@/lib/user-profile";

export type EmailAuthActionResult =
  | { ok: true; message?: string; step?: "code" | "password" }
  | { ok: false; error: string };

const GENERIC_LOGIN_ERROR = "이메일 또는 비밀번호가 올바르지 않습니다.";
const GENERIC_CODE_SENT = "인증 코드를 보냈어요. 이메일을 확인해 주세요.";
const GENERIC_BUSY = "요청이 너무 많아요. 잠시 후 다시 시도해 주세요.";

function passwordMismatchOrInvalid(
  password: string,
  confirm: string,
): string | null {
  const policy = validatePassword(password);
  if (policy) return policy;
  if (password !== confirm) return "비밀번호가 일치하지 않습니다.";
  return null;
}

async function findUserByEmail(email: string) {
  return prisma.user.findFirst({
    where: { email: { equals: email, mode: "insensitive" } },
    select: {
      id: true,
      email: true,
      emailVerified: true,
      passwordHash: true,
    },
  });
}

/** Signup step 1: request OTP (or silent already-registered mail). Never creates User. */
export async function requestSignupCodeAction(
  emailInput: string,
): Promise<EmailAuthActionResult> {
  const email = normalizeEmail(emailInput);
  if (!isValidEmail(email)) {
    return { ok: false, error: "올바른 이메일 주소를 입력해 주세요." };
  }

  const existing = await findUserByEmail(email);
  if (existing) {
    // Enumeration-safe: same UI message, different email content.
    await sendAlreadyRegisteredEmail({ to: email });
    return { ok: true, message: GENERIC_CODE_SENT, step: "code" };
  }

  const resendOk = await canResendChallenge(email, "signup");
  if (!resendOk.ok) {
    return {
      ok: false,
      error: `${resendOk.retryAfterSec}초 후에 다시 요청해 주세요.`,
    };
  }

  const code = generateOtpCode();
  await createChallenge({ email, purpose: "signup", code });
  const sent = await sendSignupOtpEmail({ to: email, code });
  if (!sent.ok) return sent;

  return { ok: true, message: GENERIC_CODE_SENT, step: "code" };
}

/** Signup step 2: verify OTP → signed ticket cookie. Still no User. */
export async function verifySignupCodeAction(
  emailInput: string,
  codeInput: string,
): Promise<EmailAuthActionResult> {
  const email = normalizeEmail(emailInput);
  const code = codeInput.trim();

  if (!isValidEmail(email)) {
    return { ok: false, error: "올바른 이메일 주소를 입력해 주세요." };
  }
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: "인증 코드 6자리를 입력해 주세요." };
  }

  // Existing account should not reach password step via signup.
  const existing = await findUserByEmail(email);
  if (existing) {
    return {
      ok: false,
      error: "이미 가입된 이메일입니다. 로그인해 주세요.",
    };
  }

  const result = await verifyChallengeCode({ email, purpose: "signup", code });
  if (!result.ok) {
    if (result.error === "locked") {
      return { ok: false, error: "인증 시도 횟수를 초과했습니다. 코드를 다시 받아 주세요." };
    }
    if (result.error === "expired" || result.error === "not_found") {
      return { ok: false, error: "인증 코드가 만료되었습니다. 다시 받아 주세요." };
    }
    return { ok: false, error: "인증 코드가 올바르지 않습니다." };
  }

  await setAuthTicketCookie(createAuthTicket("signup", email));
  return { ok: true, message: "이메일 인증이 완료되었습니다.", step: "password" };
}

/** Signup step 3: create User only after verified ticket + password. */
export async function completeSignupAction(
  passwordInput: string,
  confirmInput: string,
): Promise<EmailAuthActionResult> {
  const ticketRaw = await readAuthTicketCookie();
  if (!ticketRaw) {
    return { ok: false, error: "인증이 만료되었습니다. 처음부터 다시 진행해 주세요." };
  }
  const ticket = parseAuthTicket(ticketRaw);
  if (!ticket || ticket.purpose !== "signup") {
    await clearAuthTicketCookie();
    return { ok: false, error: "인증이 만료되었습니다. 처음부터 다시 진행해 주세요." };
  }

  const passwordError = passwordMismatchOrInvalid(passwordInput, confirmInput);
  if (passwordError) return { ok: false, error: passwordError };

  const existing = await findUserByEmail(ticket.email);
  if (existing) {
    await clearAuthTicketCookie();
    return { ok: false, error: "이미 가입된 이메일입니다. 로그인해 주세요." };
  }

  const passwordHash = await hashPassword(passwordInput);
  const user = await prisma.user.create({
    data: {
      email: ticket.email,
      emailVerified: new Date(),
      passwordHash,
    },
  });
  await finalizeNewUserProfile({ id: user.id });
  const attached = await attachReferralFromCookie(user.id);
  if (!attached) await markInviteClaimNeeded(user.id);
  await clearAuthTicketCookie();
  await createDatabaseSession(user.id);

  revalidateAuthBoundary();
  redirect(attached ? "/notifications/settings?new=1" : "/signup/welcome");
}

export async function loginWithEmailAction(
  emailInput: string,
  passwordInput: string,
): Promise<EmailAuthActionResult> {
  const email = normalizeEmail(emailInput);
  if (!isValidEmail(email) || !passwordInput) {
    return { ok: false, error: GENERIC_LOGIN_ERROR };
  }

  const throttleKey = loginThrottleKey(email);
  if (await isThrottled(throttleKey)) {
    return { ok: false, error: GENERIC_BUSY };
  }

  const user = await findUserByEmail(email);
  const canLogin =
    user &&
    user.passwordHash &&
    user.emailVerified &&
    (await verifyPassword(passwordInput, user.passwordHash));

  if (!canLogin) {
    const { locked } = await recordThrottleFailure(throttleKey, {
      windowMs: LOGIN_FAIL_WINDOW_MS,
      max: LOGIN_FAIL_MAX,
      lockMs: LOGIN_LOCK_MS,
    });
    return { ok: false, error: locked ? GENERIC_BUSY : GENERIC_LOGIN_ERROR };
  }

  await clearThrottle(throttleKey);
  await createDatabaseSession(user!.id);

  revalidateAuthBoundary();
  redirect("/account");
}

/** Reset / attach password: request OTP. Always same success message. */
export async function requestResetCodeAction(
  emailInput: string,
): Promise<EmailAuthActionResult> {
  const email = normalizeEmail(emailInput);
  if (!isValidEmail(email)) {
    return { ok: false, error: "올바른 이메일 주소를 입력해 주세요." };
  }

  const user = await findUserByEmail(email);
  // Only send real OTP if account exists with that email.
  // Social users with email can attach a password via reset.
  if (!user || !user.email) {
    // Enumeration-safe: pretend we sent.
    return { ok: true, message: GENERIC_CODE_SENT, step: "code" };
  }

  const resendOk = await canResendChallenge(email, "reset");
  if (!resendOk.ok) {
    return {
      ok: false,
      error: `${resendOk.retryAfterSec}초 후에 다시 요청해 주세요.`,
    };
  }

  const code = generateOtpCode();
  await createChallenge({ email, purpose: "reset", code });
  const sent = await sendResetOtpEmail({ to: email, code });
  if (!sent.ok) return sent;

  return { ok: true, message: GENERIC_CODE_SENT, step: "code" };
}

export async function verifyResetCodeAction(
  emailInput: string,
  codeInput: string,
): Promise<EmailAuthActionResult> {
  const email = normalizeEmail(emailInput);
  const code = codeInput.trim();

  if (!isValidEmail(email)) {
    return { ok: false, error: "올바른 이메일 주소를 입력해 주세요." };
  }
  if (!/^\d{6}$/.test(code)) {
    return { ok: false, error: "인증 코드 6자리를 입력해 주세요." };
  }

  const user = await findUserByEmail(email);
  if (!user) {
    return { ok: false, error: "인증 코드가 올바르지 않습니다." };
  }

  const result = await verifyChallengeCode({ email, purpose: "reset", code });
  if (!result.ok) {
    if (result.error === "locked") {
      return { ok: false, error: "인증 시도 횟수를 초과했습니다. 코드를 다시 받아 주세요." };
    }
    if (result.error === "expired" || result.error === "not_found") {
      return { ok: false, error: "인증 코드가 만료되었습니다. 다시 받아 주세요." };
    }
    return { ok: false, error: "인증 코드가 올바르지 않습니다." };
  }

  await setAuthTicketCookie(createAuthTicket("reset", email));
  return { ok: true, message: "이메일 인증이 완료되었습니다.", step: "password" };
}

export async function completeResetAction(
  passwordInput: string,
  confirmInput: string,
): Promise<EmailAuthActionResult> {
  const ticketRaw = await readAuthTicketCookie();
  if (!ticketRaw) {
    return { ok: false, error: "인증이 만료되었습니다. 처음부터 다시 진행해 주세요." };
  }
  const ticket = parseAuthTicket(ticketRaw);
  if (!ticket || ticket.purpose !== "reset") {
    await clearAuthTicketCookie();
    return { ok: false, error: "인증이 만료되었습니다. 처음부터 다시 진행해 주세요." };
  }

  const passwordError = passwordMismatchOrInvalid(passwordInput, confirmInput);
  if (passwordError) return { ok: false, error: passwordError };

  const user = await findUserByEmail(ticket.email);
  if (!user) {
    await clearAuthTicketCookie();
    return { ok: false, error: "계정을 찾을 수 없어요." };
  }

  const passwordHash = await hashPassword(passwordInput);
  await prisma.user.update({
    where: { id: user.id },
    data: {
      passwordHash,
      emailVerified: user.emailVerified ?? new Date(),
      email: user.email ?? ticket.email,
    },
  });

  await clearAuthTicketCookie();
  await createDatabaseSession(user.id);

  revalidateAuthBoundary();
  redirect("/account");
}

/** Logged-in user: set or change password (requires verified email). */
export async function setAccountPasswordAction(
  passwordInput: string,
  confirmInput: string,
  currentPasswordInput?: string,
): Promise<EmailAuthActionResult> {
  const session = await auth();
  const userId = session?.user?.id;
  if (!userId) return { ok: false, error: "로그인이 필요합니다." };

  const user = await prisma.user.findUnique({
    where: { id: userId },
    select: { email: true, emailVerified: true, passwordHash: true },
  });
  if (!user) return { ok: false, error: "계정을 찾을 수 없어요." };
  if (!user.email || !user.emailVerified) {
    return {
      ok: false,
      error: "비밀번호를 설정하려면 먼저 이메일을 인증해 주세요.",
    };
  }

  if (user.passwordHash) {
    if (!currentPasswordInput) {
      return { ok: false, error: "현재 비밀번호를 입력해 주세요." };
    }
    const ok = await verifyPassword(currentPasswordInput, user.passwordHash);
    if (!ok) return { ok: false, error: "현재 비밀번호가 올바르지 않습니다." };
  }

  const passwordError = passwordMismatchOrInvalid(passwordInput, confirmInput);
  if (passwordError) return { ok: false, error: passwordError };

  const passwordHash = await hashPassword(passwordInput);
  await prisma.user.update({
    where: { id: userId },
    data: { passwordHash },
  });

  revalidatePath("/account/manage");
  return {
    ok: true,
    message: user.passwordHash ? "비밀번호를 변경했습니다." : "비밀번호를 만들었습니다.",
  };
}

export async function resendSignupCodeAction(
  emailInput: string,
): Promise<EmailAuthActionResult> {
  return requestSignupCodeAction(emailInput);
}

export async function resendResetCodeAction(
  emailInput: string,
): Promise<EmailAuthActionResult> {
  return requestResetCodeAction(emailInput);
}
