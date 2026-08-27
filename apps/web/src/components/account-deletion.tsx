"use client";

import { Modal } from "@balink/ui/modal";
import { useRef, useState } from "react";
import { useFormStatus } from "react-dom";
import { deleteAccountAction } from "@/components/account-actions";
import { notifyWebViewSync } from "@/lib/native-shell";

export function AccountDeletion() {
  const [open, setOpen] = useState(false);
  const submittingRef = useRef(false);

  return (
    <section className="border-t border-border py-7">
      <h2 className="text-base font-semibold text-accent">계정 삭제</h2>
      <p className="mt-2 text-sm leading-relaxed text-muted-foreground">
        발링크 회원 정보가 삭제되고, 카카오·Apple 연결 해제를 시도합니다. 삭제 후에는
        같은 소셜 계정으로 다시 가입할 수 있습니다.
      </p>

      <button
        type="button"
        onClick={() => setOpen(true)}
        className="mt-5 rounded-full bg-accent px-4 py-2.5 text-sm font-semibold text-background hover:opacity-90"
      >
        계정 삭제하기
      </button>

      <Modal
        open={open}
        title="계정을 삭제할까요?"
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
            <form
              action={deleteAccountAction}
              onSubmit={(event) => {
                if (submittingRef.current) return;
                notifyWebViewSync("auth");
                const form = event.currentTarget;
                const detach = window.balinkPush?.detach;
                if (!detach) return;

                event.preventDefault();
                submittingRef.current = true;
                void Promise.race([
                  detach(),
                  new Promise<void>((resolve) => window.setTimeout(resolve, 1_500)),
                ]).finally(() => form.requestSubmit());
              }}
            >
              <DeleteButton />
            </form>
          </>
        }
      >
        북마크, 알림 조건 등 회원 정보가 모두 삭제되며 되돌릴 수 없습니다.
      </Modal>
    </section>
  );
}

function DeleteButton() {
  const { pending } = useFormStatus();

  return (
    <button
      type="submit"
      disabled={pending}
      className="rounded-full bg-accent px-4 py-2 text-sm font-semibold text-background hover:opacity-90 disabled:cursor-not-allowed disabled:opacity-50"
    >
      {pending ? "삭제 중..." : "삭제하기"}
    </button>
  );
}
