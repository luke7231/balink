import { ChevronLeft, FileText, Clock, CheckCircle, XCircle, AlertCircle } from "lucide-react";

type Status = "검토중" | "합격" | "불합격" | "서류접수";

const applications = [
  {
    id: 1,
    studio: "리베라 발레 스튜디오",
    region: "서울 강남",
    type: "성인발레",
    pay: "타임당 4만원",
    appliedAt: "2025.06.15",
    status: "검토중" as Status,
  },
  {
    id: 2,
    studio: "아르떼 댄스 아카데미",
    region: "경기 수원",
    type: "유아발레",
    pay: "총 7만원",
    appliedAt: "2025.06.10",
    status: "합격" as Status,
  },
  {
    id: 3,
    studio: "그랑 발레 센터",
    region: "서울 서초",
    type: "초등발레",
    pay: "협의",
    appliedAt: "2025.06.02",
    status: "불합격" as Status,
  },
  {
    id: 4,
    studio: "로열 발레 아카데미",
    region: "인천 연수",
    type: "유아·초등",
    pay: "총 9만원",
    appliedAt: "2025.05.28",
    status: "서류접수" as Status,
  },
];

const statusConfig: Record<Status, { label: string; color: string; bg: string; Icon: React.ElementType }> = {
  검토중: { label: "검토중", color: "#555", bg: "#f2f2f4", Icon: Clock },
  합격: { label: "합격", color: "#1a7a3c", bg: "#edf7f1", Icon: CheckCircle },
  불합격: { label: "불합격", color: "#d4183d", bg: "#fdf0f3", Icon: XCircle },
  서류접수: { label: "서류접수", color: "#888", bg: "#f8f8f8", Icon: AlertCircle },
};

export function ApplicationsPage({ onBack }: { onBack: () => void }) {
  const counts = {
    전체: applications.length,
    검토중: applications.filter((a) => a.status === "검토중").length,
    합격: applications.filter((a) => a.status === "합격").length,
  };

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
          지원 내역
        </span>
      </div>

      {/* Summary cards */}
      <div
        style={{
          display: "grid",
          gridTemplateColumns: "1fr 1fr 1fr",
          gap: 8,
          padding: "16px 16px 8px",
        }}
      >
        {[
          { label: "전체 지원", value: counts.전체, sub: "건" },
          { label: "검토중", value: counts.검토중, sub: "건" },
          { label: "합격", value: counts.합격, sub: "건" },
        ].map((s) => (
          <div
            key={s.label}
            style={{
              backgroundColor: "#fff",
              borderRadius: 12,
              border: "1px solid rgba(0,0,0,0.07)",
              padding: "12px 14px",
              textAlign: "center",
            }}
          >
            <p style={{ fontSize: 22, fontWeight: 800, color: "#0a0a0a", letterSpacing: -0.5, lineHeight: 1.2 }}>
              {s.value}
              <span style={{ fontSize: 12, fontWeight: 500, color: "#aaa" }}>{s.sub}</span>
            </p>
            <p style={{ fontSize: 11, fontWeight: 500, color: "#999", marginTop: 3, letterSpacing: -0.1 }}>
              {s.label}
            </p>
          </div>
        ))}
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          padding: "8px 16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {applications.map((app) => {
          const cfg = statusConfig[app.status];
          const Icon = cfg.Icon;
          return (
            <div
              key={app.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.07)",
                padding: 16,
                cursor: "pointer",
              }}
            >
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.4, marginBottom: 3 }}>
                    {app.studio}
                  </p>
                  <p style={{ fontSize: 11, fontWeight: 500, color: "#999", letterSpacing: -0.1 }}>
                    {app.region} · {app.type}
                  </p>
                </div>
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    gap: 4,
                    backgroundColor: cfg.bg,
                    borderRadius: 20,
                    paddingLeft: 9,
                    paddingRight: 9,
                    paddingTop: 4,
                    paddingBottom: 4,
                    flexShrink: 0,
                  }}
                >
                  <Icon size={11} strokeWidth={2} color={cfg.color} />
                  <span style={{ fontSize: 11, fontWeight: 700, color: cfg.color, letterSpacing: -0.1 }}>
                    {cfg.label}
                  </span>
                </div>
              </div>

              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 10,
                  borderTop: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.4 }}>
                  {app.pay}
                </span>
                <span style={{ fontSize: 11, fontWeight: 400, color: "#bbb" }}>
                  지원일 {app.appliedAt}
                </span>
              </div>
            </div>
          );
        })}

        {/* Empty state hint */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            border: "1px dashed rgba(0,0,0,0.1)",
            padding: 20,
            textAlign: "center",
          }}
        >
          <FileText size={24} strokeWidth={1.5} color="#ccc" style={{ margin: "0 auto 8px" }} />
          <p style={{ fontSize: 13, fontWeight: 600, color: "#bbb", letterSpacing: -0.2 }}>
            공고에 관심있다면 지원해보세요
          </p>
          <p style={{ fontSize: 11, fontWeight: 400, color: "#ccc", marginTop: 3 }}>
            지원 내역이 여기에 기록됩니다
          </p>
        </div>
      </div>
    </div>
  );
}
