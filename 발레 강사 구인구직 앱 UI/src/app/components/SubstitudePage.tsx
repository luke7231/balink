import { useState } from "react";
import { Search, Plus, MessageCircle, Heart, Clock, ChevronRight, X } from "lucide-react";
import { SubstitudeDetailPage } from "./SubstitudeDetailPage";

type Post = {
  id: number;
  author: string;
  badge: string;
  region: string;
  date: string;
  title: string;
  body: string;
  tags: string[];
  likes: number;
  comments: number;
  isUrgent: boolean;
  isLiked: boolean;
  timeAgo: string;
};

const initialPosts: Post[] = [
  {
    id: 1,
    author: "김발레",
    badge: "강사",
    region: "서울 강남",
    date: "2025.06.19",
    timeAgo: "10분 전",
    title: "오늘 저녁 성인반 대타 급구요 🙏",
    body: "오늘 저녁 7시 성인 입문반 대타 구합니다. 갑자기 몸이 안 좋아서요ㅠ 2시간 수업이고 수강생 8명입니다. 사례비 협의 가능해요.",
    tags: ["성인발레", "강남", "오늘저녁"],
    likes: 3,
    comments: 5,
    isUrgent: true,
    isLiked: false,
  },
  {
    id: 2,
    author: "박튀튀",
    badge: "강사",
    region: "경기 수원",
    date: "2025.06.19",
    timeAgo: "43분 전",
    title: "다음 주 화요일 유아반 대타 찾습니다",
    body: "6월 24일 화요일 오후 4시 유아발레반(5~7세) 대타 부탁드립니다. 아이들 진도는 입문 과정이고 수업 자료 드려요. 타임당 4만원 드립니다.",
    tags: ["유아발레", "수원", "6월24일"],
    likes: 7,
    comments: 2,
    isUrgent: false,
    isLiked: true,
  },
  {
    id: 3,
    author: "이아라",
    badge: "강사",
    region: "서울 마포",
    date: "2025.06.18",
    timeAgo: "어제",
    title: "대타 가능하신 분 연락 주세요 (주 1회)",
    body: "매주 목요일 오전 10시 성인 초급반입니다. 6월 26일, 7월 3일 두 차례 필요해요. 수강생 6명이고 강습비는 수업당 3.5만원입니다. 마포 홍대 근처예요.",
    tags: ["성인발레", "홍대", "목요일"],
    likes: 12,
    comments: 8,
    isUrgent: false,
    isLiked: false,
  },
  {
    id: 4,
    author: "최포인트",
    badge: "원장",
    region: "인천 연수",
    date: "2025.06.18",
    timeAgo: "어제",
    title: "인천 연수구 학원 단기 대타 강사 모집",
    body: "7월 한 달간 기존 강사 휴가로 대체 강사 찾습니다. 성인반 주 3회(월수금), 유아반 주 2회(화목) 수업 가능하신 분. 시간당 단가 협의 가능하며 교통비 별도 지원합니다.",
    tags: ["성인+유아", "인천", "7월"],
    likes: 21,
    comments: 14,
    isUrgent: false,
    isLiked: false,
  },
  {
    id: 5,
    author: "정발레",
    badge: "강사",
    region: "서울 송파",
    date: "2025.06.17",
    timeAgo: "2일 전",
    title: "이번 주 토요일 오전 대타 급하게 구해요",
    body: "6월 21일 토요일 오전 10시~12시 성인 중급반입니다. 갑자기 일이 생겨서요. 잠실/송파 근처 오실 수 있는 분이면 더 좋고요, 5만원 드릴게요.",
    tags: ["성인발레", "송파", "토요일"],
    likes: 5,
    comments: 3,
    isUrgent: true,
    isLiked: false,
  },
  {
    id: 6,
    author: "한백조",
    badge: "강사",
    region: "서울 서초",
    date: "2025.06.17",
    timeAgo: "2일 전",
    title: "대타 경험 있으신 선생님 연락 환영해요",
    body: "저도 종종 대타 요청 받는 강사인데요, 서초·강남·방배 지역에서 서로 대타 가능한 분들끼리 연락망 만들고 싶어요. 댓글로 지역이랑 가능 요일 남겨주시면 감사해요!",
    tags: ["네트워크", "서초", "강남"],
    likes: 38,
    comments: 22,
    isLiked: true,
    isUrgent: false,
  },
];

