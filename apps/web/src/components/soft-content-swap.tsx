"use client";

import { useEffect, useRef, useState, type ReactNode } from "react";

const EASE = "ease-[cubic-bezier(0.16,1,0.3,1)]";

type SoftContentSwapProps = {
  ready: boolean;
  skeleton: ReactNode;
  children: ReactNode;
  /** 스켈레톤 언마운트 전 대기 (페이드 시간과 맞춤) */
  durationMs?: number;
};

/**
 * 스켈레톤 → 실콘텐츠를 하드 스왑하지 않고 겹쳐 크로스페이드한다.
 */
export function SoftContentSwap({
  ready,
  skeleton,
  children,
  durationMs = 520,
}: SoftContentSwapProps) {
  const [keepSkeleton, setKeepSkeleton] = useState(!ready);
  /** 캐시 hit 로 처음부터 ready면 페이드인 생략 */
  const [contentShown, setContentShown] = useState(ready);
  const prevReady = useRef(ready);

  useEffect(() => {
    if (!ready) {
      prevReady.current = false;
      setKeepSkeleton(true);
      setContentShown(false);
      return;
    }

    const becameReady = !prevReady.current;
    prevReady.current = true;

    if (!becameReady) {
      // 처음부터 캐시로 ready
      setKeepSkeleton(false);
      setContentShown(true);
      return;
    }

    const frame = window.requestAnimationFrame(() => {
      setContentShown(true);
    });
    const timer = window.setTimeout(() => setKeepSkeleton(false), durationMs);

    return () => {
      window.cancelAnimationFrame(frame);
      window.clearTimeout(timer);
    };
  }, [ready, durationMs]);

  return (
    <div className="relative min-w-0">
      {keepSkeleton ? (
        <div
          aria-hidden={ready}
          className={`transition-[opacity,transform] duration-500 ${EASE} motion-reduce:transition-none ${
            ready
              ? "pointer-events-none absolute inset-x-0 top-0 z-10 translate-y-1 opacity-0"
              : "translate-y-0 opacity-100"
          }`}
        >
          {skeleton}
        </div>
      ) : null}

      {ready ? (
        <div
          className={`transition-[opacity,transform] duration-500 ${EASE} motion-reduce:transition-none ${
            contentShown ? "translate-y-0 opacity-100" : "translate-y-2 opacity-0"
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
