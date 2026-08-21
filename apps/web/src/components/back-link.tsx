"use client";

import Link from "next/link";
import { useRouter } from "next/navigation";
import type { ReactNode } from "react";

/**
 * Prefers stack/history back so list scroll & infinite-scroll state stay.
 * Falls back to `href` when there is no in-app history (deep link, new tab).
 */
export function BackLink({
  href,
  className,
  children,
}: {
  href: string;
  className?: string;
  children: ReactNode;
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

        if (typeof window !== "undefined" && window.history.length > 1) {
          event.preventDefault();
          router.back();
        }
      }}
    >
      {children}
    </Link>
  );
}
