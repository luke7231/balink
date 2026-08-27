"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Prefers stack/history back so list scroll & infinite-scroll state stay.
 * Falls back to `href` when there is no in-app history (deep link, new tab).
 *
 * `preferHref`: skip history.back() and go to `href` so the destination refetches.
 * Use on mutation screens (notification settings) where stale cache is worse
 * than losing scroll. Native still uses NATIVE_BACK (stack pop + WEB_SYNC).
 */
export function BackLink({
  href,
  className,
  children,
  preferHref = false,
}: {
  href: string;
  className?: string;
  children: ReactNode;
  preferHref?: boolean;
}) {
  const router = useRouter();

  return (
    <Link
      href={href}
      className={className}
      onClick={(event) => {
        if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey) return;
        if (event.button !== 0) return;

        if (typeof window !== "undefined" && window.ReactNativeWebView) {
          event.preventDefault();
          window.ReactNativeWebView.postMessage(
            JSON.stringify({ type: "NATIVE_BACK", fallbackPath: href }),
          );
          return;
        }

        if (
          !preferHref &&
          typeof window !== "undefined" &&
          window.history.length > 1
        ) {
          event.preventDefault();
          router.back();
        }
      }}
    >
      {children}
    </Link>
  );
}
