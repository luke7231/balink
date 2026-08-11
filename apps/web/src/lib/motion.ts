import type { CSSProperties } from "react";

/** Stagger delay index for CSS `--motion-index`. Cap keeps long lists snappy. */
export function motionIndexStyle(index: number, max = 10): CSSProperties {
  return { "--motion-index": Math.min(index, max) } as CSSProperties;
}
