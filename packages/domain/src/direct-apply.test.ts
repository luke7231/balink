import assert from "node:assert/strict";
import { test } from "node:test";
import { hasDirectApplyContacts, resolveDirectApplyActions } from "./direct-apply.js";

test("empty contacts produce no actions (balletmania-style)", () => {
  assert.equal(hasDirectApplyContacts({ phones: [], emails: [] }), false);
  assert.deepEqual(
    resolveDirectApplyActions({
      phones: [],
      emails: [],
      methods: [],
      title: "발레매니아 공고",
    }),
    [],
  );
});

test("esangdance mobile + email yields sms, tel, mailto", () => {
  const actions = resolveDirectApplyActions({
    phones: ["010-1234-5678"],
    emails: ["studio@example.com"],
    methods: ["sms", "email"],
    title: "망원동 대강",
  });

  assert.equal(hasDirectApplyContacts({ phones: ["010-1234-5678"], emails: ["studio@example.com"] }), true);
  assert.equal(actions.length, 3);
  assert.equal(actions[0]?.kind, "sms");
  assert.equal(actions[1]?.kind, "tel");
  assert.equal(actions[2]?.kind, "mailto");
  assert.match(actions[0]!.href, /^sms:01012345678\?body=/);
  assert.equal(actions[1]!.href, "tel:01012345678");
  assert.match(actions[2]!.href, /^mailto:studio@example\.com\?/);
  assert.match(decodeURIComponent(actions[0]!.href), /망원동 대강/);
  assert.match(decodeURIComponent(actions[2]!.href), /망원동 대강 지원합니다/);
});

test("phone-only method prefers tel before sms", () => {
  const actions = resolveDirectApplyActions({
    phones: ["01012345678"],
    emails: [],
    methods: ["phone"],
    title: "정규 채용",
  });
  assert.deepEqual(
    actions.map((a) => a.kind),
    ["tel", "sms"],
  );
});

test("landline only yields tel", () => {
  const actions = resolveDirectApplyActions({
    phones: ["02-1234-5678"],
    emails: null,
    title: "학원 채용",
  });
  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.kind, "tel");
  assert.equal(actions[0]?.href, "tel:0212345678");
  assert.equal(actions[0]?.displayValue, "02-1234-5678");
});

test("dedupes phones and emails", () => {
  const actions = resolveDirectApplyActions({
    phones: ["010-1111-2222", "01011112222"],
    emails: ["A@Example.com", "a@example.com"],
    title: "공고",
  });
  assert.equal(actions.filter((a) => a.kind === "sms").length, 1);
  assert.equal(actions.filter((a) => a.kind === "tel").length, 1);
  assert.equal(actions.filter((a) => a.kind === "mailto").length, 1);
});
