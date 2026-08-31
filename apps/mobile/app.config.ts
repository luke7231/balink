import { existsSync, readFileSync } from "node:fs";
import { resolve } from "node:path";
import { networkInterfaces } from "node:os";
import type { ExpoConfig, ConfigContext } from "expo/config";

function applyEnvFile(filePath: string) {
  if (!existsSync(filePath)) return;
  for (const rawLine of readFileSync(filePath, "utf8").split("\n")) {
    const line = rawLine.trim();
    if (!line || line.startsWith("#")) continue;
    const eq = line.indexOf("=");
    if (eq <= 0) continue;
    const key = line.slice(0, eq).trim();
    let value = line.slice(eq + 1).trim();
    if (
      (value.startsWith("'") && value.endsWith("'")) ||
      (value.startsWith('"') && value.endsWith('"'))
    ) {
      value = value.slice(1, -1);
    }
    if (!process.env[key]) process.env[key] = value;
  }
}

applyEnvFile(resolve(__dirname, "../../.env"));
applyEnvFile(resolve(__dirname, ".env"));

const PRODUCTION_WEB_URL = "https://www.balink.co.kr";
const LOCAL_WEB_PORT = 3100;
const kakaoNativeAppKey = process.env.EXPO_PUBLIC_KAKAO_NATIVE_APP_KEY?.trim();
const kakaoScheme = kakaoNativeAppKey ? `kakao${kakaoNativeAppKey}` : null;

function getLanIPv4(): string | null {
  const nets = networkInterfaces();
  for (const entries of Object.values(nets)) {
    for (const entry of entries ?? []) {
      if (entry.family === "IPv4" && !entry.internal) return entry.address;
    }
  }
  return null;
}

function resolveWebUrl(): string {
  const fromEnv = process.env.EXPO_PUBLIC_WEB_URL?.trim();
  if (fromEnv) return fromEnv.replace(/\/$/, "");
  if (process.env.EAS_BUILD === "true") return PRODUCTION_WEB_URL;
  const lan = getLanIPv4();
  if (lan) return `http://${lan}:${LOCAL_WEB_PORT}`;
  return `http://127.0.0.1:${LOCAL_WEB_PORT}`;
}

function isLocalWebUrl(url: string): boolean {
  try {
    const { hostname, protocol } = new URL(url);
    if (protocol !== "http:") return false;
    if (hostname === "localhost" || hostname === "127.0.0.1") return true;
    return /^(10\.|192\.168\.|172\.(1[6-9]|2\d|3[0-1])\.)/.test(hostname);
  } catch {
    return false;
  }
}

const webUrl = resolveWebUrl();
const allowCleartext = isLocalWebUrl(webUrl);

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "발링크",
  slug: "balink",
  owner: "luke7299",
  version: "1.0.1",
  orientation: "portrait",
  scheme: kakaoScheme ? ["balink", kakaoScheme] : "balink",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.luke7231.balink",
    buildNumber: "3",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
      LSApplicationQueriesSchemes: [
        "kakaotalk",
        "kakaokompassauth",
        "kakaolink",
        "kakaoplus",
      ],
      ...(allowCleartext
        ? {
            NSAppTransportSecurity: {
              NSAllowsLocalNetworking: true,
            },
          }
        : {}),
    },
  },
  android: {
    package: "com.luke7231.balink",
    // Prefer EAS file env `GOOGLE_SERVICES_JSON`; local fallback is gitignored.
    googleServicesFile:
      process.env.GOOGLE_SERVICES_JSON ?? "./credentials/google-services.json",
    // 구형 런처용. adaptiveIcon 이 우선이다.
    icon: "./assets/icon-android.png",
    adaptiveIcon: {
      // Android safe zone(지름 ~66%) 안에 들어가게 만든 투명 전경.
      // 넓게 넣으면 갤럭시 스퀘어클 마스크에 b/k 가 잘린다. iOS 는 상위 icon 을 쓴다.
      foregroundImage: "./assets/adaptive-icon.png",
      backgroundColor: "#ffffff",
    },
    ...(kakaoScheme
      ? {
          intentFilters: [
            {
              action: "VIEW",
              category: ["BROWSABLE", "DEFAULT"],
              data: [{ scheme: kakaoScheme }],
            },
          ],
        }
      : {}),
    ...(allowCleartext ? { usesCleartextTraffic: true } : {}),
  },
  plugins: [
    "expo-dev-client",
    [
      "expo-notifications",
      {
        defaultChannel: "match",
      },
    ],
    "expo-secure-store",
    [
      "expo-splash-screen",
      {
        // Android 12+ 는 전체 화면 스플래시를 쓰지 않고 가운데 아이콘만 그린다.
        // iOS 는 legacy 전체 이미지, Android 는 크롭된 스플래시 아이콘 + imageWidth.
        backgroundColor: "#faf7f6",
        image: "./assets/splash-icon.png",
        imageWidth: 200,
        resizeMode: "contain",
        dark: {
          image: "./assets/splash-icon-dark.png",
          backgroundColor: "#09090b",
        },
        ios: {
          image: "./assets/splash.png",
          backgroundColor: "#faf7f6",
          resizeMode: "cover",
          enableFullScreenImage_legacy: true,
          dark: {
            image: "./assets/splash-dark.png",
            backgroundColor: "#09090b",
          },
        },
        android: {
          image: "./assets/splash-icon.png",
          imageWidth: 200,
          resizeMode: "contain",
          backgroundColor: "#faf7f6",
          dark: {
            image: "./assets/splash-icon-dark.png",
            backgroundColor: "#09090b",
          },
        },
      },
    ],
    "./plugins/with-kakao-android",
  ],
  extra: {
    webUrl,
    eas: {
      projectId:
        process.env.EXPO_PROJECT_ID || "7e0451a0-6b73-42dd-95d6-c44f0a51187a",
    },
  },
});
