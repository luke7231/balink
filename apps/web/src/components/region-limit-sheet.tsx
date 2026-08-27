"use client";

import Link from "next/link";
import { BottomSheet } from "@/components/bottom-sheet";
import { CTA_PRESS_CLASS } from "@/lib/button-classes";

export function RegionLimitSheet({
  open,
  referred = false,
  onClose,
}: {
  open: boolean;
  referred?: boolean;
  onClose: () => void;
}) {
  return (
    <BottomSheet open={open} title="관심지역을 더 열려면" onClose={onClose}>
      <div className="space-y-3">
        <section className={`rounded-2xl bg-surface-muted px-4 py-4 ${referred ? "opacity-60" : ""}`}>
          <h3 className="text-sm font-semibold text-foreground">하나 더 여는 법</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            공유받은 친구 코드를 넣으면 관심지역이 하나 더 열립니다.
          </p>
          {referred ? (
            <button
              type="button"
              disabled
              className="mt-4 flex h-12 w-full items-center justify-center rounded-full border border-border bg-surface text-sm font-semibold text-muted-foreground"
            >
              코드를 이미 넣었어요
            </button>
          ) : (
            <Link
              href="/signup/invite-code?from=limit"
              className={`mt-4 flex h-12 w-full items-center justify-center rounded-full bg-accent text-sm font-semibold text-background hover:opacity-90 ${CTA_PRESS_CLASS}`}
            >
              친구 코드 입력하기
            </Link>
          )}
        </section>

        <section className="rounded-2xl bg-surface-muted px-4 py-4">
          <h3 className="text-sm font-semibold text-foreground">무제한 관심지역</h3>
          <p className="mt-1.5 text-sm leading-relaxed text-muted-foreground">
            친구가 가입한 뒤 내 코드를 넣으면 관심지역이 무제한이 됩니다.
          </p>
          <Link
            href="/account/invite"
            className={`mt-4 flex h-12 w-full items-center justify-center rounded-full text-sm font-semibold ${CTA_PRESS_CLASS} ${
              referred
                ? "bg-accent text-background hover:opacity-90"
                : "border border-border bg-surface text-foreground hover:bg-background"
            }`}
          >
            친구 초대하러 가기
          </Link>
        </section>
      </div>
    </BottomSheet>
  );
}
