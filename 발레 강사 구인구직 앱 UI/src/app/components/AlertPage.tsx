import { useState } from "react";
import { Bell, Briefcase, Star, ChevronRight } from "lucide-react";

type AlertItem = {
  id: number;
  type: "job" | "system" | "bookmark";
  title: string;
  body: string;
  time: string;
  isRead: boolean;
};

const initialAlerts: AlertItem[] = [
  {
    id: 1,
    type: "job",
    title: "새 공고 알림",
    body: "내 조건과 일치하는 공고가 등록됐어요 — 서울 강남 · 성인발레 · 타임당 4만원",
    time: "방금 전",
    isRead: false,
  },
  {
    id: 2,
    type: "bookmark",
    title: "저장한 공고 마감 임박",
    body: "리베라 발레 스튜디오 공고가 3일 후 마감돼요.",
    time: "10분 전",
    isRead: false,
  },
  {
    id: 3,
    type: "job",
    title: "새 공고 알림",
    body: "내 조건과 일치하는 공고가 등록됐어요 — 경기 수원 · 유아발레 · 총 7만원",
    time: "1시간 전",
    isRead: false,
  },
  {
    id: 4,
    type: "system",
    title: "발링크 공지",
    body: "새로운 출처가 추가됐어요. 이제 댄스잡에서도 공고를 확인할 수 있어요.",
    time: "어제",
    isRead: true,
  },
  {
    id: 5,
    type: "bookmark",
    title: "저장한 공고 마감 임박",
    body: "그랑 발레 센터 공고가 내일 마감돼요. 서두르세요!",
    time: "어제",
    isRead: true,
  },
  {
    id: 6,
    type: "job",
    title: "새 공고 알림",
    body: "내 조건과 일치하는 공고가 등록됐어요 — 서울 서초 · 초등발레 · 협의",
    time: "2일 전",
    isRead: true,
  },
  {
    id: 7,
    type: "system",
    title: "발링크 업데이트",
    body: "알림 조건을 더욱 세밀하게 설정할 수 있게 됐어요. 마이 → 알림 설정에서 확인하세요.",
    time: "3일 전",
    isRead: true,
  },
];

const iconMap = {
  job: Briefcase,
  bookmark: Star,
  system: Bell,
};

export function AlertPage() {
  const [alerts, setAlerts] = useState(initialAlerts);
  const unreadCount = alerts.filter((a) => !a.isRead).length;

  const markAllRead = () => {
    setAlerts((prev) => prev.map((a) => ({ ...a, isRead: true })));
  };

  const markRead = (id: number) => {
    setAlerts((prev) =>
      prev.map((a) => (a.id === id ? { ...a, isRead: true } : a))
    );
  };

  const today = alerts.filter((a) =>
    ["방금 전", "10분 전", "1시간 전"].includes(a.time)
  );
  const earlier = alerts.filter(
    (a) => !["방금 전", "10분 전", "1시간 전"].includes(a.time)
  );

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f5f5f7" }}>
      {/* Header */}
      <div
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: 16,
          backgroundColor: "#f5f5f7",
        }}
      >
        <div
          style={{
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
            <span
              style={{
                fontSize: 22,
                fontWeight: 800,
                color: "#0a0a0a",
                letterSpacing: -0.8,
              }}
            >
              알림
            </span>
            {unreadCount > 0 && (
              <div
                style={{
                  backgroundColor: "#0a0a0a",
                  borderRadius: 20,
                  paddingLeft: 8,
                  paddingRight: 8,
                  paddingTop: 2,
                  paddingBottom: 2,
                  minWidth: 22,
                  textAlign: "center",
                }}
              >
                <span
                  style={{
                    fontSize: 11,
                    fontWeight: 700,
                    color: "#fff",
                  }}
                >
                  {unreadCount}
                </span>
              </div>
            )}
          </div>
          {unreadCount > 0 && (
            <button
              onClick={markAllRead}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                fontSize: 13,
                fontWeight: 600,
                color: "#888",
                letterSpacing: -0.2,
                padding: 0,
              }}
            >
              모두 읽음
            </button>
          )}
        </div>
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          paddingBottom: 16,
        }}
      >
        {/* Alert condition nudge card */}
        <div
          style={{
            marginLeft: 16,
            marginRight: 16,
            marginBottom: 16,
            backgroundColor: "#ffffff",
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.07)",
            padding: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
            cursor: "pointer",
          }}
        >
          <div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 700,
                color: "#0a0a0a",
                letterSpacing: -0.3,
                marginBottom: 2,
              }}
            >
              알림 조건 설정
            </p>
            <p style={{ fontSize: 11, fontWeight: 400, color: "#aaa", letterSpacing: -0.1 }}>
              지역, 수업 종류, 급여 조건을 설정하면 딱 맞는 공고를 알려드려요
            </p>
          </div>
          <ChevronRight size={16} strokeWidth={1.8} color="#ccc" />
        </div>

        {today.length > 0 && (
          <AlertSection
            title="오늘"
            items={today}
            onRead={markRead}
          />
        )}
        {earlier.length > 0 && (
          <AlertSection
            title="이전 알림"
            items={earlier}
            onRead={markRead}
          />
        )}
      </div>
    </div>
  );
}

