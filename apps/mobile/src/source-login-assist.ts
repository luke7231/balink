import * as SecureStore from "expo-secure-store";
import { sourceLoginSite, type SourceLoginSite } from "./source-session-hosts";

export type SourceLoginCredential = {
  username: string;
  password: string;
};

export type SourceLoginMessage =
  | { type: "SOURCE_LOGIN_FORM" }
  | { type: "SOURCE_LOGIN_GONE" }
  | { type: "SOURCE_LOGIN_SUBMIT"; username: string; password: string }
  | { type: "SOURCE_LOGIN_REQUIRED"; loginUrl: string; returnUrl: string };

const CREDENTIAL_PREFIX = "balink.source-login.v1.";
const DECLINED_PREFIX = "balink.source-login.declined.v1.";

export const SOURCE_LOGIN_BEFORE_SCRIPT = `
(function () {
  var orig = window.alert;
  window.alert = function (msg) {
    if (msg && /권한이 없습니다|로그인 후 이용/.test(String(msg))) return;
    if (typeof orig === 'function') return orig.apply(window, arguments);
  };
})();
true;
`;

export const SOURCE_LOGIN_DETECT_SCRIPT = `
(function () {
  if (!window.ReactNativeWebView) return;
  function post(payload) {
    window.ReactNativeWebView.postMessage(JSON.stringify(payload));
  }
  function findFields() {
    var user = document.querySelector('input[name="id"]:not([type="hidden"]), input[name="mb_id"]');
    var pass = document.querySelector('input[name="passwd"], input[name="mb_password"]');
    if (!user || !pass) return null;
    return { user: user, pass: pass };
  }
  function isLoginPath() {
    return /\\/login\\.html$/i.test(location.pathname)
      || /\\/bbs\\/login\\.php$/i.test(location.pathname)
      || /rankup_member\\/login/i.test(location.pathname);
  }
  function isDetailOrBlockedPath() {
    var path = location.pathname + location.search;
    if (/employ_detail|working_detail|pay_resume|\\/M\\d+\\/\\d+|wr_id=|board\\.php/i.test(path)) return true;
    var text = (document.body && (document.body.innerText || document.body.textContent)) || '';
    return /글을 읽을 권한이 없습니다|로그인 후 이용/.test(text);
  }
  function loginPageUrl() {
    var origin = location.origin;
    if (/esangdance\\.net$/i.test(location.hostname.replace(/^www\\./, ''))) {
      return origin + '/bbs/login.php?url=' + encodeURIComponent(location.href);
    }
    return origin + '/m/login.html';
  }
  function shouldSendToLogin() {
    if (window.__BALINK_LOGIN_REDIRECT__) return false;
    if (isLoginPath() || findFields()) return false;
    if (!isDetailOrBlockedPath()) return false;
    var text = (document.body && (document.body.innerText || document.body.textContent)) || '';
    if (/로그아웃/.test(text)) return false;
    if (/글을 읽을 권한이 없습니다|로그인 후 이용/.test(text)) return true;
    var hasLoginCta = !!document.querySelector('a[href*="login.html"], a[href*="/bbs/login.php"]');
    var hasDetail = !!(
      document.querySelector('#employ_detail_textarea')
      || document.querySelector('#tmp_content')
      || document.querySelector('#bo_v_con')
    );
    return hasLoginCta && !hasDetail;
  }
  function maybeRedirect() {
    if (!shouldSendToLogin()) return;
    window.__BALINK_LOGIN_REDIRECT__ = true;
    post({ type: 'SOURCE_LOGIN_REQUIRED', loginUrl: loginPageUrl(), returnUrl: location.href });
  }
  function report() {
    post({ type: findFields() ? 'SOURCE_LOGIN_FORM' : 'SOURCE_LOGIN_GONE' });
    maybeRedirect();
  }
  function capture() {
    var fields = findFields();
    if (!fields) return;
    var username = (fields.user.value || '').trim();
    var password = fields.pass.value || '';
    if (!username || !password) return;
    post({ type: 'SOURCE_LOGIN_SUBMIT', username: username, password: password });
  }
  report();
  if (window.__BALINK_SOURCE_LOGIN_HOOK__) return;
  window.__BALINK_SOURCE_LOGIN_HOOK__ = true;
  document.addEventListener('submit', function () { capture(); }, true);
  document.addEventListener('click', function (event) {
    var target = event.target;
    if (!target || !target.closest) return;
    var clickable = target.closest('button, input[type="submit"], input[type="image"], input[type="button"]');
    if (!clickable) return;
    var fields = findFields();
    if (!fields) return;
    if (fields.user.form && !fields.user.form.contains(clickable)) return;
    capture();
  }, true);
  var last = !!findFields();
  var observer = new MutationObserver(function () {
    var found = !!findFields();
    if (found === last) return;
    last = found;
    report();
  });
  observer.observe(document.documentElement, { childList: true, subtree: true });
})();
true;
`;

