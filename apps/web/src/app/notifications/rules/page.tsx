import { redirect } from "next/navigation";
import { prisma } from "@balink/db";
import { parseNotificationPreference } from "@balink/domain";
import { auth } from "@/auth";
import { BackLink } from "@/components/back-link";
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
    <div className="min-h-full page-bg">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-lg px-4 py-8">
        <BackLink
          href="/notifications"
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          ← 알림함
        </BackLink>

        <div className="mt-6">
          <NotificationRulesList initialPreference={preference} />
        </div>
      </main>
    </div>
  );
}
