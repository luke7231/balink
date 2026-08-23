"use client";

import type { MouseEvent, ReactNode } from "react";
import { trackAmplitudeEvent } from "@/lib/amplitude-client";
import {
  AmplitudeEventName,
  type AmplitudePostKind,
} from "@/lib/amplitude-events";
import { isSafeHttpUrl, openInAppBrowser } from "@/lib/native-shell";

interface OriginalSourceLinkProps {
  href: string;
  title?: string;
  className?: string;
  analytics?: {
    postKind: AmplitudePostKind;
    postId: string;
    sourceLabel?: string | null;
  };
  children: ReactNode;
}

export function OriginalSourceLink({
  href,
  title = "원문",
  className,
  analytics,
  children,
}: OriginalSourceLinkProps) {
  function handleClick(event: MouseEvent<HTMLAnchorElement>) {
    if (event.metaKey || event.ctrlKey || event.shiftKey || event.altKey || event.button !== 0) {
      return;
    }
    if (analytics) {
      trackAmplitudeEvent(AmplitudeEventName.ClickedSourceLink, {
        screen:
          analytics.postKind === "job" ? "job_detail" : "substitute_detail",
        post_kind: analytics.postKind,
        post_id: analytics.postId,
        source_label: analytics.sourceLabel ?? title,
      });
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
