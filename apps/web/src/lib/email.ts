import { Resend } from "resend";

const DEFAULT_FROM = "발링크 <noreply@balink.co.kr>";

export function getEmailFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
}

export function isEmailSendingConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

export async function sendEmailChangeVerification(params: {
  to: string;
  confirmUrl: string;
}): Promise<{ ok: true } | { ok: false; error: string }> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "이메일 발송 설정이 되어 있지 않습니다." };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: getEmailFromAddress(),
      to: params.to,
      subject: "[발링크] 이메일 주소 변경 확인",
      html: `
        <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#111;">
          <p>발링크 계정 이메일 변경을 요청하셨습니다.</p>
          <p>아래 버튼을 누르면 이메일이 <strong>${params.to}</strong>로 변경됩니다.</p>
          <p style="margin:28px 0;">
            <a href="${params.confirmUrl}"
               style="display:inline-block;padding:12px 20px;border-radius:999px;background:#111;color:#fff;text-decoration:none;font-weight:600;">
              이메일 변경 확인
            </a>
          </p>
          <p style="font-size:13px;color:#666;">링크는 30분 동안만 유효합니다. 요청하지 않았다면 이 메일을 무시하세요.</p>
        </div>
      `,
      text: `발링크 계정 이메일 변경을 요청하셨습니다.\n\n다음 링크를 열어 변경을 확인하세요 (30분 유효):\n${params.confirmUrl}\n\n요청하지 않았다면 이 메일을 무시하세요.`,
    });

    if (error) {
      console.warn("[email] resend send failed", error);
      return { ok: false, error: "인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." };
    }

    return { ok: true };
  } catch (error) {
    console.warn("[email] resend send threw", error);
    return { ok: false, error: "인증 메일 발송에 실패했습니다. 잠시 후 다시 시도해 주세요." };
  }
}
