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
export type ThemePreference = "system" | "light" | "dark";
export type ResolvedTheme = "light" | "dark";

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
  | { type: "NATIVE_NAV"; path: string }
  | { type: "SET_THEME"; preference: ThemePreference };

export type NativeToWebMessage =
  | ({ type: "PUSH_PERMISSION_STATUS" } & PushPermissionPayload)
  | ({ type: "PUSH_TOKEN"; expoPushToken: string; platform: "ios" | "android" } & InstallationCredential)
  | ({
      type: "PUSH_INSTALLATION";
      platform: "ios" | "android";
    } & InstallationCredential)
  | { type: "PUSH_OPENED"; href: string }
  | {
      type: "THEME_STATE";
      preference: ThemePreference;
      resolvedTheme: ResolvedTheme;
    };

function isThemePreference(value: unknown): value is ThemePreference {
  return value === "system" || value === "light" || value === "dark";
}

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
      case "SET_THEME": {
        const preference = (message as { preference?: unknown }).preference;
        if (!isThemePreference(preference)) return null;
        return { type: "SET_THEME", preference };
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
