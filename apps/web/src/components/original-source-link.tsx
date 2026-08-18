"use client";

import { useState, type MouseEvent, type ReactNode } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { isSafeHttpUrl, openInAppBrowser } from "@/lib/native-shell";

interface OriginalSourceLinkProps {
  href: string;
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
  title = "원문",
  className,
  children,
}: OriginalSourceLinkProps) {
  const [open, setOpen] = useState(false);
  const host = hostnameOf(href);

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
        <iframe
          key={href}
          src={open ? href : undefined}
          title={title}
          className="h-full w-full border-0 bg-surface"
          referrerPolicy="no-referrer-when-downgrade"
          sandbox="allow-scripts allow-same-origin allow-forms allow-popups allow-popups-to-escape-sandbox"
        />
        {host ? (
          <p className="sr-only">
            {host} 원문을 인앱으로 표시합니다. 보이지 않으면 브라우저에서 열어 주세요.
          </p>
        ) : null}
      </BottomSheet>
    </>
  );
}
