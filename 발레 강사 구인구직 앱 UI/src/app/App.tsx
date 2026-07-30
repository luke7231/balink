import { useState } from "react";
import {
  Search,
  Menu,
  Home,
  Briefcase,
  Bell,
  User,
  Bookmark,
  BookmarkCheck,
  ChevronRight,
} from "lucide-react";
import { JobsPage } from "./components/JobsPage";
import { AlertPage } from "./components/AlertPage";
import { MyPage } from "./components/MyPage";
import { JobDetailPage, type Job } from "./components/JobDetailPage";
import { LoginPage } from "./components/LoginPage";

/* MARKER-MAKE-KIT-INVOKED */
/* MARKER-MAKE-KIT-DISCOVERY-READ */

const subPosts = [
  {
    id: 1,
    author: "김발레",
    badge: "강사",
    region: "서울 강남",
    title: "오늘 저녁 성인반 대타 급구요 🙏",
    tags: ["성인발레", "강남", "오늘저녁"],
    likes: 3,
    comments: 5,
    isUrgent: true,
    timeAgo: "10분 전",
  },
  {
    id: 2,
    author: "박튀튀",
    badge: "강사",
    region: "경기 수원",
    title: "다음 주 화요일 유아반 대타 찾습니다",
    tags: ["유아발레", "수원", "6월24일"],
    likes: 7,
    comments: 2,
    isUrgent: false,
    timeAgo: "43분 전",
  },
  {
    id: 5,
    author: "정발레",
    badge: "강사",
    region: "서울 송파",
    title: "이번 주 토요일 오전 대타 급하게 구해요",
    tags: ["성인발레", "송파", "토요일"],
    likes: 5,
    comments: 3,
    isUrgent: true,
    timeAgo: "어제",
  },
];

const jobListings = [
  {
    id: 1,
    studio: "리베라 발레 스튜디오",
    region: "서울 강남",
    days: "월수금 10:00-12:00",
    pay: "타임당 4만원",
    type: "성인발레",
    source: "발레매니아",
    isNew: true,
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
  },
  {
    id: 5,
    studio: "로열 발레 아카데미",
    region: "인천 연수",
    days: "화목토 14:00-16:00",
    pay: "총 9만원",
    type: "유아·초등",
    source: "발레매니아",
    isNew: true,
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
  },
];

const tabs = [
  { id: "home", label: "홈", Icon: Home },
  { id: "jobs", label: "공고", Icon: Briefcase },
  { id: "alert", label: "알림", Icon: Bell },
  { id: "my", label: "마이", Icon: User },
];

type TabId = "home" | "jobs" | "alert" | "my";

