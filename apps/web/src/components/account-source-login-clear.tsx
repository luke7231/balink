"use client";

import { Modal } from "@balink/ui/modal";
import { useState } from "react";
import { clearSourceLoginOnDevice, useNativeShell } from "@/lib/native-shell";

export function AccountSourceLoginClear() {
  const nativeShell = useNativeShell();
  const [open, setOpen] = useState(false);
  const [cleared, setCleared] = useState(false);

  if (!nativeShell) return null;

  function handleClear() {
    clearSourceLoginOnDevice();
    setCleared(true);
    setOpen(false);
  }

  return (
    <section className="border-t border-border py-7">
      <h2 className="text-base font-semibold text-foreground">원문 로그인 기억</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        발레매니아·이상댄스 아이디를 이 폰에만 기억해 둔 경우, 여기서 지울 수 있습니다. 발링크
        계정과는 별개입니다.
      </p>
      {cleared ? (
        <p className="mt-5 text-sm font-medium text-accent">이 폰의 원문 로그인 기억을 지웠습니다.</p>
      ) : (
        <button
          type="button"
          onClick={() => setOpen(true)}
          className="mt-5 rounded-full border border-border bg-surface px-4 py-2.5 text-sm font-semibold text-foreground hover:bg-surface-muted"
        >
          이 폰에서 지우기
        </button>
      )}

      <Modal
        open={open}
        title="원문 로그인을 지울까요?"
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
            <button
              type="button"
              onClick={handleClear}
              className="rounded-full bg-foreground px-4 py-2 text-sm font-semibold text-background hover:opacity-85"
            >
              지우기
            </button>
          </>
        }
      >
        이 폰에 기억해 둔 발레매니아·이상댄스 아이디가 삭제됩니다. 다음 원문 보기에서 다시 입력해야
        합니다.
      </Modal>
    </section>
  );
}
