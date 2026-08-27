import Link from "next/link";
import { prisma } from "@balink/db";
import {
  formatNotificationRuleTitle,
  parseNotificationPreference,
} from "@balink/domain";
import { auth } from "@/auth";
import { markAllNotificationsReadAction } from "@/components/notification-actions";
import { NotificationItem } from "@/components/notification-item";
import { NotificationRulesOverview } from "@/components/notification-rules-overview";
import { PushPermissionCallout } from "@/components/push-permission-callout";
import { EmptyStatePanel } from "@/components/empty-state-panel";
import { SiteHeader } from "@/components/site-header";
import { fetchHealth } from "@/lib/graphql/queries";
import { loadRegionLimitState } from "@/lib/referral";
import { emptyCopy, notificationCopy } from "@/lib/ui-copy";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    const health = await fetchHealth();
    return (
      <div className="min-h-full page-bg">
        <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />
        <main className="mx-auto max-w-lg px-4 py-8">
          <PushPermissionCallout loggedIn={false} serverEnabled={false} />
          <EmptyStatePanel
            title={emptyCopy.notificationsGuest.title}
            description={emptyCopy.notificationsGuest.description}
          >
            <Link
              href="/login"
              className="mt-5 inline-flex rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background"
            >
              {emptyCopy.notificationsGuest.cta}
            </Link>
          </EmptyStatePanel>
        </main>
      </div>
    );
  }

  const [health, notifications, interestRegions, notificationRow, regionLimit] = await Promise.all([
    fetchHealth(),
    prisma.userNotification.findMany({
      where: { userId: session.user.id },
      orderBy: { createdAt: "desc" },
      take: 50,
    }),
    prisma.userInterestRegion.findMany({
      where: { userId: session.user.id },
      orderBy: [{ sido: "asc" }, { sigungu: "asc" }],
      select: { sido: true, sigungu: true },
    }),
    prisma.userNotificationPreference.findUnique({
      where: { userId: session.user.id },
    }),
    loadRegionLimitState(session.user.id),
  ]);

  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const notificationPreference = parseNotificationPreference(
    notificationRow,
    interestRegions,
  );
  const activeRuleSummaries = notificationPreference.rules
    .filter((rule) => rule.enabled)
    .map(formatNotificationRuleTitle);

  return (
    <div className="min-h-full page-bg">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-lg px-4 py-8 md:max-w-2xl">
        <PushPermissionCallout
          loggedIn
          serverEnabled={notificationPreference.enabled}
          activeRuleSummaries={activeRuleSummaries}
        />
        <NotificationRulesOverview
          preference={notificationPreference}
          regionUnlocked={regionLimit.unlocked}
          regionReferred={regionLimit.referred}
        />

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h3 className="text-base font-semibold text-foreground">
              {notificationCopy.inboxTitle}
            </h3>
            {unreadCount > 0 ? (
              <form action={markAllNotificationsReadAction}>
                <button
                  type="submit"
                  className="rounded-full border border-border bg-surface px-3 py-1.5 text-xs font-semibold text-foreground hover:border-accent-border hover:text-accent"
                >
                  {notificationCopy.markAllRead}
                </button>
              </form>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <EmptyStatePanel
              title={emptyCopy.notifications.title}
              description={emptyCopy.notifications.description}
            />
          ) : (
            <ul className="space-y-3">
              {notifications.map((item, index) => (
                <li key={item.id}>
                  <NotificationItem
                    id={item.id}
                    type={item.type}
                    title={item.title}
                    body={item.body}
                    href={item.href}
                    createdAt={item.createdAt}
                    unread={!item.readAt}
                    index={index}
                  />
                </li>
              ))}
            </ul>
          )}
        </section>
      </main>
    </div>
  );
}
