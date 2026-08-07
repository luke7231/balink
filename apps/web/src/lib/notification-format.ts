export function formatNotificationTime(value: Date | string): string {
  const date = typeof value === "string" ? new Date(value) : value;
  const now = Date.now();
  const diffMs = now - date.getTime();
  const minute = 60_000;
  const hour = 60 * minute;
  const day = 24 * hour;

  if (diffMs < minute) return "방금 전";
  if (diffMs < hour) return `${Math.floor(diffMs / minute)}분 전`;
  if (diffMs < day) return `${Math.floor(diffMs / hour)}시간 전`;
  if (diffMs < 2 * day) return "어제";

  return new Intl.DateTimeFormat("ko-KR", {
    timeZone: "Asia/Seoul",
    month: "long",
    day: "numeric",
  }).format(date);
}

export function notificationTypeLabel(type: string): string {
  switch (type) {
    case "job_match":
      return "채용";
    case "substitute_match":
      return "대강";
    case "system":
      return "공지";
    default:
      return "알림";
  }
}
