"use client";

import type { ReactNode } from "react";
import { Suspense } from "react";
import { usePathname } from "next/navigation";
import { BottomTabBar, shouldHideBottomTab } from "@/components/bottom-tab-bar";
import { MobileBridge } from "@/components/mobile-bridge";
import { PrefetchTabs } from "@/components/prefetch-tabs";
import { useNativeShell } from "@/lib/native-shell";

function AppShellInner({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const nativeShell = useNativeShell();
  const hideTab = nativeShell || shouldHideBottomTab(pathname);

  return (
    <>
      <MobileBridge />
      {nativeShell ? null : <PrefetchTabs />}
      <div
        className={
          hideTab ? "flex min-h-full flex-1 flex-col" : "flex min-h-full flex-1 flex-col pb-20"
        }
      >
        {children}
      </div>
      {nativeShell ? null : <BottomTabBar />}
    </>
  );
}

export function AppShell({ children }: { children: ReactNode }) {
  return (
    <Suspense fallback={<div className="flex min-h-full flex-1 flex-col">{children}</div>}>
      <AppShellInner>{children}</AppShellInner>
    </Suspense>
  );
}
