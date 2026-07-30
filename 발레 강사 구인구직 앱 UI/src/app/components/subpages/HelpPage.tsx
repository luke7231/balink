import { useState } from "react";
import { ChevronLeft, ChevronDown, ChevronUp, MessageCircle } from "lucide-react";

const faqs = [
  {
    id: 1,
    category: "공고",
    q: "공고는 어디서 가져오나요?",
    a: "블랙스완은 발레매니아, 이상댄스, 댄스잡 등 주요 발레 구인구직 사이트의 공고를 수집하여 제공합니다. 별도로 사이트를 방문할 필요 없이 한 곳에서 모든 공고를 확인하세요.",
  },
  {
    id: 2,
    category: "공고",
    q: "공고는 얼마나 자주 업데이트되나요?",
    a: "새 공고는 매일 오전 9시와 오후 6시, 하루 두 번 자동으로 수집됩니다. 알림 조건을 설정해두면 조건에 맞는 새 공고가 등록될 때 즉시 푸시 알림을 받을 수 있습니다.",
  },
  {
    id: 3,
    category: "알림",
    q: "알림 조건은 어떻게 설정하나요?",
    a: "마이 탭 → 알림 조건 설정에서 원하는 지역, 수업 종류, 급여 범위를 설정하면 조건에 맞는 공고가 올라올 때 알림을 보내드립니다. 조건은 여러 개 추가할 수 있습니다.",
  },
  {
    id: 4,
    category: "계정",
    q: "로그인 없이도 공고를 볼 수 있나요?",
    a: "네, 로그인 없이도 공고 목록을 볼 수 있습니다. 다만 공고 저장, 지원 내역 관리, 알림 설정 등의 기능은 로그인 후 이용 가능합니다.",
  },
  {
    id: 5,
    category: "계정",
    q: "회원 탈퇴는 어떻게 하나요?",
    a: "마이 탭 → 앱 설정 → 계정 관리에서 회원 탈퇴를 진행할 수 있습니다. 탈퇴 시 저장 공고, 지원 내역 등 모든 데이터가 삭제되며 복구가 불가능합니다.",
  },
  {
    id: 6,
    category: "기타",
    q: "공고 등록 또는 광고 문의는 어떻게 하나요?",
    a: "학원이나 스튜디오 운영자분들의 공고 등록 및 광고 문의는 아래 고객센터 채팅으로 연락해 주세요. 빠르게 안내해 드리겠습니다.",
  },
];

const categories = ["전체", "공고", "알림", "계정", "기타"];

export function HelpPage({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(null);
  const [activeCategory, setActiveCategory] = useState("전체");

  const filtered = faqs.filter(
    (f) => activeCategory === "전체" || f.category === activeCategory
  );

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f5f5f7" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 4,
          paddingLeft: 12,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: 14,
          backgroundColor: "#f5f5f7",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <button
          onClick={onBack}
          style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#0a0a0a", display: "flex" }}
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>
        <span style={{ fontSize: 17, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.5 }}>
          도움말
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
        {/* Category tabs */}
        <div
          style={{
            display: "flex",
            gap: 6,
            padding: "14px 16px 10px",
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {categories.map((c) => (
            <button
              key={c}
              onClick={() => setActiveCategory(c)}
              style={{
                whiteSpace: "nowrap",
                flexShrink: 0,
                backgroundColor: activeCategory === c ? "#0a0a0a" : "#fff",
                color: activeCategory === c ? "#fff" : "#666",
                border: activeCategory === c ? "1px solid #0a0a0a" : "1px solid rgba(0,0,0,0.1)",
                borderRadius: 20,
                paddingLeft: 14,
                paddingRight: 14,
                paddingTop: 7,
                paddingBottom: 7,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: -0.2,
              }}
            >
              {c}
            </button>
          ))}
        </div>

        {/* FAQ list */}
        <div style={{ padding: "4px 16px 16px", display: "flex", flexDirection: "column", gap: 6 }}>
          {filtered.map((faq) => {
            const open = expanded === faq.id;
            return (
              <div
                key={faq.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 14,
                  border: "1px solid rgba(0,0,0,0.07)",
                  overflow: "hidden",
                }}
              >
                <button
                  onClick={() => setExpanded(open ? null : faq.id)}
                  style={{
                    width: "100%",
                    background: "none",
                    border: "none",
                    cursor: "pointer",
                    padding: "15px 16px",
                    textAlign: "left",
                    display: "flex",
                    alignItems: "center",
                    gap: 10,
                  }}
                >
                  <span
                    style={{
                      fontSize: 10,
                      fontWeight: 700,
                      color: "#888",
                      backgroundColor: "#f2f2f4",
                      borderRadius: 5,
                      paddingLeft: 6,
                      paddingRight: 6,
                      paddingTop: 2,
                      paddingBottom: 2,
                      flexShrink: 0,
                    }}
                  >
                    {faq.category}
                  </span>
                  <p
                    style={{
                      flex: 1,
                      fontSize: 13,
                      fontWeight: 700,
                      color: "#0a0a0a",
                      letterSpacing: -0.3,
                      lineHeight: 1.4,
                      textAlign: "left",
                    }}
                  >
                    {faq.q}
                  </p>
                  <div style={{ flexShrink: 0, color: "#ccc" }}>
                    {open ? <ChevronUp size={15} strokeWidth={2} /> : <ChevronDown size={15} strokeWidth={2} />}
                  </div>
                </button>

                {open && (
                  <div
                    style={{
                      padding: "0 16px 15px",
                      borderTop: "1px solid rgba(0,0,0,0.05)",
                    }}
                  >
                    <p
                      style={{
                        fontSize: 13,
                        fontWeight: 400,
                        color: "#555",
                        lineHeight: 1.65,
                        letterSpacing: -0.2,
                        paddingTop: 12,
                      }}
                    >
                      {faq.a}
                    </p>
                  </div>
                )}
              </div>
            );
          })}
        </div>

        {/* Contact card */}
        <div style={{ padding: "0 16px" }}>
          <div
            style={{
              backgroundColor: "#0a0a0a",
              borderRadius: 16,
              padding: 18,
              display: "flex",
              alignItems: "center",
              gap: 14,
              cursor: "pointer",
            }}
          >
            <div
              style={{
                width: 40,
                height: 40,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 10,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
              }}
            >
              <MessageCircle size={18} strokeWidth={1.8} color="#fff" />
            </div>
            <div>
              <p style={{ fontSize: 13, fontWeight: 700, color: "#fff", letterSpacing: -0.3, marginBottom: 2 }}>
                고객센터 채팅 문의
              </p>
              <p style={{ fontSize: 11, fontWeight: 400, color: "rgba(255,255,255,0.45)" }}>
                평일 09:00 – 18:00 운영
              </p>
            </div>
          </div>
        </div>
      </div>
    </div>
  );
}
