import Constants from "expo-constants";
import * as Crypto from "expo-crypto";
import * as Device from "expo-device";
import * as Notifications from "expo-notifications";
import * as SecureStore from "expo-secure-store";
import type { InstallationCredential, PushPermissionPayload } from "./bridge";

const INSTALLATION_ID_KEY = "balink.installation-id";
const INSTALLATION_SECRET_KEY = "balink.installation-secret";

export async function getPushPermission(): Promise<PushPermissionPayload> {
  if (!Device.isDevice) {
    return {
      permission: "unavailable",
      canAskAgain: false,
      checkedAt: new Date().toISOString(),
    };
  }
  const response = await Notifications.getPermissionsAsync();
  // Android often reports "not asked yet" as DENIED with canAskAgain=true.
  // Only treat as permanently denied when the OS will no longer show the prompt.
  const permission =
    response.status === Notifications.PermissionStatus.GRANTED
      ? "granted"
      : response.status === Notifications.PermissionStatus.DENIED && !response.canAskAgain
        ? "denied"
        : "undetermined";
  return {
    permission,
    canAskAgain: response.canAskAgain,
    checkedAt: new Date().toISOString(),
  };
}

export async function getExpoPushToken(): Promise<string | null> {
  const projectId =
    (Constants.expoConfig?.extra?.eas?.projectId as string | undefined) ||
    Constants.easConfig?.projectId;
  if (!projectId) return null;
  try {
    return (await Notifications.getExpoPushTokenAsync({ projectId })).data;
  } catch (error) {
    console.warn("Expo push token 발급 실패", error);
    return null;
  }
}

export async function getOrCreateInstallationCredential(): Promise<InstallationCredential> {
  const existingId = await SecureStore.getItemAsync(INSTALLATION_ID_KEY);
  const existingSecret = await SecureStore.getItemAsync(INSTALLATION_SECRET_KEY);
  if (existingId && existingSecret) {
    return { installationId: existingId, installationSecret: existingSecret };
  }

  const installationId = Crypto.randomUUID();
  const randomBytes = await Crypto.getRandomBytesAsync(32);
  const installationSecret = Array.from(randomBytes, (value) =>
    value.toString(16).padStart(2, "0"),
  ).join("");
  await Promise.all([
    SecureStore.setItemAsync(INSTALLATION_ID_KEY, installationId),
    SecureStore.setItemAsync(INSTALLATION_SECRET_KEY, installationSecret),
  ]);
  return { installationId, installationSecret };
}

export async function requestPushPermission(): Promise<PushPermissionPayload> {
  if (Device.isDevice) {
    await Notifications.requestPermissionsAsync();
  }
  return getPushPermission();
}