export default function App() {
  const [activeTab, setActiveTab] = useState<TabId>("home");
  const [bookmarks, setBookmarks] = useState<Set<number>>(new Set());
  const [detailJob, setDetailJob] = useState<Job | null>(null);
  const [showLogin, setShowLogin] = useState(false);
  const unreadAlerts = 3;

  const toggleBookmark = (id: number) => {
    setBookmarks((prev) => {
      const next = new Set(prev);
      if (next.has(id)) next.delete(id);
      else next.add(id);
      return next;
    });
  };

  return (
    <div
      className="flex items-center justify-center min-h-screen"
      style={{ backgroundColor: "#e8e8ea" }}
    >
      {/* iPhone frame */}
      <div
        className="relative overflow-hidden flex flex-col"
        style={{
          width: 390,
          height: 844,
          backgroundColor: "#f5f5f7",
          borderRadius: 44,
          boxShadow:
            "0 32px 80px rgba(0,0,0,0.22), 0 0 0 1px rgba(0,0,0,0.08)",
          fontFamily:
            "'Apple SD Gothic Neo', 'Pretendard', 'Noto Sans KR', -apple-system, BlinkMacSystemFont, sans-serif",
        }}
      >
        {/* Status bar */}
        <div
          className="flex items-center justify-between px-6 shrink-0"
          style={{ height: 44, paddingTop: 12 }}
        >
          <span style={{ fontSize: 13, fontWeight: 600, color: "#111" }}>
            9:41
          </span>
          <div className="flex items-center gap-1.5">
            <svg width="17" height="12" viewBox="0 0 17 12" fill="none">
              <rect x="0" y="3" width="3" height="9" rx="1" fill="#111" />
              <rect x="4.5" y="2" width="3" height="10" rx="1" fill="#111" />
              <rect x="9" y="0.5" width="3" height="11.5" rx="1" fill="#111" />
              <rect x="13.5" y="0" width="3" height="12" rx="1" fill="#111" opacity="0.3" />
            </svg>
            <svg width="15" height="11" viewBox="0 0 15 11" fill="none">
              <path d="M7.5 2.5C9.2 2.5 10.7 3.2 11.8 4.3L13 3C11.5 1.6 9.6 0.8 7.5 0.8C5.4 0.8 3.5 1.6 2 3L3.2 4.3C4.3 3.2 5.8 2.5 7.5 2.5Z" fill="#111" />
              <path d="M7.5 5.5C8.5 5.5 9.4 5.9 10.1 6.6L11.3 5.3C10.2 4.3 8.9 3.8 7.5 3.8C6.1 3.8 4.8 4.3 3.7 5.3L4.9 6.6C5.6 5.9 6.5 5.5 7.5 5.5Z" fill="#111" />
              <circle cx="7.5" cy="9" r="1.5" fill="#111" />
            </svg>
            <div
              style={{
                width: 25,
                height: 12,
                border: "1px solid rgba(0,0,0,0.35)",
                borderRadius: 3,
                padding: "1.5px",
                display: "flex",
                alignItems: "center",
              }}
            >
              <div
                style={{
                  width: "70%",
                  height: "100%",
                  backgroundColor: "#111",
                  borderRadius: 1.5,
                }}
              />
            </div>
          </div>
        </div>

        {/* Header — only on home */}
        {activeTab === "home" && (
          <div
            className="flex items-center justify-between shrink-0"
            style={{
              paddingLeft: 20,
              paddingRight: 20,
              paddingTop: 8,
              paddingBottom: 12,
              backgroundColor: "#f5f5f7",
            }}
          >
            <div style={{ display: "flex", alignItems: "baseline", gap: 2 }}>
              <span
                style={{
                  fontSize: 22,
                  fontWeight: 800,
                  color: "#0a0a0a",
                  letterSpacing: -0.8,
                }}
              >
                블랙스완
              </span>
              <div
                style={{
                  width: 5,
                  height: 5,
                  backgroundColor: "#0a0a0a",
                  borderRadius: "50%",
                  marginBottom: 3,
                  marginLeft: 1,
                }}
              />
            </div>
            <div className="flex items-center gap-3">
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "#0a0a0a",
                }}
              >
                <Search size={20} strokeWidth={1.8} />
              </button>
              <button
                style={{
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 4,
                  color: "#0a0a0a",
                }}
              >
                <Menu size={20} strokeWidth={1.8} />
              </button>
              <button
                onClick={() => setShowLogin(true)}
              style={{
                  backgroundColor: "#0a0a0a",
                  color: "#fff",
                  border: "none",
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
                로그인
              </button>
            </div>
          </div>
        )}

        {/* Page content */}
        <div
          style={{
            flex: 1,
            overflow: "hidden",
            display: "flex",
            flexDirection: "column",
            paddingBottom: 0,
          }}
        >
          {detailJob ? (
            <JobDetailPage
              job={detailJob}
              onBack={() => setDetailJob(null)}
              isBookmarked={bookmarks.has(detailJob.id)}
              onBookmark={() => toggleBookmark(detailJob.id)}
            />
          ) : (
            <>
              {activeTab === "home" && (
                <HomePage
                  bookmarks={bookmarks}
                  onBookmark={toggleBookmark}
                  onTabChange={setActiveTab}
                  onSelectJob={setDetailJob}
                />
              )}
              {activeTab === "jobs" && <JobsPage />}
              {activeTab === "alert" && <AlertPage />}
              {activeTab === "my" && <MyPage />}
            </>
          )}
        </div>

        {/* Login overlay */}
        {showLogin && <LoginPage onClose={() => setShowLogin(false)} />}

        {/* Bottom Tab Bar — hidden when detail page is open */}
        {!detailJob && <div
          style={{
            position: "absolute",
            bottom: 0,
            left: 0,
            right: 0,
            height: 80,
            backgroundColor: "#ffffff",
            borderTop: "1px solid rgba(0,0,0,0.07)",
            display: "flex",
            alignItems: "flex-start",
            paddingTop: 10,
            paddingBottom: 20,
          }}
        >
          {tabs.map(({ id, label, Icon }) => {
            const active = activeTab === id;
            const showBadge = id === "alert" && unreadAlerts > 0;
            return (
              <button
                key={id}
                onClick={() => setActiveTab(id as TabId)}
                style={{
                  flex: 1,
                  display: "flex",
                  flexDirection: "column",
                  alignItems: "center",
                  gap: 3,
                  background: "none",
                  border: "none",
                  cursor: "pointer",
                  padding: 0,
                  color: active ? "#0a0a0a" : "#b0b0b8",
                  position: "relative",
                }}
              >
                <div style={{ position: "relative" }}>
                  <Icon
                    size={22}
                    strokeWidth={active ? 2.2 : 1.7}
                    fill={active && id !== "alert" ? "#0a0a0a" : "none"}
                    color={active ? "#0a0a0a" : "#b0b0b8"}
                  />
                  {showBadge && (
                    <div
                      style={{
                        position: "absolute",
                        top: -3,
                        right: -4,
                        width: 14,
                        height: 14,
                        backgroundColor: "#0a0a0a",
                        borderRadius: "50%",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        border: "1.5px solid #fff",
                      }}
                    >
                      <span
                        style={{
                          fontSize: 8,
                          fontWeight: 700,
                          color: "#fff",
                          lineHeight: 1,
                        }}
                      >
                        {unreadAlerts}
                      </span>
                    </div>
                  )}
                </div>
                <span
                  style={{
                    fontSize: 10,
                    fontWeight: active ? 700 : 500,
                    letterSpacing: -0.1,
                  }}
                >
                  {label}
                </span>
              </button>
            );
          })}
        </div>}
      </div>
    </div>
  );
}

