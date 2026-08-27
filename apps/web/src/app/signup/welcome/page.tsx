import { redirect } from "next/navigation";
import { prisma } from "@balink/db";
import { auth } from "@/auth";
import { MotionReveal } from "@/components/motion-reveal";
import { PostAuthHomeRedirect } from "@/components/post-auth-home-redirect";
import { SignupWelcomeActions } from "@/components/signup-welcome-actions";
import {
  hasClaimInviteCookie,
} from "@/lib/referral-cookie";

export const dynamic = "force-dynamic";

export default async function SignupWelcomePage() {
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

  if (user.invitedByUserId) {
    return <PostAuthHomeRedirect />;
  }

  // Open claim prompt wins over a leftover device "done" cookie.
  if (await hasClaimInviteCookie()) {
    return (
      <main className="flex min-h-full flex-1 flex-col page-bg-radial">
        <div className="mx-auto flex w-full max-w-md flex-1 flex-col px-6 py-8">
          <MotionReveal index={0} variant="fade-in">
            <p className="text-sm text-muted-foreground">발링크</p>
          </MotionReveal>

          <MotionReveal index={1} variant="fade-up" className="mt-6">
            <h1 className="text-2xl font-bold tracking-tight text-foreground">
              가입이 완료되었어요
            </h1>
            <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
              공유받은 친구 코드가 있으면 관심지역이 하나 더 열립니다. 없으면 건너뛰어도
              됩니다.
            </p>
          </MotionReveal>

          <SignupWelcomeActions />
        </div>
      </main>
    );
  }

  // Skipped before, or returning login with no prompt.
  return <PostAuthHomeRedirect />;
}
