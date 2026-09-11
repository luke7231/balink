export const HOME_QUICK_ALERT_REGIONS = [
  "강남",
  "서초",
  "송파",
  "강동",
  "마포",
  "용산",
  "성동",
  "영등포",
  "강서",
  "수원",
  "용인",
  "성남",
  "대전",
  "대구",
  "부산",
] as const;

export type HomeQuickShortcut =
  | {
      id: "today";
      label: string;
      href: string;
      icon: "sun";
    }
  | {
      id: "alerts";
      label: string;
      href: string;
      icon: "bell";
      regions: readonly string[];
    }
  | {
      id: "feedback";
      label: string;
      action: "support-form";
      icon: "chat";
    };

export const HOME_QUICK_SHORTCUTS: HomeQuickShortcut[] = [
  {
    id: "today",
    label: "오늘의 공고",
    href: "/today",
    icon: "sun",
  },
  {
    id: "alerts",
    label: "알림받기",
    href: "/notifications",
    icon: "bell",
    regions: HOME_QUICK_ALERT_REGIONS,
  },
  {
    id: "feedback",
    label: "피드백",
    action: "support-form",
    icon: "chat",
  },
];
