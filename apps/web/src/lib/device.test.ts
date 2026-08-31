import assert from "node:assert/strict";
import test from "node:test";
import {
  isAndroidDevice,
  isGalaxyDevice,
  isIosDevice,
  parseUserAgent,
} from "./device";

const GALAXY_WEBVIEW =
  "Mozilla/5.0 (Linux; Android 14; SM-S918N Build/UP1A.231005.007; wv) AppleWebKit/537.36 (KHTML, like Gecko) Version/4.0 Chrome/120.0.6099.230 Mobile Safari/537.36";
const GALAXY_BROWSER =
  "Mozilla/5.0 (Linux; Android 13; SM-A536N) AppleWebKit/537.36 (KHTML, like Gecko) SamsungBrowser/23.0 Chrome/110.0.5481.154 Mobile Safari/537.36";
const PIXEL =
  "Mozilla/5.0 (Linux; Android 14; Pixel 8) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.6099.230 Mobile Safari/537.36";
const IPHONE =
  "Mozilla/5.0 (iPhone; CPU iPhone OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const IPAD =
  "Mozilla/5.0 (iPad; CPU OS 17_2 like Mac OS X) AppleWebKit/605.1.15 (KHTML, like Gecko) Version/17.0 Mobile/15E148 Safari/604.1";
const DESKTOP_MAC =
  "Mozilla/5.0 (Macintosh; Intel Mac OS X 10_15_7) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/120.0.0.0 Safari/537.36";

test("Galaxy WebView and Samsung Browser are android + galaxy", () => {
  const webview = parseUserAgent(GALAXY_WEBVIEW);
  assert.equal(webview.os, "android");
  assert.equal(webview.family, "galaxy");
  assert.equal(webview.isGalaxy, true);
  assert.equal(isGalaxyDevice(GALAXY_WEBVIEW), true);
  assert.equal(isAndroidDevice(GALAXY_BROWSER), true);
  assert.equal(isGalaxyDevice(GALAXY_BROWSER), true);
});

test("other Android is android but not galaxy", () => {
  const device = parseUserAgent(PIXEL);
  assert.equal(device.os, "android");
  assert.equal(device.family, "android");
  assert.equal(device.isGalaxy, false);
  assert.equal(isAndroidDevice(PIXEL), true);
  assert.equal(isGalaxyDevice(PIXEL), false);
});

test("iPhone and iPad are ios", () => {
  assert.equal(parseUserAgent(IPHONE).family, "iphone");
  assert.equal(parseUserAgent(IPAD).family, "ipad");
  assert.equal(isIosDevice(IPHONE), true);
  assert.equal(isIosDevice(IPAD), true);
  assert.equal(isAndroidDevice(IPHONE), false);
});

test("desktop and empty UA are other", () => {
  assert.equal(parseUserAgent(DESKTOP_MAC).os, "other");
  assert.equal(parseUserAgent(null).os, "other");
  assert.equal(parseUserAgent("").os, "other");
  assert.equal(isIosDevice(DESKTOP_MAC), false);
  assert.equal(isAndroidDevice(DESKTOP_MAC), false);
});
