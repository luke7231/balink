export type PushPermission = "granted" | "denied" | "undetermined" | "unavailable";
export type PushPermissionAction = "request" | "settings" | null;

export function getPushPermissionAction(
  permission: PushPermission,
  canAskAgain: boolean,
): PushPermissionAction {
  if (permission === "granted" || permission === "unavailable") return null;
  // Prefer the OS prompt whenever it can still be shown (Android first-launch
  // often looks like denied even before the user has answered).
  return canAskAgain ? "request" : "settings";
}
