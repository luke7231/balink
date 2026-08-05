import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@black-swan/db";
import { listAdminDistrictGroups, parseNotificationPreference } from "@black-swan/domain";
import { auth } from "@/auth";
import { InterestRegionPicker } from "@/components/interest-region-picker";
import { NotificationPreferenceForm } from "@/components/notification-preference-form";
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
      select: { id: true, sido: true, sigungu: true },
    }),
    prisma.userNotificationPreference.findUnique({
      where: { userId: session.user.id },
    }),
  ]);

  const districtGroups = listAdminDistrictGroups();
  const notificationPreference = parseNotificationPreference(notificationRow);

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffcfd_0%,#ffffff_140px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-lg px-4 py-8">
        <Link href="/notifications" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← 알림함
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">알림 조건</h1>
        <p className="mt-1 text-sm text-zinc-500">관심지역과 정규·대타 조건을 설정합니다.</p>

        <section className="mt-6 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">관심지역</h2>
          <p className="mt-1 text-sm text-zinc-500">지역은 OR로 매칭됩니다.</p>
          <div className="mt-5">
            <InterestRegionPicker
              initialRegions={interestRegions}
              districtGroups={districtGroups}
            />
          </div>
        </section>

        <section className="mt-4 rounded-3xl border border-zinc-200 bg-white p-6 shadow-sm">
          <h2 className="text-base font-semibold text-zinc-900">정규 · 대타 조건</h2>
          <p className="mt-1 text-sm text-zinc-500">요일 AND/OR, 시간대는 OR입니다.</p>
          <div className="mt-5">
            <NotificationPreferenceForm initialPreference={notificationPreference} />
          </div>
        </section>
      </main>
    </div>
  );
}
