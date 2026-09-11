"use client";

import Link from "next/link";
import { useEffect, useState } from "react";
import { OriginalSourceLink } from "@/components/original-source-link";
import {
  HOME_QUICK_SHORTCUTS,
  type HomeQuickShortcut,
} from "@/lib/home-quick-shortcuts";
import {
  SUPPORT_INQUIRY_FORM_TITLE,
  SUPPORT_INQUIRY_FORM_URL,
} from "@/lib/support";

const REGION_CYCLE_MS = 3500;

function pickRandomRegion(regions: readonly string[], exclude?: string): string {
  if (regions.length === 0) return "";
  if (regions.length === 1) return regions[0]!;
  const pool = exclude ? regions.filter((item) => item !== exclude) : regions;
  const choices = pool.length > 0 ? pool : regions;
  return choices[Math.floor(Math.random() * choices.length)]!;
}

function RegionCycleLabel({ regions }: { regions: readonly string[] }) {
  const [label, setLabel] = useState(regions[0] ?? "");
  const [visible, setVisible] = useState(true);

  useEffect(() => {
    if (regions.length === 0) return;
    setLabel(pickRandomRegion(regions));

    if (regions.length <= 1) return;
    const reduceMotion = window.matchMedia("(prefers-reduced-motion: reduce)").matches;
    if (reduceMotion) return;

    let fadeTimer: number | undefined;
    const timer = window.setInterval(() => {
      setVisible(false);
      fadeTimer = window.setTimeout(() => {
        setLabel((current) => pickRandomRegion(regions, current));
        setVisible(true);
      }, 160);
    }, REGION_CYCLE_MS);

    return () => {
      window.clearInterval(timer);
      if (fadeTimer != null) window.clearTimeout(fadeTimer);
    };
  }, [regions]);

  return (
    <span
      aria-hidden
      className={`text-[11px] font-bold leading-none tracking-tight text-foreground transition-opacity duration-150 ${
        visible ? "opacity-100" : "opacity-0"
      }`}
    >
      {label}
    </span>
  );
}

function SunIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <circle cx="12" cy="12" r="4.2" fill="#F59E0B" />
      <path
        d="M12 2.8v2.1M12 19.1V21.2M2.8 12h2.1M19.1 12h2.1M5.2 5.2l1.5 1.5M17.3 17.3l1.5 1.5M18.8 5.2l-1.5 1.5M6.7 17.3l-1.5 1.5"
        stroke="#F59E0B"
        strokeWidth="2"
        strokeLinecap="round"
      />
    </svg>
  );
}

function BellIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M12 3.5c-3.1 0-5.6 2.4-5.6 5.4v2.2c0 .9-.3 1.8-.9 2.5l-.7.8c-.7.8-.1 2.1 1 2.1h13.4c1.1 0 1.7-1.3 1-2.1l-.7-.8c-.6-.7-.9-1.6-.9-2.5V8.9c0-3-2.5-5.4-5.6-5.4Z"
        fill="#8B5CF6"
      />
      <path
        d="M10 18.8a2.2 2.2 0 0 0 4 0"
        stroke="#8B5CF6"
        strokeWidth="2"
        strokeLinecap="round"
      />
      <circle cx="17.2" cy="6.2" r="2.2" fill="#F43F5E" />
    </svg>
  );
}

function ChatIcon() {
  return (
    <svg width="28" height="28" viewBox="0 0 24 24" fill="none" aria-hidden>
      <path
        d="M5 6.5A2.5 2.5 0 0 1 7.5 4h9A2.5 2.5 0 0 1 19 6.5v6A2.5 2.5 0 0 1 16.5 15H10l-3.8 3.2c-.5.4-1.2.1-1.2-.5V6.5Z"
        fill="#0EA5E9"
      />
      <path
        d="M8.5 8.5h7M8.5 11.5h4.5"
        stroke="white"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

const slotClassName =
  "flex h-14 w-14 items-center justify-center rounded-[1.15rem] bg-surface-muted shadow-sm";

function ShortcutBody({ item }: { item: HomeQuickShortcut }) {
  if (item.icon === "bell") {
    return (
      <>
        <span className={`${slotClassName} flex-col gap-0.5`}>
          <BellIcon />
          <RegionCycleLabel regions={item.regions} />
        </span>
        <span className="mt-2 text-center text-[12px] font-medium leading-tight text-foreground">
          {item.label}
        </span>
      </>
    );
  }

  return (
    <>
      <span className={slotClassName}>
        {item.icon === "sun" ? <SunIcon /> : <ChatIcon />}
      </span>
      <span className="mt-2 text-center text-[12px] font-medium leading-tight text-foreground">
        {item.label}
      </span>
    </>
  );
}

export function HomeQuickMenu() {
  return (
    <section aria-label="빠른 메뉴" className="mb-5 min-w-0 max-w-full">
      <div className="flex min-w-0 gap-4 overflow-x-auto overscroll-x-contain pb-1 scrollbar-none">
        {HOME_QUICK_SHORTCUTS.map((item) => {
          if (item.id === "feedback") {
            return (
              <OriginalSourceLink
                key={item.id}
                href={SUPPORT_INQUIRY_FORM_URL}
                title={SUPPORT_INQUIRY_FORM_TITLE}
                className="flex w-[4.25rem] shrink-0 flex-col items-center"
              >
                <ShortcutBody item={item} />
              </OriginalSourceLink>
            );
          }

          return (
            <Link
              key={item.id}
              href={item.href}
              aria-label={item.label}
              className="flex w-[4.25rem] shrink-0 flex-col items-center"
            >
              <ShortcutBody item={item} />
            </Link>
          );
        })}
      </div>
    </section>
  );
}
