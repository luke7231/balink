"use client";

import Image from "next/image";
import Link from "next/link";
import { MotionReveal } from "@/components/motion-reveal";
import { AmplitudeEventName } from "@/lib/amplitude-events";
import { trackAmplitudeEvent } from "@/lib/amplitude-client";
import { APP_STORE_URL, PLAY_STORE_URL } from "@/lib/site";

export function DesktopAppPromo() {
  return (
    <aside
      className="desktop-app-promo"
      aria-label="발링크 앱 안내"
    >
      <div className="flex min-h-0 flex-1 flex-col justify-center px-10 py-12 lg:px-14 xl:px-20">
        <MotionReveal index={0} variant="fade-in">
          <Image
            src="/brand/logo-horizontal.png"
            alt="balink"
            width={614}
            height={175}
            priority
            className="h-9 w-auto dark:hidden"
          />
          <Image
            src="/brand/logo-horizontal-dark.png"
            alt="balink"
            width={611}
            height={169}
            priority
            className="hidden h-9 w-auto dark:block"
          />
        </MotionReveal>

        <MotionReveal index={1} variant="fade-up" className="mt-8">
          <h1 className="max-w-md text-3xl font-semibold tracking-tight text-foreground xl:text-4xl">
            전국 모든 채용·대강을 한곳에서!
          </h1>
        </MotionReveal>

        <MotionReveal index={2} variant="fade-up" className="mt-4">
          <p className="max-w-sm text-base leading-relaxed text-muted-foreground">
            앱에서 알림을 받아보세요!
          </p>
        </MotionReveal>

        <MotionReveal index={3} variant="fade-up" className="mt-8">
          <div className="flex flex-wrap gap-3">
            <a
              href={APP_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackAmplitudeEvent(AmplitudeEventName.ClickedAppStore, {
                  store: "ios",
                })
              }
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90"
            >
              <AppleIcon className="h-5 w-5 shrink-0" />
              App Store에서 받기
            </a>
            <a
              href={PLAY_STORE_URL}
              target="_blank"
              rel="noopener noreferrer"
              onClick={() =>
                trackAmplitudeEvent(AmplitudeEventName.ClickedAppStore, {
                  store: "android",
                })
              }
              className="inline-flex h-12 items-center gap-2.5 rounded-full bg-foreground px-5 text-sm font-semibold text-background transition hover:opacity-90"
            >
              <PlayIcon className="h-5 w-5 shrink-0" />
              Google Play에서 받기
            </a>
          </div>
        </MotionReveal>
      </div>

      <footer className="shrink-0 px-10 pb-8 lg:px-14 xl:px-20">
        <nav className="flex flex-wrap gap-x-4 gap-y-1 text-sm text-muted-foreground">
          <Link href="/terms" className="hover:text-foreground">
            이용약관
          </Link>
          <Link href="/privacy" className="hover:text-foreground">
            개인정보처리방침
          </Link>
        </nav>
      </footer>
    </aside>
  );
}

function AppleIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M16.7 12.6c0-2.3 1.9-3.4 2-3.5-1.1-1.6-2.8-1.8-3.4-1.8-1.4-.2-2.8.9-3.5.9-.7 0-1.9-.8-3.1-.8-1.6 0-3.1 1-3.9 2.4-1.7 2.9-.4 7.2 1.2 9.6.8 1.1 1.7 2.4 3 2.4 1.2 0 1.6-.8 3.1-.8s1.8.8 3.1.8c1.3 0 2.1-1.1 2.9-2.2.9-1.3 1.3-2.5 1.3-2.6-.1 0-2.5-1-2.5-3.8zM14.5 5.5c.6-.8 1.1-1.9.9-3-.9 0-2 .6-2.6 1.4-.6.7-1.1 1.8-.9 2.9 1 .1 2-.5 2.6-1.3z" />
    </svg>
  );
}

function PlayIcon({ className }: { className?: string }) {
  return (
    <svg
      className={className}
      viewBox="0 0 24 24"
      fill="currentColor"
      aria-hidden
    >
      <path d="M4.5 2.1a1.1 1.1 0 0 0-1.1 1.1v17.6c0 .9 1 1.4 1.7.9l14.2-8.8a1.1 1.1 0 0 0 0-1.8L5.1 2.3a1.1 1.1 0 0 0-.6-.2z" />
    </svg>
  );
}
