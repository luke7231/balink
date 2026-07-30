import { useState } from "react";
import {
  Bookmark,
  Bell,
  FileText,
  ChevronRight,
  MapPin,
  LogOut,
  Settings,
  HelpCircle,
  Shield,
  Edit3,
} from "lucide-react";
import { ApplicationsPage } from "./subpages/ApplicationsPage";
import { SavedJobsPage } from "./subpages/SavedJobsPage";
import { NoticePage } from "./subpages/NoticePage";
import { HelpPage } from "./subpages/HelpPage";
import { PrivacyPage } from "./subpages/PrivacyPage";

type SubPage = "applications" | "saved" | "notice" | "help" | "privacy" | null;

const savedJobs = [
  { id: 1, studio: "리베라 발레 스튜디오", region: "서울 강남", pay: "타임당 4만원", daysLeft: 3 },
  { id: 3, studio: "그랑 발레 센터", region: "서울 서초", pay: "협의", daysLeft: 1 },
];

export function MyPage() {
  const [subPage, setSubPage] = useState<SubPage>(null);
  const [activeConditions, setActiveConditions] = useState(["서울 강남", "성인발레"]);

  const removeCondition = (c: string) => {
    setActiveConditions((prev) => prev.filter((x) => x !== c));
  };

  // Sub-page routing
  if (subPage === "applications") return <ApplicationsPage onBack={() => setSubPage(null)} />;
  if (subPage === "saved") return <SavedJobsPage onBack={() => setSubPage(null)} />;
  if (subPage === "notice") return <NoticePage onBack={() => setSubPage(null)} />;
  if (subPage === "help") return <HelpPage onBack={() => setSubPage(null)} />;
  if (subPage === "privacy") return <PrivacyPage onBack={() => setSubPage(null)} />;

  const menuGroups: {
    title: string;
    items: { label: string; icon: React.ElementType; badge: number | null; page: SubPage }[];
  }[] = [
    {
      title: "활동",
      items: [
        { label: "저장한 공고", icon: Bookmark, badge: 2, page: "saved" },
        { label: "지원 내역", icon: FileText, badge: null, page: "applications" },
        { label: "알림 설정", icon: Bell, badge: null, page: null },
      ],
    },
    {
      title: "설정",
      items: [
        { label: "프로필 편집", icon: Edit3, badge: null, page: null },
        { label: "관심 조건 설정", icon: MapPin, badge: null, page: null },
        { label: "앱 설정", icon: Settings, badge: null, page: null },
      ],
    },
    {
      title: "고객지원",
      items: [
        { label: "공지사항", icon: Bell, badge: null, page: "notice" },
        { label: "도움말", icon: HelpCircle, badge: null, page: "help" },
        { label: "개인정보처리방침", icon: Shield, badge: null, page: "privacy" },
      ],
    },
  ];

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
        <span
          style={{
            fontSize: 22,
            fontWeight: 800,
            color: "#0a0a0a",
            letterSpacing: -0.8,
          }}
        >
          마이
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          paddingBottom: 24,
        }}
      >
        {/* Profile card */}
        <div
          style={{
            marginLeft: 16,
            marginRight: 16,
            marginBottom: 12,
            backgroundColor: "#0a0a0a",
            borderRadius: 20,
            padding: 20,
            position: "relative",
            overflow: "hidden",
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -20,
              top: -20,
              width: 100,
              height: 100,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.04)",
            }}
          />

          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 14,
              marginBottom: 16,
              position: "relative",
              zIndex: 1,
            }}
          >
            <div
              style={{
                width: 52,
                height: 52,
                borderRadius: "50%",
                backgroundColor: "rgba(255,255,255,0.12)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <span style={{ fontSize: 22, fontWeight: 700, color: "#fff", letterSpacing: -0.5 }}>
                김
              </span>
            </div>

            <div style={{ flex: 1 }}>
              <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                <p style={{ fontSize: 17, fontWeight: 700, color: "#fff", letterSpacing: -0.4 }}>
                  김발레
                </p>
                <div
                  style={{
                    backgroundColor: "rgba(255,255,255,0.15)",
                    borderRadius: 6,
                    paddingLeft: 7,
                    paddingRight: 7,
                    paddingTop: 2,
                    paddingBottom: 2,
                  }}
                >
                  <span style={{ fontSize: 10, fontWeight: 600, color: "rgba(255,255,255,0.7)" }}>
                    강사
                  </span>
                </div>
              </div>
              <p style={{ fontSize: 12, fontWeight: 400, color: "rgba(255,255,255,0.45)", letterSpacing: -0.2 }}>
                ballet.kim@email.com
              </p>
            </div>

            <button
              style={{
                background: "none",
                border: "1px solid rgba(255,255,255,0.15)",
                borderRadius: 8,
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 6,
                paddingBottom: 6,
                cursor: "pointer",
                display: "flex",
                alignItems: "center",
                gap: 4,
                color: "rgba(255,255,255,0.6)",
              }}
            >
              <Edit3 size={12} strokeWidth={1.8} />
              <span style={{ fontSize: 11, fontWeight: 600 }}>편집</span>
            </button>
          </div>

          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr 1fr",
              gap: 1,
              position: "relative",
              zIndex: 1,
            }}
          >
            {[
              { label: "저장 공고", value: "2", page: "saved" as SubPage },
              { label: "지원", value: "4", page: "applications" as SubPage },
              { label: "알림 조건", value: activeConditions.length.toString(), page: null as SubPage },
            ].map((stat, i) => (
              <button
                key={stat.label}
                onClick={() => stat.page && setSubPage(stat.page)}
                style={{
                  textAlign: "center",
                  paddingTop: 12,
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  background: "none",
                  border: "none",
                  borderTop: "1px solid rgba(255,255,255,0.08)",
                  borderLeft: i > 0 ? "1px solid rgba(255,255,255,0.08)" : "none",
                  cursor: stat.page ? "pointer" : "default",
                  padding: "12px 0 0",
                } as React.CSSProperties}
              >
                <p style={{ fontSize: 20, fontWeight: 800, color: "#ffffff", letterSpacing: -0.5, marginBottom: 2 }}>
                  {stat.value}
                </p>
                <p style={{ fontSize: 10, fontWeight: 500, color: "rgba(255,255,255,0.4)", letterSpacing: -0.1 }}>
                  {stat.label}
                </p>
              </button>
            ))}
          </div>
        </div>

        {/* Alert conditions */}
        {activeConditions.length > 0 && (
          <div
            style={{
              marginLeft: 16,
              marginRight: 16,
              marginBottom: 12,
              backgroundColor: "#ffffff",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.07)",
              padding: 16,
            }}
          >
            <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 12 }}>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.3 }}>
                알림 조건
              </p>
              <button
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  fontSize: 11, fontWeight: 600, color: "#888",
                  display: "flex", alignItems: "center", gap: 2, padding: 0,
                }}
              >
                편집 <ChevronRight size={12} strokeWidth={2} />
              </button>
            </div>
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6 }}>
              {activeConditions.map((c) => (
                <div
                  key={c}
                  style={{
                    display: "flex", alignItems: "center", gap: 5,
                    backgroundColor: "#f2f2f4", borderRadius: 20,
                    paddingLeft: 10, paddingRight: 8, paddingTop: 5, paddingBottom: 5,
                  }}
                >
                  <span style={{ fontSize: 12, fontWeight: 600, color: "#333", letterSpacing: -0.2 }}>{c}</span>
                  <button
                    onClick={() => removeCondition(c)}
                    style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "#aaa", fontSize: 14, lineHeight: 1 }}
                  >
                    ×
                  </button>
                </div>
              ))}
              <button
                style={{
                  display: "flex", alignItems: "center", gap: 3,
                  backgroundColor: "transparent",
                  border: "1px dashed rgba(0,0,0,0.2)", borderRadius: 20,
                  paddingLeft: 10, paddingRight: 10, paddingTop: 5, paddingBottom: 5,
                  cursor: "pointer",
                }}
              >
                <span style={{ fontSize: 14, color: "#aaa", lineHeight: 1 }}>+</span>
                <span style={{ fontSize: 12, fontWeight: 600, color: "#aaa", letterSpacing: -0.2 }}>추가</span>
              </button>
            </div>
          </div>
        )}

        {/* Saved jobs preview */}
        <div
          style={{
            marginLeft: 16, marginRight: 16, marginBottom: 12,
            backgroundColor: "#ffffff", borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden",
          }}
        >
          <button
            onClick={() => setSubPage("saved")}
            style={{
              width: "100%",
              display: "flex", alignItems: "center", justifyContent: "space-between",
              padding: "14px 16px",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
              background: "none", border: "none",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
              cursor: "pointer",
            } as React.CSSProperties}
          >
            <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
              <Bookmark size={14} strokeWidth={1.8} color="#0a0a0a" />
              <span style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.3 }}>
                저장한 공고
              </span>
              <span
                style={{
                  backgroundColor: "#0a0a0a", color: "#fff",
                  borderRadius: 20, fontSize: 10, fontWeight: 700,
                  paddingLeft: 6, paddingRight: 6, paddingTop: 1, paddingBottom: 1,
                }}
              >
                {savedJobs.length}
              </span>
            </div>
            <ChevronRight size={14} strokeWidth={2} color="#ccc" />
          </button>

          {savedJobs.map((job, idx) => (
            <button
              key={job.id}
              onClick={() => setSubPage("saved")}
              style={{
                width: "100%",
                display: "flex", alignItems: "center", justifyContent: "space-between",
                padding: "12px 16px",
                background: "none", border: "none",
                borderTop: idx > 0 ? "1px solid rgba(0,0,0,0.04)" : "none",
                cursor: "pointer", textAlign: "left",
              } as React.CSSProperties}
            >
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.3, marginBottom: 2 }}>
                  {job.studio}
                </p>
                <p style={{ fontSize: 11, fontWeight: 400, color: "#aaa", letterSpacing: -0.1 }}>
                  {job.region} · {job.pay}
                </p>
              </div>
              <span style={{ fontSize: 11, fontWeight: 600, color: job.daysLeft <= 3 ? "#d4183d" : "#aaa" }}>
                D-{job.daysLeft}
              </span>
            </button>
          ))}
        </div>

        {/* Menu groups */}
        {menuGroups.map((group) => (
          <div
            key={group.title}
            style={{
              marginLeft: 16, marginRight: 16, marginBottom: 12,
              backgroundColor: "#ffffff", borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.07)", overflow: "hidden",
            }}
          >
            <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", letterSpacing: -0.1, padding: "12px 16px 6px" }}>
              {group.title}
            </p>
            {group.items.map((item, idx) => {
              const Icon = item.icon;
              return (
                <button
                  key={item.label}
                  onClick={() => item.page && setSubPage(item.page)}
                  style={{
                    width: "100%",
                    display: "flex", alignItems: "center", justifyContent: "space-between",
                    padding: "12px 16px",
                    borderTop: idx === 0 ? "none" : "1px solid rgba(0,0,0,0.04)",
                    background: "none", border: "none",
                    borderTop: idx === 0 ? "none" : "1px solid rgba(0,0,0,0.04)",
                    cursor: "pointer", textAlign: "left",
                  } as React.CSSProperties}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
                    <Icon size={16} strokeWidth={1.7} color="#555" />
                    <span style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", letterSpacing: -0.2 }}>
                      {item.label}
                    </span>
                    {item.badge && (
                      <div style={{ backgroundColor: "#0a0a0a", borderRadius: 20, paddingLeft: 6, paddingRight: 6, paddingTop: 1, paddingBottom: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>{item.badge}</span>
                      </div>
                    )}
                  </div>
                  <ChevronRight size={14} strokeWidth={1.8} color="#ccc" />
                </button>
              );
            })}
          </div>
        ))}

        {/* Logout */}
        <div style={{ marginLeft: 16, marginRight: 16, marginBottom: 8 }}>
          <button
            style={{
              width: "100%",
              backgroundColor: "#ffffff",
              borderRadius: 14,
              border: "1px solid rgba(0,0,0,0.07)",
              padding: "14px 16px",
              display: "flex", alignItems: "center", gap: 10,
              cursor: "pointer",
            }}
          >
            <LogOut size={16} strokeWidth={1.7} color="#d4183d" />
            <span style={{ fontSize: 13, fontWeight: 600, color: "#d4183d", letterSpacing: -0.2 }}>
              로그아웃
            </span>
          </button>
        </div>

        <p style={{ textAlign: "center", fontSize: 11, fontWeight: 400, color: "#ccc", paddingTop: 4 }}>
          블랙스완 v1.0.0
        </p>
      </div>
    </div>
  );
}
