import assert from "node:assert/strict";
import test from "node:test";
import {
  hashPassword,
  PASSWORD_MIN_LENGTH,
  validatePassword,
  verifyPassword,
} from "./password";

test("validatePassword enforces min length", () => {
  assert.match(validatePassword("short") ?? "", /8/);
  assert.equal(validatePassword("a".repeat(PASSWORD_MIN_LENGTH)), null);
});

test("hashPassword and verifyPassword round-trip", async () => {
  const hash = await hashPassword("correct-horse-battery");
  assert.match(hash, /^scrypt\$/);
  assert.equal(await verifyPassword("correct-horse-battery", hash), true);
  assert.equal(await verifyPassword("wrong-password", hash), false);
});

test("verifyPassword rejects malformed hashes", async () => {
  assert.equal(await verifyPassword("anything", "not-a-hash"), false);
  assert.equal(await verifyPassword("anything", "scrypt$1$2$3$zz$yy"), false);
});
