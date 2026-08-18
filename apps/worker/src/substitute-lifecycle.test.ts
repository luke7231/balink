import assert from "node:assert/strict";
import { test } from "node:test";
import {
  isEmployBoardSourceUrl,
  isEmploySubstituteSourcePostId,
} from "@balink/domain";

test("lifecycle skip helpers detect employ-routed substitutes", () => {
  assert.equal(isEmploySubstituteSourcePostId("employ:87661"), true);
  assert.equal(isEmploySubstituteSourcePostId("87661"), false);
  assert.equal(
    isEmployBoardSourceUrl("https://www.balletmania.com/work/employ_detail.html?no=87661"),
    true,
  );
  assert.equal(
    isEmployBoardSourceUrl("https://www.balletmania.com/work/working_detail.html?no=1"),
    false,
  );
});
