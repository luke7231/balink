"use client";

import Script from "next/script";
import { useState } from "react";

declare global {
  interface Window {
    Kakao?: {
      init(key: string): void;
      isInitialized(): boolean;
      Channel: {
        chat(options: { channelPublicId: string }): void;
      };
    };
  }
}

export function KakaoChannelChat({
  javascriptKey,
  channelPublicId,
  className,
}: {
  javascriptKey?: string;
  channelPublicId?: string;
  className?: string;
}) {
  const [ready, setReady] = useState(false);
  const [error, setError] = useState<string | null>(null);

  if (!javascriptKey || !channelPublicId) return null;

  function initialize() {
    const kakao = window.Kakao;
    if (!kakao) {
      setError("카카오톡 채팅을 불러오지 못했어요.");
      return;
    }

    if (!kakao.isInitialized()) {
      kakao.init(javascriptKey!);
    }
    setReady(true);
    setError(null);
  }

  function openChat() {
    const kakao = window.Kakao;
    if (!ready || !kakao?.isInitialized()) {
      setError("잠시 후 다시 시도해 주세요.");
      return;
    }

    const mobileUserAgent = /Android|iPhone|iPad|iPod/i.test(navigator.userAgent);
    const touchMac = navigator.platform === "MacIntel" && navigator.maxTouchPoints > 1;
    if (!mobileUserAgent && !touchMac) {
      window.open(
        `https://pf.kakao.com/${encodeURIComponent(channelPublicId!)}/chat`,
        "_blank",
        "noopener,noreferrer",
      );
      setError(null);
      return;
    }

    try {
      kakao.Channel.chat({ channelPublicId: channelPublicId! });
      setError(null);
    } catch {
      setError("카카오톡 채팅을 열지 못했어요.");
    }
  }

  return (
    <>
      <Script
        src="https://t1.kakaocdn.net/kakao_js_sdk/2.7.4/kakao.min.js"
        strategy="afterInteractive"
        onLoad={initialize}
        onReady={initialize}
        onError={() => setError("카카오톡 채팅을 불러오지 못했어요.")}
      />
      <button
        type="button"
        disabled={!ready}
        onClick={openChat}
        className={`${className ?? ""} disabled:cursor-wait disabled:opacity-50`}
      >
        <span className="inline-flex items-center gap-2">
          <KakaoChatIcon />
          카카오톡 채팅
        </span>
        <span aria-hidden>→</span>
      </button>
      {error ? (
        <p role="alert" className="py-1 text-xs text-red-800">
          {error}
        </p>
      ) : null}
    </>
  );
}

function KakaoChatIcon() {
  return (
    <span
      aria-hidden
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-[#FEE500]"
    >
      <svg width="14" height="14" viewBox="0 0 18 18" fill="none">
        <path
          d="M9 1.5C4.86 1.5 1.5 4.16 1.5 7.45c0 2.12 1.4 3.98 3.52 5.05l-.9 3.3c-.08.3.26.53.5.37l3.95-2.62c.47.05.96.08 1.43.08 4.14 0 7.5-2.66 7.5-5.95S13.14 1.5 9 1.5Z"
          fill="#191600"
        />
      </svg>
    </span>
  );
}
