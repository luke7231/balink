import assert from "node:assert/strict";
import { test } from "node:test";
import {
  REFERRAL_CODE_LENGTH,
  encodeReferralCode,
  normalizeReferralCode,
} from "./referral.js";

test("normalize accepts 8-char codes without ambiguous letters", () => {
  assert.equal(normalizeReferralCode("ab2k7nmp"), "AB2K7NMP");
  assert.equal(normalizeReferralCode(" AB2K-7NMP "), "AB2K7NMP");
  assert.equal(normalizeReferralCode("AB2K7NMP0"), null);
  assert.equal(normalizeReferralCode("IO10ABCD"), null);
  assert.equal(normalizeReferralCode(""), null);
});

test("encode maps entropy onto the safe alphabet", () => {
  const code = encodeReferralCode(Uint8Array.from({ length: 8 }, (_, i) => i * 17));
  assert.equal(code.length, REFERRAL_CODE_LENGTH);
  assert.equal(normalizeReferralCode(code), code);
});
