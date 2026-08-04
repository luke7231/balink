import Image from "next/image";
import Link from "next/link";
import { auth } from "@/auth";
import { signOutAction } from "@/components/login-actions";
import { DEFAULT_AVATAR_PATH } from "@/lib/profile-image";

interface SiteHeaderProps {
  jobCount?: number;
  substituteCount?: number;
}

export async function SiteHeader({ jobCount, substituteCount }: SiteHeaderProps) {
  const session = await auth();
  const user = session?.user;

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

          {user ? (
            <div className="ml-1 flex items-center gap-2 rounded-full border border-zinc-200 bg-white px-2 py-1.5">
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
              <form action={signOutAction}>
                <button
                  type="submit"
                  className="rounded-full px-2.5 py-1 text-xs font-medium text-zinc-500 hover:bg-zinc-100 hover:text-zinc-800"
                >
                  로그아웃
                </button>
              </form>
            </div>
          ) : (
            <Link
              href="/login"
              className="rounded-full bg-zinc-950 px-4 py-2 text-sm font-medium text-white hover:bg-zinc-800"
            >
              로그인
            </Link>
          )}
        </nav>
      </div>
    </header>
  );
}
