import assert from "node:assert/strict";
import { test } from "node:test";
import { isAcademyPlaceholderImageUrl, pickAcademyThumbnailUrl } from "./academy-images.js";

test("isAcademyPlaceholderImageUrl detects balletmania no_img", () => {
  assert.equal(isAcademyPlaceholderImageUrl("https://www.balletmania.com/images/no_img.gif"), true);
  assert.equal(
    isAcademyPlaceholderImageUrl(
      "https://habitstorage.s3.ap-northeast-2.amazonaws.com/academy-images/9093f3cc/87434/gallery-1-57bfebfdb72f.gif",
    ),
    true,
  );
  assert.equal(
    isAcademyPlaceholderImageUrl(
      "https://habitstorage.s3.ap-northeast-2.amazonaws.com/academy-images/9093f3cc/87483/gallery-1-57489e6cf9fe.png",
    ),
    false,
  );
});

test("pickAcademyThumbnailUrl skips placeholders and falls back to logo", () => {
  assert.equal(
    pickAcademyThumbnailUrl(
      [
        {
          url: "https://habitstorage.s3.ap-northeast-2.amazonaws.com/x/gallery-1-57bfebfdb72f.gif",
          sourceUrl: "https://www.balletmania.com/images/no_img.gif",
        },
      ],
      "https://habitstorage.s3.ap-northeast-2.amazonaws.com/x/logo.png",
    ),
    "https://habitstorage.s3.ap-northeast-2.amazonaws.com/x/logo.png",
  );

  assert.equal(
    pickAcademyThumbnailUrl(
      [{ url: "https://www.balletmania.com/images/no_img.gif" }],
      null,
    ),
    null,
  );
});
