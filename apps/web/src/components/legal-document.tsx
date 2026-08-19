import Link from "next/link";
import type { ReactNode } from "react";

export function LegalDocument({
  title,
  effectiveDate,
  children,
}: {
  title: string;
  effectiveDate: string;
  children: ReactNode;
}) {
  return (
    <main className="page-bg min-h-full flex-1">
      <div className="mx-auto w-full max-w-lg px-4 py-8">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← 마이페이지
        </Link>

        <header className="mt-6 rounded-3xl border border-border bg-surface p-6 shadow-sm">
          <p className="text-sm font-semibold text-accent">발링크</p>
          <h1 className="mt-1 text-2xl font-bold tracking-tight text-foreground">{title}</h1>
          <p className="mt-3 text-xs text-muted-foreground">시행일: {effectiveDate}</p>
        </header>

        <div className="mt-4 space-y-3">{children}</div>

        <p className="py-8 text-center text-xs text-muted-foreground">
          © {new Date().getFullYear()} 발링크
        </p>
      </div>
    </main>
  );
}

export function LegalSection({
  title,
  children,
}: {
  title: string;
  children: ReactNode;
}) {
  return (
    <section className="rounded-2xl border border-border bg-surface p-5 shadow-sm">
      <h2 className="text-sm font-bold leading-relaxed text-foreground">{title}</h2>
      <div className="mt-3 space-y-2 text-sm leading-7 text-muted-foreground">{children}</div>
    </section>
  );
}
