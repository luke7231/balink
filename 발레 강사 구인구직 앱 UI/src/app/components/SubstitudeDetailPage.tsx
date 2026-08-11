import { useState, useRef, useEffect } from "react";
import {
  ChevronLeft,
  Heart,
  MessageCircle,
  Share2,
  MoreHorizontal,
  Send,
  Clock,
  MapPin,
  Bookmark,
  BookmarkCheck,
  AlertCircle,
} from "lucide-react";

export type Post = {
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

type Comment = {
  id: number;
  author: string;
  badge: string;
  text: string;
  timeAgo: string;
  isLiked: boolean;
  likes: number;
  replyTo?: string;
};

const commentMap: Record<number, Comment[]> = {
  1: [
    { id: 1, author: "이아라", badge: "강사", text: "저 가능할 것 같아요! 혹시 카톡 아이디 알 수 있을까요?", timeAgo: "5분 전", isLiked: false, likes: 1 },
    { id: 2, author: "박튀튀", badge: "강사", text: "저도 강남 근처인데 시간이 정확히 어떻게 되나요? 7시 시작이면 9시 끝인가요?", timeAgo: "3분 전", isLiked: false, likes: 0 },
    { id: 3, author: "김발레", badge: "강사", text: "네 맞아요! 오후 7시~9시 2시간 수업이에요. DM 주시면 자세히 말씀드릴게요 :)", timeAgo: "2분 전", isLiked: true, likes: 2, replyTo: "박튀튀" },
    { id: 4, author: "최포인트", badge: "원장", text: "오늘 저녁은 저도 어렵고.. 혹시 내일도 필요하시면 연락 주세요!", timeAgo: "1분 전", isLiked: false, likes: 0 },
    { id: 5, author: "정발레", badge: "강사", text: "빨리 해결되길 바랍니다 🙏", timeAgo: "방금 전", isLiked: false, likes: 0 },
  ],
  2: [
    { id: 1, author: "한백조", badge: "강사", text: "수원 영통 근처예요. 유아반 경험 있고 화요일 가능합니다!", timeAgo: "30분 전", isLiked: true, likes: 3 },
    { id: 2, author: "박튀튀", badge: "강사", text: "감사합니다! 쪽지 드릴게요 :)", timeAgo: "28분 전", isLiked: false, likes: 0, replyTo: "한백조" },
  ],
  3: [
    { id: 1, author: "김발레", badge: "강사", text: "홍대 근처 삽니다. 목요일 오전 가능해요!", timeAgo: "2시간 전", isLiked: false, likes: 2 },
    { id: 2, author: "최포인트", badge: "원장", text: "혹시 성인 중급도 가능하신가요?", timeAgo: "1시간 전", isLiked: false, likes: 0 },
    { id: 3, author: "이아라", badge: "강사", text: "네 중급도 괜찮아요!", timeAgo: "59분 전", isLiked: true, likes: 1, replyTo: "최포인트" },
    { id: 4, author: "정발레", badge: "강사", text: "저도 관심 있어요. 수업 자료는 어떤 식으로 주시나요?", timeAgo: "50분 전", isLiked: false, likes: 0 },
    { id: 5, author: "이아라", badge: "강사", text: "PDF로 커리큘럼 정리해서 드려요 :)", timeAgo: "48분 전", isLiked: false, likes: 1, replyTo: "정발레" },
    { id: 6, author: "한백조", badge: "강사", text: "좋은 정보 감사해요!", timeAgo: "30분 전", isLiked: false, likes: 0 },
    { id: 7, author: "박튀튀", badge: "강사", text: "저도 마포 근처예요! DM 드려도 될까요?", timeAgo: "10분 전", isLiked: false, likes: 0 },
    { id: 8, author: "이아라", badge: "강사", text: "물론이죠! 환영해요 😊", timeAgo: "8분 전", isLiked: false, likes: 0, replyTo: "박튀튀" },
  ],
  4: [
    { id: 1, author: "김발레", badge: "강사", text: "인천 연수구 거주중이에요. 성인반은 월수금, 유아반은 화목 모두 가능합니다!", timeAgo: "어제", isLiked: true, likes: 5 },
    { id: 2, author: "이아라", badge: "강사", text: "저는 성인반만 가능한데 혹시 그래도 될까요?", timeAgo: "어제", isLiked: false, likes: 1 },
    { id: 3, author: "최포인트", badge: "원장", text: "성인반만도 가능해요! 연락처 남겨주시면 제가 연락드릴게요.", timeAgo: "어제", isLiked: false, likes: 0, replyTo: "이아라" },
    { id: 4, author: "정발레", badge: "강사", text: "교통비 별도 지원 감사합니다. 지하철역에서 가까운가요?", timeAgo: "어제", isLiked: false, likes: 0 },
    { id: 5, author: "최포인트", badge: "원장", text: "인천 1호선 연수역 도보 5분 거리예요 :)", timeAgo: "어제", isLiked: true, likes: 2, replyTo: "정발레" },
    { id: 6, author: "한백조", badge: "강사", text: "저도 관심 있어요! DM 드려도 될까요?", timeAgo: "어제", isLiked: false, likes: 0 },
    { id: 7, author: "최포인트", badge: "원장", text: "네 언제든지요!", timeAgo: "어제", isLiked: false, likes: 0, replyTo: "한백조" },
    { id: 8, author: "박튀튀", badge: "강사", text: "7월 한 달이면 꽤 긴 기간이네요. 잘 해결되길!", timeAgo: "어제", isLiked: false, likes: 0 },
    { id: 9, author: "김발레", badge: "강사", text: "저 이미 연락드렸는데 기다리는 중이에요 😅", timeAgo: "어제", isLiked: false, likes: 1 },
    { id: 10, author: "최포인트", badge: "원장", text: "조금만 기다려 주세요! 곧 연락드릴게요 🙏", timeAgo: "어제", isLiked: false, likes: 0, replyTo: "김발레" },
    { id: 11, author: "이아라", badge: "강사", text: "저도 이번 주 안으로 연락드릴게요.", timeAgo: "2일 전", isLiked: false, likes: 0 },
    { id: 12, author: "정발레", badge: "강사", text: "좋은 기회네요. 꼭 성사되길!", timeAgo: "2일 전", isLiked: false, likes: 0 },
    { id: 13, author: "한백조", badge: "강사", text: "인천은 좀 멀긴 한데... 고민해봐야겠어요 😅", timeAgo: "2일 전", isLiked: false, likes: 0 },
    { id: 14, author: "박튀튀", badge: "강사", text: "교통비 지원이면 충분히 고려할 만해요!", timeAgo: "2일 전", isLiked: false, likes: 1, replyTo: "한백조" },
  ],
  5: [
    { id: 1, author: "한백조", badge: "강사", text: "잠실 살아요. 토요일 오전 가능합니다!", timeAgo: "어제", isLiked: true, likes: 2 },
    { id: 2, author: "정발레", badge: "강사", text: "저도 송파 근처인데 오전 10시는 가능해요. 연락처 주시면 연락할게요!", timeAgo: "어제", isLiked: false, likes: 0 },
    { id: 3, author: "김발레", badge: "강사", text: "성인 중급 진도는 어디쯤인가요?", timeAgo: "어제", isLiked: false, likes: 0 },
  ],
  6: [
    { id: 1, author: "김발레", badge: "강사", text: "서초 거주, 월수금 오전/오후 가능합니다!", timeAgo: "2일 전", isLiked: true, likes: 4 },
    { id: 2, author: "박튀튀", badge: "강사", text: "강남 거주, 화목 오전 가능해요 :)", timeAgo: "2일 전", isLiked: false, likes: 2 },
    { id: 3, author: "이아라", badge: "강사", text: "마포인데 강남 쪽도 대타 갈 수 있어요! 토요일 위주로 가능합니다.", timeAgo: "2일 전", isLiked: false, likes: 1 },
    { id: 4, author: "최포인트", badge: "원장", text: "방배 학원인데 저도 가끔 대타 강사 필요할 때가 있어요. 저도 추가해도 될까요?", timeAgo: "2일 전", isLiked: false, likes: 0 },
    { id: 5, author: "한백조", badge: "강사", text: "이런 네트워크 너무 필요했어요! 서초 거주 성인/유아반 모두 가능합니다.", timeAgo: "2일 전", isLiked: true, likes: 3 },
    { id: 6, author: "정발레", badge: "강사", text: "송파 거주 주말 가능해요!", timeAgo: "2일 전", isLiked: false, likes: 0 },
    { id: 7, author: "이아라", badge: "강사", text: "좋은 아이디어예요 ✨ 카카오 오픈채팅 만들면 어때요?", timeAgo: "어제", isLiked: true, likes: 8 },
    { id: 8, author: "한백조", badge: "강사", text: "오픈채팅 완전 찬성입니다!", timeAgo: "어제", isLiked: false, likes: 2, replyTo: "이아라" },
    { id: 9, author: "김발레", badge: "강사", text: "저도요! 만들어지면 링크 공유해주세요 🙏", timeAgo: "어제", isLiked: false, likes: 1, replyTo: "이아라" },
    { id: 10, author: "박튀튀", badge: "강사", text: "강남구 토요일 오후도 가능한 분 계신가요?", timeAgo: "어제", isLiked: false, likes: 0 },
    { id: 11, author: "최포인트", badge: "원장", text: "원장 입장에서도 이런 연락망이 너무 필요했어요. 학원 원장분들도 함께하면 좋을 것 같아요!", timeAgo: "어제", isLiked: true, likes: 5 },
    { id: 12, author: "정발레", badge: "강사", text: "원장님들도 당연히 환영이죠 😊", timeAgo: "어제", isLiked: false, likes: 0, replyTo: "최포인트" },
    { id: 13, author: "한백조", badge: "강사", text: "다들 반응이 너무 좋네요! 오픈채팅 링크 올려드릴게요 잠시만요", timeAgo: "6시간 전", isLiked: true, likes: 7 },
    { id: 14, author: "이아라", badge: "강사", text: "기다리고 있을게요!", timeAgo: "6시간 전", isLiked: false, likes: 0, replyTo: "한백조" },
    { id: 15, author: "김발레", badge: "강사", text: "저도요 빨리 만들어주세요 ㅎㅎ", timeAgo: "5시간 전", isLiked: false, likes: 0, replyTo: "한백조" },
    { id: 16, author: "박튀튀", badge: "강사", text: "정말 좋은 글이에요. 좋아요 누르고 갑니다 💙", timeAgo: "3시간 전", isLiked: false, likes: 0 },
    { id: 17, author: "정발레", badge: "강사", text: "이 커뮤니티 자체가 너무 따뜻해서 좋아요!", timeAgo: "2시간 전", isLiked: true, likes: 4 },
    { id: 18, author: "최포인트", badge: "원장", text: "발링크 앱 덕분에 좋은 연결이 생기네요 😊", timeAgo: "1시간 전", isLiked: false, likes: 2 },
    { id: 19, author: "한백조", badge: "강사", text: "오픈채팅 링크 올렸어요! 검색창에 '발레강사대타_서초강남' 으로 검색하면 돼요!", timeAgo: "30분 전", isLiked: true, likes: 12 },
    { id: 20, author: "이아라", badge: "강사", text: "완전 감사합니다!!! 바로 들어갔어요 🎉", timeAgo: "28분 전", isLiked: false, likes: 1, replyTo: "한백조" },
    { id: 21, author: "김발레", badge: "강사", text: "저도 입장완료! 다들 만나요 😄", timeAgo: "25분 전", isLiked: false, likes: 1, replyTo: "한백조" },
    { id: 22, author: "박튀튀", badge: "강사", text: "저도 들어갔어요. 앞으로 잘 부탁드려요!", timeAgo: "20분 전", isLiked: false, likes: 0 },
  ],
};

const avatarColors: Record<string, string> = {
  김발레: "#0a0a0a",
  박튀튀: "#3a3a4a",
  이아라: "#2a2a3a",
  최포인트: "#1a1a2a",
  정발레: "#4a4a5a",
  한백조: "#0a0a0a",
};

function Avatar({ name, size = 32 }: { name: string; size?: number }) {
  return (
    <div
      style={{
        width: size,
        height: size,
        borderRadius: "50%",
        backgroundColor: avatarColors[name] ?? "#0a0a0a",
        display: "flex",
        alignItems: "center",
        justifyContent: "center",
        flexShrink: 0,
      }}
    >
      <span style={{ fontSize: size * 0.38, fontWeight: 700, color: "#fff" }}>
        {name.charAt(0)}
      </span>
    </div>
  );
}

export function SubstitudeDetailPage({
  post,
  onBack,
  onLikePost,
}: {
  post: Post;
  onBack: () => void;
  onLikePost: () => void;
}) {
  const [comments, setComments] = useState<Comment[]>(
    commentMap[post.id] ?? []
  );
  const [input, setInput] = useState("");
  const [replyTo, setReplyTo] = useState<string | null>(null);
  const [saved, setSaved] = useState(false);
  const inputRef = useRef<HTMLInputElement>(null);
  const bottomRef = useRef<HTMLDivElement>(null);

  const submitComment = () => {
    const text = input.trim();
    if (!text) return;
    setComments((prev) => [
      ...prev,
      {
        id: Date.now(),
        author: "김발레",
        badge: "강사",
        text,
        timeAgo: "방금 전",
        isLiked: false,
        likes: 0,
        replyTo: replyTo ?? undefined,
      },
    ]);
    setInput("");
    setReplyTo(null);
    setTimeout(() => bottomRef.current?.scrollIntoView({ behavior: "smooth" }), 80);
  };

  const toggleCommentLike = (id: number) => {
    setComments((prev) =>
      prev.map((c) =>
        c.id === id
          ? { ...c, isLiked: !c.isLiked, likes: c.isLiked ? c.likes - 1 : c.likes + 1 }
          : c
      )
    );
  };

  const startReply = (author: string) => {
    setReplyTo(author);
    inputRef.current?.focus();
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
          paddingRight: 16,
          paddingTop: 8,
          paddingBottom: 12,
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
        <span style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.3 }}>
          대타
        </span>
        <div style={{ display: "flex", alignItems: "center", gap: 4 }}>
          <button
            onClick={() => setSaved((s) => !s)}
            style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: saved ? "#0a0a0a" : "#c8c8cc", display: "flex" }}
          >
            {saved ? <BookmarkCheck size={19} strokeWidth={2} /> : <Bookmark size={19} strokeWidth={1.7} />}
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#aaa", display: "flex" }}>
            <Share2 size={18} strokeWidth={1.7} />
          </button>
          <button style={{ background: "none", border: "none", cursor: "pointer", padding: 6, color: "#aaa", display: "flex" }}>
            <MoreHorizontal size={18} strokeWidth={1.7} />
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div style={{ flex: 1, overflowY: "auto", scrollbarWidth: "none", paddingBottom: 80 }}>

        {/* Post card */}
        <div
          style={{
            backgroundColor: "#fff",
            marginBottom: 8,
            padding: "18px 20px 16px",
          }}
        >
          {/* Author */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between", marginBottom: 14 }}>
            <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
              <Avatar name={post.author} size={40} />
              <div>
                <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 2 }}>
                  <span style={{ fontSize: 14, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.3 }}>
                    {post.author}
                  </span>
                  <span
                    style={{
                      fontSize: 10, fontWeight: 700, color: "#888",
                      backgroundColor: "#f2f2f4", borderRadius: 5,
                      paddingLeft: 6, paddingRight: 6, paddingTop: 2, paddingBottom: 2,
                    }}
                  >
                    {post.badge}
                  </span>
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
                </div>
                <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                  <MapPin size={10} strokeWidth={1.8} color="#bbb" />
                  <span style={{ fontSize: 11, fontWeight: 400, color: "#bbb" }}>{post.region}</span>
                  <span style={{ fontSize: 10, color: "#ddd" }}>·</span>
                  <Clock size={10} strokeWidth={1.8} color="#bbb" />
                  <span style={{ fontSize: 11, fontWeight: 400, color: "#bbb" }}>{post.timeAgo}</span>
                </div>
              </div>
            </div>
          </div>

          {/* Title */}
          <p
            style={{
              fontSize: 19,
              fontWeight: 800,
              color: "#0a0a0a",
              letterSpacing: -0.6,
              lineHeight: 1.35,
              marginBottom: 12,
            }}
          >
            {post.title}
          </p>

          {/* Body */}
          <p
            style={{
              fontSize: 14,
              fontWeight: 400,
              color: "#333",
              lineHeight: 1.7,
              letterSpacing: -0.2,
              marginBottom: 16,
              whiteSpace: "pre-wrap",
            }}
          >
            {post.body}
          </p>

          {/* Tags */}
          {post.tags.length > 0 && (
            <div style={{ display: "flex", flexWrap: "wrap", gap: 6, marginBottom: 16 }}>
              {post.tags.map((t) => (
                <span
                  key={t}
                  style={{
                    fontSize: 12, fontWeight: 600, color: "#555",
                    backgroundColor: "#f5f5f7", borderRadius: 7,
                    paddingLeft: 9, paddingRight: 9, paddingTop: 4, paddingBottom: 4,
                    letterSpacing: -0.1,
                  }}
                >
                  #{t}
                </span>
              ))}
            </div>
          )}

          {/* Urgent warning */}
          {post.isUrgent && (
            <div
              style={{
                backgroundColor: "#fdf0f3",
                borderRadius: 10,
                padding: "10px 12px",
                display: "flex",
                alignItems: "center",
                gap: 7,
                marginBottom: 16,
              }}
            >
              <AlertCircle size={13} strokeWidth={2} color="#d4183d" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#d4183d", letterSpacing: -0.2 }}>
                마감이 임박한 대타 요청이에요. 빠르게 연락해보세요!
              </span>
            </div>
          )}

          {/* Divider */}
          <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.05)", marginBottom: 12 }} />

          {/* Actions row */}
          <div style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}>
            <div style={{ display: "flex", alignItems: "center", gap: 16 }}>
              <button
                onClick={onLikePost}
                style={{
                  background: "none", border: "none", cursor: "pointer",
                  display: "flex", alignItems: "center", gap: 5, padding: 0,
                }}
              >
                <Heart
                  size={18}
                  strokeWidth={1.8}
                  color={post.isLiked ? "#d4183d" : "#bbb"}
                  fill={post.isLiked ? "#d4183d" : "none"}
                />
                <span style={{ fontSize: 13, fontWeight: 600, color: post.isLiked ? "#d4183d" : "#bbb" }}>
                  {post.likes}
                </span>
              </button>
              <div style={{ display: "flex", alignItems: "center", gap: 5 }}>
                <MessageCircle size={18} strokeWidth={1.8} color="#bbb" />
                <span style={{ fontSize: 13, fontWeight: 600, color: "#bbb" }}>
                  {comments.length}
                </span>
              </div>
            </div>
            <span style={{ fontSize: 11, fontWeight: 400, color: "#ccc" }}>{post.date}</span>
          </div>
        </div>

        {/* Comments section */}
        <div style={{ backgroundColor: "#fff", paddingTop: 4 }}>
          {/* Section header */}
          <div
            style={{
              padding: "14px 20px 10px",
              borderBottom: "1px solid rgba(0,0,0,0.05)",
            }}
          >
            <span style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.3 }}>
              댓글 {comments.length}
            </span>
          </div>

          {comments.length === 0 ? (
            <div
              style={{
                display: "flex", flexDirection: "column", alignItems: "center",
                padding: "40px 20px", gap: 8,
              }}
            >
              <MessageCircle size={28} strokeWidth={1.4} color="#ddd" />
              <p style={{ fontSize: 13, fontWeight: 500, color: "#ccc", letterSpacing: -0.2 }}>
                첫 댓글을 남겨보세요
              </p>
            </div>
          ) : (
            <div style={{ paddingBottom: 8 }}>
              {comments.map((c, idx) => (
                <div
                  key={c.id}
                  style={{
                    padding: "13px 20px",
                    borderBottom: idx < comments.length - 1 ? "1px solid rgba(0,0,0,0.04)" : "none",
                    paddingLeft: c.replyTo ? 52 : 20,
                    backgroundColor: c.replyTo ? "#fafafa" : "#fff",
                  }}
                >
                  <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
                    <Avatar name={c.author} size={28} />
                    <div style={{ flex: 1, minWidth: 0 }}>
                      {/* Meta */}
                      <div style={{ display: "flex", alignItems: "center", gap: 5, marginBottom: 4 }}>
                        <span style={{ fontSize: 12, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.2 }}>
                          {c.author}
                        </span>
                        <span
                          style={{
                            fontSize: 9, fontWeight: 700, color: "#999",
                            backgroundColor: "#f2f2f4", borderRadius: 4,
                            paddingLeft: 5, paddingRight: 5, paddingTop: 1, paddingBottom: 1,
                          }}
                        >
                          {c.badge}
                        </span>
                        {c.replyTo && (
                          <span style={{ fontSize: 11, fontWeight: 500, color: "#bbb" }}>
                            → {c.replyTo}
                          </span>
                        )}
                        <span style={{ fontSize: 10, fontWeight: 400, color: "#ccc", marginLeft: "auto" }}>
                          {c.timeAgo}
                        </span>
                      </div>

                      {/* Text */}
                      <p
                        style={{
                          fontSize: 13, fontWeight: 400, color: "#333",
                          lineHeight: 1.6, letterSpacing: -0.2, marginBottom: 7,
                        }}
                      >
                        {c.text}
                      </p>

                      {/* Comment actions */}
                      <div style={{ display: "flex", alignItems: "center", gap: 12 }}>
                        <button
                          onClick={() => toggleCommentLike(c.id)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            display: "flex", alignItems: "center", gap: 3, padding: 0,
                          }}
                        >
                          <Heart
                            size={12}
                            strokeWidth={1.8}
                            color={c.isLiked ? "#d4183d" : "#ccc"}
                            fill={c.isLiked ? "#d4183d" : "none"}
                          />
                          {c.likes > 0 && (
                            <span style={{ fontSize: 11, fontWeight: 600, color: c.isLiked ? "#d4183d" : "#bbb" }}>
                              {c.likes}
                            </span>
                          )}
                        </button>
                        <button
                          onClick={() => startReply(c.author)}
                          style={{
                            background: "none", border: "none", cursor: "pointer",
                            fontSize: 11, fontWeight: 600, color: "#bbb",
                            padding: 0, letterSpacing: -0.1,
                          }}
                        >
                          답글
                        </button>
                      </div>
                    </div>
                  </div>
                </div>
              ))}
            </div>
          )}
        </div>

        <div ref={bottomRef} />
      </div>

      {/* Fixed comment input */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          backgroundColor: "#fff",
          borderTop: "1px solid rgba(0,0,0,0.07)",
          padding: "10px 16px 20px",
        }}
      >
        {/* Reply indicator */}
        {replyTo && (
          <div
            style={{
              display: "flex", alignItems: "center", justifyContent: "space-between",
              backgroundColor: "#f5f5f7", borderRadius: 8,
              paddingLeft: 10, paddingRight: 8, paddingTop: 6, paddingBottom: 6,
              marginBottom: 8,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 600, color: "#666", letterSpacing: -0.1 }}>
              {replyTo}님에게 답글
            </span>
            <button
              onClick={() => setReplyTo(null)}
              style={{ background: "none", border: "none", cursor: "pointer", padding: 2, color: "#aaa", fontSize: 14, lineHeight: 1 }}
            >
              ×
            </button>
          </div>
        )}

        <div style={{ display: "flex", alignItems: "center", gap: 10 }}>
          <Avatar name="김발레" size={30} />
          <div
            style={{
              flex: 1,
              display: "flex",
              alignItems: "center",
              backgroundColor: "#f5f5f7",
              borderRadius: 22,
              paddingLeft: 14,
              paddingRight: 6,
              paddingTop: 4,
              paddingBottom: 4,
            }}
          >
            <input
              ref={inputRef}
              value={input}
              onChange={(e) => setInput(e.target.value)}
              onKeyDown={(e) => e.key === "Enter" && submitComment()}
              placeholder={replyTo ? `${replyTo}님에게 답글...` : "댓글을 입력하세요"}
              style={{
                flex: 1,
                background: "none",
                border: "none",
                outline: "none",
                fontSize: 13,
                color: "#0a0a0a",
                letterSpacing: -0.2,
                paddingTop: 6,
                paddingBottom: 6,
              }}
            />
            <button
              onClick={submitComment}
              style={{
                width: 32,
                height: 32,
                borderRadius: "50%",
                backgroundColor: input.trim() ? "#0a0a0a" : "#e0e0e0",
                border: "none",
                cursor: input.trim() ? "pointer" : "default",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                flexShrink: 0,
                transition: "background 0.15s",
              }}
            >
              <Send size={13} strokeWidth={2} color="#fff" />
            </button>
          </div>
        </div>
      </div>
    </div>
  );
}
