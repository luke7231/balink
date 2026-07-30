import { useState } from "react";
import { ChevronLeft, ChevronDown, ChevronUp } from "lucide-react";

const notices = [
  {
    id: 1,
    tag: "서비스",
    title: "블랙스완 앱 v1.1 업데이트 안내",
    date: "2025.06.15",
    isNew: true,
    body: `안녕하세요, 블랙스완 팀입니다.

이번 업데이트(v1.1)에서는 다음과 같은 기능이 개선되었습니다.

• 알림 조건 세분화: 지역, 수업 종류, 급여 조건을 더욱 세밀하게 설정할 수 있습니다.
• 공고 검색 속도 개선: 필터 적용 시 결과가 더 빠르게 표시됩니다.
• 마이 페이지 UI 개편: 지원 내역 및 저장 공고를 한눈에 확인할 수 있습니다.

항상 블랙스완을 이용해 주셔서 감사합니다.`,
  },
  {
    id: 2,
    tag: "공지",
    title: "새로운 공고 출처 추가 — 댄스잡",
    date: "2025.06.10",
    isNew: true,
    body: `블랙스완에 새로운 공고 출처 '댄스잡'이 추가되었습니다.

이제 발레매니아, 이상댄스에 이어 댄스잡의 공고도 블랙스완에서 한 번에 확인하실 수 있습니다.

더 많은 공고를 빠르게 찾아보세요.`,
  },
  {
    id: 3,
    tag: "이벤트",
    title: "출시 기념 선착순 프리미엄 무료 체험",
    date: "2025.06.01",
    isNew: false,
    body: `블랙스완 출시를 기념하여 선착순 500명에게 프리미엄 기능 1개월 무료 체험 기회를 드립니다.

프리미엄 기능:
• 알림 조건 무제한 설정
• 공고 지원 현황 실시간 알림
• 저장 공고 폴더 관리

이미 프리미엄이 적용되신 분들은 마이 페이지에서 확인하실 수 있습니다.`,
  },
  {
    id: 4,
    tag: "서비스",
    title: "개인정보처리방침 개정 안내",
    date: "2025.05.20",
    isNew: false,
    body: `개인정보보호법 개정에 따라 블랙스완의 개인정보처리방침이 일부 수정되었습니다.

주요 변경 사항:
• 개인정보 보유 기간 명확화
• 제3자 제공 동의 절차 간소화

자세한 내용은 마이 > 개인정보처리방침에서 확인하실 수 있습니다.`,
  },
];

export function NoticePage({ onBack }: { onBack: () => void }) {
  const [expanded, setExpanded] = useState<number | null>(1);

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
          공지사항
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          padding: "16px 16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 6,
        }}
      >
        {notices.map((n) => {
          const open = expanded === n.id;
          return (
            <div
              key={n.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.07)",
                overflow: "hidden",
              }}
            >
              <button
                onClick={() => setExpanded(open ? null : n.id)}
                style={{
                  width: "100%",
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: "16px",
                  textAlign: "left",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  gap: 10,
                }}
              >
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 5 }}>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 700,
                        color: open ? "#fff" : "#555",
                        backgroundColor: open ? "#0a0a0a" : "#f2f2f4",
                        borderRadius: 5,
                        paddingLeft: 6, paddingRight: 6,
                        paddingTop: 2, paddingBottom: 2,
                        transition: "all 0.15s",
                      }}
                    >
                      {n.tag}
                    </span>
                    {n.isNew && (
                      <span
                        style={{
                          fontSize: 9, fontWeight: 700, color: "#fff",
                          backgroundColor: "#0a0a0a",
                          borderRadius: 4,
                          paddingLeft: 5, paddingRight: 5,
                          paddingTop: 2, paddingBottom: 2,
                        }}
                      >
                        NEW
                      </span>
                    )}
                  </div>
                  <p
                    style={{
                      fontSize: 13, fontWeight: 700, color: "#0a0a0a",
                      letterSpacing: -0.3, lineHeight: 1.4,
                      marginBottom: 3,
                    }}
                  >
                    {n.title}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 400, color: "#bbb" }}>{n.date}</p>
                </div>
                <div style={{ flexShrink: 0, color: "#ccc" }}>
                  {open ? <ChevronUp size={16} strokeWidth={2} /> : <ChevronDown size={16} strokeWidth={2} />}
                </div>
              </button>

              {open && (
                <div
                  style={{
                    padding: "0 16px 16px",
                    borderTop: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ paddingTop: 14 }}>
                    {n.body.split("\n").map((line, i) => (
                      <p
                        key={i}
                        style={{
                          fontSize: 13, fontWeight: 400,
                          color: line.startsWith("•") ? "#333" : "#555",
                          lineHeight: 1.65,
                          letterSpacing: -0.2,
                          marginTop: line === "" ? 8 : 0,
                          fontWeight: line.endsWith(":") ? 600 : 400,
                        } as React.CSSProperties}
                      >
                        {line || " "}
                      </p>
                    ))}
                  </div>
                </div>
              )}
            </div>
          );
        })}
      </div>
    </div>
  );
}
