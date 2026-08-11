import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@balink/db";
import { parseNotificationPreference } from "@balink/domain";
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
    <div className="min-h-full bg-[linear-gradient(180deg,#fffcfd_0%,#ffffff_140px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-lg px-4 py-8">
        <Link href="/notifications" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← 알림함
        </Link>

        <div className="mt-6">
          <NotificationRulesList initialPreference={preference} />
        </div>
      </main>
    </div>
  );
}
