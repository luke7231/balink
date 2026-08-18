import type { CSSProperties } from "react";
import { motionIndexStyle } from "@/lib/motion";

/** 등장 모션과 쉬머를 분리 — 같은 노드에 두면 animation 이 덮어써져 뚝뚝 끊김 */
export function SkeletonChip({
  className,
  index = 0,
}: {
  className: string;
  index?: number;
}) {
  return (
    <div className="motion-fade-up shrink-0" style={motionIndexStyle(index) as CSSProperties}>
      <div className={`motion-shimmer ${className}`} />
    </div>
  );
}

export function SkeletonCard({
  className = "h-28 rounded-3xl",
  index = 0,
}: {
  className?: string;
  index?: number;
}) {
  return (
    <div className="motion-fade-up" style={motionIndexStyle(index) as CSSProperties}>
      <div className={`motion-shimmer w-full ${className}`} />
    </div>
  );
}
