import Image from "next/image";
import Link from "next/link";
import { Suspense } from "react";
import { auth } from "@/auth";
import { MobileAwareSignOutForm } from "@/components/mobile-aware-sign-out-form";
import { DEFAULT_AVATAR_PATH } from "@/lib/profile-image";

interface SiteHeaderProps {
  jobCount?: number;
  substituteCount?: number;
}

export function SiteHeader({ jobCount, substituteCount }: SiteHeaderProps) {
  return (
    <header className="border-b border-rose-100/80 bg-white/80 backdrop-blur">
      <div className="mx-auto flex max-w-5xl items-center justify-between gap-4 px-4 py-5">
        <Link href="/" className="shrink-0" aria-label="발링크 홈">
          <Image
            src="/brand/logo-horizontal.png"
            alt="balink"
            width={140}
            height={50}
            priority
            className="h-8 w-auto sm:h-9"
          />
        </Link>

        <div className="flex items-center gap-2">
          <nav className="hidden items-center gap-1 md:flex" aria-label="주요 메뉴">
            <Link
              href="/"
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-rose-50 hover:text-rose-700"
            >
              채용{jobCount != null ? ` (${jobCount})` : ""}
            </Link>
            <Link
              href="/substitutes"
              className="rounded-full px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-rose-50 hover:text-rose-700"
            >
              대강{substituteCount != null ? ` (${substituteCount})` : ""}
            </Link>
            <Suspense fallback={null}>
              <SiteHeaderNotificationsLink />
            </Suspense>
          </nav>

          <Suspense fallback={<div className="h-9 w-20 rounded-full bg-zinc-100" aria-hidden="true" />}>
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
      className="rounded-full px-3 py-2 text-sm font-medium text-zinc-700 hover:bg-rose-50 hover:text-rose-700"
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
      <div className="flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-1.5">
        <Image
          src={user.image || DEFAULT_AVATAR_PATH}
          alt=""
          width={28}
          height={28}
          className="h-7 w-7 rounded-full object-cover"
          unoptimized
        />
        <Link
          href="/account"
          className="max-w-28 truncate text-sm font-medium text-zinc-800 hover:text-rose-700"
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
      className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
    >
      로그인
    </Link>
  );
}
