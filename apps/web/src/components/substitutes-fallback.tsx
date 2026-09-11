import { SkeletonCard, SkeletonChip } from "@/components/skeleton-block";
import { ListViewToggle } from "@/components/list-view-toggle";
import type { ListViewMode } from "@/lib/list-view-preference";

export function SubstitutesFallback({
  hasFilter = false,
  listView = "card",
  onListViewChange,
}: {
  hasFilter?: boolean;
  listView?: ListViewMode;
  onListViewChange?: (mode: ListViewMode) => void;
}) {
  const skeletonClass =
    listView === "board" ? "h-14 rounded-none first:rounded-t-3xl last:rounded-b-3xl" : undefined;

  return (
    <>
      <div className="mb-6 flex gap-2 overflow-hidden" aria-hidden="true">
        <SkeletonChip index={0} className="h-10 w-20 rounded-full" />
        <SkeletonChip index={1} className="h-10 w-14 rounded-full" />
        <SkeletonChip index={2} className="h-10 w-14 rounded-full" />
        <SkeletonChip index={3} className="h-10 w-20 rounded-full" />
      </div>
      <div
        className="mb-4 flex items-center justify-between gap-3 motion-fade-in"
        style={{ ["--motion-index" as string]: 1 }}
      >
        <h1 className="text-lg font-semibold text-foreground">발레 대강</h1>
        <div className="flex shrink-0 items-center gap-2">
          {onListViewChange ? (
            <ListViewToggle value={listView} onChange={onListViewChange} />
          ) : null}
          <p className="text-sm text-muted-foreground">
            {hasFilter ? "필터 적용 · " : ""}
            불러오는 중
          </p>
        </div>
      </div>
      <div
        className={
          listView === "board"
            ? "overflow-hidden rounded-3xl border border-border bg-surface shadow-sm divide-y divide-border"
            : "space-y-3"
        }
        aria-busy="true"
        aria-label="대강 목록 로딩"
      >
        {[0, 1, 2, 3].map((index) => (
          <SkeletonCard key={index} index={index + 2} className={skeletonClass} />
        ))}
      </div>
    </>
  );
}
