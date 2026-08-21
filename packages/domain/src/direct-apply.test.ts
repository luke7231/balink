import assert from "node:assert/strict";
import { test } from "node:test";
import {
  extractApplyLinks,
  hasDirectApplyContacts,
  resolveDirectApplyActions,
  splitTextByUrls,
} from "./direct-apply.js";

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

test("지원 방법 섹션 URL과 오픈카톡을 바로 지원 링크로 추출한다", () => {
  const links = extractApplyLinks({
    displaySections: [
      {
        title: "지원 방법",
        content: "오픈카카오톡으로 이력서를 전달해 주세요:\nhttps://open.kakao.com/o/s8Ra3joi",
      },
      {
        title: "근무 조건",
        content: "자세한 안내는 https://example.com/guide 참고",
      },
    ],
  });
  assert.deepEqual(links, ["https://open.kakao.com/o/s8Ra3joi"]);
  assert.equal(hasDirectApplyContacts({ links }), true);

  const actions = resolveDirectApplyActions({
    links,
    title: "강남 정규",
  });
  assert.equal(actions.length, 1);
  assert.equal(actions[0]?.kind, "link");
  assert.equal(actions[0]?.href, "https://open.kakao.com/o/s8Ra3joi");
  assert.match(actions[0]!.label, /오픈채팅/);
});

test("본문 텍스트의 오픈카톡도 추출한다", () => {
  const links = extractApplyLinks({
    texts: ["문의는 https://open.kakao.com/o/abc123 로"],
  });
  assert.deepEqual(links, ["https://open.kakao.com/o/abc123"]);
});

test("splitTextByUrls keeps trailing punctuation outside the url", () => {
  const parts = splitTextByUrls("링크: https://open.kakao.com/o/x.");
  assert.deepEqual(parts, [
    { type: "text", value: "링크: " },
    { type: "url", value: "https://open.kakao.com/o/x" },
    { type: "text", value: "." },
  ]);
});
