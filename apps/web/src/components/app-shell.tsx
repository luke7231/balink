"use client";

import type { ReactNode } from "react";
import { usePathname } from "next/navigation";
import { BottomTabBar, shouldHideBottomTab } from "@/components/bottom-tab-bar";

export function AppShell({ children }: { children: ReactNode }) {
  const pathname = usePathname() || "/";
  const hideTab = shouldHideBottomTab(pathname);

  return (
    <>
      <div className={hideTab ? "flex min-h-full flex-1 flex-col" : "flex min-h-full flex-1 flex-col pb-20"}>
        {children}
      </div>
      <BottomTabBar />
    </>
  );
}