/* ────────────────── Home page ────────────────── */
function HomePage({
  bookmarks,
  onBookmark,
  onTabChange,
  onSelectJob,
}: {
  bookmarks: Set<number>;
  onBookmark: (id: number) => void;
  onTabChange: (tab: TabId) => void;
  onSelectJob: (job: Job) => void;
}) {
  return (
    <div
      style={{
        flex: 1,
        overflowY: "auto",
        scrollbarWidth: "none",
        paddingBottom: 80,
      }}
    >
      {/* Main Banner */}
      <div style={{ paddingLeft: 16, paddingRight: 16, paddingBottom: 20 }}>
        <div
          style={{
            backgroundColor: "#0a0a0a",
            borderRadius: 20,
            padding: 24,
            position: "relative",
            overflow: "hidden",
            minHeight: 180,
          }}
        >
          <div
            style={{
              position: "absolute",
              right: -10,
              bottom: -10,
              width: 140,
              height: 160,
              opacity: 0.08,
            }}
          >
            <BalletSilhouette />
          </div>
          <div
            style={{
              position: "absolute",
              inset: 0,
              backgroundImage:
                "radial-gradient(circle at 80% 20%, rgba(255,255,255,0.04) 0%, transparent 60%)",
              borderRadius: 20,
            }}
          />

          <div style={{ position: "relative", zIndex: 1 }}>
            <div
              style={{
                display: "inline-flex",
                alignItems: "center",
                gap: 5,
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 20,
                paddingLeft: 10,
                paddingRight: 10,
                paddingTop: 4,
                paddingBottom: 4,
                marginBottom: 14,
              }}
            >
              <div
                style={{
                  width: 6,
                  height: 6,
                  backgroundColor: "#fff",
                  borderRadius: "50%",
                }}
              />
              <span
                style={{
                  fontSize: 11,
                  fontWeight: 600,
                  color: "rgba(255,255,255,0.7)",
                  letterSpacing: 0.2,
                }}
              >
                TODAY
              </span>
            </div>

            <p
              style={{
                fontSize: 22,
                fontWeight: 700,
                color: "#ffffff",
                lineHeight: 1.35,
                letterSpacing: -0.5,
                marginBottom: 8,
              }}
            >
              오늘 들어온
              <br />
              발레 공고
            </p>
            <p
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "rgba(255,255,255,0.5)",
                lineHeight: 1.5,
                marginBottom: 22,
                letterSpacing: -0.2,
              }}
            >
              내 조건에 맞는 수업을 빠르게 찾아보세요
            </p>

            <button
              onClick={() => onTabChange("jobs")}
              style={{
                backgroundColor: "#ffffff",
                color: "#0a0a0a",
                border: "none",
                borderRadius: 12,
                paddingLeft: 18,
                paddingRight: 18,
                paddingTop: 10,
                paddingBottom: 10,
                fontSize: 13,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: -0.2,
                display: "flex",
                alignItems: "center",
                gap: 4,
              }}
            >
              공고 보기
              <ChevronRight size={14} strokeWidth={2.5} />
            </button>
          </div>
        </div>
      </div>

      {/* Section: 오늘의 발레 공고 */}
      <div style={{ paddingLeft: 20, paddingRight: 20 }}>
        <div
          className="flex items-center justify-between"
          style={{ marginBottom: 14 }}
        >
          <span
            style={{
              fontSize: 17,
              fontWeight: 700,
              color: "#0a0a0a",
              letterSpacing: -0.4,
            }}
          >
            오늘의 발레 공고
          </span>
          <button
            onClick={() => onTabChange("jobs")}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              fontSize: 13,
              fontWeight: 500,
              color: "#888",
              letterSpacing: -0.2,
              display: "flex",
              alignItems: "center",
              gap: 2,
              padding: 0,
            }}
          >
            더 보기
            <ChevronRight size={13} strokeWidth={2} />
          </button>
        </div>

        <div
          style={{
            display: "grid",
            gridTemplateColumns: "1fr 1fr",
            gap: 10,
          }}
        >
          {jobListings.map((job) => (
            <JobCard
              key={job.id}
              job={job}
              isBookmarked={bookmarks.has(job.id)}
              onBookmark={() => onBookmark(job.id)}
              onSelect={() => onSelectJob(job)}
            />
          ))}
        </div>
      </div>

      {/* 대타 섹션 */}
      <div style={{ paddingLeft: 20, paddingRight: 20, paddingBottom: 24 }}>
        <div className="flex items-center justify-between" style={{ marginBottom: 14 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
            <span style={{ fontSize: 17, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.4 }}>
              대타 게시판
            </span>
            <span
              style={{
                fontSize: 10, fontWeight: 700, color: "#d4183d",
                backgroundColor: "#fdf0f3", borderRadius: 5,
                paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2,
              }}
            >
              급구 2
            </span>
          </div>
          <button
            onClick={() => onTabChange("jobs")}
            style={{
              background: "none", border: "none", cursor: "pointer",
              fontSize: 13, fontWeight: 500, color: "#888", letterSpacing: -0.2,
              display: "flex", alignItems: "center", gap: 2, padding: 0,
            }}
          >
            더 보기 <ChevronRight size={13} strokeWidth={2} />
          </button>
        </div>

        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {subPosts.map((post) => (
            <SubPostCard key={post.id} post={post} />
          ))}
        </div>
      </div>
    </div>
  );
}

