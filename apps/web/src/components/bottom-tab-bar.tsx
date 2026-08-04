"use client";

import Link from "next/link";
import { usePathname } from "next/navigation";

const tabs = [
  {
    href: "/",
    label: "채용",
    match: (pathname: string) => pathname === "/",
    icon: BriefcaseIcon,
  },
  {
    href: "/substitutes",
    label: "대타",
    match: (pathname: string) => pathname === "/substitutes",
    icon: CalendarIcon,
  },
  {
    href: "/saved",
    label: "저장",
    match: (pathname: string) => pathname === "/saved",
    icon: BookmarkIcon,
  },
  {
    href: "/account",
    label: "마이",
    match: (pathname: string) => pathname.startsWith("/account") || pathname === "/login",
    icon: UserIcon,
  },
] as const;

export function shouldHideBottomTab(pathname: string) {
  if (pathname === "/login") return true;
  if (pathname.startsWith("/jobs/")) return true;
  if (pathname.startsWith("/substitutes/") && pathname !== "/substitutes") return true;
  return false;
}

export function BottomTabBar() {
  const pathname = usePathname() || "/";
  if (shouldHideBottomTab(pathname)) return null;

  return (
    <nav
      aria-label="하단 메뉴"
      className="fixed inset-x-0 bottom-0 z-40 border-t border-zinc-200/80 bg-white/95 backdrop-blur"
      style={{ paddingBottom: "env(safe-area-inset-bottom)" }}
    >
      <ul className="mx-auto flex h-[64px] max-w-lg items-stretch">
        {tabs.map((tab) => {
          const active = tab.match(pathname);
          const Icon = tab.icon;
          return (
            <li key={tab.href} className="flex-1">
              <Link
                href={tab.href}
                aria-current={active ? "page" : undefined}
                className={`flex h-full flex-col items-center justify-center gap-1 text-[11px] font-medium transition ${
                  active ? "text-zinc-900" : "text-zinc-400 hover:text-zinc-600"
                }`}
              >
                <Icon active={active} />
                <span>{tab.label}</span>
              </Link>
            </li>
          );
        })}
      </ul>
    </nav>
  );
}

function BriefcaseIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <path
        d="M8 7V5.5A1.5 1.5 0 0 1 9.5 4h5A1.5 1.5 0 0 1 16 5.5V7"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
      />
      <rect
        x="3.75"
        y="7"
        width="16.5"
        height="12.5"
        rx="2"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.12 : 0}
      />
      <path
        d="M3.75 12h16.5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

function CalendarIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <rect
        x="3.75"
        y="5"
        width="16.5"
        height="15"
        rx="2"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.12 : 0}
      />
      <path
        d="M8 3.5V6.5M16 3.5V6.5M3.75 9.5h16.5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}

function BookmarkIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" aria-hidden="true">
      {active ? (
        <path
          fill="currentColor"
          d="M6 3.75A2.25 2.25 0 0 1 8.25 1.5h7.5A2.25 2.25 0 0 1 18 3.75v18.19a.75.75 0 0 1-1.2.6L12 18.75l-4.8 3.79a.75.75 0 0 1-1.2-.6V3.75Z"
        />
      ) : (
        <path
          fill="none"
          stroke="currentColor"
          strokeWidth="1.8"
          strokeLinecap="round"
          strokeLinejoin="round"
          d="M6.75 3.75h10.5A1.5 1.5 0 0 1 18.75 5.25v15.19a.75.75 0 0 1-1.2.6L12 17.25l-5.55 3.79a.75.75 0 0 1-1.2-.6V5.25a1.5 1.5 0 0 1 1.5-1.5Z"
        />
      )}
    </svg>
  );
}

function UserIcon({ active }: { active: boolean }) {
  return (
    <svg viewBox="0 0 24 24" className="h-[22px] w-[22px]" fill="none" aria-hidden="true">
      <circle
        cx="12"
        cy="8"
        r="3.5"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        fill={active ? "currentColor" : "none"}
        fillOpacity={active ? 0.12 : 0}
      />
      <path
        d="M5 19.5c1.5-3.2 4-4.8 7-4.8s5.5 1.6 7 4.8"
        stroke="currentColor"
        strokeWidth={active ? 2.2 : 1.7}
        strokeLinecap="round"
      />
    </svg>
  );
}
