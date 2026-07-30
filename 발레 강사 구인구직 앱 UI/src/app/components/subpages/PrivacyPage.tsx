import { ChevronLeft } from "lucide-react";

const sections = [
  {
    title: "제1조 (개인정보의 처리 목적)",
    body: `블랙스완(이하 '회사')은 다음의 목적을 위하여 개인정보를 처리합니다. 처리하고 있는 개인정보는 다음의 목적 이외의 용도로는 이용되지 않으며, 이용 목적이 변경되는 경우에는 개인정보 보호법 제18조에 따라 별도의 동의를 받는 등 필요한 조치를 이행할 예정입니다.

• 회원 가입 및 관리: 회원 가입의사 확인, 회원제 서비스 제공에 따른 본인 식별·인증, 회원자격 유지·관리, 서비스 부정이용 방지
• 서비스 제공: 발레 강사 구인구직 공고 제공, 알림 발송, 맞춤형 공고 추천`,
  },
  {
    title: "제2조 (처리하는 개인정보 항목)",
    body: `회사는 서비스 제공을 위해 아래와 같은 개인정보를 수집합니다.

필수 항목:
• 이메일 주소, 비밀번호, 닉네임

선택 항목:
• 활동 지역, 관심 수업 종류, 경력 정보

자동 수집 항목:
• 서비스 이용 기록, 접속 로그, 기기 정보(OS 버전, 앱 버전)`,
  },
  {
    title: "제3조 (개인정보의 처리 및 보유 기간)",
    body: `회사는 법령에 따른 개인정보 보유·이용 기간 또는 정보주체로부터 개인정보를 수집 시에 동의 받은 개인정보 보유·이용 기간 내에서 개인정보를 처리·보유합니다.

• 회원 정보: 회원 탈퇴 후 즉시 삭제 (단, 관련 법령에 따라 보관이 필요한 경우 해당 기간 동안 보관)
• 서비스 이용 기록: 3개월`,
  },
  {
    title: "제4조 (개인정보의 제3자 제공)",
    body: `회사는 정보주체의 개인정보를 원칙적으로 외부에 제공하지 않습니다. 다만, 아래의 경우에는 예외로 합니다.

• 정보주체가 사전에 동의한 경우
• 법령의 규정에 의거하거나, 수사 목적으로 법령에 정해진 절차와 방법에 따라 수사기관의 요구가 있는 경우`,
  },
  {
    title: "제5조 (정보주체의 권리·의무 및 행사방법)",
    body: `정보주체는 회사에 대해 언제든지 다음 각 호의 개인정보 보호 관련 권리를 행사할 수 있습니다.

• 개인정보 열람 요구
• 오류 등이 있을 경우 정정 요구
• 삭제 요구
• 처리 정지 요구

권리 행사는 마이 탭 → 앱 설정 → 계정 관리를 통해 직접 하거나, 고객센터 채팅을 통해 요청하실 수 있습니다.`,
  },
  {
    title: "제6조 (개인정보 보호책임자)",
    body: `회사는 개인정보 처리에 관한 업무를 총괄해서 책임지고, 정보주체의 개인정보 관련 불만 처리 및 피해구제 등을 위하여 아래와 같이 개인정보 보호책임자를 지정하고 있습니다.

• 성명: 블랙스완 개인정보보호팀
• 이메일: privacy@blackswan.kr
• 운영 시간: 평일 09:00 – 18:00`,
  },
];

export function PrivacyPage({ onBack }: { onBack: () => void }) {
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
          개인정보처리방침
        </span>
      </div>

      <div
        style={{
          flex: 1,
          overflowY: "auto",
          scrollbarWidth: "none",
          padding: "16px 16px 32px",
        }}
      >
        {/* Version notice */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 12,
            border: "1px solid rgba(0,0,0,0.07)",
            padding: "12px 14px",
            marginBottom: 16,
            display: "flex",
            alignItems: "center",
            justifyContent: "space-between",
          }}
        >
          <span style={{ fontSize: 12, fontWeight: 600, color: "#555", letterSpacing: -0.2 }}>
            시행일
          </span>
          <span style={{ fontSize: 12, fontWeight: 700, color: "#0a0a0a", letterSpacing: -0.2 }}>
            2025년 6월 1일
          </span>
        </div>

        {/* Intro */}
        <div
          style={{
            backgroundColor: "#fff",
            borderRadius: 14,
            border: "1px solid rgba(0,0,0,0.07)",
            padding: 16,
            marginBottom: 10,
          }}
        >
          <p
            style={{
              fontSize: 13,
              fontWeight: 400,
              color: "#555",
              lineHeight: 1.7,
              letterSpacing: -0.2,
            }}
          >
            블랙스완(이하 '회사')은 이용자의 개인정보를 중요하게 생각합니다. 이 개인정보처리방침은 회사가 제공하는 블랙스완 앱 서비스 이용 시 수집하는 개인정보의 항목, 수집 및 이용 목적, 보유 기간, 제3자 제공 여부 등을 안내합니다.
          </p>
        </div>

        {/* Sections */}
        <div style={{ display: "flex", flexDirection: "column", gap: 8 }}>
          {sections.map((s, idx) => (
            <div
              key={idx}
              style={{
                backgroundColor: "#fff",
                borderRadius: 14,
                border: "1px solid rgba(0,0,0,0.07)",
                padding: 16,
              }}
            >
              <p
                style={{
                  fontSize: 13,
                  fontWeight: 700,
                  color: "#0a0a0a",
                  letterSpacing: -0.3,
                  marginBottom: 10,
                  lineHeight: 1.4,
                }}
              >
                {s.title}
              </p>
              <div
                style={{
                  height: 1,
                  backgroundColor: "rgba(0,0,0,0.05)",
                  marginBottom: 10,
                }}
              />
              {s.body.split("\n").map((line, i) => (
                <p
                  key={i}
                  style={{
                    fontSize: 12,
                    fontWeight: line.startsWith("•") ? 500 : 400,
                    color: line.startsWith("•") ? "#333" : "#666",
                    lineHeight: 1.7,
                    letterSpacing: -0.2,
                    marginTop: line === "" ? 6 : 0,
                    paddingLeft: line.startsWith("•") ? 0 : 0,
                  }}
                >
                  {line || " "}
                </p>
              ))}
            </div>
          ))}
        </div>

        {/* Footer */}
        <p
          style={{
            textAlign: "center",
            fontSize: 11,
            fontWeight: 400,
            color: "#ccc",
            marginTop: 20,
            letterSpacing: -0.1,
          }}
        >
          © 2025 블랙스완. All rights reserved.
        </p>
      </div>
    </div>
  );
}
