"use client";

import type { ReactNode } from "react";
import { motionIndexStyle } from "@/lib/motion";

type MotionRevealProps = {
  children: ReactNode;
  index?: number;
  variant?: "fade-up" | "fade-in" | "soft-scale";
  className?: string;
  /** 내용이 바뀌면 애니메이션을 다시 재생 */
  remountKey?: string | number;
};

const VARIANT_CLASS = {
  "fade-up": "motion-fade-up",
  "fade-in": "motion-fade-in",
  "soft-scale": "motion-soft-scale",
} as const;

export function MotionReveal({
  children,
  index = 0,
  variant = "soft-scale",
  className = "",
  remountKey,
}: MotionRevealProps) {
  return (
    <div
      key={remountKey}
      className={`${VARIANT_CLASS[variant]} ${className}`.trim()}
      style={motionIndexStyle(index)}
    >
      {children}
    </div>
  );
}
