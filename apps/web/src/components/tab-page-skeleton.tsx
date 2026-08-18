import { SkeletonCard, SkeletonChip } from "@/components/skeleton-block";

export function TabPageSkeleton() {
  return (
    <div className="home-surface min-h-full page-bg">
      <div className="border-b border-accent-border/80 bg-surface/80 px-4 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <SkeletonChip index={0} className="h-8 w-28 rounded" />
          <div className="flex gap-2">
            <SkeletonChip index={1} className="h-8 w-14 rounded-full" />
            <SkeletonChip index={2} className="h-8 w-14 rounded-full" />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <SkeletonCard index={0} className="h-28 rounded-3xl" />
        <SkeletonCard index={1} className="h-10 rounded-full" />
        <div className="space-y-3">
          {[2, 3, 4].map((index) => (
            <SkeletonCard key={index} index={index} className="h-24 rounded-2xl" />
          ))}
        </div>
      </main>
    </div>
  );
}
