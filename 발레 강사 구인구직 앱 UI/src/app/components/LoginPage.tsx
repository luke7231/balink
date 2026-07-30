import { X, ChevronRight } from "lucide-react";

export function LoginPage({ onClose }: { onClose: () => void }) {
  return (
    <div
      style={{
        position: "absolute",
        inset: 0,
        backgroundColor: "#ffffff",
        display: "flex",
        flexDirection: "column",
        borderRadius: 44,
        overflow: "hidden",
        zIndex: 100,
      }}
    >
      {/* Status bar spacer */}
      <div style={{ height: 44 }} />

      {/* Close button */}
      <div style={{ paddingLeft: 20, paddingTop: 8, paddingBottom: 4 }}>
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            padding: 6,
            color: "#888",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
          }}
        >
          <X size={22} strokeWidth={1.8} />
        </button>
      </div>

      {/* Hero section */}
      <div
        style={{
          flex: 1,
          display: "flex",
          flexDirection: "column",
          alignItems: "center",
          justifyContent: "center",
          paddingLeft: 32,
          paddingRight: 32,
          paddingBottom: 24,
        }}
      >
        {/* Logo mark */}
        <div
          style={{
            width: 72,
            height: 72,
            borderRadius: "50%",
            backgroundColor: "#0a0a0a",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            marginBottom: 28,
            flexShrink: 0,
          }}
        >
          <SwanMark />
        </div>

        {/* Headline */}
        <p
          style={{
            fontSize: 28,
            fontWeight: 800,
            color: "#0a0a0a",
            textAlign: "center",
            lineHeight: 1.3,
            letterSpacing: -0.8,
          }}
        >
          흩어진 발레 공고를
          <br />
          한번에 한곳에서
        </p>
      </div>

      {/* Auth buttons */}
      <div
        style={{
          paddingLeft: 24,
          paddingRight: 24,
          paddingBottom: 36,
          display: "flex",
          flexDirection: "column",
          gap: 10,
        }}
      >
        {/* Google */}
        <button
          style={{
            width: "100%",
            height: 52,
            backgroundColor: "#ffffff",
            border: "1px solid rgba(0,0,0,0.13)",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <GoogleIcon />
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#1a1a1a",
              letterSpacing: -0.3,
            }}
          >
            구글 계정으로 계속하기
          </span>
        </button>

        {/* Apple */}
        <button
          style={{
            width: "100%",
            height: 52,
            backgroundColor: "#0a0a0a",
            border: "none",
            borderRadius: 14,
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 10,
            cursor: "pointer",
          }}
        >
          <AppleIcon />
          <span
            style={{
              fontSize: 15,
              fontWeight: 600,
              color: "#ffffff",
              letterSpacing: -0.3,
            }}
          >
            Apple로 계속하기
          </span>
        </button>

        {/* Divider */}
        <div
          style={{
            display: "flex",
            alignItems: "center",
            gap: 12,
            marginTop: 2,
            marginBottom: 2,
          }}
        >
          <div style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />
          <span
            style={{
              fontSize: 12,
              fontWeight: 500,
              color: "#bbb",
              letterSpacing: -0.1,
            }}
          >
            또는
          </span>
          <div style={{ flex: 1, height: 1, backgroundColor: "rgba(0,0,0,0.08)" }} />
        </div>

        {/* Naver + Kakao */}
        <div
          style={{
            display: "flex",
            justifyContent: "center",
            gap: 32,
          }}
        >
          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 7,
              padding: 0,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                backgroundColor: "#03C75A",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <span style={{ fontSize: 18, fontWeight: 900, color: "#fff", letterSpacing: -0.5 }}>
                N
              </span>
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#555", letterSpacing: -0.2 }}>
              네이버
            </span>
          </button>

          <button
            style={{
              background: "none",
              border: "none",
              cursor: "pointer",
              display: "flex",
              flexDirection: "column",
              alignItems: "center",
              gap: 7,
              padding: 0,
            }}
          >
            <div
              style={{
                width: 46,
                height: 46,
                borderRadius: "50%",
                backgroundColor: "#FEE500",
                display: "flex",
                alignItems: "center",
                justifyContent: "center",
              }}
            >
              <KakaoIcon />
            </div>
            <span style={{ fontSize: 12, fontWeight: 500, color: "#555", letterSpacing: -0.2 }}>
              카카오
            </span>
          </button>
        </div>

        {/* Browse without login */}
        <button
          onClick={onClose}
          style={{
            background: "none",
            border: "none",
            cursor: "pointer",
            display: "flex",
            alignItems: "center",
            justifyContent: "center",
            gap: 3,
            marginTop: 4,
            padding: "8px 0",
          }}
        >
          <span
            style={{
              fontSize: 13,
              fontWeight: 500,
              color: "#aaa",
              letterSpacing: -0.2,
            }}
          >
            로그인 없이 둘러보기
          </span>
          <ChevronRight size={13} strokeWidth={2} color="#bbb" />
        </button>
      </div>
    </div>
  );
}

