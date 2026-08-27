import assert from "node:assert/strict";
import test from "node:test";
import {
  createAuthTicket,
  generateOtpCode,
  hashOtpCode,
  isValidEmail,
  normalizeEmail,
  OTP_LENGTH,
  OTP_MAX_ATTEMPTS,
  parseAuthTicket,
  verifyOtpCode,
} from "./email-auth";

test("normalizeEmail trims and lowercases", () => {
  assert.equal(normalizeEmail("  Foo.Bar@Example.COM "), "foo.bar@example.com");
});

test("isValidEmail basic checks", () => {
  assert.equal(isValidEmail("a@b.co"), true);
  assert.equal(isValidEmail("not-an-email"), false);
  assert.equal(isValidEmail(""), false);
});

test("generateOtpCode is zero-padded digits", () => {
  for (let i = 0; i < 20; i += 1) {
    const code = generateOtpCode();
    assert.equal(code.length, OTP_LENGTH);
    assert.match(code, /^\d{6}$/);
  }
});

test("hashOtpCode / verifyOtpCode", () => {
  const code = "042891";
  const hash = hashOtpCode(code);
  assert.equal(verifyOtpCode(code, hash), true);
  assert.equal(verifyOtpCode("042890", hash), false);
  assert.equal(OTP_MAX_ATTEMPTS, 5);
});

test("auth ticket survives emails with dots", () => {
  process.env.AUTH_SECRET = "test-secret-for-ticket-signing-only";
  const email = "first.last+tag@example.com";
  const ticket = createAuthTicket("signup", email);
  const parsed = parseAuthTicket(ticket);
  assert.deepEqual(parsed, { purpose: "signup", email });
});

test("auth ticket rejects tampering and expiry", () => {
  process.env.AUTH_SECRET = "test-secret-for-ticket-signing-only";
  const ticket = createAuthTicket("reset", "user@example.com", 60_000);
  const parts = ticket.split(".");
  parts[3] = "tampered";
  assert.equal(parseAuthTicket(parts.join(".")), null);

  const expired = createAuthTicket("signup", "user@example.com", -1_000);
  assert.equal(parseAuthTicket(expired), null);
});

test("signup gate: User is created only after password step (action contract)", async () => {
  // requestSignupCodeAction / verifySignupCodeAction must not create users.
  // We assert the module source still contains create only in completeSignupAction.
  const fs = await import("node:fs/promises");
  const path = new URL("../components/email-auth-actions.ts", import.meta.url);
  const source = await fs.readFile(path, "utf8");

  const createCalls = [...source.matchAll(/prisma\.user\.create/g)];
  assert.equal(createCalls.length, 1, "exactly one User.create for signup completion");

  const completeIdx = source.indexOf("export async function completeSignupAction");
  const createIdx = source.indexOf("prisma.user.create");
  assert.ok(completeIdx > 0 && createIdx > completeIdx);

  const requestIdx = source.indexOf("export async function requestSignupCodeAction");
  const verifyIdx = source.indexOf("export async function verifySignupCodeAction");
  assert.ok(requestIdx > 0 && verifyIdx > requestIdx);
  assert.ok(
    !source.slice(requestIdx, completeIdx).includes("prisma.user.create"),
    "OTP steps must not create User",
  );
});
