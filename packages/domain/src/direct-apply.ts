export type DirectApplyKind = "sms" | "tel" | "mailto" | "link";

export type DirectApplyAction = {
  kind: DirectApplyKind;
  href: string;
  label: string;
  /** 시트에 보여줄·복사할 번호·이메일·URL */
  displayValue: string;
};

const MOBILE_PREFIX = /^01[016789]/;
const URL_RE = /https?:\/\/[^\s<>"')）\]\}]+/gi;
const APPLY_SECTION_TITLE_RE =
  /지원\s*방법|지원\s*안내|지원\s*처|지원\s*링크|연락\s*방법|오픈\s*채팅|카카오/;

export function hasDirectApplyContacts(input: {
  phones?: string[] | null;
  emails?: string[] | null;
  links?: string[] | null;
}): boolean {
  return (
    uniqueNonEmpty(input.phones).length > 0 ||
    uniqueNonEmpty(input.emails).length > 0 ||
    uniqueNonEmpty(input.links).length > 0
  );
}

/**
 * 지원 방법 섹션·알려진 지원 호스트(오픈카톡 등)에서 http(s) URL을 모은다.
 */
export function extractApplyLinks(input: {
  displaySections?: Array<{ title?: string | null; content?: string | null }> | null;
  texts?: string[] | null;
}): string[] {
  const urls: string[] = [];

  for (const section of input.displaySections ?? []) {
    const title = (section.title ?? "").trim();
    const content = section.content ?? "";
    const fromApplySection = APPLY_SECTION_TITLE_RE.test(title);
    for (const url of extractUrlsFromText(content)) {
      if (fromApplySection || isKnownApplyHost(url)) {
        urls.push(url);
      }
    }
  }

  for (const text of input.texts ?? []) {
    for (const url of extractUrlsFromText(text)) {
      if (isKnownApplyHost(url)) urls.push(url);
    }
  }

  return uniqueNonEmpty(urls);
}

/** 본문 링크화용: URL과 일반 텍스트 조각으로 나눈다. */
export function splitTextByUrls(
  text: string,
): Array<{ type: "text" | "url"; value: string }> {
  if (!text) return [];
  const parts: Array<{ type: "text" | "url"; value: string }> = [];
  let lastIndex = 0;
  const re = new RegExp(URL_RE.source, URL_RE.flags);
  for (const match of text.matchAll(re)) {
    const raw = match[0] ?? "";
    const url = stripTrailingPunctuation(raw);
    const start = match.index ?? 0;
    if (start > lastIndex) {
      parts.push({ type: "text", value: text.slice(lastIndex, start) });
    }
    if (url) {
      parts.push({ type: "url", value: url });
      const trailing = raw.slice(url.length);
      if (trailing) parts.push({ type: "text", value: trailing });
      lastIndex = start + raw.length;
    }
  }
  if (lastIndex < text.length) {
    parts.push({ type: "text", value: text.slice(lastIndex) });
  }
  return parts.length > 0 ? parts : [{ type: "text", value: text }];
}

/**
 * 공개 연락처·지원 링크로 전화·문자·메일·링크 액션을 만든다.
 * 휴대폰은 문자 → 전화, 일반전화는 전화만, 이메일은 mailto, URL은 link.
 */
export function resolveDirectApplyActions(input: {
  phones?: string[] | null;
  emails?: string[] | null;
  links?: string[] | null;
  methods?: string[] | null;
  title?: string | null;
}): DirectApplyAction[] {
  const title = (input.title ?? "").trim() || "공고";
  const subject = `${title} 지원합니다`;
  const body = `안녕하세요, 공고 보고 지원합니다.\n\n공고: ${title}`;
  const methods = new Set((input.methods ?? []).map((m) => m.toLowerCase()));
  const preferSms = methods.has("sms") || !methods.has("phone");

  const actions: DirectApplyAction[] = [];
  const seen = new Set<string>();

  for (const phone of uniqueNonEmpty(input.phones)) {
    const digits = phone.replace(/\D/g, "");
    if (digits.length < 8) continue;
    const display = formatPhoneDisplay(digits, phone);

    if (isMobilePhone(digits)) {
      const smsKey = `sms:${digits}`;
      const telKey = `tel:${digits}`;
      const smsAction: DirectApplyAction = {
        kind: "sms",
        href: buildSmsHref(digits, body),
        label: `문자 · ${display}`,
        displayValue: display,
      };
      const telAction: DirectApplyAction = {
        kind: "tel",
        href: `tel:${digits}`,
        label: `전화 · ${display}`,
        displayValue: display,
      };

      if (preferSms) {
        pushUnique(actions, seen, smsKey, smsAction);
        pushUnique(actions, seen, telKey, telAction);
      } else {
        pushUnique(actions, seen, telKey, telAction);
        pushUnique(actions, seen, smsKey, smsAction);
      }
      continue;
    }

    pushUnique(actions, seen, `tel:${digits}`, {
      kind: "tel",
      href: `tel:${digits}`,
      label: `전화 · ${display}`,
      displayValue: display,
    });
  }

  for (const email of uniqueNonEmpty(input.emails)) {
    const normalized = email.trim().toLowerCase();
    if (!normalized.includes("@")) continue;
    pushUnique(actions, seen, `mailto:${normalized}`, {
      kind: "mailto",
      href: buildMailtoHref(normalized, subject, body),
      label: `이메일 · ${normalized}`,
      displayValue: normalized,
    });
  }

  for (const link of uniqueNonEmpty(input.links)) {
    const href = normalizeHttpUrl(link);
    if (!href) continue;
    pushUnique(actions, seen, `link:${href.toLowerCase()}`, {
      kind: "link",
      href,
      label: formatLinkLabel(href),
      displayValue: href,
    });
  }

  return actions;
}

export function extractUrlsFromText(text: string): string[] {
  if (!text) return [];
  const out: string[] = [];
  const re = new RegExp(URL_RE.source, URL_RE.flags);
  for (const match of text.matchAll(re)) {
    const url = stripTrailingPunctuation(match[0] ?? "");
    if (url) out.push(url);
  }
  return out;
}

function isKnownApplyHost(url: string): boolean {
  try {
    const host = new URL(url).hostname.toLowerCase();
    return (
      host === "open.kakao.com" ||
      host.endsWith(".open.kakao.com") ||
      host === "pf.kakao.com" ||
      host.endsWith(".pf.kakao.com")
    );
  } catch {
    return false;
  }
}

function normalizeHttpUrl(raw: string): string | null {
  const trimmed = raw.trim();
  if (!/^https?:\/\//i.test(trimmed)) return null;
  try {
    const parsed = new URL(trimmed);
    if (parsed.protocol !== "http:" && parsed.protocol !== "https:") return null;
    return parsed.href;
  } catch {
    return null;
  }
}

function formatLinkLabel(href: string): string {
  try {
    const parsed = new URL(href);
    const host = parsed.hostname.toLowerCase();
    const path = `${parsed.pathname}${parsed.search}`.replace(/\/$/, "") || "/";
    const short = `${host}${path.length > 28 ? `${path.slice(0, 28)}…` : path}`;
    if (host === "open.kakao.com" || host.endsWith(".open.kakao.com")) {
      return `오픈채팅 · ${short}`;
    }
    if (host === "pf.kakao.com" || host.endsWith(".pf.kakao.com")) {
      return `카카오채널 · ${short}`;
    }
    return `지원 링크 · ${short}`;
  } catch {
    return `지원 링크 · ${href}`;
  }
}

function stripTrailingPunctuation(url: string): string {
  return url.replace(/[.,;:!?）)\]\}]+$/g, "");
}

