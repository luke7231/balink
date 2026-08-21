"use client";

import { splitTextByUrls } from "@balink/domain";
import { OriginalSourceLink } from "@/components/original-source-link";

/** 본문 속 http(s) URL을 탭·복사 가능한 링크로 렌더한다. */
export function LinkifiedText({
  text,
  className,
}: {
  text: string;
  className?: string;
}) {
  const parts = splitTextByUrls(text);
  return (
    <p className={className}>
      {parts.map((part, index) => {
        if (part.type !== "url") {
          return <span key={`t-${index}`}>{part.value}</span>;
        }
        return (
          <OriginalSourceLink
            key={`u-${index}`}
            href={part.value}
            title="지원 링크"
            className="break-all font-medium text-foreground underline decoration-border underline-offset-2 hover:opacity-80"
          >
            {part.value}
          </OriginalSourceLink>
        );
      })}
    </p>
  );
}
