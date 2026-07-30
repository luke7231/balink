import { useState } from "react";
import {
  ChevronLeft,
  Bookmark,
  BookmarkCheck,
  Share2,
  MapPin,
  Clock,
  Calendar,
  Banknote,
  Users,
  Phone,
  Mail,
  ExternalLink,
  ChevronRight,
  AlertCircle,
  CheckCircle2,
} from "lucide-react";

export type Job = {
  id: number;
  studio: string;
  region: string;
  days: string;
  pay: string;
  type: string;
  source: string;
  isNew: boolean;
  daysLeft?: number;
};

const detailData: Record<
  number,
  {
    address: string;
    payDetail: string;
    schedule: string[];
    classInfo: { label: string; value: string }[];
    requirements: string[];
    preferredQuals: string[];
    description: string;
    contact: { type: string; value: string }[];
    studioInfo: string;
    postedAt: string;
    closingAt: string;
  }
> = {
  1: {
    address: "서울 강남구 역삼동 123-4 리베라빌딩 3층",
    payDetail: "타임당 4만원 (월 2회 수업 기준 약 32만원)",
    schedule: ["월 · 수 · 금", "오전 10:00 – 12:00", "수업당 2시간"],
    classInfo: [
      { label: "수업 종류", value: "성인발레 입문·초급" },
      { label: "수강 인원", value: "8~12명" },
      { label: "수업 공간", value: "전용 발레 연습실 (바레 설비 완비)" },
      { label: "계약 형태", value: "프리랜서 (월 단위 계약)" },
    ],
    requirements: [
      "발레 관련 전공 또는 동등한 실력 보유자",
      "성인 수업 지도 경험 1년 이상",
      "원활한 의사소통 가능자",
    ],
    preferredQuals: [
      "RAD, CBTS 등 발레 자격증 보유자",
      "강남·서초 지역 거주 또는 출퇴근 가능자",
    ],
    description:
      "리베라 발레 스튜디오는 2015년 설립된 성인 전문 발레 스튜디오입니다. 직장인과 주부 회원을 중심으로 운영되며, 편안하고 전문적인 환경에서 수업을 진행합니다. 소규모 클래스로 강사와 수강생이 충분히 소통할 수 있습니다.",
    contact: [
      { type: "전화", value: "02-1234-5678" },
      { type: "이메일", value: "recruit@libera-ballet.kr" },
    ],
    studioInfo: "리베라 발레 스튜디오",
    postedAt: "2025.06.15",
    closingAt: "2025.06.18",
  },
  2: {
    address: "경기 수원시 영통구 매탄동 45-2 아르떼센터 4층",
    payDetail: "총 7만원 / 회 (화 3.5만원 + 목 3.5만원)",
    schedule: ["화 · 목", "오후 19:20 – 21:50", "수업당 2.5시간"],
    classInfo: [
      { label: "수업 종류", value: "유아발레 (5~7세)" },
      { label: "수강 인원", value: "6~10명" },
      { label: "수업 공간", value: "발레 전용 연습실 (거울 완비)" },
      { label: "계약 형태", value: "프리랜서 (3개월 계약 후 연장)" },
    ],
    requirements: [
      "유아 발레 지도 경험 보유자",
      "유아 대상 교육에 관심과 열정이 있는 분",
    ],
    preferredQuals: [
      "유아 발레 교육 자격증 보유자",
      "수원·용인 지역 거주자 우대",
    ],
    description:
      "아르떼 댄스 아카데미는 경기 수원에서 운영되는 댄스 전문 학원으로, 유아부터 성인까지 다양한 댄스 프로그램을 운영합니다. 현재 유아발레 강사를 충원하고 있으며, 함께 성장할 분을 찾습니다.",
    contact: [
      { type: "전화", value: "031-987-6543" },
      { type: "이메일", value: "info@arte-dance.co.kr" },
    ],
    studioInfo: "아르떼 댄스 아카데미",
    postedAt: "2025.06.10",
    closingAt: "2025.06.17",
  },
};

const fallbackDetail = {
  address: "주소 정보를 불러오는 중입니다",
  payDetail: "상세 급여는 면접 시 협의",
  schedule: ["상세 일정 협의 가능"],
  classInfo: [{ label: "수업 종류", value: "발레" }],
  requirements: ["발레 관련 경험자"],
  preferredQuals: [],
  description: "자세한 내용은 담당자에게 문의해주세요.",
  contact: [{ type: "이메일", value: "info@studio.kr" }],
  studioInfo: "",
  postedAt: "2025.06.01",
  closingAt: "미정",
};

