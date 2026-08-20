export type DirectApplyKind = "sms" | "tel" | "mailto";

export type DirectApplyAction = {
  kind: DirectApplyKind;
  href: string;
  label: string;
  /** 시트에 보여줄 번호·이메일 */
  displayValue: string;
};

const MOBILE_PREFIX = /^01[016789]/;

export function hasDirectApplyContacts(input: {
  phones?: string[] | null;
  emails?: string[] | null;
}): boolean {
  return uniqueNonEmpty(input.phones).length > 0 || uniqueNonEmpty(input.emails).length > 0;
}

/**
 * 공개 연락처로 전화·문자·메일 액션을 만든다.
 * 휴대폰은 문자 → 전화, 일반전화는 전화만, 이메일은 mailto.
 */
export function resolveDirectApplyActions(input: {
  phones?: string[] | null;
  emails?: string[] | null;
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

  return actions;
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
