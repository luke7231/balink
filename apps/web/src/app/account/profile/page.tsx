import { redirect } from "next/navigation";
import { prisma } from "@balink/db";
import { auth } from "@/auth";
import { BackLink } from "@/components/back-link";
import { MotionReveal } from "@/components/motion-reveal";
import { ProfileEditForm } from "@/components/profile-edit-form";

export const dynamic = "force-dynamic";

export default async function AccountProfilePage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [user, pendingRequest] = await Promise.all([
    prisma.user.findUnique({
      where: { id: session.user.id },
      select: { name: true, email: true, image: true },
    }),
    prisma.emailChangeRequest.findFirst({
      where: {
        userId: session.user.id,
        expiresAt: { gt: new Date() },
      },
      orderBy: { createdAt: "desc" },
      select: { newEmail: true },
    }),
  ]);

  if (!user) {
    redirect("/login");
  }

  return (
    <main className="page-bg-radial flex min-h-full flex-1 flex-col">
      <div className="mx-auto w-full max-w-lg px-6 py-8">
        <MotionReveal index={0} variant="fade-in">
          <BackLink
            href="/account"
            className="inline-flex items-center text-sm text-muted-foreground hover:text-foreground"
          >
            ← 마이페이지
          </BackLink>
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-6 pb-8">
          <header>
            <h1 className="text-2xl font-bold tracking-tight text-foreground">프로필 편집</h1>
            <p className="mt-2 text-sm text-muted-foreground">
              이름과 사진은 바로 반영되고, 이메일은 인증 후 변경됩니다.
            </p>
          </header>
        </MotionReveal>

        <ProfileEditForm
          initialName={user.name ?? ""}
          initialEmail={user.email}
          initialImage={user.image}
          pendingEmail={pendingRequest?.newEmail ?? null}
        />
      </div>
    </main>
  );
}
