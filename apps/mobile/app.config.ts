import type { ExpoConfig, ConfigContext } from "expo/config";

export default ({ config }: ConfigContext): ExpoConfig => ({
  ...config,
  name: "블랙스완",
  slug: "black-swan",
  owner: "luke7299",
  version: "0.1.0",
  orientation: "portrait",
  scheme: "blackswan",
  userInterfaceStyle: "automatic",
  ios: {
    supportsTablet: false,
    bundleIdentifier: "com.luke7231.blackswan",
    infoPlist: {
      ITSAppUsesNonExemptEncryption: false,
    },
  },
  android: {
    package: "com.luke7231.blackswan",
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
    webUrl: process.env.EXPO_PUBLIC_WEB_URL || "https://black-swan-web.vercel.app",
    eas: {
      projectId:
        process.env.EXPO_PROJECT_ID || "7decf845-280c-4fb1-9931-f3a766ed1bd7",
    },
  },
});
