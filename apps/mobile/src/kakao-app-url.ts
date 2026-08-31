import { Linking, Platform } from "react-native";
import { openIntentUri } from "../modules/android-intent/src";

const KAKAO_APP_SCHEMES = [
  "kakaotalk:",
  "kakaokompassauth:",
  "kakaolink:",
  "kakaoplus:",
];

const KAKAO_INTENT_SCHEMES = new Set([
  "kakaotalk",
  "kakaokompassauth",
  "kakaolink",
  "kakaoplus",
]);

const KAKAO_TALK_PACKAGE = "com.kakao.talk";
const KAKAO_CAPRI_ACTION = "com.kakao.talk.intent.action.CAPRI_LOGGED_IN_ACTIVITY";

/**
 * iOS: Safari 조각을 붙여 카카오가 톡 전환을 시도하게 한다.
 * Android: applicationNameForUserAgent로는 `; wv)`를 못 지우므로 userAgent 전체를 쓴다.
 */
export const WEBVIEW_APP_NAME =
  Platform.OS === "ios" ? "Version/18.0 Safari/604.1" : undefined;

/** Android WebView 기본 UA의 `; wv)`를 제거한 Chrome 형태. 카카오가 웹 전용 로그인만 주는 걸 막는다. */
export const WEBVIEW_USER_AGENT =
  Platform.OS === "android"
    ? "Mozilla/5.0 (Linux; Android 14; Mobile) AppleWebKit/537.36 (KHTML, like Gecko) Chrome/131.0.0.0 Mobile Safari/537.36"
    : undefined;

type AndroidIntent = {
  action?: string;
  packageName?: string;
  scheme?: string;
  extras: Record<string, string>;
  fallbackUrl?: string;
};

export type OpenKakaoResult = {
  opened: boolean;
  fallbackUrl?: string;
};

function parseAndroidIntent(intentUrl: string): AndroidIntent | null {
  const trimmed = intentUrl.trim();
  if (!trimmed.toLowerCase().startsWith("intent:")) return null;

  const hashMarker = "#Intent";
  const hashIndex = trimmed.indexOf(hashMarker);
  const intentBody =
    hashIndex >= 0
      ? trimmed.slice(hashIndex + hashMarker.length).replace(/^;/, "")
      : "";

  const extras: Record<string, string> = {};
  let action: string | undefined;
  let packageName: string | undefined;
  let scheme: string | undefined;
  let fallbackUrl: string | undefined;

  for (const segment of intentBody.split(";")) {
    if (!segment || segment === "end") continue;
    const eq = segment.indexOf("=");
    if (eq <= 0) continue;
    const key = segment.slice(0, eq);
    const rawValue = segment.slice(eq + 1);
    let value = rawValue;
    try {
      value = decodeURIComponent(rawValue);
    } catch {
      /* keep raw */
    }

    if (key === "action") {
      action = value;
      continue;
    }
    if (key === "package") {
      packageName = value;
      continue;
    }
    if (key === "scheme") {
      scheme = value;
      continue;
    }
    if (key === "S.browser_fallback_url") {
      fallbackUrl = value;
      continue;
    }
    if (key.startsWith("S.")) {
      extras[key.slice(2)] = value;
    }
  }

  return { action, packageName, scheme, extras, fallbackUrl };
}

function isKakaoAndroidIntent(intent: AndroidIntent): boolean {
  if (intent.packageName === KAKAO_TALK_PACKAGE) return true;
  if (intent.action === KAKAO_CAPRI_ACTION) return true;
  if (intent.action?.toLowerCase().includes("kakao")) return true;
  if (intent.scheme && KAKAO_INTENT_SCHEMES.has(intent.scheme.toLowerCase())) {
    return true;
  }
  return Object.keys(intent.extras).some((key) => key.startsWith("com.kakao."));
}

function resolveKakaoSchemeUrl(url: string): string | null {
  const trimmed = url.trim();
  if (KAKAO_APP_SCHEMES.some((scheme) => trimmed.toLowerCase().startsWith(scheme))) {
    return trimmed;
  }
  if (/^kakao[0-9a-z]+:\/\//i.test(trimmed)) {
    return trimmed;
  }
  return null;
}

export function resolveKakaoExternalUrl(url: string): string | null {
  const schemeUrl = resolveKakaoSchemeUrl(url);
  if (schemeUrl) return schemeUrl;

  if (url.trim().toLowerCase().startsWith("intent:")) {
    const intent = parseAndroidIntent(url);
    if (!intent || !isKakaoAndroidIntent(intent)) return null;
    return url.trim();
  }

  return null;
}

export function isKakaoAppUrl(url: string): boolean {
  const trimmed = url.trim();
  // CAPRI 파싱이 일부 변형 intent 를 놓쳐도 Android 쪽에서 열어보게 한다.
  if (
    Platform.OS === "android" &&
    trimmed.toLowerCase().startsWith("intent:") &&
    /kakao/i.test(trimmed)
  ) {
    return true;
  }
  return resolveKakaoExternalUrl(url) !== null;
}

function extractFallbackUrl(url: string): string | undefined {
  if (!url.toLowerCase().startsWith("intent:")) return undefined;
  return parseAndroidIntent(url)?.fallbackUrl;
}

async function openAndroidKakaoIntent(intentUrl: string): Promise<OpenKakaoResult> {
  const fallbackUrl = extractFallbackUrl(intentUrl);
  try {
    const opened = await openIntentUri(intentUrl);
    return { opened, fallbackUrl };
  } catch {
    return { opened: false, fallbackUrl };
  }
}

export async function openKakaoAppUrl(url: string): Promise<OpenKakaoResult> {
  const trimmed = url.trim();
  const fallbackUrl = extractFallbackUrl(trimmed);

  if (Platform.OS === "android" && trimmed.toLowerCase().startsWith("intent:")) {
    return openAndroidKakaoIntent(trimmed);
  }

  const target = resolveKakaoSchemeUrl(trimmed) ?? resolveKakaoExternalUrl(trimmed) ?? trimmed;
  try {
    await Linking.openURL(target);
    return { opened: true, fallbackUrl };
  } catch {
    return { opened: false, fallbackUrl };
  }
}
