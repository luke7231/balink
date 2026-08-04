import Link from "next/link";
import Image from "next/image";
import { redirect } from "next/navigation";
import { prisma } from "@black-swan/db";
import { listAdminDistrictGroups } from "@black-swan/domain";
import { auth } from "@/auth";
import { deleteAccountAction } from "@/components/account-actions";
import { InterestRegionPicker } from "@/components/interest-region-picker";
import { DEFAULT_AVATAR_PATH } from "@/lib/profile-image";

export default async function AccountPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = session.user;
  const interestRegions = await prisma.userInterestRegion.findMany({
    where: { userId: user.id },
    orderBy: [{ sido: "asc" }, { sigungu: "asc" }],
    select: { id: true, sido: true, sigungu: true },
  });
  const districtGroups = listAdminDistrictGroups();

  return (
    <main className="flex min-h-full flex-1 flex-col bg-[radial-gradient(circle_at_top,#fff1f2,#ffffff_55%)]">
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <Link href="/" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← 홈으로
        </Link>

        <section className="mt-8 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h1 className="text-xl font-bold tracking-tight text-zinc-900">내 계정</h1>
          <p className="mt-1 text-sm text-zinc-500">프로필과 관심지역</p>

          <div className="mt-6 flex items-center gap-3">
            <Image
              src={user.image || DEFAULT_AVATAR_PATH}
              alt=""
              width={48}
              height={48}
              className="h-12 w-12 rounded-full object-cover"
              unoptimized
            />
            <div>
              <p className="font-semibold text-zinc-900">{user.name ?? "회원"}</p>
              <p className="text-sm text-zinc-500">{user.email ?? "이메일 없음"}</p>
            </div>
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">저장한 공고</h2>
          <p className="mt-1 text-sm text-zinc-500">관심 있는 채용 공고를 모아 볼 수 있습니다.</p>
          <Link
            href="/saved"
            className="mt-4 inline-flex rounded-full border border-zinc-200 bg-white px-4 py-2.5 text-sm font-semibold text-zinc-800 hover:border-rose-200 hover:text-rose-700"
          >
            저장한 공고 보기
          </Link>
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">관심지역</h2>
          <p className="mt-1 text-sm text-zinc-500">
            알림을 받을 시·군·구를 원하는 만큼 추가하세요.
          </p>
          <div className="mt-5">
            <InterestRegionPicker
              initialRegions={interestRegions}
              districtGroups={districtGroups}
            />
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-rose-200 bg-rose-50/60 p-6">
          <h2 className="text-base font-semibold text-rose-900">계정 삭제</h2>
          <p className="mt-2 text-sm leading-relaxed text-rose-800/90">
            블랙스완 회원 정보가 삭제되고, 카카오 연결도 해제(unlink)를 시도합니다.
            삭제 후에는 같은 카카오로 다시 가입할 수 있습니다.
          </p>

          <form action={deleteAccountAction} className="mt-5">
            <button
              type="submit"
              className="rounded-full bg-rose-700 px-4 py-2.5 text-sm font-semibold text-white hover:bg-rose-800"
            >
              계정 삭제하기
            </button>
          </form>

          <div className="mt-5 space-y-2 text-xs leading-relaxed text-rose-900/70">
            <p className="font-medium text-rose-900/90">카카오에서 직접 끊는 방법</p>
            <p>
              1.{" "}
              <a
                href="https://accounts.kakao.com"
                target="_blank"
                rel="noreferrer"
                className="underline"
              >
                카카오계정
              </a>{" "}
              로그인
            </p>
            <p>2. 연결된 서비스 관리 → 블랙스완(앱 이름) → 연결 끊기</p>
            <p>또는 카카오톡 → 설정 → 카카오계정 → 연결된 서비스</p>
          </div>
        </section>
      </div>
    </main>
  );
}
