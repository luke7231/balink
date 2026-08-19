import { Linking, Platform } from "react-native";

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

/** iOS만 Safari UA를 붙여 카카오가 앱 전환을 시도하게 한다. Android는 WebView 기본 Chrome UA를 유지한다. */
export const WEBVIEW_APP_NAME =
  Platform.OS === "ios" ? "Version/18.0 Safari/604.1" : undefined;

function resolveKakaoIntentUrl(intentUrl: string): string | null {
  const scheme = /(?:^|;)scheme=([^;]+)/i.exec(intentUrl)?.[1]?.trim();
  const pkg = /(?:^|;)package=([^;]+)/i.exec(intentUrl)?.[1]?.trim();
  const path = /^intent:\/\/([^#]*)/.exec(intentUrl)?.[1] ?? "";

  if (scheme && KAKAO_INTENT_SCHEMES.has(scheme.toLowerCase())) {
    return `${scheme}://${path}`;
  }
  if (pkg === "com.kakao.talk") {
    return `${scheme || "kakaotalk"}://${path}`;
  }
  return null;
}

export function resolveKakaoExternalUrl(url: string): string | null {
  const trimmed = url.trim();
  if (KAKAO_APP_SCHEMES.some((scheme) => trimmed.toLowerCase().startsWith(scheme))) {
    return trimmed;
  }
  if (/^kakao[0-9a-z]+:\/\//i.test(trimmed)) {
    return trimmed;
  }
  if (trimmed.toLowerCase().startsWith("intent:")) {
    return resolveKakaoIntentUrl(trimmed);
  }
  return null;
}

export function isKakaoAppUrl(url: string): boolean {
  return resolveKakaoExternalUrl(url) !== null;
}

export function openKakaoAppUrl(url: string) {
  const target = resolveKakaoExternalUrl(url) ?? url;
  void Linking.openURL(target).catch(() => {
    /* 카카오톡 미설치·에뮬레이터는 웹 로그인으로 이어짐 */
  });
}