function InfoRow({
  icon: Icon,
  label,
  value,
  highlight,
}: {
  icon: React.ElementType;
  label: string;
  value: string;
  highlight?: boolean;
}) {
  return (
    <div style={{ display: "flex", alignItems: "flex-start", gap: 10 }}>
      <div
        style={{
          width: 32,
          height: 32,
          borderRadius: 8,
          backgroundColor: "#f2f2f4",
          display: "flex",
          alignItems: "center",
          justifyContent: "center",
          flexShrink: 0,
          marginTop: 1,
        }}
      >
        <Icon size={14} strokeWidth={1.8} color="#555" />
      </div>
      <div style={{ flex: 1 }}>
        <p style={{ fontSize: 11, fontWeight: 500, color: "#aaa", letterSpacing: -0.1, marginBottom: 2 }}>
          {label}
        </p>
        <p
          style={{
            fontSize: highlight ? 15 : 13,
            fontWeight: highlight ? 800 : 600,
            color: "#0a0a0a",
            letterSpacing: -0.3,
            lineHeight: 1.4,
          }}
        >
          {value}
        </p>
      </div>
    </div>
  );
}

function Section({ title, children }: { title: string; children: React.ReactNode }) {
  return (
    <div
      style={{
        backgroundColor: "#fff",
        borderRadius: 16,
        border: "1px solid rgba(0,0,0,0.07)",
        overflow: "hidden",
        marginBottom: 10,
      }}
    >
      <div
        style={{
          paddingLeft: 16,
          paddingRight: 16,
          paddingTop: 14,
          paddingBottom: 14,
          borderBottom: "1px solid rgba(0,0,0,0.05)",
        }}
      >
        <p style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.3 }}>
          {title}
        </p>
      </div>
      <div style={{ padding: "14px 16px" }}>{children}</div>
    </div>
  );
}

