import { Resend } from "resend";

const DEFAULT_FROM = "발링크 <noreply@balink.co.kr>";

export function getEmailFromAddress(): string {
  return process.env.RESEND_FROM_EMAIL?.trim() || DEFAULT_FROM;
}

export function isEmailSendingConfigured(): boolean {
  return Boolean(process.env.RESEND_API_KEY?.trim());
}

type SendResult = { ok: true } | { ok: false; error: string };

async function sendResendEmail(params: {
  to: string;
  subject: string;
  html: string;
  text: string;
}): Promise<SendResult> {
  const apiKey = process.env.RESEND_API_KEY?.trim();
  if (!apiKey) {
    return { ok: false, error: "이메일 발송 설정이 되어 있지 않습니다." };
  }

  try {
    const resend = new Resend(apiKey);
    const { error } = await resend.emails.send({
      from: getEmailFromAddress(),
      to: params.to,
      subject: params.subject,
      html: params.html,
      text: params.text,
    });

    if (error) {
      console.warn("[email] resend send failed", error);
      return { ok: false, error: "인증 메일 발송에 실패했어요. 잠시 후 다시 시도해 주세요." };
    }

    return { ok: true };
  } catch (error) {
    console.warn("[email] resend send threw", error);
    return { ok: false, error: "인증 메일 발송에 실패했어요. 잠시 후 다시 시도해 주세요." };
  }
}

function otpHtml(params: { heading: string; body: string; code: string }): string {
  return `
    <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#111;">
      <p>${params.heading}</p>
      <p>${params.body}</p>
      <p style="margin:28px 0;font-size:32px;font-weight:700;letter-spacing:0.35em;font-variant-numeric:tabular-nums;">
        ${params.code}
      </p>
      <p style="font-size:13px;color:#666;">코드는 10분 동안만 유효합니다. 요청하지 않았다면 이 메일을 무시하세요.</p>
    </div>
  `;
}

export async function sendEmailChangeVerification(params: {
  to: string;
  confirmUrl: string;
}): Promise<SendResult> {
  return sendResendEmail({
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
    text: `발링크 계정 이메일 변경을 요청했습니다.\n\n다음 링크를 열어 변경을 확인하세요 (30분 유효):\n${params.confirmUrl}\n\n요청하지 않았다면 이 메일을 무시하세요.`,
  });
}

export async function sendSignupOtpEmail(params: {
  to: string;
  code: string;
}): Promise<SendResult> {
  return sendResendEmail({
    to: params.to,
    subject: "[발링크] 회원가입 인증 코드",
    html: otpHtml({
      heading: "발링크 회원가입을 위한 인증 코드입니다.",
      body: "아래 6자리 코드를 앱 또는 웹에 입력해 주세요.",
      code: params.code,
    }),
    text: `발링크 회원가입 인증 코드: ${params.code}\n\n코드는 10분 동안만 유효합니다. 요청하지 않았다면 이 메일을 무시하세요.`,
  });
}

export async function sendResetOtpEmail(params: {
  to: string;
  code: string;
}): Promise<SendResult> {
  return sendResendEmail({
    to: params.to,
    subject: "[발링크] 비밀번호 재설정 인증 코드",
    html: otpHtml({
      heading: "발링크 비밀번호 재설정을 위한 인증 코드입니다.",
      body: "아래 6자리 코드를 앱 또는 웹에 입력해 주세요.",
      code: params.code,
    }),
    text: `발링크 비밀번호 재설정 인증 코드: ${params.code}\n\n코드는 10분 동안만 유효합니다. 요청하지 않았다면 이 메일을 무시하세요.`,
  });
}

export async function sendAlreadyRegisteredEmail(params: {
  to: string;
}): Promise<SendResult> {
  return sendResendEmail({
    to: params.to,
    subject: "[발링크] 이미 가입된 이메일입니다",
    html: `
      <div style="font-family:-apple-system,BlinkMacSystemFont,'Segoe UI',sans-serif;line-height:1.6;color:#111;">
        <p>이 이메일로 이미 발링크 계정이 있습니다.</p>
        <p>로그인하거나, 비밀번호를 잊었다면 비밀번호 재설정을 이용해 주세요.</p>
        <p style="font-size:13px;color:#666;">요청하지 않았다면 이 메일을 무시하세요.</p>
      </div>
    `,
    text: `이 이메일로 이미 발링크 계정이 있습니다.\n\n로그인하거나, 비밀번호를 잊었다면 비밀번호 재설정을 이용해 주세요.\n\n요청하지 않았다면 이 메일을 무시하세요.`,
  });
}