type WriteModalProps = {
  onClose: () => void;
  onSubmit: (post: Omit<Post, "id" | "likes" | "comments" | "isLiked">) => void;
};

function WriteModal({ onClose, onSubmit }: WriteModalProps) {
  const [title, setTitle] = useState("");
  const [body, setBody] = useState("");
  const [tag, setTag] = useState("");
  const [tags, setTags] = useState<string[]>([]);

  const addTag = () => {
    const t = tag.trim();
    if (t && !tags.includes(t) && tags.length < 4) {
      setTags([...tags, t]);
      setTag("");
    }
  };

  const submit = () => {
    if (!title.trim() || !body.trim()) return;
    onSubmit({
      author: "김발레",
      badge: "강사",
      region: "서울 강남",
      date: "2025.06.19",
      timeAgo: "방금 전",
      title: title.trim(),
      body: body.trim(),
      tags,
      isUrgent: title.includes("급구") || title.includes("오늘"),
    });
    onClose();
  };

  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "rgba(0,0,0,0.35)",
        display: "flex",
        alignItems: "flex-end",
        zIndex: 200,
        borderRadius: 44,
        overflow: "hidden",
      }}
    >
      <div
        style={{
          width: "100%",
          backgroundColor: "#fff",
          borderRadius: "20px 20px 0 0",
          padding: "20px 20px 36px",
          display: "flex",
          flexDirection: "column",
          gap: 14,
        }}
      >
        {/* Handle */}
        <div style={{ display: "flex", justifyContent: "center", marginBottom: -4 }}>
          <div style={{ width: 36, height: 4, borderRadius: 2, backgroundColor: "#e0e0e0" }} />
        </div>

        {/* Header */}
        <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
          <span style={{ fontSize: 16, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.4 }}>
            대타 글쓰기
          </span>
          <button onClick={onClose} style={{ background: "none", border: "none", cursor: "pointer", padding: 4 }}>
            <X size={18} strokeWidth={1.8} color="#888" />
          </button>
        </div>

        {/* Title */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 6, letterSpacing: -0.1 }}>제목</p>
          <input
            value={title}
            onChange={(e) => setTitle(e.target.value)}
            placeholder="예) 오늘 저녁 성인반 대타 급구요"
            style={{
              width: "100%",
              backgroundColor: "#f5f5f7",
              border: "none",
              borderRadius: 10,
              padding: "11px 13px",
              fontSize: 13,
              fontWeight: 500,
              color: "#0a0a0a",
              outline: "none",
              letterSpacing: -0.2,
              boxSizing: "border-box",
            }}
          />
        </div>

        {/* Body */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 6, letterSpacing: -0.1 }}>내용</p>
          <textarea
            value={body}
            onChange={(e) => setBody(e.target.value)}
            placeholder="수업 날짜, 시간, 지역, 수강생 수, 급여 등 자세히 적어주세요"
            rows={4}
            style={{
              width: "100%",
              backgroundColor: "#f5f5f7",
              border: "none",
              borderRadius: 10,
              padding: "11px 13px",
              fontSize: 13,
              fontWeight: 400,
              color: "#0a0a0a",
              outline: "none",
              resize: "none",
              letterSpacing: -0.2,
              lineHeight: 1.6,
              boxSizing: "border-box",
              fontFamily: "inherit",
            }}
          />
        </div>

        {/* Tags */}
        <div>
          <p style={{ fontSize: 11, fontWeight: 600, color: "#aaa", marginBottom: 6, letterSpacing: -0.1 }}>태그 (선택)</p>
          <div style={{ display: "flex", gap: 6, flexWrap: "wrap", marginBottom: 8 }}>
            {tags.map((t) => (
              <div
                key={t}
                style={{
                  display: "flex", alignItems: "center", gap: 4,
                  backgroundColor: "#0a0a0a", borderRadius: 20,
                  paddingLeft: 10, paddingRight: 8, paddingTop: 4, paddingBottom: 4,
                }}
              >
                <span style={{ fontSize: 11, fontWeight: 600, color: "#fff" }}>#{t}</span>
                <button
                  onClick={() => setTags(tags.filter((x) => x !== t))}
                  style={{ background: "none", border: "none", cursor: "pointer", padding: 0, color: "rgba(255,255,255,0.5)", lineHeight: 1 }}
                >
                  ×
                </button>
              </div>
            ))}
          </div>
          <div style={{ display: "flex", gap: 6 }}>
            <input
              value={tag}
              onChange={(e) => setTag(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && addTag()}
              placeholder="태그 입력 후 추가"
              style={{
                flex: 1,
                backgroundColor: "#f5f5f7",
                border: "none",
                borderRadius: 10,
                padding: "9px 12px",
                fontSize: 13,
                color: "#0a0a0a",
                outline: "none",
                letterSpacing: -0.2,
              }}
            />
            <button
              onClick={addTag}
              style={{
                backgroundColor: "#f2f2f4",
                border: "none",
                borderRadius: 10,
                paddingLeft: 14,
                paddingRight: 14,
                fontSize: 12,
                fontWeight: 700,
                color: "#555",
                cursor: "pointer",
              }}
            >
              추가
            </button>
          </div>
        </div>

        {/* Submit */}
        <button
          onClick={submit}
          disabled={!title.trim() || !body.trim()}
          style={{
            width: "100%",
            height: 50,
            backgroundColor: title.trim() && body.trim() ? "#0a0a0a" : "#e0e0e0",
            border: "none",
            borderRadius: 14,
            fontSize: 15,
            fontWeight: 700,
            color: title.trim() && body.trim() ? "#fff" : "#bbb",
            cursor: title.trim() && body.trim() ? "pointer" : "default",
            letterSpacing: -0.3,
            transition: "background 0.15s",
          }}
        >
          등록하기
        </button>
      </div>
    </div>
  );
}

