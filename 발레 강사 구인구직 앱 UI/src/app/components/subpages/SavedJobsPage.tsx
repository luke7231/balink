import { useState } from "react";
import { ChevronLeft, Bookmark, BookmarkCheck, MapPin, Clock, Trash2 } from "lucide-react";

const initialSaved = [
  {
    id: 1,
    studio: "리베라 발레 스튜디오",
    region: "서울 강남",
    days: "월수금 10:00-12:00",
    pay: "타임당 4만원",
    type: "성인발레",
    source: "발레매니아",
    daysLeft: 3,
    savedAt: "2025.06.15",
  },
  {
    id: 3,
    studio: "그랑 발레 센터",
    region: "서울 서초",
    days: "월수금 16:00-18:00",
    pay: "협의",
    type: "초등발레",
    source: "발레매니아",
    daysLeft: 1,
    savedAt: "2025.06.14",
  },
  {
    id: 5,
    studio: "로열 발레 아카데미",
    region: "인천 연수",
    days: "화목토 14:00-16:00",
    pay: "총 9만원",
    type: "유아·초등",
    source: "발레매니아",
    daysLeft: 5,
    savedAt: "2025.06.13",
  },
];

export function SavedJobsPage({ onBack }: { onBack: () => void }) {
  const [saved, setSaved] = useState(initialSaved);
  const [removing, setRemoving] = useState<number | null>(null);

  const remove = (id: number) => {
    setRemoving(id);
    setTimeout(() => {
      setSaved((prev) => prev.filter((j) => j.id !== id));
      setRemoving(null);
    }, 180);
  };

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f5f5f7" }}>
      {/* Header */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 12,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: 14,
          backgroundColor: "#f5f5f7",
          borderBottom: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={onBack}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#0a0a0a", display: "flex" }}
          >
            <ChevronLeft size={22} strokeWidth={2} />
          </button>
          <span style={{ fontSize: 17, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.5 }}>
            저장한 공고
          </span>
        </div>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#aaa" }}>{saved.length}개</span>
      </div>

      {/* List */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          padding: "16px 16px 24px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {saved.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 80,
              gap: 10,
            }}
          >
            <Bookmark size={36} strokeWidth={1.4} color="#ddd" />
            <p style={{ fontSize: 14, fontWeight: 600, color: "#bbb", letterSpacing: -0.3 }}>
              저장한 공고가 없어요
            </p>
            <p style={{ fontSize: 12, fontWeight: 400, color: "#ccc" }}>
              마음에 드는 공고를 저장해보세요
            </p>
          </div>
        ) : (
          saved.map((job) => (
            <div
              key={job.id}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.07)",
                padding: 16,
                cursor: "pointer",
                opacity: removing === job.id ? 0.4 : 1,
                transition: "opacity 0.18s",
              }}
            >
              {/* Top row */}
              <div style={{ display: "flex", alignItems: "flex-start", justifyContent: "space-between", marginBottom: 10 }}>
                <div style={{ flex: 1 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 4 }}>
                    <span
                      style={{
                        fontSize: 10, fontWeight: 600, color: "#888",
                        backgroundColor: "#f2f2f4", borderRadius: 5,
                        paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2,
                      }}
                    >
                      {job.source}
                    </span>
                    <span style={{ fontSize: 10, fontWeight: 500, color: "#bbb" }}>{job.type}</span>
                  </div>
                  <p style={{ fontSize: 15, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.4, lineHeight: 1.35 }}>
                    {job.studio}
                  </p>
                </div>
                <button
                  onClick={(e) => { e.stopPropagation(); remove(job.id); }}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 4, color: "#ddd", display: "flex", flexShrink: 0 }}
                >
                  <Trash2 size={15} strokeWidth={1.7} />
                </button>
              </div>

              {/* Mid info */}
              <div style={{ display: "flex", gap: 12, marginBottom: 10 }}>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <MapPin size={11} strokeWidth={1.8} color="#bbb" />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#888" }}>{job.region}</span>
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                  <Clock size={11} strokeWidth={1.8} color="#bbb" />
                  <span style={{ fontSize: 11, fontWeight: 500, color: "#888" }}>{job.days}</span>
                </div>
              </div>

              {/* Bottom row */}
              <div
                style={{
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "space-between",
                  paddingTop: 10,
                  borderTop: "1px solid rgba(0,0,0,0.05)",
                }}
              >
                <span style={{ fontSize: 16, fontWeight: 800, color: "#0a0a0a", letterSpacing: -0.5 }}>
                  {job.pay}
                </span>
                <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
                  <span style={{ fontSize: 10, fontWeight: 400, color: "#ccc" }}>
                    저장 {job.savedAt}
                  </span>
                  <span
                    style={{
                      fontSize: 11, fontWeight: 700,
                      color: job.daysLeft <= 3 ? "#d4183d" : "#aaa",
                    }}
                  >
                    D-{job.daysLeft}
                  </span>
                </div>
              </div>
            </div>
          ))
        )}
      </div>
    </div>
  );
}
