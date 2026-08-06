import { redirect } from "next/navigation";
import { prisma } from "@black-swan/db";
import { parseNotificationPreference } from "@black-swan/domain";
import { auth } from "@/auth";
import { markAllNotificationsReadAction } from "@/components/notification-actions";
import { NotificationItem } from "@/components/notification-item";
import { NotificationRulesOverview } from "@/components/notification-rules-overview";
import { SiteHeader } from "@/components/site-header";
import { fetchHealth } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

export default async function NotificationsPage() {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const [health, notifications, interestRegions, notificationRow] = await Promise.all([
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
  ]);

  const unreadCount = notifications.filter((item) => !item.readAt).length;
  const notificationPreference = parseNotificationPreference(
    notificationRow,
    interestRegions,
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffcfd_0%,#ffffff_140px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-lg px-4 py-8 md:max-w-2xl">
        <NotificationRulesOverview preference={notificationPreference} />

        <section>
          <div className="mb-3 flex items-end justify-between gap-3">
            <h3 className="text-base font-semibold text-zinc-900">받은 알림</h3>
            {unreadCount > 0 ? (
              <form action={markAllNotificationsReadAction}>
                <button
                  type="submit"
                  className="rounded-full border border-zinc-200 bg-white px-3 py-1.5 text-xs font-semibold text-zinc-700 hover:border-rose-200 hover:text-rose-700"
                >
                  모두 읽음
                </button>
              </form>
            ) : null}
          </div>

          {notifications.length === 0 ? (
            <div className="rounded-3xl border border-zinc-200 bg-white px-6 py-12 text-center shadow-sm">
              <p className="text-sm font-medium text-zinc-800">아직 알림이 없습니다</p>
              <p className="mt-2 text-sm text-zinc-500">
                알림 조건에 맞는 공고가 올라오면 여기에 표시됩니다.
              </p>
            </div>
          ) : (
            <ul className="space-y-3">
              {notifications.map((item) => (
                <li key={item.id}>
                  <NotificationItem
                    id={item.id}
                    type={item.type}
                    title={item.title}
                    body={item.body}
                    href={item.href}
                    createdAt={item.createdAt}
                    unread={!item.readAt}
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
