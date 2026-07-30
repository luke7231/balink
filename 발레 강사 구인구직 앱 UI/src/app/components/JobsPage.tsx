import { useState } from "react";
import { Search, SlidersHorizontal, Bookmark, BookmarkCheck, ChevronRight, MapPin, Clock } from "lucide-react";
import { JobDetailPage, type Job } from "./JobDetailPage";
import { SubstitudePage } from "./SubstitudePage";

const filters = ["전체", "성인발레", "유아발레", "초등발레", "문화센터"];
const regions = ["전체 지역", "서울", "경기", "인천", "부산"];

const allJobs = [
  {
    id: 1,
    studio: "리베라 발레 스튜디오",
    region: "서울 강남",
    days: "월수금 10:00-12:00",
    pay: "타임당 4만원",
    type: "성인발레",
    source: "발레매니아",
    isNew: true,
    daysLeft: 3,
  },
  {
    id: 2,
    studio: "아르떼 댄스 아카데미",
    region: "경기 수원",
    days: "화목 19:20-21:50",
    pay: "총 7만원",
    type: "유아발레",
    source: "이상댄스",
    isNew: false,
    daysLeft: 7,
  },
  {
    id: 3,
    studio: "그랑 발레 센터",
    region: "서울 서초",
    days: "월수금 16:00-18:00",
    pay: "협의",
    type: "초등발레",
    source: "발레매니아",
    isNew: true,
    daysLeft: 1,
  },
  {
    id: 4,
    studio: "피루엣 발레 스쿨",
    region: "서울 마포",
    days: "토일 10:00-13:00",
    pay: "타임당 5만원",
    type: "성인발레",
    source: "이상댄스",
    isNew: false,
    daysLeft: 10,
  },
  {
    id: 5,
    studio: "로열 발레 아카데미",
    region: "인천 연수",
    days: "화목토 14:00-16:00",
    pay: "총 9만원",
    type: "유아발레",
    source: "발레매니아",
    isNew: true,
    daysLeft: 5,
  },
  {
    id: 6,
    studio: "앙트르샤 댄스",
    region: "서울 강서",
    days: "월화수목 18:00-20:00",
    pay: "협의",
    type: "성인발레",
    source: "이상댄스",
    isNew: false,
    daysLeft: 14,
  },
  {
    id: 7,
    studio: "파드되 발레 스튜디오",
    region: "서울 송파",
    days: "화목 10:00-12:00",
    pay: "타임당 4.5만원",
    type: "초등발레",
    source: "발레매니아",
    isNew: false,
    daysLeft: 6,
  },
  {
    id: 8,
    studio: "아라베스크 댄스센터",
    region: "경기 성남",
    days: "월수 15:00-17:30",
    pay: "총 8만원",
    type: "성인발레",
    source: "이상댄스",
    isNew: true,
    daysLeft: 2,
  },
];

