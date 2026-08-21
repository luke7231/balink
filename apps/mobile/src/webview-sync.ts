/** Cross-tab WebView sync generation. Bumped when auth/bookmark changes. */

let generation = 0;

export function bumpWebViewSync(): number {
  generation += 1;
  return generation;
}

export function getWebViewSyncGeneration(): number {
  return generation;
}
