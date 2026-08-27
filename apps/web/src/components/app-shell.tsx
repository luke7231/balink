"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomTabBar, shouldHideBottomTab } from "@/components/bottom-tab-bar";
import { MobileBridge } from "@/components/mobile-bridge";
import { NativeSyncRefresh } from "@/components/native-sync-refresh";
import { PrefetchTabs } from "@/components/prefetch-tabs";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const hideTab = shouldHideBottomTab(pathname);

  return (
    <>
      <MobileBridge />
      <NativeSyncRefresh />
      <PrefetchTabs />
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
    </>
  );
}