export function fillSourceLoginScript(username: string, password: string): string {
  return `
(function () {
  var user = document.querySelector('input[name="id"]:not([type="hidden"]), input[name="mb_id"]');
  var pass = document.querySelector('input[name="passwd"], input[name="mb_password"]');
  if (!user || !pass) return;
  var username = ${JSON.stringify(username)};
  var password = ${JSON.stringify(password)};
  user.focus();
  user.value = username;
  user.dispatchEvent(new Event('input', { bubbles: true }));
  user.dispatchEvent(new Event('change', { bubbles: true }));
  pass.focus();
  pass.value = password;
  pass.dispatchEvent(new Event('input', { bubbles: true }));
  pass.dispatchEvent(new Event('change', { bubbles: true }));
})();
true;
`;
}

export function parseSourceLoginMessage(raw: string): SourceLoginMessage | null {
  try {
    const message = JSON.parse(raw) as Partial<SourceLoginMessage> & {
      username?: unknown;
      password?: unknown;
      loginUrl?: unknown;
      returnUrl?: unknown;
    };
    if (message.type === "SOURCE_LOGIN_FORM" || message.type === "SOURCE_LOGIN_GONE") {
      return { type: message.type };
    }
    if (message.type === "SOURCE_LOGIN_REQUIRED") {
      const loginUrl = typeof message.loginUrl === "string" ? message.loginUrl : "";
      const returnUrl = typeof message.returnUrl === "string" ? message.returnUrl : "";
      if (!sourceLoginSite(loginUrl) || !sourceLoginSite(returnUrl)) return null;
      return { type: "SOURCE_LOGIN_REQUIRED", loginUrl, returnUrl };
    }
    if (message.type !== "SOURCE_LOGIN_SUBMIT") return null;
    if (typeof message.username !== "string" || typeof message.password !== "string") return null;
    const username = message.username.trim();
    if (!username || !message.password) return null;
    return { type: "SOURCE_LOGIN_SUBMIT", username, password: message.password };
  } catch {
    return null;
  }
}

export async function getSavedSourceLogin(
  site: SourceLoginSite,
): Promise<SourceLoginCredential | null> {
  try {
    const raw = await SecureStore.getItemAsync(credentialKey(site));
    if (!raw) return null;
    const parsed: unknown = JSON.parse(raw);
    if (!parsed || typeof parsed !== "object") return null;
    const credential = parsed as Partial<SourceLoginCredential>;
    if (!credential.username || !credential.password) return null;
    return { username: credential.username, password: credential.password };
  } catch (error) {
    console.warn("원문 로그인 정보 읽기 실패", error);
    return null;
  }
}

export async function saveSourceLogin(site: SourceLoginSite, credential: SourceLoginCredential) {
  try {
    await SecureStore.setItemAsync(credentialKey(site), JSON.stringify(credential));
    await SecureStore.deleteItemAsync(declinedKey(site));
  } catch (error) {
    console.warn("원문 로그인 정보 저장 실패", error);
  }
}

export async function deleteSourceLogin(site: SourceLoginSite) {
  try {
    await Promise.all([
      SecureStore.deleteItemAsync(credentialKey(site)),
      SecureStore.deleteItemAsync(declinedKey(site)),
    ]);
  } catch (error) {
    console.warn("원문 로그인 정보 삭제 실패", error);
  }
}

export async function clearAllSourceLogins() {
  await Promise.all([deleteSourceLogin("balletmania"), deleteSourceLogin("esangdance")]);
}

export async function isSourceLoginDeclined(site: SourceLoginSite): Promise<boolean> {
  try {
    return (await SecureStore.getItemAsync(declinedKey(site))) === "1";
  } catch {
    return false;
  }
}

export async function declineSourceLogin(site: SourceLoginSite) {
  try {
    await SecureStore.setItemAsync(declinedKey(site), "1");
  } catch (error) {
    console.warn("원문 로그인 저장 거절 실패", error);
  }
}

function credentialKey(site: SourceLoginSite): string {
  return `${CREDENTIAL_PREFIX}${site}`;
}

function declinedKey(site: SourceLoginSite): string {
  return `${DECLINED_PREFIX}${site}`;
}
