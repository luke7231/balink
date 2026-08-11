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

export type WebToNativeMessage =
  | { type: "READY" }
  | { type: "GET_PUSH_PERMISSION" }
  | { type: "REQUEST_PUSH_PERMISSION" }
  | { type: "OPEN_NOTIFICATION_SETTINGS" };

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
    const message = JSON.parse(value) as Partial<WebToNativeMessage>;
    switch (message.type) {
      case "READY":
      case "GET_PUSH_PERMISSION":
      case "REQUEST_PUSH_PERMISSION":
      case "OPEN_NOTIFICATION_SETTINGS":
        return message as WebToNativeMessage;
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
