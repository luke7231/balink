import type { CSSProperties } from "react";
import { motionIndexStyle } from "@/lib/motion";

export function HomeFiltersFallback() {
  return (
    <div className="mb-6 flex gap-2 overflow-hidden" aria-hidden="true">
      <div className="motion-shimmer h-10 w-16 shrink-0 rounded-full" />
      <div className="motion-shimmer h-10 w-24 shrink-0 rounded-full" />
      <div className="motion-shimmer h-10 w-28 shrink-0 rounded-full" />
      <div className="motion-shimmer h-10 w-20 shrink-0 rounded-full" />
    </div>
  );
}

export function HomeJobsSectionFallback({ hasFilter }: { hasFilter: boolean }) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h3 className="text-lg font-semibold text-foreground">최신 공고</h3>
        <p className="text-sm text-muted-foreground">
          {hasFilter ? "필터 적용 · " : ""}
          불러오는 중
        </p>
      </div>
      <div className="space-y-3" aria-busy="true" aria-label="공고 목록 로딩">
        {[0, 1, 2, 3].map((index) => (
          <div
            key={index}
            className="motion-fade-up motion-shimmer h-28 rounded-3xl"
            style={motionIndexStyle(index) as CSSProperties}
          />
        ))}
      </div>
    </>
  );
}
