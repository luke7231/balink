"use client";

import { useMemo, useState } from "react";
import {
  hasDirectApplyContacts,
  resolveDirectApplyActions,
  type DirectApplyAction,
} from "@balink/domain";
import { BookmarkButton } from "@/components/bookmark-button";
import { BottomSheet } from "@/components/bottom-sheet";
import { ExternalLinkIcon } from "@/components/external-link-icon";
import { OriginalSourceLink } from "@/components/original-source-link";

export type DetailSourceLink = {
  href: string;
  label: string;
  title?: string;
};

type DirectApplyControlsProps = {
  postTitle: string;
  contactPhones: string[];
  contactEmails: string[];
  contactMethods: string[];
  /** 지원 방법 등에서 추출한 http(s) 링크 */
  applyLinks?: string[];
  sourceLinks: DetailSourceLink[];
  /** 채용·대강 저장. 없으면 저장 아이콘 숨김. */
  bookmark?:
    | { jobPostId: string; initialBookmarked: boolean }
    | { substitutePostId: string; initialBookmarked: boolean }
    | { loginHref: string };
};

const barIconClass =
  "inline-flex h-12 w-12 shrink-0 items-center justify-center rounded-full border transition";

export function DirectApplyControls({
  postTitle,
  contactPhones,
  contactEmails,
  contactMethods,
  applyLinks = [],
  sourceLinks,
  bookmark,
}: DirectApplyControlsProps) {
  const [open, setOpen] = useState(false);
  const [copiedKey, setCopiedKey] = useState<string | null>(null);

  const canApply = hasDirectApplyContacts({
    phones: contactPhones,
    emails: contactEmails,
    links: applyLinks,
  });
  const actions = useMemo(
    () =>
      resolveDirectApplyActions({
        phones: contactPhones,
        emails: contactEmails,
        links: applyLinks,
        methods: contactMethods,
        title: postTitle,
      }),
    [applyLinks, contactEmails, contactMethods, contactPhones, postTitle],
  );

  const primarySource = sourceLinks[0] ?? null;
  /** 바로 지원이 없고 원문만/원문+저장일 때 full 원문 보기 CTA */
  const sourceAsFullCta = !canApply && Boolean(primarySource);

  async function copyValue(key: string, value: string) {
    try {
      await navigator.clipboard.writeText(value);
      setCopiedKey(key);
      window.setTimeout(() => setCopiedKey((current) => (current === key ? null : current)), 1600);
    } catch {
      /* ignore */
    }
  }

  const bookmarkControl = bookmark ? (
    "jobPostId" in bookmark ? (
      <BookmarkButton
        jobPostId={bookmark.jobPostId}
        initialBookmarked={bookmark.initialBookmarked}
        variant="bar"
      />
    ) : "substitutePostId" in bookmark ? (
      <BookmarkButton
        substitutePostId={bookmark.substitutePostId}
        initialBookmarked={bookmark.initialBookmarked}
        variant="bar"
      />
    ) : (
      <BookmarkButton loginHref={bookmark.loginHref} variant="bar" />
    )
  ) : null;

  const sourceFullControl = primarySource ? (
    <OriginalSourceLink
      href={primarySource.href}
      title={primarySource.title ?? "원문"}
      className="inline-flex h-12 flex-1 items-center justify-center rounded-full bg-accent px-4 text-sm font-semibold text-background hover:opacity-90"
    >
      자세히 보기
    </OriginalSourceLink>
  ) : null;

  const sourceIconControl =
    primarySource && !sourceAsFullCta ? (
      <OriginalSourceLink
        href={primarySource.href}
        title={primarySource.title ?? "원문"}
        className={`${barIconClass} border-border bg-surface text-muted-foreground hover:border-accent-border hover:text-foreground`}
      >
        <span className="sr-only">원문 보기</span>
        <ExternalLinkIcon className="h-5 w-5" />
      </OriginalSourceLink>
    ) : null;

  return (
    <>
      {/* Desktop inline CTA */}
      <div className="mt-5 hidden items-center gap-2 sm:flex">
        {canApply ? (
          <button
            type="button"
            onClick={() => setOpen(true)}
            className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-5 text-sm font-semibold text-background hover:opacity-90"
          >
            <SendIcon />
            바로 지원하기
          </button>
        ) : null}
        {sourceAsFullCta ? sourceFullControl : null}
        {bookmarkControl}
        {sourceIconControl}
      </div>

      {/* Mobile sticky bar */}
      <div className="fixed inset-x-0 bottom-0 z-20 border-t border-border bg-surface/95 px-4 py-3 backdrop-blur sm:hidden">
        <div className="mx-auto flex max-w-lg items-center gap-2">
          {canApply ? (
            <button
              type="button"
              onClick={() => setOpen(true)}
              className="inline-flex h-12 flex-1 items-center justify-center gap-2 rounded-full bg-accent px-4 text-sm font-semibold text-background"
            >
              <SendIcon />
              바로 지원하기
            </button>
          ) : null}
          {sourceAsFullCta ? sourceFullControl : null}
          {bookmarkControl}
          {sourceIconControl}
        </div>
      </div>

      <BottomSheet open={open} title="바로 지원하기" onClose={() => setOpen(false)}>
        <p className="mb-4 text-sm leading-6 text-muted-foreground">
          공고에 공개된 연락처·지원 링크로 바로 연락합니다. 문자·메일은 짧은 지원 문구가 미리
          채워지고, 링크는 복사하거나 열 수 있습니다.
        </p>
        <ul className="space-y-2">
          {actions.map((action) => (
            <li key={`${action.kind}:${action.displayValue}`}>
              <ApplyActionRow
                action={action}
                copied={copiedKey === `${action.kind}:${action.displayValue}`}
                onCopy={() => copyValue(`${action.kind}:${action.displayValue}`, action.displayValue)}
              />
            </li>
          ))}
        </ul>
      </BottomSheet>
    </>
  );
}

