import { redirect } from "next/navigation";
import { prisma } from "@balink/db";
import {
  MAX_NOTIFICATION_RULES,
  createNotificationRuleId,
  defaultNotificationRule,
  formatNotificationRuleTitle,
  isBlankNotificationPreference,
  listAdminDistrictGroups,
  parseNotificationPreference,
} from "@balink/domain";
import { auth } from "@/auth";
import { BackLink } from "@/components/back-link";
import { NotificationSettingsPanel } from "@/components/notification-settings-panel";
import { PushPermissionCallout } from "@/components/push-permission-callout";
import { SiteHeader } from "@/components/site-header";
import { fetchHealth } from "@/lib/graphql/queries";
import { loadRegionLimitState } from "@/lib/referral";

export const dynamic = "force-dynamic";

type SearchParams = Promise<{ ruleId?: string; new?: string; from?: string }>;

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
  const fromInbox = params.from === "inbox";
  const backHref = fromInbox ? "/notifications" : "/notifications/rules";

  if (!wantsNew && !requestedRuleId) {
    redirect("/notifications/rules");
  }

  const [health, interestRegions, notificationRow, regionLimit] = await Promise.all([
    fetchHealth(),
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
    <div className="min-h-full page-bg">
      <SiteHeader jobCount={health.jobCount} substituteCount={health.substituteCount} />

      <main className="mx-auto max-w-lg px-4 py-8">
        <BackLink
          href={backHref}
          preferHref
          className="text-sm text-muted-foreground hover:text-foreground"
        >
          {fromInbox ? "← 알림함" : "← 알림 조건"}
        </BackLink>

        <h1 className="mt-6 text-2xl font-semibold tracking-tight text-foreground">
          {wantsNew ? "알림 조건 추가" : "알림 조건 수정"}
        </h1>
        <p className="mt-1 text-sm text-muted-foreground">
          지역·유형·요일·시간대를 정해 저장하면 알림함에 반영돼요.
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
          isNewRule={wantsNew}
          redirectOnSave={backHref}
          regionUnlocked={regionLimit.unlocked}
          regionReferred={regionLimit.referred}
        />
      </main>
    </div>
  );
}
