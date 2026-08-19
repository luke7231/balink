"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { isSafeHttpUrl, openInAppBrowser } from "@/lib/native-shell";

interface OriginalSourceLinkProps {
  href: string;
  embedHref?: string;
  title?: string;
  className?: string;
  children: ReactNode;
}

function hostnameOf(url: string): string | null {
  try {
    return new URL(url).hostname.replace(/^www\./, "");
  } catch {
    return null;
  }
}

export function OriginalSourceLink({
  href,
  embedHref,
  title = "원문",
  className,
  children,
}: OriginalSourceLinkProps) {
  const [open, setOpen] = useState(false);
  const [loading, setLoading] = useState(true);
  const host = hostnameOf(href);
  const frameSrc = embedHref ?? href;
  const scrollParent = isGoogleFormUrl(frameSrc);

  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    if (!isSafeHttpUrl(href)) return;
    if (openInAppBrowser(href, title)) {
      // 구버전 네이티브는 메시지를 무시하므로, 기본 이동은 막지 않는다.
      // 신버전은 클릭 인터셉트가 preventDefault 한다.
      return;
    }
    event.preventDefault();
    setLoading(true);
    setOpen(true);
  }

  return (
    <>
      <a
        href={href}
        target="_blank"
        rel="noopener noreferrer"
        className={className}
        data-browser-title={title}
        onClick={handleClick}
      >
        {children}
      </a>
      <BottomSheet
        open={open}
        title={title}
        fill
        onClose={() => setOpen(false)}
        headerAction={
          <a
            href={href}
            target="_blank"
            rel="noopener noreferrer"
            className="rounded-full px-3 py-1.5 text-sm font-medium text-accent hover:bg-accent-subtle"
          >
            브라우저
          </a>
        }
      >
        <div
          className={
            scrollParent
              ? "relative h-full min-h-0 overflow-y-auto overscroll-contain"
              : "relative h-full min-h-0 overflow-hidden"
          }
        >
          <iframe
            key={frameSrc}
            src={open ? frameSrc : undefined}
            title={title}
            className={
              scrollParent
                ? "block w-full border-0 bg-surface"
                : "absolute inset-0 h-full w-full border-0 bg-surface"
            }
            style={scrollParent ? { height: 2400 } : undefined}
            referrerPolicy="no-referrer-when-downgrade"
            sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
            onLoad={() => setLoading(false)}
          />
          {loading ? <InAppBrowserSkeleton /> : null}
        </div>
        {host ? (
          <p className="sr-only">
            {host} 원문을 인앱으로 표시합니다. 보이지 않으면 브라우저에서 열어 주세요.
          </p>
        ) : null}
      </BottomSheet>
    </>
  );
}

function isGoogleFormUrl(url: string) {
  try {
    const host = new URL(url).hostname;
    return host === "forms.gle" || host.endsWith("docs.google.com");
  } catch {
    return false;
  }
}

function InAppBrowserSkeleton() {
  return (
    <div
      role="status"
      aria-label="페이지 불러오는 중"
      className="absolute inset-0 animate-pulse bg-background px-5 py-6"
    >
      <div className="mx-auto w-full max-w-2xl">
        <div className="h-28 rounded-2xl bg-surface-muted" />
        <div className="mt-4 space-y-3 rounded-2xl bg-surface p-5">
          <div className="h-4 w-24 rounded-full bg-surface-muted" />
          <div className="h-12 rounded-xl bg-surface-muted" />
        </div>
        <div className="mt-4 space-y-3 rounded-2xl bg-surface p-5">
          <div className="h-4 w-32 rounded-full bg-surface-muted" />
          <div className="h-24 rounded-xl bg-surface-muted" />
        </div>
        <div className="mt-4 space-y-3 rounded-2xl bg-surface p-5">
          <div className="h-4 w-20 rounded-full bg-surface-muted" />
          <div className="h-12 rounded-xl bg-surface-muted" />
        </div>
      </div>
    </div>
  );
}
