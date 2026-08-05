import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@black-swan/db";
import { listAdminDistrictGroups, parseNotificationPreference } from "@black-swan/domain";
import { auth } from "@/auth";
import { NotificationSettingsPanel } from "@/components/notification-settings-panel";
import { SiteHeader } from "@/components/site-header";
import { fetchHealth } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

export default async function NotificationSettingsPage() {
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

  const districtGroups = listAdminDistrictGroups();
  const notificationPreference = parseNotificationPreference(
    notificationRow,
    interestRegions,
  );

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffcfd_0%,#ffffff_140px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-lg px-4 py-8">
        <Link href="/notifications" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← 알림함
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">알림 설정</h1>
        <p className="mt-1 text-sm text-zinc-500">
          지역·유형·요일·시간대를 규칙으로 묶어 여러 개 둘 수 있습니다.
        </p>

        <NotificationSettingsPanel
          initialPreference={notificationPreference}
          districtGroups={districtGroups}
        />
      </main>
    </div>
  );
}
