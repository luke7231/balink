"use client";

import { Modal } from "@balink/ui/modal";
import { useState } from "react";
import { MobileAwareSignOutForm } from "@/components/mobile-aware-sign-out-form";

export function AccountSignOut() {
  const [open, setOpen] = useState(false);

  return (
    <section className="border-t border-border py-7">
      <h2 className="text-base font-semibold text-foreground">로그아웃</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        이 기기에서 발링크 계정의 로그인을 종료합니다.
      </p>
      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 rounded-full bg-foreground px-4 py-2.5 text-sm font-semibold text-background hover:opacity-85"
      >
        로그아웃하기
      </button>

      <Modal
        open={open}
        title="로그아웃할까요?"
        onClose={() => setOpen(false)}
        footer={
          <>
            <button
              type="button"
              onClick={() => setOpen(false)}
              className="rounded-full border border-border bg-surface px-4 py-2 text-sm font-semibold text-foreground hover:bg-surface-muted"
            >
              취소
            </button>
            <MobileAwareSignOutForm buttonClassName="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-85" />
          </>
        }
      >
        로그아웃해도 북마크와 관심지역은 계정에 그대로 보관됩니다.
      </Modal>
    </section>
  );
}
