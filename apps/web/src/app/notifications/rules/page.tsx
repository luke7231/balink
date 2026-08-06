import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@black-swan/db";
import { parseNotificationPreference } from "@black-swan/domain";
import { auth } from "@/auth";
import { NotificationRulesList } from "@/components/notification-rules-list";
import { SiteHeader } from "@/components/site-header";
import { fetchHealth } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

export default async function NotificationRulesPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [health, interestRegions, notificationRow] = await Promise.all([
    fetchHealth(),
    prisma.userInterestRegion.findMany({
      where: { userId: session.user.id },
      orderBy: [{ sido: "asc" }, { sigungu: "asc" }],
      select: { sido: true, sigungu: true },
    }),
    prisma.userNotificationPreference.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  const preference = parseNotificationPreference(notificationRow, interestRegions);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffcfd_0%,#ffffff_140px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-lg px-4 py-8">
        <Link href="/notifications" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← 알림함
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">알림 조건</h1>
        <p className="mt-1 text-sm text-zinc-500">
          조건마다 알림을 켜고 끄거나, 수정할 수 있습니다.
        </p>

        <div className="mt-6">
          <NotificationRulesList initialPreference={preference} />
        </div>
      </main>
    </div>
  );
}