function JobCard({
  job,
  isBookmarked,
  onBookmark,
  onSelect,
}: {
  job: (typeof jobListings)[0];
  isBookmarked: boolean;
  onBookmark: () => void;
  onSelect: () => void;
}) {
  return (
    <div
      onClick={onSelect}
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        padding: 14,
        position: "relative",
        cursor: "pointer",
      }}
    >
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          marginBottom: 10,
        }}
      >
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
            letterSpacing: -0.1,
          }}
        >
          {job.source}
        </span>
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
            display: "flex",
            alignItems: "center",
          }}
        >
          {isBookmarked ? (
            <BookmarkCheck size={15} strokeWidth={2} />
          ) : (
            <Bookmark size={15} strokeWidth={1.7} />
          )}
        </button>
      </div>

      <p
        style={{
          fontSize: 16,
          fontWeight: 800,
          color: "#0a0a0a",
          letterSpacing: -0.5,
          lineHeight: 1.2,
          marginBottom: 4,
        }}
      >
        {job.pay}
      </p>

      <p
        style={{
          fontSize: 11,
          fontWeight: 600,
          color: "#444",
          letterSpacing: -0.2,
          marginBottom: 8,
          lineHeight: 1.4,
        }}
      >
        {job.days}
      </p>

      <div
        style={{
          height: 1,
          backgroundColor: "rgba(0,0,0,0.06)",
          marginBottom: 8,
        }}
      />

      <p
        style={{
          fontSize: 12,
          fontWeight: 600,
          color: "#1a1a1a",
          letterSpacing: -0.3,
          lineHeight: 1.4,
          marginBottom: 3,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 2,
          WebkitBoxOrient: "vertical" as const,
        }}
      >
        {job.studio}
      </p>

      <div style={{ display: "flex", flexDirection: "column", gap: 1 }}>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "#999",
            letterSpacing: -0.1,
          }}
        >
          {job.region}
        </span>
        <span
          style={{
            fontSize: 10,
            fontWeight: 500,
            color: "#bbb",
            letterSpacing: -0.1,
          }}
        >
          {job.type}
        </span>
      </div>
    </div>
  );
}

