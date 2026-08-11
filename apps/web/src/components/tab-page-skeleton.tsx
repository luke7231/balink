import type { CSSProperties } from "react";
import { motionIndexStyle } from "@/lib/motion";

export function TabPageSkeleton() {
  return (
    <div className="min-h-full page-bg">
      <div className="border-b border-accent-border/80 bg-surface/80 px-4 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="motion-shimmer h-8 w-28 rounded" />
          <div className="flex gap-2">
            <div className="motion-shimmer h-8 w-14 rounded-full" />
            <div className="motion-shimmer h-8 w-14 rounded-full" />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <div className="motion-fade-up motion-shimmer h-28 rounded-3xl" style={motionIndexStyle(0)} />
        <div className="motion-fade-up motion-shimmer h-10 rounded-full" style={motionIndexStyle(1)} />
        <div className="space-y-3">
          {[2, 3, 4].map((index) => (
            <div
              key={index}
              className="motion-fade-up motion-shimmer h-24 rounded-2xl"
              style={motionIndexStyle(index) as CSSProperties}
            />
          ))}
        </div>
      </main>
    </div>
  );
}
