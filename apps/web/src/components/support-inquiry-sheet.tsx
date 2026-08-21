"use client";

import { useState } from "react";
import { BottomSheet } from "@/components/bottom-sheet";
import { KakaoChannelChat } from "@/components/kakao-channel-chat";
import { OriginalSourceLink } from "@/components/original-source-link";

export function SupportInquirySheet({
  javascriptKey,
  channelPublicId,
}: {
  javascriptKey?: string;
  channelPublicId?: string;
}) {
  const [open, setOpen] = useState(false);

  return (
    <>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="-mx-2 flex w-[calc(100%+1rem)] items-center justify-between px-2 py-3 text-sm font-semibold text-foreground hover:text-accent"
      >
        문의하기
        <span aria-hidden>→</span>
      </button>

      <BottomSheet open={open} title="무엇을 도와드릴까요?" onClose={() => setOpen(false)}>
        <p className="mb-5 text-sm leading-relaxed text-muted-foreground">
          문의 내용에 알맞은 방법을 선택해 주세요.
        </p>

        <div className="space-y-3">
          <section className="rounded-3xl bg-[#FFF8C5] p-5">
            <div className="flex items-center gap-3">
              <span className="text-xl" aria-hidden>
                💬
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">카카오톡 상담</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">간단한 문의와 빠른 확인</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              로그인, 알림 설정, 서비스 이용 방법처럼 대화로 해결하기 좋은 문의를 남겨주세요.
              확인 순서대로 답변드립니다.
            </p>
            <KakaoChannelChat
              javascriptKey={javascriptKey}
              channelPublicId={channelPublicId}
              className="mt-4 flex w-full items-center justify-between rounded-full bg-[#191600] px-4 py-3 text-sm font-semibold text-white hover:bg-black"
            />
          </section>

          <section className="rounded-3xl bg-violet-100 p-5">
            <div className="flex items-center gap-3">
              <span className="text-xl" aria-hidden>
                📝
              </span>
              <div>
                <h3 className="text-base font-bold text-foreground">문의 폼</h3>
                <p className="mt-0.5 text-sm text-muted-foreground">의견 및 자세한 문의 남기기</p>
              </div>
            </div>
            <p className="mt-3 text-sm leading-6 text-muted-foreground">
              기능 제안, 오류·공고 정보 제보, 서비스 개선 의견 및 제휴 문의처럼 검토가 필요한
              내용을 남겨주세요.
            </p>
            <OriginalSourceLink
              href="https://forms.gle/a4souo2Cz6bDb3BA8"
              title="발링크 문의"
              className="mt-4 flex w-full items-center justify-between rounded-full bg-violet-600 px-4 py-3 text-sm font-semibold text-white hover:bg-violet-700"
            >
              <span className="inline-flex items-center gap-2">
                <FormChatIcon />
                문의 폼 작성하기
              </span>
              <span aria-hidden>→</span>
            </OriginalSourceLink>
          </section>
        </div>
      </BottomSheet>
    </>
  );
}

function FormChatIcon() {
  return (
    <span
      aria-hidden
      className="inline-flex h-6 w-6 items-center justify-center rounded-full bg-white"
    >
      <svg width="13" height="13" viewBox="0 0 16 16" fill="none">
        <path
          d="M3.5 2.5h9A1.5 1.5 0 0 1 14 4v8a1.5 1.5 0 0 1-1.5 1.5h-9A1.5 1.5 0 0 1 2 12V4A1.5 1.5 0 0 1 3.5 2.5Z"
          stroke="#7c3aed"
          strokeWidth="1.4"
        />
        <path
          d="M5 5.5h6M5 8h6M5 10.5h3.5"
          stroke="#7c3aed"
          strokeWidth="1.4"
          strokeLinecap="round"
        />
      </svg>
    </span>
  );
}
