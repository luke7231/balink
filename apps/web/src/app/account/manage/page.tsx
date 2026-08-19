import Link from "next/link";
import { redirect } from "next/navigation";
import { auth } from "@/auth";
import { AccountDeletion } from "@/components/account-deletion";
import { AccountSignOut } from "@/components/account-sign-out";

export default async function AccountManagePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  return (
    <main className="page-bg-radial flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <Link
          href="/account"
          className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
        >
          ← 마이페이지
        </Link>

        <header className="mt-6 pb-8">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">계정 관리</h1>
          <p className="mt-2 text-sm text-muted-foreground">
            로그인 상태와 발링크 계정을 관리합니다.
          </p>
        </header>

        <AccountSignOut />
        <AccountDeletion />
      </div>
    </main>
  );
}
