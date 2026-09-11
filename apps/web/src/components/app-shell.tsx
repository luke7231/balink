"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomTabBar, shouldHideBottomTab } from "@/components/bottom-tab-bar";
import { DesktopAppPromo } from "@/components/desktop-app-promo";
import { MobileBridge } from "@/components/mobile-bridge";
import { NativeSyncRefresh } from "@/components/native-sync-refresh";
import { PrefetchTabs } from "@/components/prefetch-tabs";
import { PushPermissionOnboardingSheet } from "@/components/push-permission-onboarding-sheet";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const hideTab = shouldHideBottomTab(pathname);

  return (
    <>
      <MobileBridge />
      <PushPermissionOnboardingSheet />
      <NativeSyncRefresh />
      <PrefetchTabs />
      <div className="desktop-app-stage flex min-h-full min-w-0 flex-1 flex-col">
        <DesktopAppPromo />
        <div className="desktop-app-phone flex min-h-full min-w-0 flex-1 flex-col">
          <div
            className={
              hideTab
                ? "app-shell-content flex min-h-full flex-1 flex-col"
                : "app-shell-content flex min-h-full flex-1 flex-col pb-20"
            }
          >
            {children}
          </div>
          {/* Native shell hides the bar via CSS; keep render path stable for hydration. */}
          {hideTab ? null : <BottomTabBar />}
        </div>
      </div>
    </>
  );
}
