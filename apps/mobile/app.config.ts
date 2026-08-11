import type { ExpoConfig, ConfigContext } from "expo/config";

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
  splash: {
    image: "./assets/splash.png",
    resizeMode: "cover",
    backgroundColor: "#faf7f6",
  },
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.luke7231.balink",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.luke7231.balink",
    adaptiveIcon: {
      foregroundImage: "./assets/icon.png",
      backgroundColor: "#ffffff",
    },
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
  ],
  extra: {
    webUrl: process.env.EXPO_PUBLIC_WEB_URL || "https://balink-web.vercel.app",
    eas: {
      projectId:
        process.env.EXPO_PROJECT_ID || "7e0451a0-6b73-42dd-95d6-c44f0a51187a",
    },
  },
});