export function JobDetailPage({
  job,
  onBack,
  isBookmarked,
  onBookmark,
}: {
  job: Job;
  onBack: () => void;
  isBookmarked: boolean;
  onBookmark: () => void;
}) {
  const [applied, setApplied] = useState(false);
  const detail = detailData[job.id] ?? fallbackDetail;
  const isUrgent = (job.daysLeft ?? 99) <= 3;

  return (
    <div
      className="flex flex-col h-full"
      style={{ backgroundColor: "#f5f5f7" }}
    >
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
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            color: "#0a0a0a",
            display: "flex",
          }}
        >
          <ChevronLeft size={22} strokeWidth={2} />
        </button>

        <span
          style={{
            fontSize: 14,
            fontWeight: 700,
            color: "#0a0a0a",
            letterSpacing: -0.3,
            flex: 1,
            textAlign: "center",
            marginLeft: -28,
          }}
        >
          공고 상세
        </span>

        <div style={{ display: "flex", alignItems: "center", gap: 8 }}>
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              color: "#888",
              display: "flex",
            }}
          >
            <Share2 size={18} strokeWidth={1.8} />
          </button>
          <button
            onClick={onBookmark}
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              padding: 6,
              color: isBookmarked ? "#0a0a0a" : "#c8c8cc",
              display: "flex",
            }}
          >
            {isBookmarked ? (
              <BookmarkCheck size={20} strokeWidth={2} />
            ) : (
              <Bookmark size={20} strokeWidth={1.7} />
            )}
          </button>
        </div>
      </div>

      {/* Scrollable body */}
      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          paddingBottom: 100,
        }}
      >
        {/* Hero card */}
        <div
          style={{
            backgroundColor: "#0a0a0a",
            marginLeft: 16,
            marginRight: 16,
            marginTop: 14,
            marginBottom: 10,
            borderRadius: 18,
            padding: "20px 20px 22px",
            position: "relative",
            overflow: "hidden",
          }}
        >
          {/* subtle radial */}
          <div
            style={{
              position: "absolute",
              right: -30,
              bottom: -30,
              width: 120,
              height: 120,
              borderRadius: "50%",
              backgroundColor: "rgba(255,255,255,0.03)",
            }}
          />

          {/* Badges row */}
          <div style={{ display: "flex", alignItems: "center", gap: 6, marginBottom: 12 }}>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(255,255,255,0.55)",
                backgroundColor: "rgba(255,255,255,0.1)",
                borderRadius: 5,
                paddingLeft: 7,
                paddingRight: 7,
                paddingTop: 3,
                paddingBottom: 3,
              }}
            >
              {job.source}
            </span>
            <span
              style={{
                fontSize: 10,
                fontWeight: 600,
                color: "rgba(255,255,255,0.4)",
                backgroundColor: "rgba(255,255,255,0.07)",
                borderRadius: 5,
                paddingLeft: 7,
                paddingRight: 7,
                paddingTop: 3,
                paddingBottom: 3,
              }}
            >
              {job.type}
            </span>
            {job.isNew && (
              <span
                style={{
                  fontSize: 9,
                  fontWeight: 700,
                  color: "#0a0a0a",
                  backgroundColor: "#ffffff",
                  borderRadius: 4,
                  paddingLeft: 6,
                  paddingRight: 6,
                  paddingTop: 2,
                  paddingBottom: 2,
                  letterSpacing: 0.3,
                }}
              >
                NEW
              </span>
            )}
          </div>

          {/* Studio name */}
          <p
            style={{
              fontSize: 20,
              fontWeight: 800,
              color: "#ffffff",
              letterSpacing: -0.6,
              lineHeight: 1.3,
              marginBottom: 6,
            }}
          >
            {job.studio}
          </p>

          {/* Region */}
          <div style={{ display: "flex", alignItems: "center", gap: 4, marginBottom: 18 }}>
            <MapPin size={12} strokeWidth={1.8} color="rgba(255,255,255,0.4)" />
            <span
              style={{
                fontSize: 12,
                fontWeight: 500,
                color: "rgba(255,255,255,0.45)",
                letterSpacing: -0.2,
              }}
            >
              {job.region} · {detail.address.split(" ").slice(0, 3).join(" ")}
            </span>
          </div>

          {/* Key stats */}
          <div
            style={{
              display: "grid",
              gridTemplateColumns: "1fr 1fr",
              gap: 8,
            }}
          >
            {[
              { label: "급여", value: job.pay },
              { label: "요일", value: detail.schedule[0] },
              { label: "시간", value: detail.schedule[1] },
              { label: "수업 형태", value: job.type },
            ].map((s) => (
              <div
                key={s.label}
                style={{
                  backgroundColor: "rgba(255,255,255,0.07)",
                  borderRadius: 10,
                  padding: "10px 12px",
                }}
              >
                <p
                  style={{
                    fontSize: 10,
                    fontWeight: 500,
                    color: "rgba(255,255,255,0.35)",
                    letterSpacing: -0.1,
                    marginBottom: 4,
                  }}
                >
                  {s.label}
                </p>
                <p
                  style={{
                    fontSize: 13,
                    fontWeight: 700,
                    color: "#ffffff",
                    letterSpacing: -0.3,
                  }}
                >
                  {s.value}
                </p>
              </div>
            ))}
          </div>

          {/* Closing date */}
          {isUrgent && (
            <div
              style={{
                marginTop: 12,
                backgroundColor: "rgba(212,24,61,0.15)",
                borderRadius: 8,
                padding: "8px 12px",
                display: "flex",
                alignItems: "center",
                gap: 6,
              }}
            >
              <AlertCircle size={13} strokeWidth={2} color="#ff6b6b" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#ff6b6b", letterSpacing: -0.2 }}>
                마감 D-{job.daysLeft} · {detail.closingAt} 마감
              </span>
            </div>
          )}
        </div>

        {/* Content area */}
        <div style={{ paddingLeft: 16, paddingRight: 16 }}>

          {/* Pay detail */}
          <Section title="급여 상세">
            <InfoRow icon={Banknote} label="급여 조건" value={detail.payDetail} highlight />
          </Section>

          {/* Schedule */}
          <Section title="수업 일정">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              <InfoRow icon={Calendar} label="요일" value={detail.schedule[0]} />
              <InfoRow icon={Clock} label="시간" value={detail.schedule[1]} />
              {detail.schedule[2] && (
                <InfoRow icon={Clock} label="수업 시간" value={detail.schedule[2]} />
              )}
            </div>
          </Section>

          {/* Class info */}
          <Section title="수업 정보">
            <div style={{ display: "flex", flexDirection: "column", gap: 12 }}>
              {detail.classInfo.map((c) => (
                <div
                  key={c.label}
                  style={{ display: "flex", alignItems: "center", justifyContent: "space-between" }}
                >
                  <span style={{ fontSize: 12, fontWeight: 500, color: "#aaa", letterSpacing: -0.2 }}>
                    {c.label}
                  </span>
                  <span style={{ fontSize: 13, fontWeight: 600, color: "#0a0a0a", letterSpacing: -0.3 }}>
                    {c.value}
                  </span>
                </div>
              ))}
            </div>
          </Section>

          {/* Requirements */}
          <Section title="자격 요건">
            <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
              {detail.requirements.map((r, i) => (
                <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                  <CheckCircle2
                    size={14}
                    strokeWidth={2}
                    color="#0a0a0a"
                    style={{ flexShrink: 0, marginTop: 2 }}
                  />
                  <span
                    style={{ fontSize: 13, fontWeight: 500, color: "#1a1a1a", letterSpacing: -0.2, lineHeight: 1.5 }}
                  >
                    {r}
                  </span>
                </div>
              ))}
            </div>

            {detail.preferredQuals.length > 0 && (
              <>
                <div style={{ height: 1, backgroundColor: "rgba(0,0,0,0.05)", margin: "14px 0" }} />
                <p style={{ fontSize: 11, fontWeight: 700, color: "#aaa", marginBottom: 8, letterSpacing: -0.1 }}>
                  우대 사항
                </p>
                <div style={{ display: "flex", flexDirection: "column", gap: 6 }}>
                  {detail.preferredQuals.map((q, i) => (
                    <div key={i} style={{ display: "flex", alignItems: "flex-start", gap: 8 }}>
                      <div
                        style={{
                          width: 5,
                          height: 5,
                          borderRadius: "50%",
                          backgroundColor: "#ccc",
                          flexShrink: 0,
                          marginTop: 6,
                        }}
                      />
                      <span
                        style={{ fontSize: 13, fontWeight: 400, color: "#666", letterSpacing: -0.2, lineHeight: 1.5 }}
                      >
                        {q}
                      </span>
                    </div>
                  ))}
                </div>
              </>
            )}
          </Section>

          {/* Studio description */}
          <Section title="스튜디오 소개">
            <div style={{ display: "flex", alignItems: "center", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 40,
                  height: 40,
                  borderRadius: 10,
                  backgroundColor: "#0a0a0a",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <span style={{ fontSize: 14, fontWeight: 800, color: "#fff" }}>
                  {job.studio.charAt(0)}
                </span>
              </div>
              <div>
                <p style={{ fontSize: 13, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.3 }}>
                  {job.studio}
                </p>
                <div style={{ display: "flex", alignItems: "center", gap: 4, marginTop: 2 }}>
                  <MapPin size={10} strokeWidth={1.8} color="#aaa" />
                  <span style={{ fontSize: 11, fontWeight: 400, color: "#aaa" }}>{job.region}</span>
                </div>
              </div>
            </div>
            <p
              style={{
                fontSize: 13,
                fontWeight: 400,
                color: "#555",
                lineHeight: 1.65,
                letterSpacing: -0.2,
              }}
            >
              {detail.description}
            </p>
          </Section>

          {/* Location */}
          <Section title="위치">
            <div style={{ display: "flex", alignItems: "flex-start", gap: 10, marginBottom: 12 }}>
              <div
                style={{
                  width: 32,
                  height: 32,
                  borderRadius: 8,
                  backgroundColor: "#f2f2f4",
                  display: "flex",
                  alignItems: "center",
                  justifyContent: "center",
                  flexShrink: 0,
                }}
              >
                <MapPin size={14} strokeWidth={1.8} color="#555" />
              </div>
              <div style={{ flex: 1 }}>
                <p style={{ fontSize: 11, fontWeight: 500, color: "#aaa", marginBottom: 2 }}>주소</p>
                <p style={{ fontSize: 13, fontWeight: 600, color: "#0a0a0a", letterSpacing: -0.3, lineHeight: 1.4 }}>
                  {detail.address}
                </p>
              </div>
            </div>

            {/* Map placeholder */}
            <div
              style={{
                height: 120,
                borderRadius: 12,
                backgroundColor: "#f0f0f2",
                border: "1px solid rgba(0,0,0,0.06)",
                display: "flex",
                flexDirection: "column",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
                cursor: "pointer",
              }}
            >
              <MapPin size={20} strokeWidth={1.5} color="#bbb" />
              <span style={{ fontSize: 12, fontWeight: 600, color: "#bbb" }}>{job.region}</span>
              <div style={{ display: "flex", alignItems: "center", gap: 3 }}>
                <span style={{ fontSize: 11, fontWeight: 500, color: "#ccc" }}>지도에서 보기</span>
                <ExternalLink size={10} strokeWidth={1.8} color="#ccc" />
              </div>
            </div>
          </Section>

          {/* Contact */}
          <Section title="문의">
            <div style={{ display: "flex", flexDirection: "column", gap: 10 }}>
              {detail.contact.map((c, i) => (
                <div key={i} style={{ display: "flex", alignItems: "center", gap: 10 }}>
                  <div
                    style={{
                      width: 32,
                      height: 32,
                      borderRadius: 8,
                      backgroundColor: "#f2f2f4",
                      display: "flex",
                      alignItems: "center",
                      justifyContent: "center",
                      flexShrink: 0,
                    }}
                  >
                    {c.type === "전화" ? (
                      <Phone size={14} strokeWidth={1.8} color="#555" />
                    ) : (
                      <Mail size={14} strokeWidth={1.8} color="#555" />
                    )}
                  </div>
                  <div style={{ flex: 1 }}>
                    <p style={{ fontSize: 11, fontWeight: 500, color: "#aaa", marginBottom: 1 }}>
                      {c.type}
                    </p>
                    <p style={{ fontSize: 13, fontWeight: 600, color: "#0a0a0a", letterSpacing: -0.3 }}>
                      {c.value}
                    </p>
                  </div>
                  <button
                    style={{
                      background: "none",
                      border: "1px solid rgba(0,0,0,0.1)",
                      borderRadius: 8,
                      paddingLeft: 10,
                      paddingRight: 10,
                      paddingTop: 5,
                      paddingBottom: 5,
                      cursor: "pointer",
                      fontSize: 11,
                      fontWeight: 600,
                      color: "#555",
                    }}
                  >
                    {c.type === "전화" ? "전화" : "메일"}
                  </button>
                </div>
              ))}
            </div>
          </Section>

          {/* Meta */}
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "space-between",
              paddingBottom: 4,
            }}
          >
            <span style={{ fontSize: 11, fontWeight: 400, color: "#ccc" }}>
              등록일 {detail.postedAt}
            </span>
            <span style={{ fontSize: 11, fontWeight: 400, color: "#ccc" }}>
              출처: {job.source}
            </span>
          </div>
        </div>
      </div>

      {/* Fixed bottom CTA */}
      <div
        style={{
          position: "absolute",
          bottom: 0,
          left: 0,
          right: 0,
          padding: "12px 16px 28px",
          backgroundColor: "#f5f5f7",
          borderTop: "1px solid rgba(0,0,0,0.06)",
        }}
      >
        {applied ? (
          <div
            style={{
              display: "flex",
              alignItems: "center",
              justifyContent: "center",
              gap: 8,
              backgroundColor: "#f2f2f4",
              borderRadius: 14,
              paddingTop: 16,
              paddingBottom: 16,
            }}
          >
            <CheckCircle2 size={18} strokeWidth={2} color="#888" />
            <span style={{ fontSize: 15, fontWeight: 700, color: "#888", letterSpacing: -0.4 }}>
              지원 완료
            </span>
          </div>
        ) : (
          <div style={{ display: "flex", gap: 8 }}>
            <button
              onClick={onBookmark}
              style={{
                width: 50,
                height: 50,
                borderRadius: 14,
                backgroundColor: "#fff",
                border: "1px solid rgba(0,0,0,0.1)",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                cursor: "pointer",
                flexShrink: 0,
              }}
            >
              {isBookmarked ? (
                <BookmarkCheck size={20} strokeWidth={2} color="#0a0a0a" />
              ) : (
                <Bookmark size={20} strokeWidth={1.7} color="#888" />
              )}
            </button>
            <button
              onClick={() => setApplied(true)}
              style={{
                flex: 1,
                height: 50,
                backgroundColor: "#0a0a0a",
                color: "#fff",
                border: "none",
                borderRadius: 14,
                fontSize: 16,
                fontWeight: 700,
                cursor: "pointer",
                letterSpacing: -0.4,
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
                gap: 6,
              }}
            >
              지원하기
              <ChevronRight size={16} strokeWidth={2.5} />
            </button>
          </div>
        )}
      </div>
    </div>
  );
}
