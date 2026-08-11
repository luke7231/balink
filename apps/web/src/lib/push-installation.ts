import { createHash, timingSafeEqual } from "node:crypto";
import type { PushPermissionStatus, PushPlatform } from "@balink/db";

const EXPO_PUSH_TOKEN_PATTERN = /^(Exponent|Expo)PushToken\[[A-Za-z0-9_-]+\]$/;
const INSTALLATION_ID_PATTERN = /^[0-9a-f]{8}-[0-9a-f]{4}-[1-8][0-9a-f]{3}-[89ab][0-9a-f]{3}-[0-9a-f]{12}$/i;
const INSTALLATION_SECRET_PATTERN = /^[0-9a-f]{64}$/i;
const PERMISSIONS = new Set<PushPermissionStatus>([
  "granted",
  "denied",
  "undetermined",
  "unavailable",
]);
const PLATFORMS = new Set<PushPlatform>(["ios", "android"]);

export interface InstallationCredentialBody {
  installationId: string;
  installationSecret: string;
}

export interface InstallationUpdateBody extends InstallationCredentialBody {
  expoPushToken: string | null;
  platform: PushPlatform;
  permissionStatus: PushPermissionStatus;
  canAskAgain: boolean;
}

export function parseInstallationCredential(value: unknown): InstallationCredentialBody | null {
  if (!value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  if (
    typeof body.installationId !== "string" ||
    !INSTALLATION_ID_PATTERN.test(body.installationId) ||
    typeof body.installationSecret !== "string" ||
    !INSTALLATION_SECRET_PATTERN.test(body.installationSecret)
  ) {
    return null;
  }
  return {
    installationId: body.installationId,
    installationSecret: body.installationSecret,
  };
}

export function parseInstallationUpdate(value: unknown): InstallationUpdateBody | null {
  const credential = parseInstallationCredential(value);
  if (!credential || !value || typeof value !== "object") return null;
  const body = value as Record<string, unknown>;
  const token = body.expoPushToken == null ? null : body.expoPushToken;
  if (
    (token !== null && (typeof token !== "string" || !EXPO_PUSH_TOKEN_PATTERN.test(token))) ||
    typeof body.platform !== "string" ||
    !PLATFORMS.has(body.platform as PushPlatform) ||
    typeof body.permissionStatus !== "string" ||
    !PERMISSIONS.has(body.permissionStatus as PushPermissionStatus) ||
    typeof body.canAskAgain !== "boolean"
  ) {
    return null;
  }
  return {
    ...credential,
    expoPushToken: token as string | null,
    platform: body.platform as PushPlatform,
    permissionStatus: body.permissionStatus as PushPermissionStatus,
    canAskAgain: body.canAskAgain,
  };
}

export function hashInstallationSecret(secret: string): string {
  return createHash("sha256").update(secret).digest("hex");
}

export function installationSecretMatches(secret: string, expectedHash: string): boolean {
  const actual = Buffer.from(hashInstallationSecret(secret), "hex");
  const expected = Buffer.from(expectedHash, "hex");
  return actual.length === expected.length && timingSafeEqual(actual, expected);
}
