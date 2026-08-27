import assert from "node:assert/strict";
import { test } from "node:test";
import { readAuthUserId } from "./amplitude-identity";

test("readAuthUserId takes only the database user id", () => {
  assert.equal(
    readAuthUserId({
      user: { id: "clxyz123", email: "a@example.com", name: "루크" },
    }),
    "clxyz123",
  );
  assert.equal(readAuthUserId({ user: { id: "  clxyz123  " } }), "clxyz123");
});

test("readAuthUserId ignores missing or empty ids", () => {
  assert.equal(readAuthUserId(null), undefined);
  assert.equal(readAuthUserId({}), undefined);
  assert.equal(readAuthUserId({ user: { email: "a@example.com" } }), undefined);
  assert.equal(readAuthUserId({ user: { id: "   " } }), undefined);
  assert.equal(readAuthUserId({ user: { id: 1 } }), undefined);
});
