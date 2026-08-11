export function TabPageSkeleton() {
  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffcfd_0%,#ffffff_140px)]">
      <div className="border-b border-rose-100/80 bg-white/80 px-4 py-5">
        <div className="mx-auto flex max-w-5xl items-center justify-between gap-4">
          <div className="h-8 w-28 animate-pulse rounded bg-zinc-100" />
          <div className="flex gap-2">
            <div className="h-8 w-14 animate-pulse rounded-full bg-zinc-100" />
            <div className="h-8 w-14 animate-pulse rounded-full bg-zinc-100" />
          </div>
        </div>
      </div>
      <main className="mx-auto max-w-5xl space-y-4 px-4 py-8">
        <div className="h-28 animate-pulse rounded-3xl bg-zinc-100" />
        <div className="h-10 animate-pulse rounded-full bg-zinc-100" />
        <div className="space-y-3">
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
          <div className="h-24 animate-pulse rounded-2xl bg-zinc-100" />
        </div>
      </main>
    </div>
  );
}
