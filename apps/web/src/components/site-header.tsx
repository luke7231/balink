import Link from "next/link";

interface SiteHeaderProps {
  jobCount?: number;
  substituteCount?: number;
}

export function SiteHeader({ jobCount, substituteCount }: SiteHeaderProps) {
  return (
    <header className="border-b border-rose-100/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl flex-col gap-4 px-4 py-5 sm:flex-row sm:items-center sm:justify-between">
        <div>
          <p className="text-sm font-medium text-rose-600">Black Swan</p>
          <h1 className="text-2xl font-bold tracking-tight text-zinc-900">발레 강사 구인 알림</h1>
        </div>

        <nav className="flex flex-wrap items-center gap-2">
          <Link
            href="/"
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-rose-50 hover:text-rose-700"
          >
            채용공고{jobCount != null ? ` (${jobCount})` : ""}
          </Link>
          <Link
            href="/substitutes"
            className="rounded-full px-4 py-2 text-sm font-medium text-zinc-700 hover:bg-rose-50 hover:text-rose-700"
          >
            대타 게시판{substituteCount != null ? ` (${substituteCount})` : ""}
          </Link>
        </nav>
      </div>
    </header>
  );
}
