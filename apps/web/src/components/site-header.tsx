import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { MobileAwareSignOutForm } from "@/components/mobile-aware-sign-out-form";
import { ProfileAvatar } from "@/components/profile-avatar";

interface SiteHeaderProps {
  jobCount?: number;
  substituteCount?: number;
}

export function SiteHeader({ jobCount, substituteCount }: SiteHeaderProps) {
  return (
    <header className="border-b border-accent-border/80 bg-surface/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5">
        <Link href="/" className="shrink-0" aria-label="발링크 홈">
          <Image
            src="/brand/logo-horizontal.png"
            alt="balink"
            width={614}
            height={175}
            priority
            className="h-8 w-auto dark:hidden sm:h-9"
          />
          <Image
            src="/brand/logo-horizontal-dark.png"
            alt="balink"
            width={611}
            height={169}
            priority
            className="hidden h-8 w-auto dark:block sm:h-9"
          />
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 md:flex" aria-label="주요 메뉴">
            <Link
              href="/"
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground hover:bg-accent-subtle hover:text-accent"
            >
              채용{jobCount != null ? ` (${jobCount})` : ""}
            </Link>
            <Link
              href="/substitutes"
              className="rounded-full px-3 py-2 text-sm font-medium text-foreground hover:bg-accent-subtle hover:text-accent"
            >
              대강{substituteCount != null ? ` (${substituteCount})` : ""}
            </Link>
            <Suspense fallback={null}>
              <SiteHeaderNotificationsLink />
            </Suspense>
          </nav>

          <Suspense fallback={<div className="h-9 w-20 rounded-full bg-surface-muted motion-shimmer" aria-hidden="true" />}>
            <SiteHeaderAuth />
          </Suspense>
        </div>
      </div>
    </header>
  );
}

async function SiteHeaderNotificationsLink() {
  const session = await auth();
  if (!session?.user) return null;
  return (
    <Link
      href="/notifications"
      className="rounded-full px-3 py-2 text-sm font-medium text-foreground hover:bg-accent-subtle hover:text-accent"
    >
      알림
    </Link>
  );
}

async function SiteHeaderAuth() {
  const session = await auth();
  const user = session?.user;

  if (user) {
    return (
      <div className="motion-fade-in flex items-center gap-2 rounded-full border border-border bg-surface px-2 py-1.5">
        <ProfileAvatar
          src={user.image}
          size={28}
          className="h-7 w-7 rounded-full object-cover"
        />
        <Link
          href="/account"
          className="max-w-28 truncate text-sm font-medium text-foreground hover:text-accent"
        >
          {user.name ?? "회원"}
        </Link>
        <MobileAwareSignOutForm className="hidden sm:block" />
      </div>
    );
  }

  return (
    <Link
      href="/login"
      className="motion-fade-in rounded-full bg-foreground px-4 py-2 text-sm font-medium text-background hover:opacity-90"
    >
      로그인
    </Link>
  );
}
