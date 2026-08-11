import Link from "next/link";
import { redirect } from "next/navigation";
import { prisma } from "@black-swan/db";
import {
  MAX_NOTIFICATION_RULES,
  createNotificationRuleId,
  defaultNotificationRule,
  formatNotificationRuleTitle,
  isBlankNotificationPreference,
  listAdminDistrictGroups,
  parseNotificationPreference,
} from "@black-swan/domain";
import { auth } from "@/auth";
import { NotificationSettingsPanel } from "@/components/notification-settings-panel";
import { PushPermissionCallout } from "@/components/push-permission-callout";
import { SiteHeader } from "@/components/site-header";
import { fetchHealth } from "@/lib/graphql/queries";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ ruleId?: string; new?: string }>;

export default async function NotificationSettingsPage({
  searchParams,
}: {
  searchParams: SearchParams;
}) {
  const session = await auth();
  if (!session?.user?.id) {
    redirect("/login");
  }

  const params = await searchParams;
  const wantsNew = params.new === "1";
  const requestedRuleId = typeof params.ruleId === "string" ? params.ruleId : undefined;

  if (!wantsNew && !requestedRuleId) {
    redirect("/notifications/rules");
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
  let notificationPreference = parseNotificationPreference(
    notificationRow,
    interestRegions,
  );

  let editRuleId = requestedRuleId;

  if (wantsNew) {
    if (isBlankNotificationPreference(notificationPreference)) {
      editRuleId = notificationPreference.rules[0]?.id ?? "default_0";
      notificationPreference = {
        ...notificationPreference,
        enabled: true,
        rules: notificationPreference.rules.map((rule) =>
          rule.id === editRuleId ? { ...rule, enabled: true } : rule,
        ),
      };
    } else if (notificationPreference.rules.length >= MAX_NOTIFICATION_RULES) {
      redirect("/notifications/rules");
    } else {
      const newRule = defaultNotificationRule({
        id: createNotificationRuleId(),
        jobType: notificationPreference.rules.at(-1)?.jobType ?? "regular",
      });
      notificationPreference = {
        ...notificationPreference,
        enabled: true,
        rules: [...notificationPreference.rules, newRule],
      };
      editRuleId = newRule.id;
    }
  }

  if (!editRuleId || !notificationPreference.rules.some((rule) => rule.id === editRuleId)) {
    redirect("/notifications/rules");
  }

  return (
    <div className="min-h-screen bg-[linear-gradient(180deg,#fffcfd_0%,#ffffff_140px)]">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-lg px-4 py-8">
        <Link href="/notifications/rules" className="text-sm text-zinc-500 hover:text-zinc-800">
          ← 알림 조건
        </Link>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-zinc-900">
          {wantsNew ? "알림 조건 추가" : "알림 조건 수정"}
        </h1>
        <p className="mt-1 text-sm text-zinc-500">
          지역·유형·요일·시간대를 정해 저장하면 알림함에 반영됩니다.
        </p>

        <div className="mt-6">
          <PushPermissionCallout
            loggedIn
            serverEnabled={notificationPreference.enabled}
            activeRuleSummaries={notificationPreference.rules
              .filter((rule) => rule.enabled)
              .map(formatNotificationRuleTitle)}
          />
        </div>

        <NotificationSettingsPanel
          initialPreference={notificationPreference}
          districtGroups={districtGroups}
          editRuleId={editRuleId}
        />
      </main>
    </div>
  );
}
