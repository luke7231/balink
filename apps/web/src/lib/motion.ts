import type { CSSProperties } from "react";

/** Stagger delay index for CSS `--motion-index`. Cap keeps long lists snappy. */
export function motionIndexStyle(index: number, max = 10): CSSProperties {
  // String keeps SSR / client style serialization identical.
  return { "--motion-index": String(Math.min(index, max)) } as CSSProperties;
}
