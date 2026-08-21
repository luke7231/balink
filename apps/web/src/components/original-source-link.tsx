"use client";

import type { MouseEvent, ReactNode } from "react";
import { isSafeHttpUrl, openInAppBrowser } from "@/lib/native-shell";

interface OriginalSourceLinkProps {
  href: string;
  title?: string;
  className?: string;
  children: ReactNode;
}

export function OriginalSourceLink({
  href,
  title = "원문",
  className,
  children,
}: OriginalSourceLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    if (!isSafeHttpUrl(href)) return;
    openInAppBrowser(href, title);
  }

  return (
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
  );
}
