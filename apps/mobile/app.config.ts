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
  version: "1.0.0",
  orientation: "portrait",
  scheme: kakaoScheme ? ["balink", kakaoScheme] : "balink",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.luke7231.balink",
    buildNumber: "1",
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
    googleServicesFile: "./google-services.json",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
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
        image: "./assets/splash.png",
        backgroundColor: "#faf7f6",
        resizeMode: "cover",
        enableFullScreenImage_legacy: true,
        dark: {
          image: "./assets/splash-dark.png",
          backgroundColor: "#09090b",
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
