export type PushPermission = "granted" | "denied" | "undetermined" | "unavailable";

export interface PushPermissionPayload {
  permission: PushPermission;
  canAskAgain: boolean;
  checkedAt: string;
}

export interface InstallationCredential {
  installationId: string;
  installationSecret: string;
}

export type HapticStyle = "selection" | "light" | "medium" | "success" | "warning" | "error";

const HAPTIC_STYLES = new Set<HapticStyle>([
  "selection",
  "light",
  "medium",
  "success",
  "warning",
  "error",
]);

export type WebToNativeMessage =
  | { type: "READY" }
  | { type: "GET_PUSH_PERMISSION" }
  | { type: "REQUEST_PUSH_PERMISSION" }
  | { type: "OPEN_NOTIFICATION_SETTINGS" }
  | { type: "HAPTIC"; style: HapticStyle }
  | { type: "NATIVE_NAV"; path: string };

export type NativeToWebMessage =
  | ({ type: "PUSH_PERMISSION_STATUS" } & PushPermissionPayload)
  | ({ type: "PUSH_TOKEN"; expoPushToken: string; platform: "ios" | "android" } & InstallationCredential)
  | ({
      type: "PUSH_INSTALLATION";
      platform: "ios" | "android";
    } & InstallationCredential)
  | { type: "PUSH_OPENED"; href: string };

export function parseWebMessage(value: string): WebToNativeMessage | null {
  try {
    const message = JSON.parse(value) as Partial<WebToNativeMessage> & { style?: string };
    switch (message.type) {
      case "READY":
      case "GET_PUSH_PERMISSION":
      case "REQUEST_PUSH_PERMISSION":
      case "OPEN_NOTIFICATION_SETTINGS":
        return message as WebToNativeMessage;
      case "HAPTIC": {
        if (!message.style || !HAPTIC_STYLES.has(message.style as HapticStyle)) return null;
        return { type: "HAPTIC", style: message.style as HapticStyle };
      }
      case "NATIVE_NAV": {
        const path = typeof (message as { path?: unknown }).path === "string"
          ? (message as { path: string }).path
          : "";
        if (!path.startsWith("/") || path.startsWith("//")) return null;
        return { type: "NATIVE_NAV", path };
      }
      default:
        return null;
    }
  } catch {
    return null;
  }
}

export function serializeNativeMessage(message: NativeToWebMessage): string {
  return JSON.stringify(message).replaceAll("\\", "\\\\").replaceAll("'", "\\'");
}
