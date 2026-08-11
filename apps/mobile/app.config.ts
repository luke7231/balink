import { networkInterfaces } from "node:os";
import type { ExpoConfig, ConfigContext } from "expo/config";

const PRODUCTION_WEB_URL = "https://balink-web.vercel.app";
const LOCAL_WEB_PORT = 3100;

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
  version: "0.1.0",
  orientation: "portrait",
  scheme: "balink",
  userInterfaceStyle: "automatic",
  icon: "./assets/icon.png",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.luke7231.balink",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
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
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#ffffff",
    },
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
      },
    ],
  ],
  extra: {
    webUrl,
    eas: {
      projectId:
        process.env.EXPO_PROJECT_ID || "7e0451a0-6b73-42dd-95d6-c44f0a51187a",
    },
  },
});
