import { SkeletonCard, SkeletonChip } from "@/components/skeleton-block";

export function HomeFiltersFallback() {
  return (
    <div className="mb-6 flex gap-2 overflow-hidden" aria-hidden="true">
      <SkeletonChip index={0} className="h-10 w-16 rounded-full" />
      <SkeletonChip index={1} className="h-10 w-24 rounded-full" />
      <SkeletonChip index={2} className="h-10 w-28 rounded-full" />
      <SkeletonChip index={3} className="h-10 w-20 rounded-full" />
    </div>
  );
}

export function HomeJobsSectionFallback({ hasFilter }: { hasFilter: boolean }) {
  return (
    <>
      <div className="mb-4 flex items-center justify-between">
        <h1 className="text-lg font-semibold text-foreground">발레 강사 채용</h1>
        <p className="text-sm text-muted-foreground">
          {hasFilter ? "필터 적용 · " : ""}
          불러오는 중
        </p>
      </div>
      <div className="space-y-3" aria-busy="true" aria-label="공고 목록 로딩">
        {[0, 1, 2, 3].map((index) => (
          <SkeletonCard key={index} index={index} />
        ))}
      </div>
    </>
  );
}