export function JobsPage() {
  const [activeTab, setActiveTab] = useState<"jobs" | "sub">("jobs");
  const [activeFilter, setActiveFilter] = useState("전체");
  const [activeRegion, setActiveRegion] = useState("전체 지역");
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set([1, 3]));
  const [search, setSearch] = useState("");
  const [selectedJob, setSelectedJob] = useState<Job | null>(null);

  const toggleBookmark = (id: number) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  if (selectedJob) {
    return (
      <JobDetailPage
        job={selectedJob}
        onBack={() => setSelectedJob(null)}
        isBookmarked={bookmarks.has(selectedJob.id)}
        onBookmark={() => toggleBookmark(selectedJob.id)}
      />
    );
  }

  const filtered = allJobs.filter((j) => {
    const matchType = activeFilter === "전체" || j.type === activeFilter;
    const matchRegion =
      activeRegion === "전체 지역" || j.region.startsWith(activeRegion);
    const matchSearch =
      search === "" ||
      j.studio.includes(search) ||
      j.region.includes(search) ||
      j.type.includes(search);
    return matchType && matchRegion && matchSearch;
  });

  return (
    <div className="flex flex-col h-full">
      {/* Top header with tab switcher */}
      <div
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 8,
          paddingBottom: 0,
          backgroundColor: "#f5f5f7",
        }}
      >
        <div style={{ marginBottom: 14 }}>
          <span style={{ fontSize: 22, fontWeight: 800, color: "#0a0a0a", letterSpacing: -0.8 }}>
            공고
          </span>
        </div>

        {/* Tab pill switcher */}
        <div
          style={{
            display: "flex",
            backgroundColor: "#ebebed",
            borderRadius: 12,
            padding: 3,
            marginBottom: 14,
          }}
        >
          {(["jobs", "sub"] as const).map((tab) => {
            const label = tab === "jobs" ? "공고" : "대타";
            const active = activeTab === tab;
            return (
              <button
                key={tab}
                onClick={() => setActiveTab(tab)}
                style={{
                  flex: 1,
                  height: 34,
                  borderRadius: 10,
                  backgroundColor: active ? "#ffffff" : "transparent",
                  border: "none",
                  cursor: "pointer",
                  fontSize: 14,
                  fontWeight: active ? 700 : 500,
                  color: active ? "#0a0a0a" : "#888",
                  letterSpacing: -0.3,
                  boxShadow: active ? "0 1px 4px rgba(0,0,0,0.1)" : "none",
                  transition: "all 0.15s",
                }}
              >
                {label}
              </button>
            );
          })}
        </div>
      </div>

      {/* Tab content */}
      {activeTab === "sub" ? (
        <SubstitudePage />
      ) : (
      <div
        style={{
          display: "flex",
          flexDirection: "column",
          flex: 1,
          overflow: "hidden",
        }}
      >

      {/* Jobs filter header */}
      <div
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 0,
          paddingBottom: 12,
          backgroundColor: "#f5f5f7",
        }}
      >
        {/* Search bar */}
        <div
          style={{
            backgroundColor: "#ffffff",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.08)",
            display: "flex",
            alignItems: "center",
            gap: 8,
            paddingLeft: 14,
            paddingRight: 14,
            paddingTop: 10,
            paddingBottom: 10,
            marginBottom: 12,
          }}
        >
          <Search size={16} strokeWidth={1.8} color="#999" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="학원명, 지역, 수업 종류로 검색"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 14,
              color: "#1a1a1a",
              letterSpacing: -0.3,
            }}
          />
          {search && (
            <button
              onClick={() => setSearch("")}
              style={{
                background: "none",
                border: "none",
                cursor: "pointer",
                color: "#bbb",
                fontSize: 16,
                lineHeight: 1,
                padding: 0,
              }}
            >
              ×
            </button>
          )}
        </div>

        {/* Region filter row */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            scrollbarWidth: "none",
            marginBottom: 8,
          }}
        >
          {regions.map((r) => (
            <button
              key={r}
              onClick={() => setActiveRegion(r)}
              style={{
                whiteSpace: "nowrap",
                flexShrink: 0,
                backgroundColor: activeRegion === r ? "#0a0a0a" : "#ffffff",
                color: activeRegion === r ? "#fff" : "#555",
                border: activeRegion === r ? "1px solid #0a0a0a" : "1px solid rgba(0,0,0,0.12)",
                borderRadius: 20,
                paddingLeft: 12,
                paddingRight: 12,
                paddingTop: 6,
                paddingBottom: 6,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: -0.2,
              }}
            >
              {r}
            </button>
          ))}
        </div>

        {/* Type filter row */}
        <div
          style={{
            display: "flex",
            gap: 6,
            overflowX: "auto",
            scrollbarWidth: "none",
          }}
        >
          {filters.map((f) => (
            <button
              key={f}
              onClick={() => setActiveFilter(f)}
              style={{
                whiteSpace: "nowrap",
                flexShrink: 0,
                backgroundColor: activeFilter === f ? "#0a0a0a" : "transparent",
                color: activeFilter === f ? "#fff" : "#888",
                border: "none",
                borderRadius: 20,
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 5,
                paddingBottom: 5,
                fontSize: 12,
                fontWeight: 600,
                cursor: "pointer",
                letterSpacing: -0.2,
              }}
            >
              {f}
            </button>
          ))}
        </div>
      </div>

      {/* Divider */}
      <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.06)" }} />

      {/* Count row */}
      <div
        style={{
          paddingLeft: 20,
          paddingRight: 20,
          paddingTop: 12,
          paddingBottom: 8,
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          backgroundColor: "#f5f5f7",
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, color: "#999" }}>
          총{" "}
          <span style={{ fontWeight: 700, color: "#0a0a0a" }}>{filtered.length}</span>
          개 공고
        </span>
        <button
          style={{
            display: "flex",
            alignItems: "center",
            gap: 4,
            background: "none",
            border: "none",
            cursor: "pointer",
            fontSize: 12,
            fontWeight: 600,
            color: "#555",
          }}
        >
          <SlidersHorizontal size={13} strokeWidth={1.8} />
          필터
        </button>
      </div>

      {/* Job list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          paddingLeft: 16,
          paddingRight: 16,
          paddingBottom: 16,
          display: "flex",
          flexDirection: "column",
          gap: 8,
          backgroundColor: "#f5f5f7",
        }}
      >
        {filtered.length === 0 ? (
          <div
            style={{
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              justifyContent: "center",
              paddingTop: 60,
              gap: 8,
            }}
          >
            <span style={{ fontSize: 32 }}>🩰</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#aaa" }}>
              해당 조건의 공고가 없어요
            </span>
          </div>
        ) : (
          filtered.map((job) => (
            <JobListCard
              key={job.id}
              job={job}
              isBookmarked={bookmarks.has(job.id)}
              onBookmark={() => toggleBookmark(job.id)}
              onSelect={() => setSelectedJob(job)}
            />
          ))
        )}
      </div>
      </div>
      )}
    </div>
  );
}

function JobListCard({
  job,
  isBookmarked,
  onBookmark,
  onSelect,
}: {
  onSelect: () => void;
  job: (typeof allJobs)[0];
  isBookmarked: boolean;
  onBookmark: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        padding: 16,
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "flex-start",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
        <div style={{ flex: 1, paddingRight: 8 }}>
          <div
            style={{
              display: "flex",
              alignItems: "center",
              gap: 6,
              marginBottom: 5,
            }}
          >
            {job.isNew && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#fff",
                  backgroundColor: "#0a0a0a",
                  borderRadius: 4,
                  paddingLeft: 5,
                  paddingRight: 5,
                  paddingTop: 2,
                  paddingBottom: 2,
                  letterSpacing: 0.2,
                }}
              >
                NEW
              </span>
            )}
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "#888",
                backgroundColor: "#f2f2f4",
                borderRadius: 5,
                paddingLeft: 6,
                paddingRight: 6,
                paddingTop: 2,
                paddingBottom: 2,
              }}
            >
              {job.source}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 500,
                color: "#bbb",
              }}
            >
              {job.type}
            </span>
          </div>

          <p
            style={{
              fontSize: 15,
              fontWeight: 700,
              color: "#0a0a0a",
              letterSpacing: -0.4,
              lineHeight: 1.35,
              marginBottom: 2,
            }}
          >
            {job.studio}
          </p>
        </div>

        <button
          onClick={(e) => {
            e.stopPropagation();
            onBookmark();
          }}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 0,
            color: isBookmarked ? "#0a0a0a" : "#c8c8cc",
            flexShrink: 0,
          }}
        >
          {isBookmarked ? (
            <BookmarkCheck size={18} strokeWidth={2} />
          ) : (
            <Bookmark size={18} strokeWidth={1.7} />
          )}
        </button>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          gap: 14,
          marginBottom: 10,
        }}
      >
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <MapPin size={11} strokeWidth={1.8} color="#999" />
          <span style={{ fontSize: 11, fontWeight: 500, color: "#777", letterSpacing: -0.1 }}>
            {job.region}
          </span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <Clock size={11} strokeWidth={1.8} color="#999" />
          <span style={{ fontSize: 11, fontWeight: 500, color: "#777", letterSpacing: -0.1 }}>
            {job.days}
          </span>
        </div>
      </div>

      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
        }}
      >
        <span
          style={{
            fontSize: 16,
            fontWeight: 800,
            color: "#0a0a0a",
            letterSpacing: -0.5,
          }}
        >
          {job.pay}
        </span>
        <span
          style={{
            fontSize: 11,
            fontWeight: 500,
            color: job.daysLeft <= 3 ? "#d4183d" : "#aaa",
          }}
        >
          {job.daysLeft <= 3 ? `마감 D-${job.daysLeft}` : `D-${job.daysLeft}`}
        </span>
      </div>
    </div>
  );
}
