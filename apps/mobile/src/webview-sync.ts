/** Cross-tab WebView sync generation. Bumped when auth/bookmark changes. */

export type WebSyncReason = "auth" | "bookmark";

let generation = 0;
let lastReason: WebSyncReason | null = null;

export function bumpWebViewSync(reason?: WebSyncReason): number {
  generation += 1;
  if (reason) lastReason = reason;
  return generation;
}

export function getWebViewSyncGeneration(): number {
  return generation;
}

export function getWebViewSyncReason(): WebSyncReason | null {
  return lastReason;
}
