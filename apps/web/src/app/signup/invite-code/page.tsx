import { redirect } from "next/navigation";
import { prisma } from "@balink/db";
import { auth } from "@/auth";
import { BackLink } from "@/components/back-link";
import { InviteCodeClaimForm } from "@/components/invite-code-claim-form";
import { MotionReveal } from "@/components/motion-reveal";
import { afterInviteClaimPath, type InviteClaimFrom } from "@/lib/referral";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ from?: string }>;

function parseClaimFrom(raw: string | undefined): InviteClaimFrom {
  if (raw === "account" || raw === "limit") return raw;
  return "signup";
}

function consumeClaimRedirect(next: string) {
  redirect(`/api/referral/consume-claim?next=${encodeURIComponent(next)}`);
}

export default async function InviteCodeClaimPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const user = await prisma.user.findUnique({
    where: { id: session.user.id },
    select: { invitedByUserId: true },
  });

  if (!user) {
    redirect("/login");
  }

  const params = await searchParams;
  const from = parseClaimFrom(params.from);

  if (user.invitedByUserId) {
    consumeClaimRedirect(afterInviteClaimPath(from));
  }

  return (
    <main className="flex min-h-full flex-1 flex-col page-bg-radial">
      <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
        <MotionReveal index={0} variant="fade-in">
          {from === "account" ? (
            <BackLink
              href="/account"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              ← 마이페이지
            </BackLink>
          ) : from === "limit" ? (
            <BackLink
              href="/account/invite"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              ← 관심지역 무제한 열기
            </BackLink>
          ) : (
            <BackLink
              href="/signup/welcome"
              className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
            >
              ← 가입 완료
            </BackLink>
          )}
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-6 pb-6">
          <h1 className="text-2xl font-bold tracking-tight text-foreground">
            친구 코드를 입력해 주세요
          </h1>
          <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
            {from === "signup"
              ? "코드를 넣으면 관심지역이 하나 더 열립니다. 없으면 건너뛰어도 됩니다."
              : "코드를 넣으면 관심지역이 하나 더 열립니다."}
          </p>
        </MotionReveal>

        <InviteCodeClaimForm from={from} />
      </div>
    </main>
  );
}