/* ── Icon components ── */

function SwanMark() {
  return (
    <svg width="38" height="38" viewBox="0 0 38 38" fill="none">
      {/* Swan silhouette — neck curves up, wing extends right */}
      {/* Body */}
      <ellipse cx="20" cy="26" rx="9" ry="6" fill="white" opacity="0.95" />
      {/* Neck */}
      <path
        d="M18 26 Q16 20 15 14 Q14.5 10 17 9 Q19.5 8 20 11 Q20.5 14 19 18 Q18.2 21 18 26Z"
        fill="white"
        opacity="0.95"
      />
      {/* Head */}
      <ellipse cx="17.5" cy="8.5" rx="3" ry="2.5" fill="white" />
      {/* Beak */}
      <path d="M14.5 8.5 L12 8 L14 9 Z" fill="white" opacity="0.7" />
      {/* Wing tip */}
      <path
        d="M22 23 Q28 18 30 20 Q28 24 22 26Z"
        fill="white"
        opacity="0.7"
      />
    </svg>
  );
}

function GoogleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M19.6 10.23c0-.68-.06-1.36-.18-2H10v3.79h5.4a4.6 4.6 0 0 1-2 3.02v2.5h3.23c1.89-1.74 2.97-4.3 2.97-7.31Z"
        fill="#4285F4"
      />
      <path
        d="M10 20c2.7 0 4.96-.9 6.62-2.43l-3.23-2.5c-.9.6-2.04.96-3.39.96-2.6 0-4.8-1.76-5.59-4.12H1.08v2.58A10 10 0 0 0 10 20Z"
        fill="#34A853"
      />
      <path
        d="M4.41 11.91A6.01 6.01 0 0 1 4.1 10c0-.66.11-1.3.31-1.91V5.51H1.08A10 10 0 0 0 0 10c0 1.61.39 3.14 1.08 4.49l3.33-2.58Z"
        fill="#FBBC05"
      />
      <path
        d="M10 3.97c1.47 0 2.78.5 3.82 1.5l2.86-2.86A9.96 9.96 0 0 0 10 0 10 10 0 0 0 1.08 5.51l3.33 2.58C5.2 5.73 7.4 3.97 10 3.97Z"
        fill="#EA4335"
      />
    </svg>
  );
}

function AppleIcon() {
  return (
    <svg width="20" height="20" viewBox="0 0 20 20" fill="none">
      <path
        d="M14.5 0c.1 1.4-.38 2.77-1.2 3.78-.84 1.02-2.08 1.7-3.3 1.6-.14-1.34.44-2.73 1.24-3.67C12.06.74 13.36.08 14.5 0ZM18.98 14.12c-.5 1.1-1.06 2.14-1.77 3.05-.94 1.24-1.88 2.48-3.35 2.5-1.44.03-1.9-.86-3.55-.85-1.64.01-2.14.88-3.55.85-1.44-.02-2.34-1.2-3.28-2.44C1.7 15.14.5 12.5.5 9.96c0-4.24 2.76-6.5 5.48-6.54 1.42-.03 2.76.95 3.62.95.87 0 2.5-1.18 4.22-1 .72.03 2.73.29 4.02 2.2-.1.07-2.4 1.4-2.37 4.18.03 3.32 2.91 4.42 2.97 4.44l.54-.07Z"
        fill="white"
      />
    </svg>
  );
}

function KakaoIcon() {
  return (
    <svg width="22" height="22" viewBox="0 0 22 22" fill="none">
      <path
        d="M11 2C6.03 2 2 5.36 2 9.5c0 2.67 1.72 5.01 4.33 6.35l-.87 3.2c-.08.28.23.51.47.35L9.9 17.2c.36.05.72.08 1.1.08 4.97 0 9-3.36 9-7.5S15.97 2 11 2Z"
        fill="#3C1E1E"
      />
    </svg>
  );
}
