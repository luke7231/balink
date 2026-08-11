export default function Loading() {
  return (
    <main className="flex min-h-full flex-1 flex-col page-bg-radial">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col items-center justify-center gap-8 px-6 py-8">
        <div className="flex flex-col items-center gap-5">
          <div className="h-10 w-40 rounded-lg bg-surface-muted" aria-hidden="true" />
          <div className="h-9 w-56 rounded-lg bg-surface-muted" aria-hidden="true" />
        </div>
        <div className="flex w-full flex-col gap-3">
          <div className="h-13 w-full rounded-2xl bg-[#FEE500]/80" aria-hidden="true" />
          <div className="h-13 w-full rounded-2xl bg-surface-muted" aria-hidden="true" />
        </div>
      </div>
    </main>
  );
}