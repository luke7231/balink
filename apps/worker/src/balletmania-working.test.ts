import assert from "node:assert/strict";
import test from "node:test";
import {
  normalizePostedAtRaw,
  parseWorkingDetail,
  parseWorkingListings,
} from "./balletmania-working.js";
import { hashSubstituteContent } from "./substitute-import.js";

test("parseWorkingListings extracts no from href and skips notice rows", () => {
  const html = `
    <table>
      <tbody id="div_article_contents">
        <tr class="notice" height="30"><td>공지</td><td><a href="index.html?id=working&no=566">공지</a></td></tr>
        <tr height="30">
          <td>11603</td>
          <td><a href="index.html?id=working&no=12277">우장산 대강</a></td>
          <td>이호석</td>
          <td><button class="recommend-btn" data-count="1" data-mno="123"></button></td>
          <td>15</td>
          <td>10:55:04</td>
        </tr>
      </tbody>
    </table>
  `;

  const listings = parseWorkingListings(html, { todayKstDate: "2026-07-30" });
  assert.equal(listings.length, 1);
  assert.equal(listings[0]?.no, "12277");
  assert.equal(listings[0]?.postedAtIso, "2026-07-30T10:55:04+09:00");
});

test("normalizePostedAtRaw handles date-only values", () => {
  const posted = normalizePostedAtRaw("2026-07-29", "2026-07-30");
  assert.equal(posted.postedAtIso, "2026-07-29T00:00:00+09:00");
});

test("parseWorkingDetail reads tmp_content and contact fields", () => {
  const html = `
    <div class="view_title">마포 대강</div>
    <textarea id="tmp_content">7/30 목 4시 성인발레 대강\n010-1234-5678</textarea>
    <table><tr><td>핸드폰 : 010-1234-5678</td></tr><tr><td>이메일 : test@example.com</td></tr></table>
    조회 : 34
  `;

  const detail = parseWorkingDetail(html);
  assert.equal(detail.state, "ok");
  assert.match(detail.detailText || "", /7\/30/);
  assert.deepEqual(detail.contactPhones, ["010-1234-5678"]);
  assert.deepEqual(detail.contactEmails, ["test@example.com"]);
});

test("hashSubstituteContent changes when body changes", () => {
  const first = hashSubstituteContent({ title: "A", detailText: "before" });
  const second = hashSubstituteContent({ title: "A", detailText: "after" });
  assert.notEqual(first, second);
});
