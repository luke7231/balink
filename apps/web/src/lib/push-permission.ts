export type PushPermission = "granted" | "denied" | "undetermined" | "unavailable";
export type PushPermissionAction = "request" | "settings" | null;

export function getPushPermissionAction(
  permission: PushPermission,
  canAskAgain: boolean,
): PushPermissionAction {
  if (permission === "granted" || permission === "unavailable") return null;
  return permission === "undetermined" && canAskAgain ? "request" : "settings";
}