export function SubstitudePage() {
  const [posts, setPosts] = useState<Post[]>(initialPosts);
  const [search, setSearch] = useState("");
  const [showWrite, setShowWrite] = useState(false);
  const [expandedId, setExpandedId] = useState<number | null>(null);
  const [selectedPost, setSelectedPost] = useState<Post | null>(null);

  const toggleLikePost = (id: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
    if (selectedPost?.id === id) {
      setSelectedPost((prev) =>
        prev ? { ...prev, isLiked: !prev.isLiked, likes: prev.isLiked ? prev.likes - 1 : prev.likes + 1 } : prev
      );
    }
  };

  const toggleLike = (id: number) => {
    setPosts((prev) =>
      prev.map((p) =>
        p.id === id
          ? { ...p, isLiked: !p.isLiked, likes: p.isLiked ? p.likes - 1 : p.likes + 1 }
          : p
      )
    );
  };

  const addPost = (data: Omit<Post, "id" | "likes" | "comments" | "isLiked">) => {
    setPosts((prev) => [
      { ...data, id: Date.now(), likes: 0, comments: 0, isLiked: false },
      ...prev,
    ]);
  };

  const filtered = posts.filter(
    (p) =>
      search === "" ||
      p.title.includes(search) ||
      p.body.includes(search) ||
      p.tags.some((t) => t.includes(search)) ||
      p.region.includes(search)
  );

  if (selectedPost) {
    return (
      <SubstitudeDetailPage
        post={selectedPost}
        onBack={() => setSelectedPost(null)}
        onLikePost={() => toggleLikePost(selectedPost.id)}
      />
    );
  }

  return (
    <div className="flex flex-col h-full" style={{ backgroundColor: "#f5f5f7", position: "relative" }}>
      {/* Search */}
      <div style={{ padding: "10px 16px 10px" }}>
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
          }}
        >
          <Search size={15} strokeWidth={1.8} color="#bbb" />
          <input
            value={search}
            onChange={(e) => setSearch(e.target.value)}
            placeholder="지역, 날짜, 수업 종류로 검색"
            style={{
              flex: 1,
              background: "none",
              border: "none",
              outline: "none",
              fontSize: 13,
              color: "#1a1a1a",
              letterSpacing: -0.2,
            }}
          />
          {search && (
            <button onClick={() => setSearch("")} style={{ background: "none", border: "none", cursor: "pointer", color: "#bbb", fontSize: 16, lineHeight: 1, padding: 0 }}>
              ×
            </button>
          )}
        </div>
      </div>

      {/* Count + sort */}
      <div
        style={{
          display: "flex",
          alignItems: "center",
          justifyContent: "space-between",
          paddingLeft: 20,
          paddingRight: 20,
          paddingBottom: 10,
        }}
      >
        <span style={{ fontSize: 12, fontWeight: 500, color: "#aaa" }}>
          게시글{" "}
          <span style={{ fontWeight: 700, color: "#0a0a0a" }}>{filtered.length}</span>개
        </span>
        <span style={{ fontSize: 12, fontWeight: 600, color: "#888" }}>최신순</span>
      </div>

      {/* Post list */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          padding: "0 16px 80px",
          display: "flex",
          flexDirection: "column",
          gap: 8,
        }}
      >
        {filtered.length === 0 ? (
          <div style={{ display: "flex", flexDirection: "column", alignItems: "center", paddingTop: 60, gap: 8 }}>
            <span style={{ fontSize: 30 }}>🩰</span>
            <span style={{ fontSize: 14, fontWeight: 600, color: "#bbb" }}>검색 결과가 없어요</span>
          </div>
        ) : (
          filtered.map((post) => {
            const expanded = expandedId === post.id;
            return (
              <div
                key={post.id}
                style={{
                  backgroundColor: "#fff",
                  borderRadius: 16,
                  border: "1px solid rgba(0,0,0,0.07)",
                  padding: "15px 16px",
                  cursor: "pointer",
                }}
                onClick={() => setSelectedPost(post)}
              >
                {/* Author row */}
                <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 9 }}>
                  <div style={{ display: "flex", alignItems: "center", gap: 7 }}>
                    {/* Avatar */}
                    <div
                      style={{
                        width: 28,
                        height: 28,
                        borderRadius: "50%",
                        backgroundColor: "#0a0a0a",
                        display: "flex",
                        alignItems: "center",
                        justifyContent: "center",
                        flexShrink: 0,
                      }}
                    >
                      <span style={{ fontSize: 11, fontWeight: 700, color: "#fff" }}>
                        {post.author.charAt(0)}
                      </span>
                    </div>
                    <div>
                      <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.2 }}>
                          {post.author}
                        </span>
                        <span
                          style={{
                            fontSize: 9,
                            fontWeight: 700,
                            color: "#888",
                            backgroundColor: "#f2f2f4",
                            borderRadius: 4,
                            paddingLeft: 5,
                            paddingRight: 5,
                            paddingTop: 1,
                            paddingBottom: 1,
                          }}
                        >
                          {post.badge}
                        </span>
                      </div>
                      <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 1 }}>
                        <span style={{ fontSize: 10, fontWeight: 400, color: "#bbb" }}>{post.region}</span>
                        <span style={{ fontSize: 10, color: "#ddd" }}>·</span>
                        <span style={{ fontSize: 10, fontWeight: 400, color: "#bbb" }}>{post.timeAgo}</span>
                      </div>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 6 }}>
                    {post.isUrgent && (
                      <span
                        style={{
                          fontSize: 9,
                          fontWeight: 800,
                          color: "#d4183d",
                          backgroundColor: "#fdf0f3",
                          borderRadius: 5,
                          paddingLeft: 6,
                          paddingRight: 6,
                          paddingTop: 3,
                          paddingBottom: 3,
                          letterSpacing: 0.2,
                        }}
                      >
                        급구
                      </span>
                    )}
                  </div>
                </div>

                {/* Title */}
                <p
                  style={{
                    fontSize: 14,
                    fontWeight: 700,
                    color: "#0a0a0a",
                    letterSpacing: -0.4,
                    lineHeight: 1.4,
                    marginBottom: 6,
                  }}
                >
                  {post.title}
                </p>

                {/* Body — clipped unless expanded */}
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 400,
                    color: "#555",
                    lineHeight: 1.6,
                    letterSpacing: -0.2,
                    marginBottom: 10,
                    overflow: "hidden",
                    display: "-webkit-box",
                    WebkitLineClamp: expanded ? undefined : 2,
                    WebkitBoxOrient: "vertical" as const,
                  }}
                >
                  {post.body}
                </p>

                {/* More / less toggle */}
                {post.body.length > 80 && (
                  <button
                    onClick={(e) => { e.stopPropagation(); setSelectedPost(post); }}
                    style={{
                      background: "none",
                      border: "none",
                      cursor: "pointer",
                      fontSize: 12,
                      fontWeight: 600,
                      color: "#aaa",
                      padding: 0,
                      marginBottom: 8,
                      display: "flex",
                      alignItems: "center",
                      gap: 2,
                    }}
                  >
                    더 보기 <ChevronRight size={11} strokeWidth={2} />
                  </button>
                )}

                {/* Tags */}
                {post.tags.length > 0 && (
                  <div style={{ display: "flex", flexWrap: "wrap", gap: 5, marginBottom: 10 }}>
                    {post.tags.map((t) => (
                      <span
                        key={t}
                        style={{
                          fontSize: 11,
                          fontWeight: 600,
                          color: "#666",
                          backgroundColor: "#f5f5f7",
                          borderRadius: 6,
                          paddingLeft: 7,
                          paddingRight: 7,
                          paddingTop: 3,
                          paddingBottom: 3,
                          letterSpacing: -0.1,
                        }}
                      >
                        #{t}
                      </span>
                    ))}
                  </div>
                )}

                {/* Footer */}
                <div
                  style={{
                    display: "flex",
                    alignItems: "center",
                    justifyContent: "space-between",
                    paddingTop: 10,
                    borderTop: "1px solid rgba(0,0,0,0.05)",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "center", gap: 14 }}>
                    <button
                      onClick={(e) => { e.stopPropagation(); toggleLike(post.id); }}
                      style={{
                        background: "none",
                        border: "none",
                        cursor: "pointer",
                        display: "flex",
                        alignItems: "center",
                        gap: 4,
                        padding: 0,
                      }}
                    >
                      <Heart
                        size={14}
                        strokeWidth={1.8}
                        color={post.isLiked ? "#d4183d" : "#bbb"}
                        fill={post.isLiked ? "#d4183d" : "none"}
                      />
                      <span style={{ fontSize: 12, fontWeight: 600, color: post.isLiked ? "#d4183d" : "#bbb" }}>
                        {post.likes}
                      </span>
                    </button>
                    <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                      <MessageCircle size={14} strokeWidth={1.8} color="#bbb" />
                      <span style={{ fontSize: 12, fontWeight: 600, color: "#bbb" }}>{post.comments}</span>
                    </div>
                  </div>
                  <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
                    <Clock size={11} strokeWidth={1.8} color="#ddd" />
                    <span style={{ fontSize: 11, fontWeight: 400, color: "#ccc" }}>{post.date}</span>
                  </div>
                </div>
              </div>
            );
          })
        )}
      </div>

      {/* FAB — write button */}
      <button
        onClick={() => setShowWrite(true)}
        style={{
          position: "absolute",
          bottom: 16,
          right: 16,
          width: 50,
          height: 50,
          borderRadius: "50%",
          backgroundColor: "#0a0a0a",
          border: "none",
          cursor: "pointer",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          boxShadow: "0 4px 16px rgba(0,0,0,0.22)",
          zIndex: 10,
        }}
      >
        <Plus size={20} strokeWidth={2.2} color="#fff" />
      </button>

      {/* Write modal */}
      {showWrite && (
        <WriteModal onClose={() => setShowWrite(false)} onSubmit={addPost} />
      )}
    </div>
  );
}