function AlertSection({
  title,
  items,
  onRead,
}: {
  title: string;
  items: AlertItem[];
  onRead: (id: number) => void;
}) {
  return (
    <div style={{ marginBottom: 8 }}>
      <p
        style={{
          fontSize: 12,
          fontWeight: 700,
          color: "#aaa",
          letterSpacing: -0.1,
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 8,
        }}
      >
        {title}
      </p>
      <div style={{ display: "flex", flexDirection: "column", gap: 2, paddingLeft: 16, paddingRight: 16 }}>
        {items.map((alert) => {
          const Icon = iconMap[alert.type];
          return (
            <div
              key={alert.id}
              onClick={() => onRead(alert.id)}
              style={{
                backgroundColor: alert.isRead ? "#ffffff" : "#fafafa",
                borderRadius: 14,
                border: alert.isRead
                  ? "1px solid rgba(0,0,0,0.06)"
                  : "1px solid rgba(0,0,0,0.1)",
                padding: "14px 16px",
                display: "flex",
                alignItems: "flex-start",
                gap: 12,
                cursor: "pointer",
                position: "relative",
              }}
            >
              {/* Unread dot */}
              {!alert.isRead && (
                <div
                  style={{
                    position: "absolute",
                    top: 14,
                    right: 14,
                    width: 6,
                    height: 6,
                    backgroundColor: "#0a0a0a",
                    borderRadius: "50%",
                  }}
                />
              )}

              {/* Icon */}
              <div
                style={{
                  width: 36,
                  height: 36,
                  borderRadius: 10,
                  backgroundColor: alert.isRead ? "#f2f2f4" : "#0a0a0a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <Icon
                  size={16}
                  strokeWidth={1.8}
                  color={alert.isRead ? "#888" : "#fff"}
                />
              </div>

              {/* Content */}
              <div style={{ flex: 1, minWidth: 0, paddingRight: 14 }}>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    marginBottom: 3,
                  }}
                >
                  <p
                    style={{
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0a0a0a",
                      letterSpacing: -0.3,
                    }}
                  >
                    {alert.title}
                  </p>
                  <span style={{ fontSize: 10, fontWeight: 400, color: "#bbb", flexShrink: 0, marginLeft: 8 }}>
                    {alert.time}
                  </span>
                </div>
                <p
                  style={{
                    fontSize: 12,
                    fontWeight: 400,
                    color: "#666",
                    lineHeight: 1.5,
                    letterSpacing: -0.2,
                  }}
                >
                  {alert.body}
                </p>
              </div>
            </div>
          );
        })}
      </div>
    </div>
  );
}