function isMobilePhone(digits: string): boolean {
  return MOBILE_PREFIX.test(digits) && (digits.length === 10 || digits.length === 11);
}

function buildSmsHref(digits: string, body: string): string {
  return `sms:${digits}?body=${encodeURIComponent(body)}`;
}

function buildMailtoHref(email: string, subject: string, body: string): string {
  return `mailto:${email}?subject=${encodeURIComponent(subject)}&body=${encodeURIComponent(body)}`;
}

function formatPhoneDisplay(digits: string, fallback: string): string {
  if (digits.length === 11) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 7)}-${digits.slice(7)}`;
  }
  if (digits.length === 10 && digits.startsWith("02")) {
    return `${digits.slice(0, 2)}-${digits.slice(2, 6)}-${digits.slice(6)}`;
  }
  if (digits.length === 10) {
    return `${digits.slice(0, 3)}-${digits.slice(3, 6)}-${digits.slice(6)}`;
  }
  return fallback.trim() || digits;
}

function uniqueNonEmpty(values: string[] | null | undefined): string[] {
  if (!values?.length) return [];
  const seen = new Set<string>();
  const out: string[] = [];
  for (const value of values) {
    const trimmed = value?.trim();
    if (!trimmed) continue;
    const key = trimmed.toLowerCase();
    if (seen.has(key)) continue;
    seen.add(key);
    out.push(trimmed);
  }
  return out;
}

function pushUnique(
  actions: DirectApplyAction[],
  seen: Set<string>,
  key: string,
  action: DirectApplyAction,
): void {
  if (seen.has(key)) return;
  seen.add(key);
  actions.push(action);
}