function ApplyActionRow({
  action,
  copied,
  onCopy,
}: {
  action: DirectApplyAction;
  copied: boolean;
  onCopy: () => void;
}) {
  const Icon = actionIcon(action.kind);
  const isExternal = action.kind === "link";
  const openLabel = (
    <>
      <span className="inline-flex h-9 w-9 shrink-0 items-center justify-center rounded-full bg-surface text-foreground">
        <Icon />
      </span>
      <div className="min-w-0 flex-1">
        <p className="truncate text-sm font-semibold text-foreground">{action.label}</p>
        <p className="mt-0.5 truncate text-xs text-muted-foreground">
          {isExternal ? action.displayValue : kindHint(action.kind)}
        </p>
      </div>
      <span className="shrink-0 text-sm font-medium text-muted-foreground">열기</span>
    </>
  );
  const openClassName =
    "flex min-w-0 flex-1 items-center gap-3 rounded-2xl bg-surface-muted px-4 py-3 transition hover:opacity-90";

  return (
    <div className="flex items-stretch gap-2">
      {isExternal ? (
        <OriginalSourceLink href={action.href} title="지원 링크" className={openClassName}>
          {openLabel}
        </OriginalSourceLink>
      ) : (
        <a href={action.href} className={openClassName}>
          {openLabel}
        </a>
      )}
      <button
        type="button"
        onClick={onCopy}
        className="inline-flex shrink-0 flex-col items-center justify-center gap-1 rounded-2xl border border-border px-3 text-xs font-semibold text-muted-foreground hover:bg-surface-muted hover:text-foreground"
      >
        <CopyIcon />
        {copied ? "복사됨" : "복사"}
      </button>
    </div>
  );
}

function kindHint(kind: DirectApplyAction["kind"]): string {
  if (kind === "sms") return "문자 앱에서 보내기";
  if (kind === "tel") return "전화 걸기";
  if (kind === "link") return "링크 열기";
  return "메일 앱에서 보내기";
}

function actionIcon(kind: DirectApplyAction["kind"]) {
  if (kind === "sms") return SmsIcon;
  if (kind === "tel") return PhoneIcon;
  if (kind === "link") return ExternalLinkIcon;
  return MailIcon;
}

function iconProps(className = "h-4.5 w-4.5") {
  return {
    viewBox: "0 0 24 24",
    fill: "none",
    "aria-hidden": true as const,
    className,
  };
}

function SendIcon() {
  return (
    <svg {...iconProps("h-4 w-4")}>
      <path
        d="M4.5 11.5 20 4l-3.5 16-5.2-5.2L4.5 11.5Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="m11.3 14.8 2.4 4.7"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function SmsIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="M5 5.5h14A1.5 1.5 0 0 1 20.5 7v8A1.5 1.5 0 0 1 19 16.5H9.2L5.5 19.5V7A1.5 1.5 0 0 1 7 5.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
      <path
        d="M8.5 10h7M8.5 13h4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
      />
    </svg>
  );
}

function PhoneIcon() {
  return (
    <svg {...iconProps()}>
      <path
        d="M8.2 4.8c.4-.4 1.1-.5 1.6-.2l2.1 1.3c.5.3.7.9.5 1.4l-.8 2.1a1.2 1.2 0 0 0 .3 1.3l2.4 2.4c.4.4.9.5 1.3.3l2.1-.8c.5-.2 1.1 0 1.4.5l1.3 2.1c.3.5.2 1.2-.2 1.6l-1.2 1.2c-.7.7-1.8 1-2.8.7-2.4-.7-4.8-2.5-7.1-4.8-2.3-2.3-4.1-4.7-4.8-7.1-.3-1 0-2.1.7-2.8L8.2 4.8Z"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function MailIcon() {
  return (
    <svg {...iconProps()}>
      <rect
        x="3.5"
        y="6"
        width="17"
        height="12"
        rx="2"
        stroke="currentColor"
        strokeWidth="1.8"
      />
      <path
        d="m5.5 8.5 6.5 4.5 6.5-4.5"
        stroke="currentColor"
        strokeWidth="1.8"
        strokeLinecap="round"
        strokeLinejoin="round"
      />
    </svg>
  );
}

function CopyIcon() {
  return (
    <svg {...iconProps("h-3.5 w-3.5")}>
      <rect
        x="8"
        y="8"
        width="10"
        height="12"
        rx="1.8"
        stroke="currentColor"
        strokeWidth="1.7"
      />
      <path
        d="M6 15.5H5a1.8 1.8 0 0 1-1.8-1.8V5A1.8 1.8 0 0 1 5 3.2h8.7A1.8 1.8 0 0 1 15.5 5v1"
        stroke="currentColor"
        strokeWidth="1.7"
        strokeLinecap="round"
      />
    </svg>
  );
}
