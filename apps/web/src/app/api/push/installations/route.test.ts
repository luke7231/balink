import assert from "node:assert/strict";
import test from "node:test";
import { POST } from "./route";

test("push installation API returns 400 for malformed Expo token", async () => {
  const response = await POST(
    new Request("http://localhost/api/push/installations", {
      method: "POST",
      headers: { "content-type": "application/json" },
      body: JSON.stringify({
        installationId: "5ce9bc09-4064-4a27-a7b7-d2792feab0c4",
        installationSecret: "a".repeat(64),
        expoPushToken: "invalid",
        platform: "ios",
        permissionStatus: "granted",
        canAskAgain: true,
      }),
    }),
  );
  assert.equal(response.status, 400);
});
