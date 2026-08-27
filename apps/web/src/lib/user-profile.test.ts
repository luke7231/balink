import assert from "node:assert/strict";
import test from "node:test";
import { shouldProvisionAuthJsUser } from "./user-profile";

test("new social user is provisioned (no password, no linked accounts yet)", () => {
  assert.equal(
    shouldProvisionAuthJsUser({ passwordHash: null, accountCount: 0 }),
    true,
  );
});

test("email+password user is not re-provisioned when Apple/Kakao links by email", () => {
  assert.equal(
    shouldProvisionAuthJsUser({
      passwordHash: "scrypt$16384$8$1$abc",
      accountCount: 0,
    }),
    false,
  );
});

test("existing social user is not re-provisioned when another provider links by email", () => {
  assert.equal(
    shouldProvisionAuthJsUser({ passwordHash: null, accountCount: 1 }),
    false,
  );
});
