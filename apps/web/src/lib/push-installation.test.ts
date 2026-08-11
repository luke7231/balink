import assert from "node:assert/strict";
import test from "node:test";
import {
  hashInstallationSecret,
  installationSecretMatches,
  parseInstallationCredential,
  parseInstallationUpdate,
} from "./push-installation";

const credential = {
  installationId: "5ce9bc09-4064-4a27-a7b7-d2792feab0c4",
  installationSecret: "a".repeat(64),
};

test("accepts a valid installation and Expo token payload", () => {
  assert.deepEqual(parseInstallationUpdate({
    ...credential,
    expoPushToken: "ExpoPushToken[abc_123-def]",
    platform: "ios",
    permissionStatus: "granted",
    canAskAgain: true,
  }), {
    ...credential,
    expoPushToken: "ExpoPushToken[abc_123-def]",
    platform: "ios",
    permissionStatus: "granted",
    canAskAgain: true,
  });
});

test("rejects malformed credentials, token, platform and permission", () => {
  assert.equal(parseInstallationCredential({ ...credential, installationSecret: "short" }), null);
  assert.equal(parseInstallationUpdate({
    ...credential,
    expoPushToken: "not-a-token",
    platform: "ios",
    permissionStatus: "granted",
    canAskAgain: true,
  }), null);
  assert.equal(parseInstallationUpdate({
    ...credential,
    expoPushToken: null,
    platform: "web",
    permissionStatus: "granted",
    canAskAgain: true,
  }), null);
});

test("compares installation secret hashes without exposing the secret", () => {
  const hash = hashInstallationSecret(credential.installationSecret);
  assert.equal(installationSecretMatches(credential.installationSecret, hash), true);
  assert.equal(installationSecretMatches("b".repeat(64), hash), false);
});