function BalletSilhouette() {
  return (
    <svg
      viewBox="0 0 140 160"
      fill="none"
      xmlns="http://www.w3.org/2000/svg"
      style={{ width: "100%", height: "100%" }}
    >
      <ellipse cx="70" cy="48" rx="8" ry="11" fill="white" />
      <circle cx="70" cy="28" r="9" fill="white" />
      <path d="M62 56 Q70 72 78 56" stroke="white" strokeWidth="2" fill="white" opacity="0.9" />
      <path d="M62 54 Q40 42 18 48" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M78 54 Q100 38 125 30" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      <path d="M70 72 Q68 100 66 130" stroke="white" strokeWidth="3.5" strokeLinecap="round" fill="none" />
      <path d="M70 72 Q90 85 118 72" stroke="white" strokeWidth="3" strokeLinecap="round" fill="none" />
      <ellipse cx="65" cy="133" rx="5" ry="3" fill="white" />
      <path d="M58 68 Q70 78 82 68 Q76 62 70 66 Q64 62 58 68Z" fill="white" opacity="0.5" />
      <ellipse cx="72" cy="20" rx="5" ry="4" fill="white" opacity="0.6" />
    </svg>
  );
}

function SubPostCard({ post }: { post: (typeof subPosts)[0] }) {
  return (
    <div
      style={{
        backgroundColor: "#ffffff",
        borderRadius: 14,
        border: "1px solid rgba(0,0,0,0.07)",
        boxShadow: "0 1px 4px rgba(0,0,0,0.04)",
        padding: "13px 15px",
        cursor: "pointer",
      }}
    >
      {/* Author row */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 8 }}>
        <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
          <div
            style={{
              width: 24,
              height: 24,
              borderRadius: "50%",
              backgroundColor: "#0a0a0a",
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              flexShrink: 0,
            }}
          >
            <span style={{ fontSize: 10, fontWeight: 700, color: "#fff" }}>
              {post.author.charAt(0)}
            </span>
          </div>
          <span style={{ fontSize: 12, fontWeight: 600, color: "#555", letterSpacing: -0.2 }}>
            {post.author}
          </span>
          <span style={{ fontSize: 10, fontWeight: 500, color: "#bbb" }}>·</span>
          <span style={{ fontSize: 11, fontWeight: 400, color: "#bbb" }}>{post.region}</span>
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
          {post.isUrgent && (
            <span
              style={{
                fontSize: 9, fontWeight: 800, color: "#d4183d",
                backgroundColor: "#fdf0f3", borderRadius: 5,
                paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2,
                letterSpacing: 0.2,
              }}
            >
              급구
            </span>
          )}
          <span style={{ fontSize: 10, fontWeight: 400, color: "#ccc" }}>{post.timeAgo}</span>
        </div>
      </div>

      {/* Title */}
      <p
        style={{
          fontSize: 13,
          fontWeight: 700,
          color: "#0a0a0a",
          letterSpacing: -0.3,
          lineHeight: 1.4,
          marginBottom: 8,
          overflow: "hidden",
          display: "-webkit-box",
          WebkitLineClamp: 1,
          WebkitBoxOrient: "vertical" as const,
        }}
      >
        {post.title}
      </p>

      {/* Bottom row: tags + stats */}
      <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
        <div style={{ display: "flex", gap: 4 }}>
          {post.tags.slice(0, 2).map((t) => (
            <span
              key={t}
              style={{
                fontSize: 10, fontWeight: 600, color: "#777",
                backgroundColor: "#f5f5f7", borderRadius: 5,
                paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2,
              }}
            >
              #{t}
            </span>
          ))}
        </div>
        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 11, color: "#d4a0a0" }}>♥</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#bbb" }}>{post.likes}</span>
          </div>
          <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
            <span style={{ fontSize: 11, color: "#bbb" }}>💬</span>
            <span style={{ fontSize: 11, fontWeight: 500, color: "#bbb" }}>{post.comments}</span>
          </div>
        </div>
      </div>
    </div>
  );
}
