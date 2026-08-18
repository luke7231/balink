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
 * 스켈레톤 → 실콘텐츠 크로스페이드.
 * ready 직후 스켈레톤을 바로 끄지 않고, 콘텐츠 페인트 준비까지 쉬머를 유지한 뒤 동시에 전환한다.
 */
export function SoftContentSwap({
  ready,
  skeleton,
  children,
  durationMs = 420,
}: SoftContentSwapProps) {
  const [keepSkeleton, setKeepSkeleton] = useState(!ready);
  const [contentShown, setContentShown] = useState(ready);
  /** ready여도 쉬머는 유지. true가 된 뒤에야 스켈레톤 페이드아웃 */
  const [skeletonLeaving, setSkeletonLeaving] = useState(false);
  const prevReady = useRef(ready);

  useEffect(() => {
    if (!ready) {
      prevReady.current = false;
      setKeepSkeleton(true);
      setContentShown(false);
      setSkeletonLeaving(false);
      return;
    }

    const becameReady = !prevReady.current;
    prevReady.current = true;

    if (!becameReady) {
      setKeepSkeleton(false);
      setContentShown(true);
      setSkeletonLeaving(false);
      return;
    }

    let cancelled = false;
    let raf1 = 0;
    let raf2 = 0;
    let yieldTimer = 0;
    let removeTimer = 0;

    const startCrossfade = () => {
      if (cancelled) return;
      // 콘텐츠·스켈레톤을 같은 순간에 크로스페이드 (빈 멈춤 구간 제거)
      setContentShown(true);
      setSkeletonLeaving(true);
      removeTimer = window.setTimeout(() => {
        if (!cancelled) setKeepSkeleton(false);
      }, durationMs);
    };

    // 리스트 커밋/페인트가 끝난 뒤 + 아주 짧게 양보 → 그 동안 쉬머가 계속 돌아야 함
    raf1 = window.requestAnimationFrame(() => {
      raf2 = window.requestAnimationFrame(() => {
        yieldTimer = window.setTimeout(startCrossfade, 32);
      });
    });

    return () => {
      cancelled = true;
      window.cancelAnimationFrame(raf1);
      window.cancelAnimationFrame(raf2);
      window.clearTimeout(yieldTimer);
      window.clearTimeout(removeTimer);
    };
  }, [ready, durationMs]);

  return (
    <div className="relative min-w-0">
      {keepSkeleton ? (
        <div
          aria-hidden={ready}
          className={`transition-[opacity,transform] duration-[420ms] ${EASE} motion-reduce:transition-none ${
            ready ? "pointer-events-none absolute inset-x-0 top-0 z-10" : ""
          } ${
            skeletonLeaving ? "translate-y-1 opacity-0" : "translate-y-0 opacity-100"
          }`}
        >
          {skeleton}
        </div>
      ) : null}

      {ready ? (
        <div
          className={`transition-[opacity,transform] duration-[420ms] ${EASE} motion-reduce:transition-none ${
            contentShown ? "translate-y-0 opacity-100" : "translate-y-1.5 opacity-0"
          }`}
        >
          {children}
        </div>
      ) : null}
    </div>
  );
}
