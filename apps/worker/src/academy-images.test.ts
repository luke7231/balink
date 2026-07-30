import assert from "node:assert/strict";
import test from "node:test";
import {
  buildAcademyImageObjectKey,
  buildAcademyImageSourcePrefix,
} from "./s3-storage.js";
import { parseBalletmaniaAcademyImages } from "./balletmania-academy-images.js";

test("parseBalletmaniaAcademyImages extracts logo and gallery", () => {
  const html = `
    <table>
      <tr>
        <td><img src="/PEG/jung5708.17226481650669.png"></td>
      </tr>
      <tr>
        <td><a href="company_detail.html?uid=jung5708">기업정보</a></td>
      </tr>
    </table>
    <img id="my_cphoto0" src="https://www.balletmania.com/PEG/a.png">
    <img id="my_cphoto1" src="https://www.balletmania.com/PEG/b.png">
  `;

  const parsed = parseBalletmaniaAcademyImages(html);
  assert.equal(parsed?.logoUrl, "https://www.balletmania.com/PEG/jung5708.17226481650669.png");
  assert.equal(parsed?.gallery.length, 2);
  assert.equal(parsed?.gallery[0]?.order, 1);
});

test("buildAcademyImageObjectKey groups by opaque source prefix without source name", () => {
  const sourcePrefix = buildAcademyImageSourcePrefix("balletmania");
  const key = buildAcademyImageObjectKey(
    sourcePrefix,
    "87440",
    "gallery",
    1,
    "https://www.balletmania.com/PEG/a.png",
  );
  assert.match(key, /^academy-images\/[a-f0-9]{8}\/87440\/gallery-1-[a-f0-9]{12}\.png$/);
  assert.doesNotMatch(key, /balletmania/);
  assert.equal(buildAcademyImageSourcePrefix("balletmania"), sourcePrefix);
  assert.notEqual(buildAcademyImageSourcePrefix("balletmania"), buildAcademyImageSourcePrefix("esangdance"));
});
