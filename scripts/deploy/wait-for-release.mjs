import { pathToFileURL } from "node:url";

export async function waitForRelease(url, sha, {
  fetchHealth = fetch,
  timeoutMs = 20 * 60_000,
  retryMs = 10_000,
  sleep = (ms) => new Promise((resolve) => setTimeout(resolve, ms)),
  now = Date.now,
} = {}) {
  if (!url || !sha || new URL(url).protocol !== "https:") {
    throw new Error("Usage: node wait-for-release.mjs <https-health-url> <commit-sha>");
  }
  const deadline = now() + timeoutMs;
  while (now() < deadline) {
    try {
      const response = await fetchHealth(url, { cache: "no-store", signal: AbortSignal.timeout(10_000) });
      const health = await response.json();
      if (response.ok && health.ok === true && health.revision === sha) return;
    } catch {
      // Cloudtype may still be building, migrating or replacing the old container.
    }
    await sleep(retryMs);
  }
  throw new Error("Deployment did not become healthy at the requested commit within the timeout. Inspect Cloudtype build and runtime logs.");
}

if (process.argv[1] && import.meta.url === pathToFileURL(process.argv[1]).href) {
  const [url, sha] = process.argv.slice(2);
  try {
    await waitForRelease(url, sha);
    console.info(`Verified healthy release ${sha}`);
  } catch (error) {
    console.error(error.message);
    process.exitCode = 1;
  }
}
